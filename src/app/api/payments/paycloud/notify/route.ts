import { NextRequest } from 'next/server'
import { verifyPayCloudSignature } from '@/lib/paycloud/client'

/**
 * POST /api/payments/paycloud/notify
 *
 * PayCloud calls this server-to-server after a payment completes (success,
 * fail, or cancel). This is the SOURCE OF TRUTH for payment status — never
 * trust the browser redirect alone, always confirm via this webhook (or the
 * Order Query API) before marking a booking/invoice as paid.
 *
 * CRITICAL — per PayCloud's spec, the response body must be the EXACT plain
 * text string "success" (not JSON), or they will retry up to 15 times over
 * 12 hours. Always return "success" once you've durably recorded the event,
 * even if it's a duplicate — see idempotency note below.
 *
 * Docs: https://developers.paycloud.africa/docs/addpay/CloudAPI/transaction-result-notification
 */
export async function POST(request: NextRequest) {
  const SUCCESS = new Response('success', { status: 200, headers: { 'Content-Type': 'text/plain' } })

  let payload: Record<string, unknown>
  const contentType = request.headers.get('content-type') ?? ''
  try {
    if (contentType.includes('application/json')) {
      payload = await request.json()
    } else {
      const text = await request.text()
      payload = Object.fromEntries(new URLSearchParams(text))
    }
  } catch (err) {
    console.error('[PayCloud] Failed to parse webhook body', err)
    return new Response('bad request', { status: 400 })
  }

  const isValid = verifyPayCloudSignature(payload)
  if (!isValid) {
    console.error('[PayCloud] Webhook signature verification FAILED', payload)
    return new Response('invalid signature', { status: 400 })
  }

  const orderId = (payload.merchant_order_no as string) ?? (payload.out_trade_no as string)
  const status = payload.trade_status as string // e.g. 'SUCCESS' | 'FAILED' | 'CLOSED'
  const amount = payload.order_amount as string | number | undefined

  if (!orderId) {
    console.error('[PayCloud] Webhook missing order id', payload)
    return SUCCESS
  }

  // ---------------------------------------------------------------------
  // TODO: Wire this up to your real data layer. Required behaviour:
  //
  // 1. IDEMPOTENCY: look up the order/invoice by `orderId`. If it's already
  //    marked paid/failed for this `status`, just return SUCCESS below —
  //    PayCloud resends up to 15 times and WILL send duplicates.
  //
  // 2. AMOUNT CHECK: compare `amount` against the amount you stored when you
  //    created the checkout order. Reject/flag mismatches instead of trusting
  //    the webhook blindly (per PayCloud's own security recommendation).
  //
  // 3. Update booking/invoice status:
  //
  //      if (status === 'SUCCESS') {
  //        await markInvoicePaid(orderId)
  //      } else {
  //        await markInvoicePaymentFailed(orderId, status)
  //      }
  // ---------------------------------------------------------------------

  console.log('[PayCloud] Webhook verified', { orderId, status, amount })

  return SUCCESS
}