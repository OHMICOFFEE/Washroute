'use client'
import { useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { useRouter } from 'next/navigation'
import { WASH_PACKAGE_LABELS, WASH_PRICES, COLLECTION_FEE } from '@/lib/utils/pricing'
import type { WashPackageKey } from '@/lib/utils/pricing'
import { CAR_MAKES, CAR_MAKES_MODELS, MOTORBIKE_MAKES, MOTORBIKE_MAKES_MODELS, VEHICLE_COLOURS } from '@/lib/utils/vehicles'
import { Car, ClipboardList, Plus, Check, QrCode, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

type VehicleCategory = 'car' | 'suv_bakkie' | 'panel_van' | 'motorbike'
type WalkInPaymentMethod = 'pay_online_now' | 'pos_on_pickup' | 'cash_on_pickup'

const VEHICLE_CATEGORIES: { id: VehicleCategory; label: string }[] = [
  { id: 'car',        label: 'Car'          },
  { id: 'suv_bakkie', label: 'SUV & Bakkie' },
  { id: 'panel_van',  label: 'Panel Van'    },
  { id: 'motorbike',  label: 'Motorbike'    },
]

export default function WalkInRegistryPage() {
  const store  = useDemoStore()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    customer_name: '', customer_cell: '',
    vehicle_category: 'car' as VehicleCategory,
    make: '', model: '', colour: '', registration: '',
    wash_package: 'full_house' as WashPackageKey,
    payment_method: 'cash_on_pickup' as WalkInPaymentMethod,
    notes: '',
  })

  const isMotorbike = form.vehicle_category === 'motorbike'
  const makes  = isMotorbike ? MOTORBIKE_MAKES : CAR_MAKES
  const models = form.make ? (isMotorbike ? MOTORBIKE_MAKES_MODELS[form.make] : CAR_MAKES_MODELS[form.make]) ?? [] : []
  const packagePrices = WASH_PRICES[form.vehicle_category] ?? {}
  const washPrice = packagePrices[form.wash_package] ?? 0
  const total = washPrice + COLLECTION_FEE

  const walkIns = store.bookings
    .filter(b => b.pickup_type === 'walk_in')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })) }

  function resetForm() {
    setForm({
      customer_name: '', customer_cell: '', vehicle_category: 'car',
      make: '', model: '', colour: '', registration: '',
      wash_package: 'full_house', payment_method: 'cash_on_pickup', notes: '',
    })
  }

  function copyCheckInLink() {
    const url = `${window.location.origin}/checkin`
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Check-in link copied!'))
      .catch(() => toast.error('Could not copy — link is /checkin'))
  }

  function logWalkIn() {
    if (!form.customer_name || !form.make || !form.model || !form.registration) {
      toast.error('Fill in customer name, make, model, and registration')
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
      pickup_address:   'Walk-in / Drop-off at facility',
      delivery_address: 'Walk-in / Drop-off at facility',
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
      // Pay Online Now still needs to go through checkout like a normal
      // booking; the other two are settled in person on the spot.
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

    toast.success(`${form.make} ${form.model} logged in registry`)
    resetForm()
    setShowForm(false)
    router.push(isPayOnline ? `/bookings/${id}` : '/admin/bookings')
  }

  return (
    <div className="space-y-6 anim-fadeup">
      <div className="pt-2 flex items-start justify-between gap-3">
        <div>
          <p className="caption">Admin</p>
          <h1 className="display mt-0.5">Walk-In Registry</h1>
          <p className="caption mt-1">Log vehicles dropped off in person — not collected by a driver.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary py-2 px-4 text-sm flex items-center gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Log Vehicle'}
        </button>
      </div>

      <div className="card-elevated p-4 flex items-center gap-3" style={{ border: '1.5px solid rgba(0,122,255,0.25)', background: 'rgba(0,122,255,0.04)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,122,255,0.12)' }}>
          <QrCode className="w-5 h-5" style={{ color: '#007aff' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Self Check-In Link</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Customers can check themselves in via QR code or this link — no login needed.
          </p>
        </div>
        <button onClick={copyCheckInLink} className="btn btn-secondary py-2 px-3 text-xs font-semibold shrink-0 flex items-center gap-1.5">
          <Copy className="w-3.5 h-3.5" /> Copy Link
        </button>
      </div>

      {showForm && (
        <div className="card-elevated p-5 space-y-4" style={{ border: '2px solid var(--brand-primary)' }}>
          <h2 className="heading">New Walk-In Entry</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label">Customer Name *</label>
              <input className="input" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Full name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Cell Number</label>
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
            <label className="label mb-2 block">Payment Method</label>
            <div className="space-y-2">
              <div onClick={() => set('payment_method', 'pay_online_now')}
                className="option-card cursor-pointer flex items-center gap-3"
                style={form.payment_method === 'pay_online_now' ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-subtle)' } : {}}>
                <span className="text-xl">💳</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pay Online Now</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Customer pays via checkout link</p>
                </div>
              </div>
              <div onClick={() => set('payment_method', 'pos_on_pickup')}
                className="option-card cursor-pointer flex items-center gap-3"
                style={form.payment_method === 'pos_on_pickup' ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-subtle)' } : {}}>
                <span className="text-xl">📟</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Card / Point of Sale</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tap on the card machine now</p>
                </div>
              </div>
              <div onClick={() => set('payment_method', 'cash_on_pickup')}
                className="option-card cursor-pointer flex items-center gap-3"
                style={form.payment_method === 'cash_on_pickup' ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-subtle)' } : {}}>
                <span className="text-xl">💵</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cash</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Paid in cash now</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label">Notes</label>
            <textarea className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any details about the drop-off..." />
          </div>

          <div className="card p-3 flex items-center justify-between" style={{ background: 'var(--surface-inset)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total (wash + collection fee)</span>
            <span className="font-bold text-lg" style={{ color: 'var(--brand-primary)' }}>R{total}</span>
          </div>

          <button className="btn btn-primary w-full py-3 font-bold flex items-center justify-center gap-2" onClick={logWalkIn}>
            <Check className="w-4 h-4" />
            {form.payment_method === 'pay_online_now' ? 'Log Vehicle — Send for Payment' : 'Log Vehicle — Mark Collected'}
          </button>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
          <h2 className="heading">Registry Log</h2>
          {walkIns.length > 0 && (
            <span className="ml-auto text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: 'var(--brand-primary)' }}>
              {walkIns.length}
            </span>
          )}
        </div>

        {walkIns.length === 0 ? (
          <div className="card p-10 text-center">
            <Car className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="heading text-[15px]">No walk-ins logged yet</p>
            <p className="caption text-sm mt-1">Vehicles dropped off in person will appear here.</p>
          </div>
        ) : (
          <div className="list-group">
            {walkIns.map((b, i, arr) => (
              <Link key={b.id} href={`/bookings/${b.id}`}>
                <div className="list-item cursor-pointer" style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                  <Car className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {b.make} {b.model} · {b.registration}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {b.customer_name} · {WASH_PACKAGE_LABELS[b.wash_package as WashPackageKey] ?? b.wash_package} · {b.booking_date}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                    style={{ background: 'rgba(0,122,255,0.1)', color: '#007aff' }}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}