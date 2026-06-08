import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole, assertBookingAccess } from '@/lib/auth/guards'

const schema = z.object({
  bookingId: z.string().uuid(),
  pin: z.string().regex(/^\d{4,8}$/),
  type: z.enum(['pickup', 'delivery']),
})

export async function POST(req: Request) {
  try {
    const auth = await requireRole(['driver', 'admin'])
    if (auth.error) return auth.error
    const { bookingId, pin, type } = schema.parse(await req.json())
    const access = await assertBookingAccess(bookingId, auth.user!.id, auth.role)
    if (access.error) return access.error

    if (auth.role === 'driver' && access.booking!.driver_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Driver is not assigned to this booking' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { data: booking } = await supabase
      .from('bookings')
      .select('pickup_pin_hash, delivery_pin_hash, status, delivery_pin_released')
      .eq('id', bookingId)
      .single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (type === 'pickup') {
      if (booking.status !== 'pickup_arrived') return NextResponse.json({ error: 'Pickup PIN can only be verified after pickup arrival' }, { status: 400 })
      const match = await bcrypt.compare(pin, booking.pickup_pin_hash)
      if (!match) return NextResponse.json({ error: 'Incorrect pickup PIN' }, { status: 401 })
      await supabase.from('bookings').update({ status: 'pickup_verified' }).eq('id', bookingId)
      await supabase.from('booking_status_events').insert({ booking_id: bookingId, status: 'pickup_verified', changed_by: auth.user!.id })
      return NextResponse.json({ ok: true })
    }

    if (!booking.delivery_pin_released) return NextResponse.json({ error: 'Delivery PIN not yet released' }, { status: 400 })
    if (booking.status !== 'delivery_pin_released') return NextResponse.json({ error: 'Delivery PIN cannot be verified at this status' }, { status: 400 })

    const match = await bcrypt.compare(pin, booking.delivery_pin_hash)
    if (!match) return NextResponse.json({ error: 'Incorrect delivery PIN' }, { status: 401 })

    await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId)
    await supabase.from('booking_status_events').insert([
      { booking_id: bookingId, status: 'delivery_verified', changed_by: auth.user!.id },
      { booking_id: bookingId, status: 'completed', changed_by: auth.user!.id },
    ])

    return NextResponse.json({ ok: true, completed: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
