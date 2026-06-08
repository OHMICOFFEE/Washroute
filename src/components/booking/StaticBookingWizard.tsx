'use client'
import React from 'react'
import { useState } from 'react'
import {
  calculatePrice, formatZAR, WASH_PACKAGE_LABELS, WASH_PACKAGE_DESCRIPTIONS,
  WASH_PRICES, EXTRA_PRICES, EXTRA_LABELS, getAvailablePackages,
  COLLECTION_FEE, CONCIERGE_FEE,
  PETROL_STATIONS, FUEL_AMOUNTS, FUEL_PRICES,
  type PetrolStationKey, type FuelAmountValue,
} from '@/lib/utils/pricing'
import { getTimeSlots, formatSlotDisplay, isSlotAvailable } from '@/lib/utils/timeslots'
import { CAR_MAKES_MODELS, MOTORBIKE_MAKES_MODELS, CAR_MAKES, MOTORBIKE_MAKES, VEHICLE_COLOURS } from '@/lib/utils/vehicles'
import { cn } from '@/lib/utils'
import type { BookingFormState, VehicleCategory } from '@/types'
import type { WashPackageKey } from '@/lib/utils/pricing'
import { Car, Check, Clock, ShieldCheck, Bike, Paintbrush, Truck, BusFront, ChevronRight, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useDemoStore, createBookingFromForm, getSlotBookingCount, MAX_BOOKINGS_PER_SLOT } from '@/lib/demo/store'
import { EXTRA_LABELS as EXTRA_LABEL_MAP } from '@/lib/utils/pricing'

const SA_PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape']

const DEFAULTS: BookingFormState = {
  vehicle_id: '', vehicle_type: 'car_suv_bakkie', vehicle_category: 'car',
  make: '', model: '', registration: '', variant: '',
  pickup_address: '', delivery_address: '', same_address: false,
  booking_date: '', pickup_time: '09:30', pickup_type: 'standard',
  wash_package: 'full_house', extras: [],
  concierge_selected: false, fuel_refill: false, fuel_type: null,
  fuel_station: null, fuel_amount: null, tyre_pressure: false,
  water_topup: false, oil_check: false, oil_option: null,
  custom_detail_price: 850, custom_detail_notes: '',
}

const STEPS = ['Vehicle', 'Schedule', 'Wash', 'Extras', 'Concierge', 'Review']

const VEHICLE_CATEGORIES = [
  { id: 'car',        label: 'Car',          sub: 'Hatchback, Sedan, Coupe', icon: Car      },
  { id: 'suv_bakkie', label: 'SUV & Bakkie', sub: 'SUV, 4x4, Pickup Truck',  icon: Truck    },
  { id: 'panel_van',  label: 'Panel Van',    sub: 'Minibus, Kombi, Van',     icon: BusFront },
  { id: 'motorbike',  label: 'Motorbike',    sub: 'Any bike or scooter',     icon: Bike     },
]

const tomorrow = () => {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
}

function SectionLabel({ children }: { children: string }) {
  return <p className="label mb-2">{children}</p>
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>
}

function OptionCard({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <div onClick={onClick} className={cn('option-card cursor-pointer', selected && 'selected', className)}>
      {children}
    </div>
  )
}

function CheckRow({ checked, onChange, label, sublabel, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; sublabel?: string; id: string }) {
  return (
    <div className="flex items-center gap-3 py-1 cursor-pointer" onClick={() => onChange(!checked)}>
      <div className={cn('check-box', checked && 'checked')}>
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sublabel}</p>}
      </div>
    </div>
  )
}

