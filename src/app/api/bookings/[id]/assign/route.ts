import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/guards'

const schema = z.object({ driverId: z.string().uuid() })
interface Params { params: { id: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireRole(['admin'])
    if (auth.error) return auth.error
    const { driverId } = schema.parse(await req.json())
    const supabase = createAdminClient()

    const { data: driver } = await supabase.from('profiles').select('id, role').eq('id', driverId).single()
    if (driver?.role !== 'driver') return NextResponse.json({ error: 'Selected user is not a driver' }, { status: 400 })

    const { error } = await supabase.from('bookings').update({ driver_id: driverId, status: 'driver_assigned' }).eq('id', params.id)
    if (error) throw error

    await supabase.from('booking_status_events').insert({
      booking_id: params.id,
      status: 'driver_assigned',
      changed_by: auth.user!.id,
      notes: 'Driver assigned by admin',
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
