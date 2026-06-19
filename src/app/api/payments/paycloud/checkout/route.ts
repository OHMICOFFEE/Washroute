import { NextRequest, NextResponse } from 'next/server'
import { createPayCloudCheckout } from '@/lib/paycloud/client'

/**
 * POST /api/payments/paycloud/checkout
 *
 * Body: { orderId: string, amount: number, description: string }
 *
 * Creates a PayCloud hosted-checkout order and returns { payUrl } for the
 * client to redirect the browser to. Call this from both:
 *  - the booking wizard, right before final confirmation
 *  - the invoice page, when a customer clicks "Pay Now"
 */
export async function POST(request: NextRequest) {
  let body: { orderId?: string; amount?: number; description?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { orderId, amount, description } = body

  if (!orderId || typeof orderId !== 'string') {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const result = await createPayCloudCheckout({
    orderId,
    amount,
    description: description ?? `Ohmi Pay — Booking ${orderId}`,
    returnUrl: `${appUrl}/payment/success?order=${encodeURIComponent(orderId)}`,
    notifyUrl: `${appUrl}/api/payments/paycloud/notify`,
    attach: { orderId },
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.errorMessage ?? 'Failed to create PayCloud checkout', raw: result.rawResponse },
      { status: 502 }
    )
  }

  return NextResponse.json({ payUrl: result.payUrl })
}