function ReviewRow({ label, value, last, highlight }: { label: string; value: string; last?: boolean; highlight?: boolean }) {
  return (
    <div className="list-item" style={{ borderBottom: last ? 'none' : '1px solid var(--surface-border)' }}>
      <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: highlight ? 'var(--brand-primary)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

export default function StaticBookingWizard() {
  const store  = useDemoStore()
  const router = useRouter()

  const [step, setStep]             = useState(1)
  const [form, setForm]             = useState<BookingFormState>(DEFAULTS)
  const [colour, setColour]         = useState('')
  const [selectedStation, setSelectedStation]       = useState<PetrolStationKey | ''>('')
  const [selectedOil, setSelectedOil]               = useState('')
  const [selectedFuelType, setSelectedFuelType]     = useState('')
  const [selectedFuelAmount, setSelectedFuelAmount] = useState<FuelAmountValue | ''>('')
  const [pickupSuburb, setPickupSuburb]             = useState('')
  const [pickupCity, setPickupCity]                 = useState('')
  const [pickupProvince, setPickupProvince]         = useState('')
  const [pickupPostal, setPickupPostal]             = useState('')
  const [deliverySuburb, setDeliverySuburb]         = useState('')
  const [deliveryCity, setDeliveryCity]             = useState('')
  const [deliveryProvince, setDeliveryProvince]     = useState('')
  const [deliveryPostal, setDeliveryPostal]         = useState('')

  const update = (patch: Partial<BookingFormState>) => setForm(p => ({ ...p, ...patch }))

  // Auto-fill primary vehicle on mount
  React.useEffect(() => {
    const primary = store.savedVehicles?.find(v => v.is_primary) ?? store.savedVehicles?.[0] ?? null
    if (primary && !form.make) {
      update({
        vehicle_category: primary.vehicle_type as BookingFormState['vehicle_category'],
        make:             primary.make,
        model:            primary.model,
        registration:     primary.registration,
      })
      setColour(primary.colour ?? '')
    }
  }, [])

  const isMotorbike = form.vehicle_category === 'motorbike'
  const makes       = isMotorbike ? MOTORBIKE_MAKES : CAR_MAKES
  const models      = form.make ? (isMotorbike ? MOTORBIKE_MAKES_MODELS[form.make] : CAR_MAKES_MODELS[form.make]) ?? [] : []
  const packages    = getAvailablePackages(form.vehicle_category)
  const price       = calculatePrice(form)
  const TIME_SLOTS  = getTimeSlots()
  const stationData = selectedStation ? PETROL_STATIONS[selectedStation] : null
  const fuelTotal   = selectedFuelAmount ? FUEL_PRICES[selectedFuelAmount] : 0
  const grandTotal  = price.wash_price + price.extras_total + COLLECTION_FEE +
    (form.concierge_selected ? CONCIERGE_FEE : 0) + fuelTotal

  function handleCategoryChange(cat: VehicleCategory) {
    update({ vehicle_category: cat, vehicle_type: cat === 'motorbike' ? 'motorbike' : 'car_suv_bakkie', make: '', model: '', wash_package: 'full_house' })
  }

  function handleSubmit() {
    const stationLabel = selectedStation ? PETROL_STATIONS[selectedStation]?.label ?? '' : ''
    const extraNames   = form.extras.map(e => EXTRA_LABEL_MAP[e] ?? e)
    const bookingData  = createBookingFromForm(
      form as unknown as Record<string, unknown>,
      extraNames, grandTotal, colour, stationLabel,
      selectedFuelType, selectedFuelAmount, selectedOil,
    )
    const id = store.addBooking(bookingData)
    setTimeout(() => store.createInvoice(id), 100)
    toast.success('Booking confirmed! 🎉')
    setStep(1); setForm(DEFAULTS); setColour('')
    setSelectedStation(''); setSelectedOil(''); setSelectedFuelType(''); setSelectedFuelAmount('')
    router.push('/bookings/' + id)
  }

  const canContinue1 = form.make && form.model && form.registration
  const canContinue2 = form.pickup_address && form.booking_date

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={cn('step-dot', step > idx+1 ? 'done' : step === idx+1 ? 'active' : 'pending')}>
                {step > idx+1 ? <Check className="w-3 h-3" /> : idx+1}
              </div>
              <span className="text-[10px] font-medium hidden sm:block"
                style={{ color: step === idx+1 ? 'var(--brand-primary)' : 'var(--text-tertiary)' }}>{s}</span>
            </div>
            {idx < STEPS.length-1 && <div className={cn('step-line', step > idx+1 ? 'done' : 'pending')} />}
          </div>
        ))}
      </div>

      <div className="card-elevated p-5 anim-slidein">

        {/* STEP 1 - Vehicle */}
        {step === 1 && (
          <FieldGroup>
            <div>
              <h2 className="title">Your Vehicle</h2>
              <p className="caption mt-1">Select type to see correct pricing.</p>
            </div>

            {store.savedVehicles && store.savedVehicles.length > 0 && (
              <div>
                <SectionLabel>Saved Vehicles</SectionLabel>
                <div className="space-y-2">
                  {store.savedVehicles.map(v => (
                    <button key={v.id} type="button"
                      onClick={() => {
                        update({ vehicle_category: v.vehicle_type as BookingFormState['vehicle_category'], make: v.make, model: v.model, registration: v.registration })
                        setColour(v.colour ?? '')
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left"
                      style={{ borderColor: form.registration === v.registration ? 'var(--brand-primary)' : 'var(--surface-border)', background: form.registration === v.registration ? 'var(--brand-subtle)' : 'var(--surface-inset)' }}>
                      <span className="text-xl">🚗</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>{v.make} {v.model} {v.is_primary ? '⭐' : ''}</p>
                        <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>{v.registration}{v.colour ? ` · ${v.colour}` : ''}</p>
                      </div>
                      {form.registration === v.registration && <span className="text-xs font-bold shrink-0" style={{ color:'var(--brand-primary)' }}>Selected</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionLabel>Vehicle Type</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_CATEGORIES.map(cat => (
                  <OptionCard key={cat.id} selected={form.vehicle_category === cat.id} onClick={() => handleCategoryChange(cat.id as VehicleCategory)}>
                    <div className="flex items-center gap-3">
                      <cat.icon className="w-5 h-5 shrink-0" style={{ color: form.vehicle_category === cat.id ? 'var(--brand-primary)' : 'var(--text-secondary)' }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.label}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cat.sub}</p>
                      </div>
                    </div>
                  </OptionCard>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label">Make</label>
              <select className="input" value={form.make} onChange={e => update({ make: e.target.value, model: '' })}>
                <option value="">Select make...</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label">Model</label>
              <select className="input" value={form.model} onChange={e => update({ model: e.target.value })} disabled={!form.make}>
                <option value="">{form.make ? 'Select model...' : 'Select make first'}</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="label">Year</label>
                <select className="input">
                  <option value="">Any year</option>
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label">Colour</label>
                <select className="input" value={colour} onChange={e => setColour(e.target.value)}>
                  <option value="">Select...</option>
                  {VEHICLE_COLOURS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label">Registration Number</label>
              <input className="input" value={form.registration} onChange={e => update({ registration: e.target.value.toUpperCase() })} placeholder="CA 123-456" />
            </div>

            <button className="btn btn-primary w-full" onClick={() => setStep(2)} disabled={!canContinue1}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </FieldGroup>
        )}

        {/* STEP 2 - Schedule */}
        {step === 2 && (
          <FieldGroup>
            <div>
              <h2 className="title">Pickup & Delivery</h2>
              <p className="caption mt-1">Where and when should we collect?</p>
            </div>

            <div>
              <p className="label mb-3">Pickup Address</p>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="label">Street Address *</label>
                  <input className="input" value={form.pickup_address} onChange={e => update({ pickup_address: e.target.value })} placeholder="e.g. 12 Oak Street" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5"><label className="label">Suburb *</label><input className="input" value={pickupSuburb} onChange={e => setPickupSuburb(e.target.value)} placeholder="e.g. Rondebosch" /></div>
                  <div className="flex flex-col gap-1.5"><label className="label">City *</label><input className="input" value={pickupCity} onChange={e => setPickupCity(e.target.value)} placeholder="e.g. Cape Town" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="label">Province</label>
                    <select className="input" value={pickupProvince} onChange={e => setPickupProvince(e.target.value)}>
                      <option value="">Select...</option>
                      {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5"><label className="label">Postal Code</label><input className="input" value={pickupPostal} onChange={e => setPickupPostal(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="7700" inputMode="numeric" /></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-1 cursor-pointer" onClick={() => update({ same_address: !form.same_address, delivery_address: !form.same_address ? form.pickup_address : '' })}>
              <div className={cn('check-box', form.same_address && 'checked')}>
                {form.same_address && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Deliver back to same address</p>
            </div>

            {!form.same_address && (
              <div>
                <p className="label mb-3">Delivery Address</p>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="label">Street Address *</label>
                    <input className="input" value={form.delivery_address} onChange={e => update({ delivery_address: e.target.value })} placeholder="e.g. 45 Main Road" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5"><label className="label">Suburb</label><input className="input" value={deliverySuburb} onChange={e => setDeliverySuburb(e.target.value)} placeholder="Suburb" /></div>
                    <div className="flex flex-col gap-1.5"><label className="label">City</label><input className="input" value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} placeholder="City" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="label">Province</label>
                      <select className="input" value={deliveryProvince} onChange={e => setDeliveryProvince(e.target.value)}>
                        <option value="">Select...</option>
                        {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5"><label className="label">Postal Code</label><input className="input" value={deliveryPostal} onChange={e => setDeliveryPostal(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="7700" inputMode="numeric" /></div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="label">Date</label>
              <input className="input" type="date" value={form.booking_date} min={tomorrow()} onChange={e => update({ booking_date: e.target.value })} />
            </div>

            <div className="card p-4 flex items-center gap-3" style={{ background:'var(--surface-inset)' }}>
              <Clock className="w-5 h-5 shrink-0" style={{ color:'var(--brand-primary)' }} />
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color:'var(--text-primary)' }}>Collection Fee — R{COLLECTION_FEE}</p>
                <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>1 hour lead time required on all bookings</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <SectionLabel>Pickup Time</SectionLabel>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>9:30 AM — 3:30 PM</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map(slot => {
                  const active      = form.pickup_time === slot
                  const count       = form.booking_date ? getSlotBookingCount(store.bookings, form.booking_date, slot) : 0
                  const isFull      = count >= MAX_BOOKINGS_PER_SLOT
                  const tooSoon     = form.booking_date ? !isSlotAvailable(slot, form.pickup_type as 'standard' | 'express', form.booking_date) : false
                  const unavailable = isFull || tooSoon
                  const spotsLeft   = MAX_BOOKINGS_PER_SLOT - count
                  return (
                    <button key={slot} type="button"
                      onClick={() => !unavailable && update({ pickup_time: slot })}
                      disabled={unavailable}
                      className="py-2.5 rounded-xl text-sm font-medium border transition-all"
                      style={unavailable
                        ? { background: 'var(--surface-inset)', color: 'var(--text-tertiary)', border: '1.5px solid var(--surface-border)', opacity: 0.5, cursor: 'not-allowed' }
                        : active
                        ? { background: 'var(--brand-primary)', color: '#fff', border: '1.5px solid var(--brand-primary)' }
                        : { background: 'var(--surface-inset)', color: 'var(--text-secondary)', border: '1.5px solid var(--surface-border)' }}>
                      <span className="block">{formatSlotDisplay(slot)}</span>
                      {isFull ? <span className="block text-[10px] mt-0.5 font-semibold" style={{ color: '#ff3b30' }}>Full</span>
                        : tooSoon ? <span className="block text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Too soon</span>
                        : count > 0 ? <span className="block text-[10px] mt-0.5" style={{ color: active ? 'rgba(255,255,255,0.7)' : '#ff9500' }}>{spotsLeft} left</span>
                        : <span className="block text-[10px] mt-0.5" style={{ color: active ? 'rgba(255,255,255,0.7)' : '#34c759' }}>Open</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button className="btn btn-secondary flex-1" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary flex-1" onClick={() => setStep(3)} disabled={!canContinue2}>Continue →</button>
            </div>
          </FieldGroup>
        )}

        {/* STEP 3 - Wash */}
        {step === 3 && (
          <FieldGroup>
            <div>
              <h2 className="title">Wash Package</h2>
              <p className="caption mt-1">Prices for <strong style={{ color: 'var(--text-primary)' }}>{VEHICLE_CATEGORIES.find(c => c.id === form.vehicle_category)?.label}</strong></p>
            </div>
            <div className="space-y-2">
              {packages.filter(p => p !== 'custom_detail').map(pkg => {
                const pkgPrice   = WASH_PRICES[form.vehicle_category]?.[pkg] ?? 0
                const isSelected = form.wash_package === pkg
                return (
                  <OptionCard key={pkg} selected={isSelected} onClick={() => update({ wash_package: pkg })}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={isSelected ? { background: 'var(--brand-primary)', border: '2px solid var(--brand-primary)' } : { border: '2px solid var(--surface-border)' }}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{WASH_PACKAGE_LABELS[pkg]}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{WASH_PACKAGE_DESCRIPTIONS[pkg]}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold shrink-0" style={{ color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>R{pkgPrice}</span>
                    </div>
                  </OptionCard>
                )
              })}
              <div className="divider my-1" />
              <OptionCard selected={form.wash_package === 'custom_detail'} onClick={() => update({ wash_package: 'custom_detail', custom_detail_price: 850 })}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={form.wash_package === 'custom_detail' ? { background: 'var(--brand-primary)', border: '2px solid var(--brand-primary)' } : { border: '2px solid var(--surface-border)' }}>
                      {form.wash_package === 'custom_detail' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        <Paintbrush className="w-4 h-4" style={{ color: '#ff9500' }} /> Custom Detailing
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Ceramic, paint correction, full restoration</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold shrink-0" style={{ color: '#ff9500' }}>R850</span>
                </div>
              </OptionCard>
              {form.wash_package === 'custom_detail' && (
                <div className="px-3 pb-1 space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="label">What do you need?</label>
                    <textarea className="input" value={form.custom_detail_notes ?? ''} onChange={e => update({ custom_detail_notes: e.target.value })} placeholder="e.g. Full paint correction + ceramic coating..." />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Starting from R850 — final price confirmed before proceeding.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button className="btn btn-secondary flex-1" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary flex-1" onClick={() => setStep(4)}>Continue →</button>
            </div>
          </FieldGroup>
        )}

        {/* STEP 4 - Extras */}
        {step === 4 && (
          <FieldGroup>
            <div>
              <h2 className="title">Add-On Extras</h2>
              <p className="caption mt-1">All optional — enhance your service.</p>
            </div>
            <div className="space-y-2">
              {Object.entries(EXTRA_PRICES).map(([code, extraPrice]) => {
                const sel = form.extras.includes(code)
                const descs: Record<string, string> = {
                  engine_bay_clean: 'Professional degreasing and rinse.',
                  seat_shampoo:     'Deep-clean fabric or leather seats.',
                  pet_hair_removal: 'Full interior pet hair extraction.',
                  spray_wax:        'Hydrophobic spray wax — glossy finish.',
                }
                return (
                  <div key={code} onClick={() => update({ extras: sel ? form.extras.filter(c => c !== code) : [...form.extras, code] })}
                    className="option-card cursor-pointer flex items-center gap-3"
                    style={sel ? { borderColor: 'var(--brand-primary)', background: 'var(--brand-subtle)' } : {}}>
                    <div className="check-box flex-shrink-0" style={sel ? { background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}}>
                      {sel && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{EXTRA_LABELS[code]}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{descs[code]}</p>
                    </div>
                    <span className="font-bold text-sm shrink-0" style={{ color: sel ? 'var(--brand-primary)' : 'var(--text-primary)' }}>+R{extraPrice}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 pt-1">
              <button className="btn btn-secondary flex-1" onClick={() => setStep(3)}>← Back</button>
              <button className="btn btn-primary flex-1" onClick={() => setStep(5)}>Continue →</button>
            </div>
          </FieldGroup>
        )}

        {/* STEP 5 - Concierge */}
        {step === 5 && (
          <FieldGroup>
            <div>
              <h2 className="title">Vehicle Concierge</h2>
              <p className="caption mt-1">Select what you need — all handled while we have your vehicle.</p>
            </div>

            <OptionCard selected={form.concierge_selected} onClick={() => update({ concierge_selected: !form.concierge_selected, tyre_pressure: !form.concierge_selected, water_topup: !form.concierge_selected, oil_check: !form.concierge_selected })}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,149,0,0.12)' }}>
                  <ShieldCheck className="w-5 h-5" style={{ color: '#ff9500' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Add Vehicle Concierge</p>
                    <span className="font-bold" style={{ color: '#ff9500' }}>+R{CONCIERGE_FEE}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Tap to include all 3 checks below</p>
                </div>
              </div>
            </OptionCard>

            <div>
              <SectionLabel>Included Services</SectionLabel>
              <div className="space-y-2">
                {[
                  { emoji: '🔧', title: 'Tyre Pressure Check',     desc: 'All 4 tyres checked and inflated to correct specification' },
                  { emoji: '💧', title: 'Windscreen Water Top-Up', desc: 'Washer fluid reservoir checked and topped up' },
                  { emoji: '🛢️', title: 'Oil Level Check',         desc: 'Engine oil level inspected and reported back to you' },
                ].map(item => (
                  <div key={item.title} className="card p-4 flex items-start gap-3"
                    style={form.concierge_selected
                      ? { border: '1.5px solid rgba(52,199,89,0.3)', background: 'rgba(52,199,89,0.04)' }
                      : { border: '1.5px solid var(--surface-border)', opacity: 0.6 }}>
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: form.concierge_selected ? '#34c759' : 'var(--text-tertiary)' }}>
                      {form.concierge_selected ? '✓ Included' : `R${CONCIERGE_FEE}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Optional Add-On</SectionLabel>
              <div className="card p-4 space-y-4">
                <CheckRow checked={form.fuel_refill} id="fuel"
                  onChange={v => { update({ fuel_refill: v }); if (!v) { setSelectedStation(''); setSelectedFuelType(''); setSelectedFuelAmount(''); setSelectedOil('') } }}
                  label="⛽ Add Fuel Refill"
                  sublabel="We fill your tank at your chosen station while we have the vehicle" />

                {form.fuel_refill && (
                  <div className="space-y-4 pt-3 border-t" style={{ borderColor: 'var(--surface-border)' }}>
                    <div>
                      <SectionLabel>Petrol Station</SectionLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(PETROL_STATIONS) as [PetrolStationKey, typeof PETROL_STATIONS[PetrolStationKey]][]).map(([key, station]) => (
                          <OptionCard key={key} selected={selectedStation === key}
                            onClick={() => { setSelectedStation(key); setSelectedFuelType(''); setSelectedOil('') }}>
                            <p className="text-sm font-semibold text-center" style={{ color: selectedStation === key ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                              {station.label}
                            </p>
                          </OptionCard>
                        ))}
                      </div>
                    </div>

                    {selectedStation && stationData && (
                      <div>
                        <SectionLabel>Fuel Type</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                          {stationData.fuels.map(fuel => (
                            <button key={fuel} type="button" onClick={() => setSelectedFuelType(fuel)}
                              className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                              style={selectedFuelType === fuel
                                ? { background: 'var(--brand-primary)', color: '#fff', border: '2px solid var(--brand-primary)' }
                                : { background: 'var(--surface-inset)', color: 'var(--text-secondary)', border: '2px solid var(--surface-border)' }}>
                              {fuel}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedFuelType && (
                      <div>
                        <SectionLabel>Fuel Amount</SectionLabel>
                        <div className="grid grid-cols-4 gap-2">
                          {FUEL_AMOUNTS.map(amt => (
                            <button key={amt} type="button" onClick={() => setSelectedFuelAmount(amt)}
                              className="py-3 rounded-xl font-bold text-sm border-2 transition-all"
                              style={selectedFuelAmount === amt
                                ? { background: '#ff950015', color: '#ff9500', border: '2px solid #ff9500' }
                                : { background: 'var(--surface-inset)', color: 'var(--text-secondary)', border: '2px solid var(--surface-border)' }}>
                              R{amt}
                            </button>
                          ))}
                        </div>
                        {selectedFuelAmount && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl p-3" style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.15)' }}>
                            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#007aff' }} />
                            <p className="text-xs" style={{ color: '#007aff' }}>
                              You pay <strong>R{selectedFuelAmount}</strong>. If your tank fills for less, the remainder is credited to your next wash.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button className="btn btn-secondary flex-1" onClick={() => setStep(4)}>← Back</button>
              <button className="btn btn-primary flex-1" onClick={() => setStep(6)}>Continue →</button>
            </div>
          </FieldGroup>
        )}

        {/* STEP 6 - Review */}
        {step === 6 && (
          <FieldGroup>
            <div>
              <h2 className="title">Review & Confirm</h2>
              <p className="caption mt-1">Everything look good? Confirm below.</p>
            </div>
            <div>
              <SectionLabel>Vehicle</SectionLabel>
              <div className="list-group">
                <ReviewRow label="Type"   value={VEHICLE_CATEGORIES.find(c => c.id === form.vehicle_category)?.label ?? ''} />
                <ReviewRow label="Make"   value={form.make} />
                <ReviewRow label="Model"  value={form.model} />
                {colour && <ReviewRow label="Colour" value={colour} />}
                <ReviewRow label="Reg"    value={form.registration} last />
              </div>
            </div>
            <div>
              <SectionLabel>Schedule</SectionLabel>
              <div className="list-group">
                <ReviewRow label="Date"           value={form.booking_date} />
                <ReviewRow label="Time"           value={formatSlotDisplay(form.pickup_time)} />
                <ReviewRow label="Collection Fee" value={`R${COLLECTION_FEE}`} highlight />
                <ReviewRow label="From"           value={form.pickup_address} />
                <ReviewRow label="To"             value={form.same_address ? 'Same as pickup' : form.delivery_address} last />
              </div>
            </div>
            <div>
              <SectionLabel>Services</SectionLabel>
              <div className="list-group">
                <ReviewRow label={WASH_PACKAGE_LABELS[form.wash_package as WashPackageKey]} value={`R${price.wash_price}`} highlight />
                {form.extras.map(e => <ReviewRow key={e} label={EXTRA_LABELS[e]} value={`+R${EXTRA_PRICES[e]}`} />)}
                {form.concierge_selected && <ReviewRow label="Vehicle Concierge" value={`+R${CONCIERGE_FEE}`} />}
                {form.fuel_refill && selectedStation && selectedFuelType && selectedFuelAmount && (
                  <ReviewRow label={`${stationData?.label} — ${selectedFuelType}`} value={`R${fuelTotal}`} />
                )}
                <ReviewRow label="Total" value={formatZAR(grandTotal)} highlight last />
              </div>
            </div>
            {form.fuel_refill && selectedFuelAmount && (
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.15)' }}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#007aff' }} />
                <p className="text-xs" style={{ color: '#007aff' }}>Unused fuel credit from R{selectedFuelAmount} will be applied to your next wash automatically.</p>
              </div>
            )}
            <div className="p-3 rounded-xl" style={{ background: 'var(--surface-inset)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                🔐 A secure 6-digit pickup PIN is generated on confirmation. Your delivery PIN is only revealed when the driver returns your vehicle.
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button className="btn btn-secondary flex-1" onClick={() => setStep(5)}>← Back</button>
              <button className="btn btn-primary flex-1 text-base py-4 font-bold" onClick={handleSubmit}>
                Confirm & Pay {formatZAR(grandTotal)}
              </button>
            </div>
          </FieldGroup>
        )}
      </div>

      {step < 6 && (
        <div className="card px-5 py-3 flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Estimated Total</span>
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatZAR(grandTotal || price.total)}</span>
        </div>
      )}
    </div>
  )
}
