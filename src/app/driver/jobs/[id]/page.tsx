'use client'
import React, { useState, useEffect } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Camera, CheckCircle, AlertTriangle, Phone, Shield, Navigation, Car, Fuel, Gauge } from 'lucide-react'
import toast from 'react-hot-toast'

const WAIVER_CLAUSES = [
  'I confirm I have inspected the vehicle and noted all existing damage.',
  'I accept responsibility for safe driving while the vehicle is in my custody.',
  'The vehicle owner bears full legal and financial responsibility for any accident, theft, or loss — regardless of circumstances. My liability is limited to negligent driving only.',
  'I am covered by company insurance for standard driving only — not reckless driving or negligence.',
  'I confirm the customer has removed all valuables from the vehicle.',
  'I agree to drive safely and within South African traffic laws at all times.',
  'I will immediately report any new damage occurring while the vehicle is in my custody.',
  'I accept that failure to complete this checklist accurately may result in disciplinary action.',
]

type PickupPhase = 'photos' | 'waiver' | 'pin'

export default function DriverJobPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const store   = useDemoStore()
  const booking = store.getBooking(id)

  // Pickup flow phase — persisted
  const [pickupPhase, setPickupPhase] = useState<PickupPhase>('photos')
  const [waiverChecked, setWaiverChecked] = useState<boolean[]>(new Array(WAIVER_CLAUSES.length).fill(false))
  const [pinInput, setPinInput]     = useState('')
  const [pinError, setPinError]     = useState('')
  const [deliveryPin, setDeliveryPin] = useState('')
  const [deliveryPinError, setDeliveryPinError] = useState('')

  // Odometer
  const [odometerOut, setOdometerOut] = useState(booking?.odometer_out ?? '')
  const [odometerIn,  setOdometerIn]  = useState(booking?.odometer_in  ?? '')
  const [fuelLevel,   setFuelLevel]   = useState(booking?.fuel_level   ?? '')

  // Actual concierge costs
  const [actualFuel, setActualFuel] = useState(booking?.actual_fuel_cost?.toString() ?? '')
  const [actualOil,  setActualOil]  = useState(booking?.actual_oil_cost?.toString()  ?? '')

  // Photo simulation — in prod these would be real file uploads
  const [pickupPhotos,   setPickupPhotos]   = useState<string[]>(booking?.photos_pickup   ?? [])
  const [deliveryPhotos, setDeliveryPhotos] = useState<string[]>(booking?.photos_delivery ?? [])
  const [damagePhotos,   setDamagePhotos]   = useState<string[]>(booking?.photos_damage   ?? [])

  const pinAttempts         = booking?.pin_attempts         ?? 0
  const pinLocked           = booking?.pin_locked           ?? false
  const deliveryPinAttempts = booking?.delivery_pin_attempts ?? 0
  const deliveryPinLocked   = booking?.delivery_pin_locked   ?? false

  // Restore pickup phase based on what's already done
  useEffect(() => {
    if (!booking) return
    if (booking.status === 'pickup_arrived') {
      if (pickupPhotos.length >= 6 && waiverChecked.every(Boolean)) setPickupPhase('pin')
      else if (pickupPhotos.length >= 6) setPickupPhase('waiver')
      else setPickupPhase('photos')
    }
  }, [])

  if (!booking) return (
    <div className="pt-2 text-center py-20">
      <p className="heading">Job not found</p>
      <button className="btn btn-secondary mt-4" onClick={() => router.push('/driver')}>← Back</button>
    </div>
  )

  const status = booking.status

  // Save photos to store so they persist
  function addPickupPhoto() {
    const next = [...pickupPhotos, `pickup_${Date.now()}`]
    setPickupPhotos(next)
    store.updateBookingDetails(id, { photos_pickup: next })
    toast.success(`Photo ${next.length} captured`)
  }

  function addDamagePhoto() {
    const next = [...damagePhotos, `damage_${Date.now()}`]
    setDamagePhotos(next)
    store.updateBookingDetails(id, { photos_damage: next })
    toast.success('Damage photo added')
  }

  function addDeliveryPhoto() {
    const next = [...deliveryPhotos, `delivery_${Date.now()}`]
    setDeliveryPhotos(next)
    store.updateBookingDetails(id, { photos_delivery: next })
    toast.success(`Photo ${next.length} captured`)
  }

  function saveOdometer() {
    store.updateBookingDetails(id, { odometer_out: odometerOut, fuel_level: fuelLevel })
    toast.success('Odometer saved')
  }

  function proceedToWaiver() {
    if (pickupPhotos.length < 6) { toast.error('Take at least 6 photos first'); return }
    setPickupPhase('waiver')
  }

  function proceedToPin() {
    if (!waiverChecked.every(Boolean)) { toast.error('Accept all waiver clauses'); return }
    setPickupPhase('pin')
  }

  function verifyPickupPin() {
    if (pinLocked) return
    if (pinInput === booking.pickup_pin) {
      store.updateBookingDetails(id, { pin_attempts: 0, pin_locked: false })
      store.updateBookingStatus(id, 'vehicle_collected', 'Driver')
      toast.success('PIN verified — vehicle collected!')
      setPinInput('')
    } else {
      const attempts = pinAttempts + 1
      store.updateBookingDetails(id, { pin_attempts: attempts, pin_locked: attempts >= 3 })
      if (attempts >= 3) {
        toast.error('3 failed attempts — PIN locked')
      } else {
        toast.error(`Incorrect PIN — ${3 - attempts} attempt${3 - attempts !== 1 ? 's' : ''} remaining`)
      }
      setPinInput('')
    }
  }

  function verifyDeliveryPin() {
    if (deliveryPinLocked) return
    if (deliveryPin === booking.delivery_pin) {
      store.updateBookingDetails(id, { delivery_pin_attempts: 0, delivery_pin_locked: false, odometer_in: odometerIn })
      store.updateBookingStatus(id, 'completed', 'Driver')
      toast.success('Delivery complete! 🎉')
      router.push('/driver')
    } else {
      const attempts = deliveryPinAttempts + 1
      store.updateBookingDetails(id, { delivery_pin_attempts: attempts, delivery_pin_locked: attempts >= 3 })
      if (attempts >= 3) {
        toast.error('3 failed attempts — PIN locked')
      } else {
        toast.error(`Incorrect PIN — ${3 - attempts} attempt${3 - attempts !== 1 ? 's' : ''} remaining`)
      }
      setDeliveryPin('')
    }
  }

  function advance(nextStatus: typeof booking.status) {
    store.updateBookingStatus(id, nextStatus, 'Driver')
    toast.success('Status updated')
  }

  // ── STATUS-BASED VIEWS ──

  // Assigned - start route
  if (status === 'driver_assigned') return (
    <JobLayout booking={booking} router={router}>
      <div className="space-y-4">
        <StatusCard status="Assigned" color="#007aff" />
        <InfoGrid booking={booking} />
        <button className="btn btn-primary w-full py-4 font-bold text-base flex items-center justify-center gap-2"
          onClick={() => advance('driver_en_route')}>
          <Navigation className="w-5 h-5" /> Start Route to Customer
        </button>
      </div>
    </JobLayout>
  )

  // En route
  if (status === 'driver_en_route') return (
    <JobLayout booking={booking} router={router}>
      <div className="space-y-4">
        <StatusCard status="En Route" color="#ff9500" />
        <InfoGrid booking={booking} />
        <div className="card p-4 flex items-center gap-3" style={{ background:'rgba(0,122,255,0.06)', border:'1px solid rgba(0,122,255,0.15)' }}>
          <Navigation className="w-5 h-5 shrink-0" style={{ color:'#007aff' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color:'var(--text-primary)' }}>Navigating to pickup</p>
            <p className="text-xs mt-0.5 truncate" style={{ color:'var(--text-secondary)' }}>{booking.pickup_address}</p>
          </div>
        </div>
        <button className="btn btn-primary w-full py-4 font-bold text-base" onClick={() => advance('pickup_arrived')}>
          ✅ Arrived at Customer
        </button>
      </div>
    </JobLayout>
  )

  // Pickup arrived — 3-phase flow (photos → waiver → PIN)
  if (status === 'pickup_arrived') return (
    <JobLayout booking={booking} router={router}>
      <div className="space-y-4">
        <StatusCard status="At Pickup" color="#ff9500" />

        {/* Phase progress */}
        <div className="flex gap-2">
          {[{l:'Photos',done:pickupPhotos.length>=6},{l:'Waiver',done:waiverChecked.every(Boolean)},{l:'PIN',done:false}].map((p,i) => (
            <div key={p.l} className="flex-1">
              <div className="h-1.5 rounded-full" style={{ background: p.done ? '#34c759' : pickupPhase === ['photos','waiver','pin'][i] ? 'var(--brand-primary)' : 'var(--surface-border)' }} />
              <p className="text-[10px] mt-1 text-center" style={{ color: p.done ? '#34c759' : 'var(--text-tertiary)' }}>{p.l}</p>
            </div>
          ))}
        </div>

        {/* PHASE 1 — Photos */}
        {pickupPhase === 'photos' && (
          <div className="space-y-4">
            <h2 className="heading">Step 1 — Vehicle Photos</h2>
            <p className="text-sm" style={{ color:'var(--text-secondary)' }}>Take at least 6 photos: front, back, both sides, interior, dashboard.</p>

            {/* Odometer */}
            <div className="card p-4 space-y-3">
              <p className="font-semibold text-sm flex items-center gap-2" style={{ color:'var(--text-primary)' }}>
                <Gauge className="w-4 h-4" style={{ color:'var(--brand-primary)' }} /> Odometer Reading
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="label">Reading (km)</label>
                  <input className="input" value={odometerOut} onChange={e => setOdometerOut(e.target.value)} placeholder="e.g. 45230" inputMode="numeric" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="label">Fuel Level</label>
                  <select className="input" value={fuelLevel} onChange={e => setFuelLevel(e.target.value)}>
                    <option value="">Select...</option>
                    {['Empty','1/4','1/2','3/4','Full'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-secondary w-full text-sm py-2" onClick={saveOdometer}>Save Odometer</button>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-3 gap-2">
              {pickupPhotos.map((_, i) => (
                <div key={i} className="aspect-square rounded-xl flex items-center justify-center"
                  style={{ background:'rgba(52,199,89,0.12)', border:'1px solid rgba(52,199,89,0.3)' }}>
                  <span className="text-2xl">📸</span>
                </div>
              ))}
              {pickupPhotos.length < 12 && (
                <button onClick={addPickupPhoto}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-dashed transition-all"
                  style={{ borderColor:'var(--brand-primary)', background:'var(--brand-subtle)' }}>
                  <Camera className="w-6 h-6" style={{ color:'var(--brand-primary)' }} />
                  <span className="text-xs font-medium" style={{ color:'var(--brand-primary)' }}>Add</span>
                </button>
              )}
            </div>
            <p className="text-xs text-center" style={{ color:'var(--text-tertiary)' }}>{pickupPhotos.length}/6 minimum photos taken</p>

            {/* Damage photos */}
            <div className="card p-4 space-y-3">
              <p className="font-semibold text-sm" style={{ color:'var(--text-primary)' }}>⚠️ Existing Damage (optional)</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {damagePhotos.map((_, i) => (
                  <div key={i} className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background:'rgba(255,59,48,0.1)' }}><span className="text-xl">📷</span></div>
                ))}
                <button onClick={addDamagePhoto}
                  className="w-16 h-16 rounded-xl flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed"
                  style={{ borderColor:'#ff9500' }}>
                  <Camera className="w-5 h-5" style={{ color:'#ff9500' }} />
                </button>
              </div>
            </div>

            <button className="btn btn-primary w-full py-3 font-bold" onClick={proceedToWaiver}
              disabled={pickupPhotos.length < 6}>
              {pickupPhotos.length < 6 ? `Add ${6 - pickupPhotos.length} more photos` : 'Continue to Risk Waiver →'}
            </button>
          </div>
        )}

        {/* PHASE 2 — Waiver */}
        {pickupPhase === 'waiver' && (
          <div className="space-y-4">
            <div>
              <h2 className="heading flex items-center gap-2"><Shield className="w-4 h-4" style={{ color:'#ff9500' }} /> Step 2 — Driver Risk Waiver</h2>
              <div className="mt-2 p-3 rounded-xl text-sm font-medium" style={{ background:'rgba(255,149,0,0.08)', color:'#ff9500' }}>
                By ticking all boxes, you accept these terms for {booking.make} {booking.model} ({booking.registration}).
              </div>
            </div>
            <div className="space-y-2">
              {WAIVER_CLAUSES.map((clause, i) => (
                <div key={i} onClick={() => { const next = [...waiverChecked]; next[i] = !next[i]; setWaiverChecked(next) }}
                  className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                  style={{ background: waiverChecked[i] ? 'rgba(52,199,89,0.08)' : 'var(--surface-inset)', border: `1.5px solid ${waiverChecked[i] ? 'rgba(52,199,89,0.3)' : 'var(--surface-border)'}` }}>
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: waiverChecked[i] ? '#34c759' : 'var(--surface-card)', border: `2px solid ${waiverChecked[i] ? '#34c759' : 'var(--surface-border)'}` }}>
                    {waiverChecked[i] && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <p className="text-sm" style={{ color:'var(--text-primary)' }}>{clause}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary" onClick={() => setPickupPhase('photos')}>← Back</button>
              <button className="btn btn-primary flex-1 py-3 font-bold" onClick={proceedToPin}
                disabled={!waiverChecked.every(Boolean)}>
                {waiverChecked.every(Boolean) ? '✅ Accept & Continue to PIN →' : `${waiverChecked.filter(Boolean).length}/${WAIVER_CLAUSES.length} accepted`}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3 — Pickup PIN */}
        {pickupPhase === 'pin' && (
          <>
            {(booking.payment_method === 'cash_on_pickup' || booking.payment_method === 'pos_on_pickup') && !booking.payment_collected && (
              <div className="card-elevated p-5 space-y-3" style={{ border: '2px solid #ff9500' }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#ff9500' }}>
                    {booking.payment_method === 'pos_on_pickup' ? '📟 Collect Card Payment First' : '💵 Collect Cash Payment First'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Collect <span className="font-bold">R{booking.total}</span> before completing pickup.
                  </p>
                </div>
                {booking.payment_method === 'pos_on_pickup' ? (
                  <button className="btn w-full py-3 font-bold" style={{ background: '#007aff', color: '#fff' }}
                    onClick={() => { store.markPaymentCollected(id, 'card'); toast.success('Card payment recorded') }}>
                    💳 Card Collected
                  </button>
                ) : (
                  <button className="btn w-full py-3 font-bold" style={{ background: '#34c759', color: '#fff' }}
                    onClick={() => { store.markPaymentCollected(id, 'cash'); toast.success('Cash payment recorded') }}>
                    💵 Cash Collected
                  </button>
                )}
              </div>
            )}

            {(booking.payment_method === 'cash_on_pickup' || booking.payment_method === 'pos_on_pickup') && booking.payment_collected && (
              <div className="card p-3 flex items-center gap-2" style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.3)' }}>
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#34c759' }} />
                <p className="text-xs font-semibold" style={{ color: '#34c759' }}>
                  Payment collected ({booking.payment_collected_method === 'card' ? 'card' : 'cash'}) ✓
                </p>
              </div>
            )}

            {((booking.payment_method !== 'cash_on_pickup' && booking.payment_method !== 'pos_on_pickup') || booking.payment_collected) && (
              <PinEntry
                title="Step 3 — Verify Pickup PIN"
                subtitle="Ask the customer for their 6-digit pickup PIN"
                value={pinInput}
                onChange={setPinInput}
                onSubmit={verifyPickupPin}
                locked={pinLocked}
                attempts={pinAttempts}
                maxAttempts={3}
                customerCell={booking.customer_name}