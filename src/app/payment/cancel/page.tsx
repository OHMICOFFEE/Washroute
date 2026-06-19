'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle } from 'lucide-react'
import { Suspense } from 'react'

function CancelContent() {
  const router = useRouter()
  const params = useSearchParams()
  const orderId = params.get('order')

  return (
    <div className="max-w-sm w-full bg-white rounded-2xl shadow p-8 text-center space-y-4">
      <XCircle className="w-12 h-12 mx-auto text-red-500" />
      <h1 className="text-xl font-bold text-gray-900">Payment Cancelled</h1>
      <p className="text-gray-500 text-sm">No charge was made. You can try again whenever you're ready.</p>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
        >
          Dashboard
        </button>
        <button
          onClick={() => router.push(orderId ? `/bookings/${orderId}` : '/bookings/new')}
          className="flex-1 bg-black text-white py-3 rounded-xl font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Suspense fallback={null}>
        <CancelContent />
      </Suspense>
    </div>
  )
}