import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole, assertBookingAccess } from '@/lib/auth/guards'
import { initPayment } from '@/lib/utils/payments'

const schema = z.object({ bookingId: z.string().uuid() })

export async function POST(req: Request) {
  try {
    const auth = await requireRole(['customer', 'admin'])
    if (auth.error) return auth.error
    const { bookingId } = schema.parse(await req.json())
    const access = await assertBookingAccess(bookingId, auth.user!.id, auth.role)
    if (access.error) return access.error

    const supabase = createAdminClient()
    const { data: booking } = await supabase.from('bookings').select('total, status, customer_id').eq('id', bookingId).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status !== 'pending_payment') return NextResponse.json({ error: 'Booking is not pending payment' }, { status: 400 })

    const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', booking.customer_id).single()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const result = await initPayment({
      bookingId,
      customerId: booking.customer_id,
      amount: Number(booking.total),
      email: profile?.email ?? '',
      name: profile?.full_name ?? '',
      description: `WashRoute booking ${bookingId.slice(0, 8)}`,
      returnUrl: `${appUrl}/bookings/${bookingId}?payment=success`,
      cancelUrl: `${appUrl}/bookings/${bookingId}?payment=cancelled`,
      notifyUrl: `${appUrl}/api/payments/webhook`,
    })

    await supabase.from('payments').update({ provider: result.provider, provider_ref: result.reference, payload: result.payload }).eq('booking_id', bookingId)
    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Payment error' }, { status: 500 })
  }
}
