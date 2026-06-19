'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'

/**
 * IMPORTANT — DEMO-MODE CAVEAT:
 * This app currently uses localStorage (DemoStoreProvider) instead of a real
 * database, so there is no server-side record PayCloud's webhook can update.
 * As a stopgap, THIS PAGE marks the order paid client-side once the browser
 * lands back here after checkout.
 *
 * This is NOT secure for production — a user could reach this URL without
 * actually paying. Once you connect Supabase (or another real DB), move
 * this logic into the /api/payments/paycloud/notify webhook instead, and
 * have this page simply poll/read the real payment status from your DB.
 */
function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const store = useDemoStore()
  const orderId = params.get('order')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!orderId || done) return

    const booking = store.getBooking(orderId)
    if (booking) {
      if (booking.status === 'pending_payment') {
        store.updateBookingStatus(orderId, 'confirmed', 'PayCloud')
      }
      const invoice = store.getBookingInvoice(orderId)
      if (invoice && invoice.status === 'unpaid') {
        store.markInvoicePaid(invoice.id)
      }
    } else {
      const invoice = store.getInvoice(orderId)
      if (invoice && invoice.status === 'unpaid') {
        store.markInvoicePaid(orderId)
      }
    }
    setDone(true)
  }, [orderId, done, store])

  return (
    <div className="max-w-sm w-full bg-white rounded-2xl shadow p-8 text-center space-y-4">
      {!done ? (
        <Loader2 className="w-10 h-10 mx-auto animate-spin text-gray-400" />
      ) : (
        <>
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
          <h1 className="text-xl font-bold text-gray-900">Payment Successful</h1>
          <p className="text-gray-500 text-sm">
            Thank you! Your payment has been received
            {orderId ? <> — reference <span className="font-mono">{orderId}</span></> : null}.
          </p>
        </>
      )}

      <button
        onClick={() => router.push(orderId ? `/bookings/${orderId}` : '/dashboard')}
        disabled={!done}
        className="w-full bg-black text-white py-3 rounded-xl font-semibold mt-4 disabled:opacity-50"
      >
        View Booking
      </button>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Suspense fallback={<Loader2 className="w-10 h-10 mx-auto animate-spin text-gray-400" />}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}