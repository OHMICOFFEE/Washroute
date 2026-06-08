'use client'
import { useState } from 'react'
import type { BookingWithRelations, BookingStatus } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { Camera, CheckCircle, Truck, Wrench, MapPin, KeyRound, UploadCloud } from 'lucide-react'

interface Props {
  booking: BookingWithRelations
  driverId: string
}

const STATUS_FLOW: Partial<Record<BookingStatus, { next: BookingStatus; label: string; icon: React.ElementType }>> = {
  driver_assigned:  { next: 'driver_en_route',      label: 'Start Route to Pickup',   icon: Truck },
  driver_en_route:  { next: 'pickup_arrived',        label: 'Mark Arrived at Pickup',  icon: MapPin },
  vehicle_collected:{ next: 'at_wash_facility',      label: 'Arrived at Wash Facility', icon: Wrench },
  at_wash_facility: { next: 'wash_in_progress',      label: 'Start Wash',              icon: Wrench },
  wash_in_progress: { next: 'returning_vehicle',     label: 'Start Return Journey',    icon: Truck },
  concierge_in_progress: { next: 'returning_vehicle', label: 'Start Return Journey',   icon: Truck },
  returning_vehicle:{ next: 'delivery_arrived',      label: 'Mark Arrived at Delivery', icon: MapPin },
}

export default function DriverJobActions({ booking, driverId }: Props) {
  const [pin, setPin]             = useState('')
  const [odometer, setOdometer]   = useState('')
  const [fuelLevel, setFuelLevel] = useState('')
  const [damage, setDamage]       = useState('')
  const [valuables, setValuables] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [uploading, setUploading] = useState(false)

  async function advanceStatus(newStatus: BookingStatus) {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, driverId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Status updated')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  async function verifyPickupPin() {
    if (!pin || pin.length !== 6) { toast.error('Enter a 6-digit PIN'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, pin, type: 'pickup', driverId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Save condition report then advance
      await fetch(`/api/bookings/${booking.id}/condition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ odometer: parseInt(odometer), fuel_level: fuelLevel, damage_notes: damage, valuables_removed: valuables }),
      })
      toast.success('Pickup verified!')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'PIN verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function verifyDeliveryPin() {
    if (!pin || pin.length !== 6) { toast.error('Enter a 6-digit PIN'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, pin, type: 'delivery', driverId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Delivery verified! Booking complete.')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'PIN verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>, type: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bookingId', booking.id)
      formData.append('photoType', type)
      formData.append('uploadedBy', driverId)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Photo uploaded')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function markDeliveryArrived() {
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/release-delivery-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Delivery PIN released to customer')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const { status } = booking

  // ─── Pickup PIN Verification ──────────────────────────────
  if (status === 'pickup_arrived') {
    return (
      <div className="glass rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-white">Verify Pickup PIN</h3>
        </div>
        <p className="text-white/50 text-sm">Ask the customer for their 6-digit pickup PIN to take custody of the vehicle.</p>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Odometer (km)" type="number" value={odometer} onChange={e => setOdometer(e.target.value)} placeholder="e.g. 45230" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Fuel Level</label>
            <select className="input" value={fuelLevel} onChange={e => setFuelLevel(e.target.value)}>
              <option value="">Select</option>
              {['empty','1/4','1/2','3/4','full'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Damage Notes (optional)</label>
          <textarea className="input min-h-[70px] resize-none" value={damage} onChange={e => setDamage(e.target.value)} placeholder="Note any existing scratches, dents, etc." />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="valuables" checked={valuables} onChange={e => setValuables(e.target.checked)} className="w-4 h-4 rounded accent-indigo-500" />
          <label htmlFor="valuables" className="text-sm text-white/70 cursor-pointer">Customer confirmed valuables removed</label>
        </div>

        <div className="flex items-center gap-2">
          <label className="btn btn-ghost text-xs cursor-pointer">
            <Camera className="w-4 h-4" />
            Before Photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => uploadPhoto(e, 'before')} />
          </label>
          {uploading && <span className="text-white/30 text-xs">Uploading…</span>}
        </div>

        <Input label="Enter Customer Pickup PIN" value={pin} onChange={e => setPin(e.target.value)} placeholder="6-digit PIN" maxLength={6} />

        <Button onClick={verifyPickupPin} loading={loading} className="w-full">
          <CheckCircle className="w-4 h-4" />
          Verify PIN & Take Custody
        </Button>
      </div>
    )
  }

  // ─── Delivery arrived – release pin ───────────────────────
  if (status === 'delivery_arrived') {
    return (
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">Arrived at Delivery</h3>
        </div>

        <div className="flex items-center gap-2">
          <label className="btn btn-ghost text-xs cursor-pointer">
            <Camera className="w-4 h-4" />
            After Photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => uploadPhoto(e, 'after')} />
          </label>
        </div>

        <Button onClick={markDeliveryArrived} loading={loading} variant="gold" className="w-full">
          Release Delivery PIN to Customer
        </Button>
      </div>
    )
  }

  // ─── Delivery PIN verification ─────────────────────────────
  if (status === 'delivery_pin_released') {
    return (
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-green-400" />
          <h3 className="font-semibold text-white">Complete Delivery</h3>
        </div>
        <p className="text-white/50 text-sm">The customer has been sent their delivery PIN. Ask them for it to complete handover.</p>
        <Input label="Enter Customer Delivery PIN" value={pin} onChange={e => setPin(e.target.value)} placeholder="6-digit PIN" maxLength={6} />
        <Button onClick={verifyDeliveryPin} loading={loading} variant="gold" className="w-full">
          <CheckCircle className="w-4 h-4" />
          Verify & Complete Handover
        </Button>
      </div>
    )
  }

  // ─── General next-step actions ─────────────────────────────
  const nextAction = STATUS_FLOW[status]
  if (nextAction) {
    return (
      <div className="glass rounded-2xl p-5">
        <Button
          onClick={() => advanceStatus(nextAction.next)}
          loading={loading}
          className="w-full"
          size="lg"
        >
          <nextAction.icon className="w-4 h-4" />
          {nextAction.label}
        </Button>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="glass rounded-2xl p-4 text-center">
        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <p className="text-emerald-400 font-medium">Job Completed</p>
      </div>
    )
  }

  return null
}
