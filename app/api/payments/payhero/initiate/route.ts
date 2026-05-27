import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/service-client'

/**
 * POST /api/payments/payhero/initiate
 * Initiates a Pay Hero STK push for a student's installment.
 * Pay Hero handles paybill/till at the account level — single global config.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { application_id, installment_id, phone_number, amount } = body

    if (!application_id || !phone_number || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: application_id, phone_number, amount' },
        { status: 400 }
      )
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // 1. Fetch student application
    const { data: application, error: appErr } = await supabase
      .from('applications')
      .select('id, campus, full_name, admission_number, total_balance')
      .eq('id', application_id)
      .single()

    if (appErr || !application) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // 2. Look up global Pay Hero config (single row, no campus filter)
    const { data: config, error: configErr } = await supabase
      .from('payhero_config')
      .select('channel_id, paybill_no, is_active')
      .single()

    if (configErr || !config) {
      return NextResponse.json(
        { success: false, error: 'Pay Hero not configured. Please contact admin to set up channel_id and paybill.' },
        { status: 400 }
      )
    }

    if (!config.is_active || config.channel_id === 0) {
      return NextResponse.json(
        { success: false, error: 'Pay Hero channel not active. Please update channel_id in Pay Hero settings.' },
        { status: 400 }
      )
    }

    // 3. If installment_id provided, check no pending transaction exists
    if (installment_id) {
      const { data: existingTx } = await supabase
        .from('payhero_transactions')
        .select('id, status')
        .eq('installment_id', installment_id)
        .eq('status', 'pending')
        .maybeSingle()

      if (existingTx) {
        return NextResponse.json(
          { success: false, error: 'A payment request is already pending for this installment' },
          { status: 409 }
        )
      }
    }

    // 4. Create the payhero_transactions row
    const { data: txRow, error: txErr } = await supabase
      .from('payhero_transactions')
      .insert({
        application_id,
        installment_id: installment_id || null,
        phone_number,
        amount: Number(amount),
        status: 'pending',
      })
      .select('id')
      .single()

    if (txErr || !txRow) {
      return NextResponse.json(
        { success: false, error: `Failed to create transaction record: ${txErr?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // 5. Call Pay Hero API
    const PAYHERO_BASE = 'https://backend.payhero.co.ke/api/v2'
    const authHeader = 'Basic ' + Buffer.from(
      `${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`
    ).toString('base64')

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://office-dashboard.vercel.app'}/api/payments/payhero/callback`

    const payheroBody = {
      amount: Number(amount),
      phone_number: phone_number,
      channel_id: config.channel_id,
      provider: 'm-pesa',
      external_reference: txRow.id,
      callback_url: callbackUrl,
    }

    let payheroResponse: Response
    try {
      payheroResponse = await fetch(`${PAYHERO_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payheroBody),
      })
    } catch (fetchErr: any) {
      await supabase
        .from('payhero_transactions')
        .update({ status: 'failed', callback_payload: { error: `Network error: ${fetchErr.message}` } })
        .eq('id', txRow.id)

      return NextResponse.json(
        { success: false, error: `Failed to reach Pay Hero API: ${fetchErr.message}` },
        { status: 502 }
      )
    }

    const payheroData = await payheroResponse.json()

    if (!payheroResponse.ok) {
      await supabase
        .from('payhero_transactions')
        .update({ status: 'failed', callback_payload: payheroData })
        .eq('id', txRow.id)

      return NextResponse.json(
        { success: false, error: payheroData.message || payheroData.detail || 'Pay Hero request failed' },
        { status: payheroResponse.status }
      )
    }

    // 6. Update the transaction with the stk_push_request_id
    await supabase
      .from('payhero_transactions')
      .update({ stk_push_request_id: payheroData.id?.toString() || payheroData.reference || null })
      .eq('id', txRow.id)

    return NextResponse.json({
      success: true,
      transaction_id: txRow.id,
      paybill_no: config.paybill_no,
      message: 'STK push sent. Waiting for M-Pesa confirmation.',
    })

  } catch (err: any) {
    console.error('[Pay Hero initiate] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
