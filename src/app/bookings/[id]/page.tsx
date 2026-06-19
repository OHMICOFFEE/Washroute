'use client'
import React, { useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, Car, Shield, Lock, Eye, EyeOff, Clock, Gift, XCircle, AlertTriangle, Edit2, Check, X } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { BookingStatus } from '@/types'
import { WASH_PACKAGE_LABELS, formatZAR } from '@/lib/utils/pricing'
import type { WashPackageKey } from '@/lib/utils/pricing'
import MessageThread from '@/components/messaging/MessageThread'
import toast from 'react-hot-toast'
import { CAR_MAKES, CAR_MAKES_MODELS, MOTORBIKE_MAKES, MOTORBIKE_MAKES_MODELS, VEHICLE_COLOURS } from '@/lib/utils/vehicles'
import PayWithPayCloudButton from '@/components/payments/PayWithPayCloudButton'

const LATE_CANCEL_FEE = 150

const STATUS_STEPS = [
  { status: 'confirmed',             label: 'Booking Confirmed'   },
  { status: 'driver_assigned',       label: 'Driver Assigned'     },
  { status: 'driver_en_route',       label: 'Driver En Route'     },
  { status: 'pickup_arrived',        label: 'Driver Arrived'      },
  { status: 'vehicle_collected',     label: 'Vehicle Collected'   },
  { status: 'wash_in_progress',      label: 'Wash in Progress'    },
  { status: 'returning_vehicle',     label: 'On the Way Back'     },
  { status: 'delivery_arrived',      label: 'Driver Arrived'      },
  { status: 'delivery_pin_released', label: 'Ready for Handover'  },
  { status: 'completed',             label: 'Completed ✓'         },
]

const DRIVER_EN_ROUTE_STATUSES = ['driver_en_route', 'pickup_arrived']
const CANCEL_BLOCKED_STATUSES  = ['vehicle_collected', 'at_wash_facility', 'wash_in_progress', 'returning_vehicle', 'delivery_arrived', 'delivery_pin_released', 'completed', 'cancelled']
const EDIT_ALLOWED_STATUSES    = ['confirmed', 'driver_assigned', 'driver_en_route']

