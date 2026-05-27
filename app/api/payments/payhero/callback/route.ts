import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/service-client'

/**
 * POST /api/payments/payhero/callback
 * Receives Pay Hero payment callback/webhook.
 * Updates fee_payments, payment_installments, applications, and payhero_transactions
 * in a single logical transaction.
 */
export async function POST(req: NextRequest) {
  let rawBody: string
  let payload: any

  try {
    rawBody = await req.text()
    payload = JSON.parse(rawBody)
  } catch (err) {
    console.error('[Pay Hero callback] Failed to parse body:', err)
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  console.log('[Pay Hero callback] Received:', JSON.stringify(payload).slice(0, 500))

  const supabase = await createServiceClient()

  // Extract key fields from Pay Hero callback
  // Pay Hero sends: { id, status, amount, reference, external_reference, ... }
  const externalReference = payload.external_reference || payload.external_ref
  const payheroStatus = payload.status
  const payheroReference = payload.reference || payload.payhero_reference || payload.id?.toString()
  const amount = payload.amount

  if (!externalReference) {
    console.error('[Pay Hero callback] Missing external_reference')
    return NextResponse.json({ success: false, error: 'Missing external_reference' }, { status: 400 })
  }

  // Find the payhero_transactions row
  const { data: tx, error: txErr } = await supabase
    .from('payhero_transactions')
    .select('*')
    .eq('id', externalReference)
    .single()

  if (txErr || !tx) {
    console.error('[Pay Hero callback] Transaction not found:', externalReference)
    return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 })
  }

  // Idempotency: if already completed, return success
  if (tx.status === 'completed') {
    console.log('[Pay Hero callback] Transaction already completed, skipping')
    return NextResponse.json({ success: true, message: 'Already processed' })
  }

  // Determine if payment was successful
  // Pay Hero status values: 'success', 'completed', 'failed', 'cancelled'
  const isSuccess = payheroStatus === 'success' || payheroStatus === 'completed'

  if (isSuccess) {
    // === PAYMENT SUCCESSFUL ===

    // 1. Insert into fee_payments
    const { data: feePayment, error: fpErr } = await supabase
      .from('fee_payments')
      .insert({
        application_id: tx.application_id,
        payment_method: 'mpesa',
        amount: tx.amount,
        payment_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        transaction_id: payheroReference,
        module_id: null,
        semester_id: null,
      })
      .select('id')
      .single()

    if (fpErr || !feePayment) {
      console.error('[Pay Hero callback] Failed to insert fee_payment:', fpErr)
      // Still update the tx record with callback payload for debugging
      await supabase
        .from('payhero_transactions')
        .update({ callback_payload: payload, payhero_reference: payheroReference })
        .eq('id', tx.id)
      return NextResponse.json({ success: false, error: 'Failed to record fee payment' }, { status: 500 })
    }

    // 2. Update payment_installments if installment_id exists
    if (tx.installment_id) {
      await supabase
        .from('payment_installments')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', tx.installment_id)
    }

    // 3. Update applications: reduce total_balance, update last_payment_date, clear financial_hold if balance <= 0
    // Fetch current balance first
    const { data: appData } = await supabase
      .from('applications')
      .select('total_balance')
      .eq('id', tx.application_id)
      .single()

    const newBalance = Math.max(0, Number(appData?.total_balance || 0) - Number(tx.amount))

    await supabase
      .from('applications')
      .update({
        total_balance: newBalance,
        last_payment_date: new Date().toISOString().split('T')[0],
        financial_hold: newBalance <= 0 ? false : undefined, // only clear hold, never set it
      })
      .eq('id', tx.application_id)

    // 4. Update payhero_transactions
    await supabase
      .from('payhero_transactions')
      .update({
        status: 'completed',
        fee_payment_id: feePayment.id,
        payhero_reference: payheroReference,
        completed_at: new Date().toISOString(),
        callback_payload: payload,
      })
      .eq('id', tx.id)

    console.log('[Pay Hero callback] Payment completed successfully for tx:', tx.id)

  } else {
    // === PAYMENT FAILED / CANCELLED ===
    const newStatus = payheroStatus === 'cancelled' ? 'cancelled' : 'failed'

    await supabase
      .from('payhero_transactions')
      .update({
        status: newStatus,
        payhero_reference: payheroReference,
        callback_payload: payload,
      })
      .eq('id', tx.id)

    console.log('[Pay Hero callback] Payment', newStatus, 'for tx:', tx.id)
  }

  return NextResponse.json({ success: true })
}
