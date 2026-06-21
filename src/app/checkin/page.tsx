'use client'
import { useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { useRouter } from 'next/navigation'
import { WASH_PACKAGE_LABELS, WASH_PRICES, COLLECTION_FEE } from '@/lib/utils/pricing'
import type { WashPackageKey } from '@/lib/utils/pricing'
import { CAR_MAKES, CAR_MAKES_MODELS, MOTORBIKE_MAKES, MOTORBIKE_MAKES_MODELS, VEHICLE_COLOURS } from '@/lib/utils/vehicles'
import { Car, Check, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

type VehicleCategory = 'car' | 'suv_bakkie' | 'panel_van' | 'motorbike'
type CheckInPaymentMethod = 'pay_online_now' | 'pos_on_pickup' | 'cash_on_pickup'

const VEHICLE_CATEGORIES: { id: VehicleCategory; label: string }[] = [
  { id: 'car',        label: 'Car'          },
  { id: 'suv_bakkie', label: 'SUV & Bakkie' },
  { id: 'panel_van',  label: 'Panel Van'    },
  { id: 'motorbike',  label: 'Motorbike'    },
]

/**
 * Public self-check-in page. No login required — reached via a QR code
 * posted at the wash bay or a link shared by admin. The customer fills in
 * their own vehicle details right there in person (their car is already
 * on-site), instead of admin typing it in for them.
 *
 * Functionally identical to /admin/registry's walk-in flow — same fields,
 * same pricing, same payment options — just customer-facing and public.
 */
export default function SelfCheckInPage() {
  const store  = useDemoStore()
  const router = useRouter()
  const [submitted, setSubmitted] = useState<{ id: string; pin: string } | null>(null)

  const [form, setForm] = useState({
    customer_name: '', customer_cell: '',
    vehicle_category: 'car' as VehicleCategory,
    make: '', model: '', colour: '', registration: '',
    wash_package: 'full_house' as WashPackageKey,
    payment_method: 'cash_on_pickup' as CheckInPaymentMethod,
    notes: '',
  })

  const isMotorbike = form.vehicle_category === 'motorbike'
  const makes  = isMotorbike ? MOTORBIKE_MAKES : CAR_MAKES
  const models = form.make ? (isMotorbike ? MOTORBIKE_MAKES_MODELS[form.make] : CAR_MAKES_MODELS[form.make]) ?? [] : []
  const packagePrices = WASH_PRICES[form.vehicle_category] ?? {}
  const washPrice = packagePrices[form.wash_package] ?? 0
  const total = washPrice + COLLECTION_FEE

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })) }

  function submitCheckIn() {
    if (!form.customer_name || !form.customer_cell || !form.make || !form.model || !form.registration) {
      toast.error('Please fill in your name, cell number, make, model, and registration')
      return
    }
    const today = new Date()
    const isPayOnline = form.payment_method === 'pay_online_now'

    const id = store.addBooking({
      customer_name:    form.customer_name,
      customer_cell:    form.customer_cell,
      vehicle_type:     form.vehicle_category,
      make:             form.make,
      model:            form.model,
      colour:           form.colour,
      registration:     form.registration,
      pickup_address:   'Self check-in / On-site drop-off',
      delivery_address: 'Self check-in / On-site drop-off',
      same_address:     true,
      booking_date:     today.toISOString().split('T')[0],
      pickup_time:      today.toTimeString().slice(0,5),
      pickup_type:      'walk_in',
      wash_package:     form.wash_package,
      extras:           [],
      concierge:        false,
      fuel_refill:      false,
      fuel_station:     '',
      fuel_type:        '',
      fuel_amount:      '',
      oil:              '',
      total,
      status:           isPayOnline ? 'pending_payment' : 'vehicle_collected',
      driver_id:        null,
      pickup_pin:       String(Math.floor(100000 + Math.random() * 900000)),
      delivery_pin:     String(Math.floor(100000 + Math.random() * 900000)),
      delivery_pin_released: false,
      notes:            form.notes,
      payment_method:   form.payment_method,
      payment_collected: !isPayOnline,
      payment_collected_method: isPayOnline ? undefined : (form.payment_method === 'pos_on_pickup' ? 'card' : 'cash'),
    })

    setTimeout(() => {
      const invId = store.createInvoice(id)
      if (invId && !isPayOnline) store.markInvoicePaid(invId)
    }, 100)

    const booking = store.getBooking(id)
    toast.success('Check-in complete! 🎉')

    if (isPayOnline) {
      router.push(`/bookings/${id}`)
    } else {
      setSubmitted({ id, pin: booking?.pickup_pin ?? '' })
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--surface-bg)' }}>
        <div className="card-elevated p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 mx-auto" style={{ color: '#34c759' }} />
          <h1 className="title">You're Checked In!</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Hand your keys to our staff. We'll take it from here.
          </p>
          <div className="p-4 rounded-2xl" style={{ background: 'var(--surface-inset)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Reference</p>
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>#{submitted.id}</p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            A staff member will confirm your details shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--surface-bg)' }}>
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--brand-subtle)' }}>
            <Car className="w-6 h-6" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <h1 className="display">Welcome 👋</h1>
          <p className="caption mt-1">Check yourself in — your vehicle is already here.</p>
        </div>

        <div className="card-elevated p-5 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label">Your Name *</label>
              <input className="input" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Full name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Cell Number *</label>
              <input className="input" value={form.customer_cell} onChange={e => set('customer_cell', e.target.value)} placeholder="082 000 0000" inputMode="tel" />
            </div>
          </div>

          <div>
            <label className="label mb-2 block">Vehicle Type</label>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLE_CATEGORIES.map(cat => (
                <div key={cat.id} onClick={() => set('vehicle_category', cat.id)}
                  className="option-card cursor-pointer text-center py-2.5 text-sm font-medium"
                  style={form.vehicle_category === cat.id ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-subtle)', color: 'var(--brand-primary)' } : { color: 'var(--text-primary)' }}>
                  {cat.label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label">Make *</label>
              <select className="input" value={form.make} onChange={e => set('make', e.target.value)}>
                <option value="">Select...</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Model *</label>
              <select className="input" value={form.model} onChange={e => set('model', e.target.value)} disabled={!form.make}>
                <option value="">{form.make ? 'Select...' : 'Pick make first'}</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label">Colour</label>
              <select className="input" value={form.colour} onChange={e => set('colour', e.target.value)}>
                <option value="">Select...</option>
                {VEHICLE_COLOURS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Registration *</label>
              <input className="input" value={form.registration} onChange={e => set('registration', e.target.value.toUpperCase())} placeholder="CA 123-456" />
            </div>
          </div>

          <div>
            <label className="label mb-2 block">Wash Package</label>
            <div className="space-y-2">
              {(Object.entries(packagePrices) as [WashPackageKey, number][]).map(([pkg, price]) => (
                <div key={pkg} onClick={() => set('wash_package', pkg)}
                  className="option-card cursor-pointer flex items-center justify-between"
                  style={form.wash_package === pkg ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-subtle)' } : {}}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{WASH_PACKAGE_LABELS[pkg]}</span>
                  <span className="text-sm font-bold" style={{ color: form.wash_package === pkg ? 'var(--brand-primary)' : 'var(--text-primary)' }}>R{price}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label mb-2 block">How Will You Pay?</label>
            <div className="space-y-2">
              <div onClick={() => set('payment_method', 'pay_online_now')}
                className="option-card cursor-pointer flex items-center gap-3"
                style={form.payment_method === 'pay_online_now' ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-subtle)' } : {}}>
                <span className="text-xl">💳</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pay Online Now</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Secure card payment via checkout</p>
                </div>
              </div>
              <div onClick={() => set('payment_method', 'pos_on_pickup')}
                className="option-card cursor-pointer flex items-center gap-3"
                style={form.payment_method === 'pos_on_pickup' ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-subtle)' } : {}}>
                <span className="text-xl">📟</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Card / Point of Sale</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tap your card with our staff now</p>
                </div>
              </div>
              <div onClick={() => set('payment_method', 'cash_on_pickup')}
                className="option-card cursor-pointer flex items-center gap-3"
                style={form.payment_method === 'cash_on_pickup' ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-subtle)' } : {}}>
                <span className="text-xl">💵</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cash</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pay our staff in cash now</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label">Notes (optional)</label>
            <textarea className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything we should know?" />
          </div>

          <div className="card p-3 flex items-center justify-between" style={{ background: 'var(--surface-inset)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total</span>
            <span className="font-bold text-lg" style={{ color: 'var(--brand-primary)' }}>R{total}</span>
          </div>

          <button className="btn btn-primary w-full py-4 font-bold text-base flex items-center justify-center gap-2" onClick={submitCheckIn}>
            <Check className="w-5 h-5" />
            {form.payment_method === 'pay_online_now' ? 'Check In — Continue to Payment' : 'Check In Now'}
          </button>
        </div>
      </div>
    </div>
  )
}