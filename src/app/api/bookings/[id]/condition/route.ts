import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole, assertBookingAccess } from '@/lib/auth/guards'

interface Params { params: { id: string } }
const schema = z.object({
  odometer: z.coerce.number().int().nonnegative().optional(),
  fuel_level: z.string().optional(),
  damage_notes: z.string().max(3000).optional(),
  valuables_removed: z.boolean().optional(),
})

export async function POST(req: Request, { params }: Params) {
  try {
    const auth = await requireRole(['driver', 'admin'])
    if (auth.error) return auth.error
    const access = await assertBookingAccess(params.id, auth.user!.id, auth.role)
    if (access.error) return access.error
    if (auth.role === 'driver' && access.booking!.driver_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Driver is not assigned to this booking' }, { status: 403 })
    }

    const body = schema.parse(await req.json())
    const supabase = createAdminClient()

    const { error } = await supabase.from('vehicle_condition_reports').upsert({
      booking_id: params.id,
      odometer: body.odometer ?? null,
      fuel_level: body.fuel_level ?? null,
      damage_notes: body.damage_notes ?? null,
      valuables_removed: body.valuables_removed ?? false,
    }, { onConflict: 'booking_id' })
    if (error) throw error

    await supabase.from('bookings').update({ status: 'vehicle_collected' }).eq('id', params.id)
    await supabase.from('booking_status_events').insert([
      { booking_id: params.id, status: 'pickup_verified', changed_by: auth.user!.id },
      { booking_id: params.id, status: 'vehicle_collected', changed_by: auth.user!.id },
    ])

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
