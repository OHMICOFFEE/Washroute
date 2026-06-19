import { getPayCloudConfig } from './config'
import { signParams, verifySignature } from './sign'

export interface CreateCheckoutParams {
  /** Your own internal order/booking ID — becomes merchant_order_no */
  orderId: string
  /** Amount in ZAR, e.g. 450.00 */
  amount: number
  /** Short description shown on the PayCloud checkout page */
  description: string
  /** Where PayCloud redirects the browser after payment (your success/cancel page) */
  returnUrl: string
  /** Server-to-server webhook PayCloud calls with the final result */
  notifyUrl: string
  /** Optional free-form JSON you want echoed back to you (e.g. booking metadata) */
  attach?: Record<string, unknown>
  /** Seconds until the order expires if unpaid (PayCloud default example: 300) */
  expiresSeconds?: number
}

export interface CreateCheckoutResult {
  success: boolean
  payUrl?: string
  rawResponse: Record<string, unknown>
  errorMessage?: string
}

/**
 * Calls PayCloud's hosted checkout endpoint (`/api/entry/checkout`) to create
 * an order and get back a `pay_url` to redirect the customer to.
 *
 * Docs: https://developers.paycloud.africa/docs/addpay/CloudAPI/pay-cloud-hosted-checkout
 */
export async function createPayCloudCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
  const config = getPayCloudConfig()

  const body: Record<string, unknown> = {
    app_id: config.appId,
    method: 'pay.checkout',
    format: 'JSON',
    charset: 'UTF-8',
    sign_type: 'RSA2',
    version: '1.0',
    timestamp: Date.now().toString(),
    merchant_no: config.merchantNo,
    store_no: config.storeNo,
    merchant_order_no: params.orderId,
    price_currency: 'ZAR',
    order_amount: params.amount,
    expires: params.expiresSeconds ?? 1800,
    description: params.description,
    notify_url: params.notifyUrl,
    return_url: params.returnUrl,
  }

  if (params.attach) {
    body.attach = JSON.stringify(params.attach)
  }

  body.sign = signParams(body, config.appRsaPrivateKey)

  let response: Response
  try {
    response = await fetch(`${config.endpoint}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    return {
      success: false,
      rawResponse: {},
      errorMessage: err instanceof Error ? err.message : 'Network error calling PayCloud',
    }
  }

  let json: Record<string, unknown>
  try {
    json = await response.json()
  } catch {
    return { success: false, rawResponse: {}, errorMessage: 'PayCloud returned a non-JSON response' }
  }

  if (!response.ok || json.code !== '0000' && json.code !== 0 && !json.pay_url) {
    return {
      success: false,
      rawResponse: json,
      errorMessage: (json.msg as string) ?? (json.message as string) ?? `PayCloud error (HTTP ${response.status})`,
    }
  }

  return {
    success: true,
    payUrl: json.pay_url as string,
    rawResponse: json,
  }
}

/**
 * Verify an inbound webhook (transaction result notification) or API
 * response actually came from PayCloud, using their gateway public key.
 */
export function verifyPayCloudSignature(payload: Record<string, unknown>): boolean {
  const config = getPayCloudConfig()
  const sign = payload.sign as string | undefined
  if (!sign) return false
  return verifySignature(payload, sign, config.gatewayRsaPublicKey)
}