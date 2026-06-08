import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/guards'
import { calculatePrice, EXTRA_LABELS, EXTRA_PRICES, generatePin } from '@/lib/utils/pricing'
import type { BookingFormState } from '@/types'

const bookingSchema = z.object({
  form: z.record(z.any()),
})

function cleanTime(value: unknown) {
  const raw = String(value ?? '')
  if (!/^\d{2}:\d{2}$/.test(raw)) throw new Error('Invalid pickup time')
  return `${raw}:00`
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['customer', 'admin'])
    if (auth.error) return auth.error

    const body = bookingSchema.parse(await request.json())
    const form = body.form as Partial<BookingFormState>

    if (!form.vehicle_id || !form.pickup_address || !form.booking_date || !form.pickup_time || !form.wash_package) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, customer_id')
      .eq('id', form.vehicle_id)
      .single()

    if (vehicleError || !vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    if (auth.role !== 'admin' && vehicle.customer_id !== auth.user!.id) {
      return NextResponse.json({ error: 'Vehicle does not belong to current user' }, { status: 403 })
    }

    const price = calculatePrice(form)
    const pickupPin = generatePin()
    const pickupPinHash = await bcrypt.hash(pickupPin, 12)
    const placeholderDeliveryHash = await bcrypt.hash(generatePin(), 12)

    const bookingData = {
      customer_id: auth.role === 'admin' ? vehicle.customer_id : auth.user!.id,
      vehicle_id: form.vehicle_id,
      pickup_address: form.pickup_address,
      delivery_address: form.same_address ? form.pickup_address : form.delivery_address,
      same_address: !!form.same_address,
      booking_date: form.booking_date,
      pickup_time: cleanTime(form.pickup_time),
      pickup_type: form.pickup_type ?? 'standard',
      wash_package: form.wash_package,
      wash_price: price.wash_price,
      concierge_selected: !!form.concierge_selected,
      concierge_fee: price.concierge_fee,
      fuel_refill: !!form.fuel_refill,
      fuel_type: form.fuel_type,
      fuel_station: form.fuel_station,
      fuel_amount: form.fuel_amount,
      fuel_price: price.fuel_price,
      tyre_pressure: !!form.tyre_pressure,
      water_topup: !!form.water_topup,
      oil_check: !!form.oil_check,
      oil_option: form.oil_option,
      extras_total: price.extras_total,
      express_fee: price.express_fee,
      subtotal: price.subtotal,
      total: price.total,
      pickup_pin_hash: pickupPinHash,
      delivery_pin_hash: placeholderDeliveryHash,
      delivery_pin_released: false,
      status: 'pending_payment',
    }

    const { data: booking, error } = await supabase.from('bookings').insert(bookingData).select('id').single()
    if (error) throw error

    const extras = Array.isArray(form.extras) ? form.extras : []
    if (extras.length > 0) {
      await supabase.from('booking_extras').insert(extras.map(code => ({
        booking_id: booking.id,
        service_code: code,
        service_name: EXTRA_LABELS[code] ?? code,
        price: EXTRA_PRICES[code] ?? 0,
      })))
    }

    await supabase.from('booking_status_events').insert({
      booking_id: booking.id,
      status: 'pending_payment',
      changed_by: auth.user!.id,
      notes: 'Booking created',
    })

    await supabase.from('payments').insert({
      booking_id: booking.id,
      customer_id: bookingData.customer_id,
      amount: price.total,
      provider: 'placeholder',
      status: 'pending',
    })

    return NextResponse.json({ bookingId: booking.id, pickupPin, total: price.total, status: 'created' })
  } catch (err: unknown) {
    console.error('POST /api/bookings error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create booking' }, { status: 500 })
  }
}
