'use client'
import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

interface PayWithPayCloudButtonProps {
  /** Your internal booking or invoice ID — becomes the PayCloud merchant_order_no */
  orderId: string
  /** Amount in ZAR */
  amount: number
  /** Shown on PayCloud's checkout page */
  description?: string
  className?: string
  label?: string
}

/**
 * Drop this button anywhere a customer needs to pay — the booking wizard's
 * final "Confirm & Pay" step, or the invoice page's "Pay Now" button.
 *
 * On click it calls our own /api/payments/paycloud/checkout route (which
 * signs and calls PayCloud server-side), then redirects the browser to the
 * returned PayCloud-hosted payment page.
 */
export default function PayWithPayCloudButton({
  orderId,
  amount,
  description,
  className,
  label = 'Pay with PayCloud',
}: PayWithPayCloudButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/paycloud/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, description }),
      })
      const data = await res.json()

      if (!res.ok || !data.payUrl) {
        toast.error(data.error ?? 'Could not start payment. Please try again.')
        setLoading(false)
        return
      }

      window.location.href = data.payUrl
    } catch {
      toast.error('Network error — please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className={className ?? 'w-full bg-black text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60'}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
      {loading ? 'Redirecting…' : label}
    </button>
  )
}