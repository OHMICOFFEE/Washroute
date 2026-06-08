import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole, assertBookingAccess } from '@/lib/auth/guards'
import type { BookingStatus } from '@/types'

const VALID_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending_payment: ['confirmed', 'cancelled'],
  confirmed: ['driver_assigned', 'cancelled'],
  driver_assigned: ['driver_en_route', 'cancelled'],
  driver_en_route: ['pickup_arrived'],
  pickup_arrived: ['pickup_verified'],
  pickup_verified: ['vehicle_collected'],
  vehicle_collected: ['at_wash_facility'],
  at_wash_facility: ['wash_in_progress', 'concierge_in_progress'],
  wash_in_progress: ['returning_vehicle'],
  concierge_in_progress: ['returning_vehicle'],
  returning_vehicle: ['delivery_arrived'],
  delivery_arrived: ['delivery_pin_released'],
  delivery_pin_released: ['delivery_verified'],
  delivery_verified: ['completed'],
}

const schema = z.object({ status: z.string(), notes: z.string().optional() })
interface Params { params: { id: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireRole(['driver', 'admin'])
    if (auth.error) return auth.error
    const { status, notes } = schema.parse(await req.json()) as { status: BookingStatus; notes?: string }
    const access = await assertBookingAccess(params.id, auth.user!.id, auth.role)
    if (access.error) return access.error

    if (auth.role === 'driver' && access.booking!.driver_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Driver is not assigned to this booking' }, { status: 403 })
    }

    const allowed = VALID_TRANSITIONS[access.booking!.status as BookingStatus] ?? []
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `Cannot transition from ${access.booking!.status} to ${status}` }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('bookings').update({ status }).eq('id', params.id)
    if (error) throw error

    await supabase.from('booking_status_events').insert({
      booking_id: params.id,
      status,
      changed_by: auth.user!.id,
      notes: notes ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
