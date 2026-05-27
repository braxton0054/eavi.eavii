import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/service-client'

/**
 * GET /api/payments/payhero/status?id=TRANSACTION_ID
 * Polls the status of a Pay Hero transaction.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('payhero_transactions')
      .select('id, status, amount, payhero_reference, initiated_at, completed_at, callback_payload')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: data.id,
        status: data.status,
        amount: data.amount,
        payhero_reference: data.payhero_reference,
        initiated_at: data.initiated_at,
        completed_at: data.completed_at,
      },
    })

  } catch (err: any) {
    console.error('[Pay Hero status] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
