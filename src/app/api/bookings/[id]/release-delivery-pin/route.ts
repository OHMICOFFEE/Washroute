import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole, assertBookingAccess } from '@/lib/auth/guards'
import { generatePin } from '@/lib/utils/pricing'

interface Params { params: { id: string } }

export async function POST(_req: Request, { params }: Params) {
  try {
    const auth = await requireRole(['driver', 'admin'])
    if (auth.error) return auth.error
    const access = await assertBookingAccess(params.id, auth.user!.id, auth.role)
    if (access.error) return access.error

    if (auth.role === 'driver' && access.booking!.driver_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Driver is not assigned to this booking' }, { status: 403 })
    }
    if (access.booking!.status !== 'delivery_arrived') {
      return NextResponse.json({ error: 'Delivery PIN can only be released once driver is at delivery location' }, { status: 400 })
    }

    const newPin = generatePin()
    const newHash = await bcrypt.hash(newPin, 12)
    const supabase = createAdminClient()

    const { error } = await supabase.from('bookings').update({
      delivery_pin_released: true,
      delivery_pin_hash: newHash,
      status: 'delivery_pin_released',
    }).eq('id', params.id)
    if (error) throw error

    await supabase.from('booking_status_events').insert({
      booking_id: params.id,
      status: 'delivery_pin_released',
      changed_by: auth.user!.id,
      notes: 'Delivery PIN released to authenticated requester only',
    })

    return NextResponse.json({ ok: true, deliveryPin: newPin })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
