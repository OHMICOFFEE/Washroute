/**
 * Ohmi Pay Payment Provider Module
 *
 * Abstraction layer over multiple SA payment gateways.
 * Set PAYMENT_PROVIDER env var to switch provider.
 * Currently ships with a "placeholder" that simulates payment flow.
 */

export type PaymentProvider = 'placeholder' | 'payfast' | 'yoco' | 'ozow' | 'peach'

export interface PaymentInitParams {
  bookingId: string
  customerId: string
  amount: number       // in ZAR (not cents)
  email: string
  name: string
  description: string
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
}

export interface PaymentInitResult {
  provider: PaymentProvider
  redirectUrl?: string    // redirect user here for hosted pages
  checkoutId?: string     // for embedded checkout (Peach/Yoco)
  reference: string
  payload: Record<string, unknown>
}

// ─── Placeholder ─────────────────────────────────────────────

async function initPlaceholder(params: PaymentInitParams): Promise<PaymentInitResult> {
  // Simulates a successful payment — replace with real gateway
  return {
    provider: 'placeholder',
    redirectUrl: `${params.returnUrl}?booking=${params.bookingId}&status=paid`,
    reference: `PLACEHOLDER-${Date.now()}`,
    payload: { simulated: true, amount: params.amount },
  }
}

// ─── PayFast ──────────────────────────────────────────────────

async function initPayFast(params: PaymentInitParams): Promise<PaymentInitResult> {
  const merchantId  = process.env.PAYFAST_MERCHANT_ID!
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY!
  const passphrase  = process.env.PAYFAST_PASSPHRASE!

  const data: Record<string, string> = {
    merchant_id:   merchantId,
    merchant_key:  merchantKey,
    return_url:    params.returnUrl,
    cancel_url:    params.cancelUrl,
    notify_url:    params.notifyUrl,
    name_first:    params.name.split(' ')[0] ?? '',
    name_last:     params.name.split(' ').slice(1).join(' ') ?? '',
    email_address: params.email,
    m_payment_id:  params.bookingId,
    amount:        params.amount.toFixed(2),
    item_name:     params.description,
  }

  // Build signature string
  const sigString = Object.entries(data)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join('&') + (passphrase ? `&passphrase=${encodeURIComponent(passphrase.trim())}` : '')

  const crypto = await import('crypto')
  const signature = crypto.createHash('md5').update(sigString).digest('hex')
  data.signature = signature

  const query = new URLSearchParams(data).toString()
  const sandbox = process.env.NODE_ENV !== 'production'
  const baseUrl = sandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process'

  return {
    provider: 'payfast',
    redirectUrl: `${baseUrl}?${query}`,
    reference: params.bookingId,
    payload: data,
  }
}

// ─── Yoco ─────────────────────────────────────────────────────

async function initYoco(params: PaymentInitParams): Promise<PaymentInitResult> {
  const secretKey = process.env.YOCO_SECRET_KEY!
  const res = await fetch('https://payments.yoco.com/api/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      amount:      Math.round(params.amount * 100), // cents
      currency:    'ZAR',
      successUrl:  params.returnUrl,
      cancelUrl:   params.cancelUrl,
      metadata:    { bookingId: params.bookingId },
    }),
  })
  const data = await res.json()
  return {
    provider: 'yoco',
    redirectUrl: data.redirectUrl,
    checkoutId:  data.id,
    reference:   data.id,
    payload:     data,
  }
}

// ─── Ozow ─────────────────────────────────────────────────────

async function initOzow(params: PaymentInitParams): Promise<PaymentInitResult> {
  // Ozow uses a form POST flow — return params for client-side form
  const siteCode = process.env.OZOW_SITE_CODE!
  const reference = `WR-${params.bookingId.slice(0, 8).toUpperCase()}`
  return {
    provider: 'ozow',
    reference,
    payload: {
      SiteCode:        siteCode,
      CountryCode:     'ZA',
      CurrencyCode:    'ZAR',
      Amount:          params.amount.toFixed(2),
      TransactionReference: reference,
      BankReference:   reference,
      SuccessUrl:      params.returnUrl,
      ErrorUrl:        params.cancelUrl,
      CancelUrl:       params.cancelUrl,
      NotifyUrl:       params.notifyUrl,
      IsTest:          process.env.NODE_ENV !== 'production' ? 'true' : 'false',
    },
  }
}

// ─── Peach Payments ───────────────────────────────────────────

async function initPeach(params: PaymentInitParams): Promise<PaymentInitResult> {
  const accessToken = process.env.PEACH_ACCESS_TOKEN!
  const entityId    = process.env.PEACH_ENTITY_ID!
  const sandbox     = process.env.NODE_ENV !== 'production'
  const baseUrl     = sandbox
    ? 'https://eu-test.oppwa.com'
    : 'https://eu-prod.oppwa.com'

  const body = new URLSearchParams({
    'entityId':           entityId,
    'amount':             params.amount.toFixed(2),
    'currency':           'ZAR',
    'paymentType':        'DB',
    'descriptor':         params.description,
    'merchantTransactionId': params.bookingId,
    'customer.email':    params.email,
  })

  const res = await fetch(`${baseUrl}/v1/checkouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  const data = await res.json()
  return {
    provider:   'peach',
    checkoutId: data.id,
    reference:  data.id,
    payload:    data,
  }
}

// ─── Factory ──────────────────────────────────────────────────

export async function initPayment(params: PaymentInitParams): Promise<PaymentInitResult> {
  const provider = (process.env.PAYMENT_PROVIDER ?? 'placeholder') as PaymentProvider
  switch (provider) {
    case 'payfast':     return initPayFast(params)
    case 'yoco':        return initYoco(params)
    case 'ozow':        return initOzow(params)
    case 'peach':       return initPeach(params)
    default:            return initPlaceholder(params)
  }
}