export default function BookingDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const store   = useDemoStore()
  const booking = store.getBooking(id)

  const [showPickupPin,   setShowPickupPin]   = useState(false)
  const [showDeliveryPin, setShowDeliveryPin] = useState(false)
  const [showMessages,    setShowMessages]    = useState(false)
  const [cancelStep,      setCancelStep]      = useState<'idle'|'confirm'|'reason'>('idle')
  const [cancelReason,    setCancelReason]    = useState('')
  const [showEdit,        setShowEdit]        = useState(false)
  const [editForm,        setEditForm]        = useState({
    make: '', model: '', colour: '', registration: '', vehicle_type: 'car',
    notes: '', pickup_address: '', delivery_address: '',
  })

  if (!booking) {
    return (
      <div className="pt-2 text-center py-20">
        <p className="heading">Booking not found</p>
        <button className="btn btn-secondary mt-4" onClick={() => router.push('/dashboard')}>← Back</button>
      </div>
    )
  }

  const status      = booking.status
  const currentIdx  = STATUS_STEPS.findIndex(s => s.status === status)
  const washLabel   = WASH_PACKAGE_LABELS[booking.wash_package as WashPackageKey] ?? booking.wash_package
  const myCredits   = store.getActiveCredits(booking.customer_name)
  const totalCredit = myCredits.reduce((s, c) => s + c.amount, 0)

  const canCancelFree    = status === 'confirmed' || status === 'pending_payment'
  const canCancelWithFee = DRIVER_EN_ROUTE_STATUSES.includes(status)
  const cancelBlocked    = CANCEL_BLOCKED_STATUSES.includes(status)
  const canEdit          = EDIT_ALLOWED_STATUSES.includes(status)

  function startEdit() {
    setEditForm({
      make:             booking.make,
      model:            booking.model,
      colour:           booking.colour,
      registration:     booking.registration,
      vehicle_type:     booking.vehicle_type,
      notes:            booking.notes,
      pickup_address:   booking.pickup_address,
      delivery_address: booking.delivery_address,
    })
    setShowEdit(true)
  }

  function saveEdit() {
    store.updateBookingDetails(id, {
      make:             editForm.make,
      model:            editForm.model,
      colour:           editForm.colour,
      registration:     editForm.registration,
      vehicle_type:     editForm.vehicle_type,
      notes:            editForm.notes,
      pickup_address:   editForm.pickup_address,
      delivery_address: editForm.delivery_address,
    })
    toast.success('Booking updated')
    setShowEdit(false)
  }

  function handleCancel() {
    if (canCancelFree) {
      store.updateBookingStatus(id, 'cancelled', 'Customer')
      store.updateBookingDetails(id, {
        cancelled_at:        new Date().toISOString(),
        cancelled_by:        'Customer',
        cancellation_reason: cancelReason,
        cancellation_fee:    0,
      })
      toast.success('Booking cancelled — no charge')
      router.push('/dashboard')
    } else if (canCancelWithFee) {
      store.updateBookingStatus(id, 'cancelled', 'Customer')
      store.updateBookingDetails(id, {
        cancelled_at:        new Date().toISOString(),
        cancelled_by:        'Customer',
        cancellation_reason: cancelReason,
        cancellation_fee:    LATE_CANCEL_FEE,
      })
      const profile = store.customerProfile
      const inv     = store.invoices.find(i => i.booking_id === id)
      if (inv || profile) {
        store.sendPaymentRequest({
          invoice_id:    inv?.id ?? id,
          booking_id:    id,
          customer_name: profile ? `${profile.first_name} ${profile.last_name}` : booking.customer_name,
          customer_cell: profile?.cell ?? '',
          customer_email:profile?.email ?? '',
          amount:        LATE_CANCEL_FEE,
          method:        profile?.cell ? 'whatsapp' : 'email',
          status:        'sent',
          paid_at:       null,
          reference:     `CANCEL-${id}`,
          notes:         'Late cancellation fee — driver was en route',
        })
        if (profile?.cell) {
          const num = '27' + profile.cell.replace(/^0/, '').replace(/\s/g, '')
          const msg = encodeURIComponent(
            `Hi ${profile.first_name} 👋\n\nYour booking #${id} has been cancelled.\n\n` +
            `A *late cancellation fee of R${LATE_CANCEL_FEE}* applies as your driver was already en route.\n\n` +
            `Please make payment at your earliest convenience.\n\nRef: CANCEL-${id}\n\n_Ohmi Pay_`
          )
          window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
        }
      }
      toast.success(`Booking cancelled — R${LATE_CANCEL_FEE} fee applies`)
      router.push('/dashboard')
    }
  }

  const isMotorbike = editForm.vehicle_type === 'motorbike'
  const makes       = isMotorbike ? MOTORBIKE_MAKES : CAR_MAKES
  const models      = editForm.make ? (isMotorbike ? MOTORBIKE_MAKES_MODELS[editForm.make] : CAR_MAKES_MODELS[editForm.make]) ?? [] : []

  return (
    <div className="space-y-5 anim-fadeup pb-8">

      <div className="pt-2">
        <button onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: 'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> My Bookings
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="caption">Booking #{booking.id}</p>
            <h1 className="title mt-0.5">{booking.make} {booking.model}</h1>
            <p className="caption mt-0.5">{booking.registration} · {booking.colour}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={status as BookingStatus} />
            <p className="font-bold text-lg" style={{ color: 'var(--brand-primary)' }}>{formatZAR(booking.total)}</p>
          </div>
        </div>
      </div>

      {status === 'pending_payment' && (
        <div className="card-elevated p-5 space-y-3" style={{ border: '2px solid var(--brand-primary)' }}>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Payment Required</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Complete payment to confirm your booking. We'll redirect you to our secure payment partner.
            </p>
          </div>
          <PayWithPayCloudButton
            orderId={booking.id}
            amount={booking.total}
            description={`${booking.make} ${booking.model} — ${washLabel}`}
          />
        </div>
      )}

      {booking.cancellation_fee && booking.cancellation_fee > 0 && (
        <div className="card p-4 flex items-center gap-3"
          style={{ background:'rgba(255,59,48,0.06)', border:'1.5px solid rgba(255,59,48,0.3)' }}>
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color:'#ff3b30' }} />
          <div>
            <p className="font-bold text-sm" style={{ color:'#ff3b30' }}>Cancellation Fee: {formatZAR(booking.cancellation_fee)}</p>
            <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>Payment request has been sent to you</p>
          </div>
        </div>
      )}

      {status !== 'cancelled' && (
        <div className="card p-4">
          <p className="label mb-3">Booking Progress</p>
          <div className="space-y-2">
            {STATUS_STEPS.map((step, i) => {
              const done    = i < currentIdx
              const current = i === currentIdx
              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: done ? '#34c759' : current ? 'var(--brand-primary)' : 'var(--surface-border)' }}>
                    {done    && <span className="text-white text-[10px] font-bold">✓</span>}
                    {current && <span className="text-white text-[10px] font-bold">●</span>}
                  </div>
                  <p className="text-sm" style={{ color: current ? 'var(--brand-primary)' : done ? 'var(--text-secondary)' : 'var(--text-tertiary)', fontWeight: current ? 700 : 400 }}>
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="list-group">
        <div className="list-item">
          <Car className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} />
          <div className="flex-1">
            <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>Vehicle</p>
            <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{booking.make} {booking.model} · {booking.colour}</p>
          </div>
        </div>
        <div className="list-item">
          <Clock className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} />
          <div className="flex-1">
            <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>Date & Time</p>
            <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{booking.booking_date} at {booking.pickup_time}</p>
          </div>
        </div>
        <div className="list-item">
          <MapPin className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} />
          <div className="flex-1">
            <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>Pickup</p>
            <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{booking.pickup_address}</p>
          </div>
        </div>
        <div className="list-item" style={{ borderBottom:'none' }}>
          <MapPin className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} />
          <div className="flex-1">
            <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>Delivery</p>
            <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{booking.delivery_address}</p>
          </div>
        </div>
      </div>

      <div className="card p-4 space-y-2">
        <p className="label">Services</p>
        <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>🚿 {washLabel}</p>
        {booking.concierge && <p className="text-sm" style={{ color:'var(--text-secondary)' }}>🔧 Vehicle Concierge</p>}
        {booking.fuel_refill && <p className="text-sm" style={{ color:'var(--text-secondary)' }}>⛽ Fuel Refill — R{booking.fuel_amount} ({booking.fuel_type})</p>}
        {booking.extras.map(e => <p key={e} className="text-sm" style={{ color:'var(--text-secondary)' }}>✨ {e}</p>)}
      </div>

      {!['pending_payment','cancelled'].includes(status) && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color:'var(--brand-primary)' }} />
            <p className="label">Security PINs</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background:'var(--surface-inset)' }}>
              <p className="text-xs mb-1" style={{ color:'var(--text-tertiary)' }}>Pickup PIN</p>
              <p className="font-bold text-lg tracking-widest" style={{ color:'var(--text-primary)' }}>
                {showPickupPin ? booking.pickup_pin : '••••••'}
              </p>
              <button onClick={() => setShowPickupPin(v => !v)} className="mt-1" style={{ color:'var(--text-tertiary)' }}>
                {showPickupPin ? <EyeOff className="w-4 h-4 mx-auto" /> : <Eye className="w-4 h-4 mx-auto" />}
              </button>
            </div>
            {booking.delivery_pin_released && (
              <div className="p-3 rounded-xl text-center" style={{ background:'rgba(52,199,89,0.08)', border:'1px solid rgba(52,199,89,0.3)' }}>
                <p className="text-xs mb-1" style={{ color:'var(--text-tertiary)' }}>Delivery PIN</p>
                <p className="font-bold text-lg tracking-widest" style={{ color:'#34c759' }}>
                  {showDeliveryPin ? booking.delivery_pin : '••••••'}
                </p>
                <button onClick={() => setShowDeliveryPin(v => !v)} className="mt-1" style={{ color:'var(--text-tertiary)' }}>
                  {showDeliveryPin ? <EyeOff className="w-4 h-4 mx-auto" /> : <Eye className="w-4 h-4 mx-auto" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {totalCredit > 0 && (
        <div className="card p-4 flex items-center gap-3" style={{ background:'rgba(52,199,89,0.06)', border:'1.5px solid rgba(52,199,89,0.3)' }}>
          <Gift className="w-5 h-5 shrink-0" style={{ color:'#34c759' }} />
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color:'#34c759' }}>Wash Credit Available</p>
            <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>Applies to your next booking</p>
          </div>
          <span className="font-bold text-lg" style={{ color:'#34c759' }}>{formatZAR(totalCredit)}</span>
        </div>
      )}

      <button onClick={() => setShowMessages(v => !v)} className="btn btn-secondary w-full py-3 text-sm font-medium">
        {showMessages ? 'Hide Messages' : '💬 View Messages'}
      </button>
      {showMessages && <MessageThread bookingId={id} role="customer" roleName="Customer" />}

      {canEdit && !showEdit && status !== 'cancelled' && (
        <button onClick={startEdit} className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2 text-sm font-medium">
          <Edit2 className="w-4 h-4" /> Edit Booking Details
        </button>
      )}

      {showEdit && (
        <div className="card-elevated p-5 space-y-4" style={{ border:'2px solid var(--brand-primary)' }}>
          <div className="flex items-center justify-between">
            <h2 className="heading">Edit Booking</h2>
            <button onClick={() => setShowEdit(false)}><X className="w-5 h-5" style={{ color:'var(--text-secondary)' }} /></button>
          </div>
          <p className="text-xs" style={{ color:'var(--text-secondary)' }}>
            You can change vehicle details and addresses. Date and time cannot be changed — contact us if needed.
          </p>
          <div>
            <p className="label mb-2">Vehicle Type</p>
            <div className="grid grid-cols-2 gap-2">
              {([['car','🚗 Car'],['suv_bakkie','🚙 SUV & Bakkie'],['panel_van','🚐 Panel Van'],['motorbike','🏍️ Motorbike']] as const).map(([k,v]) => (
                <div key={k} onClick={() => setEditForm(f => ({ ...f, vehicle_type: k, make: '', model: '' }))}
                  className="option-card cursor-pointer text-center py-2.5 text-sm font-medium"
                  style={editForm.vehicle_type === k ? { borderColor:'var(--brand-primary)', background:'var(--brand-subtle)', color:'var(--brand-primary)' } : { color:'var(--text-primary)' }}>
                  {v}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label">Make</label>
              <select className="input" value={editForm.make} onChange={e => setEditForm(f => ({ ...f, make: e.target.value, model: '' }))}>
                <option value="">Select...</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Model</label>
              <select className="input" value={editForm.model} onChange={e => setEditForm(f => ({ ...f, model: e.target.value }))} disabled={!editForm.make}>
                <option value="">{editForm.make ? 'Select...' : 'Pick make first'}</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label">Colour</label>
              <select className="input" value={editForm.colour} onChange={e => setEditForm(f => ({ ...f, colour: e.target.value }))}>
                <option value="">Select...</option>
                {VEHICLE_COLOURS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Registration</label>
              <input className="input" value={editForm.registration} onChange={e => setEditForm(f => ({ ...f, registration: e.target.value.toUpperCase() }))} placeholder="CA 123-456" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label">Pickup Address</label>
            <input className="input" value={editForm.pickup_address} onChange={e => setEditForm(f => ({ ...f, pickup_address: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label">Delivery Address</label>
            <input className="input" value={editForm.delivery_address} onChange={e => setEditForm(f => ({ ...f, delivery_address: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label">Notes</label>
            <textarea className="input" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions..." />
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" onClick={() => setShowEdit(false)}>Cancel</button>
            <button className="btn btn-primary flex-1 py-3 font-bold" onClick={saveEdit}>
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {!cancelBlocked && status !== 'cancelled' && !showEdit && (
        <div>
          {cancelStep === 'idle' && (
            <button onClick={() => setCancelStep('reason')}
              className="btn w-full py-3 text-sm font-medium flex items-center justify-center gap-2"
              style={{ color:'#ff3b30', background:'rgba(255,59,48,0.06)', border:'1.5px solid rgba(255,59,48,0.2)' }}>
              <XCircle className="w-4 h-4" /> Cancel This Booking
            </button>
          )}
          {cancelStep === 'reason' && (
            <div className="card-elevated p-5 space-y-4" style={{ border:'2px solid rgba(255,59,48,0.4)' }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color:'#ff9500' }} />
                <div>
                  <p className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>
                    {canCancelFree ? 'Cancel Booking — Free' : `Late Cancellation — R${LATE_CANCEL_FEE} fee applies`}
                  </p>
                  <p className="text-xs mt-1" style={{ color:'var(--text-secondary)' }}>
                    {canCancelFree
                      ? 'No driver has been assigned yet. You can cancel at no charge.'
                      : `Your driver is already en route. A cancellation fee of R${LATE_CANCEL_FEE} will be charged.`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label">Reason for cancellation</label>
                <select className="input" value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                  <option value="">Select reason...</option>
                  <option value="Wrong vehicle selected">Wrong vehicle selected</option>
                  <option value="Wrong date / time">Wrong date / time</option>
                  <option value="Plans changed">Plans changed</option>
                  <option value="Booked by mistake">Booked by mistake</option>
                  <option value="Vehicle no longer available">Vehicle no longer available</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setCancelStep('idle')}>Keep Booking</button>
                <button className="btn flex-1 font-bold py-3"
                  style={{ background:'#ff3b30', color:'#fff', opacity: !cancelReason ? 0.5 : 1 }}
                  disabled={!cancelReason}
                  onClick={() => setCancelStep('confirm')}>
                  Continue →
                </button>
              </div>
            </div>
          )}
          {cancelStep === 'confirm' && (
            <div className="card-elevated p-5 space-y-4" style={{ border:'2px solid #ff3b30' }}>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background:'rgba(255,59,48,0.1)' }}>
                  <XCircle className="w-7 h-7" style={{ color:'#ff3b30' }} />
                </div>
                <p className="font-bold" style={{ color:'var(--text-primary)' }}>Confirm Cancellation</p>
                <p className="text-sm" style={{ color:'var(--text-secondary)' }}>
                  {booking.make} {booking.model} · {booking.booking_date} at {booking.pickup_time}
                </p>
                {canCancelWithFee && <p className="font-bold text-lg" style={{ color:'#ff3b30' }}>R{LATE_CANCEL_FEE} cancellation fee</p>}
                <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>Reason: {cancelReason}</p>
              </div>
              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setCancelStep('idle')}>Go Back</button>
                <button className="btn flex-1 font-bold py-3" style={{ background:'#ff3b30', color:'#fff' }} onClick={handleCancel}>
                  {canCancelWithFee ? `Cancel & Pay R${LATE_CANCEL_FEE}` : 'Yes, Cancel Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'cancelled' && (
        <div className="card p-5 text-center space-y-3"
          style={{ border:'1.5px solid rgba(255,59,48,0.3)', background:'rgba(255,59,48,0.04)' }}>
          <XCircle className="w-8 h-8 mx-auto" style={{ color:'#ff3b30' }} />
          <p className="font-bold" style={{ color:'#ff3b30' }}>Booking Cancelled</p>
          {booking.cancellation_reason && (
            <p className="text-xs" style={{ color:'var(--text-secondary)' }}>Reason: {booking.cancellation_reason}</p>
          )}
          <button onClick={() => router.push('/bookings/new')} className="btn btn-primary w-full py-3 font-bold">Book Again</button>
        </div>
      )}

      {cancelBlocked && !['completed','cancelled'].includes(status) && (
        <div className="card p-4 flex items-center gap-3"
          style={{ background:'rgba(142,142,147,0.08)', border:'1px solid rgba(142,142,147,0.2)' }}>
          <Lock className="w-5 h-5 shrink-0" style={{ color:'var(--text-tertiary)' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color:'var(--text-secondary)' }}>Cancellation not available</p>
            <p className="text-xs mt-0.5" style={{ color:'var(--text-tertiary)' }}>
              Your vehicle has already been collected. Please contact us directly to discuss.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}