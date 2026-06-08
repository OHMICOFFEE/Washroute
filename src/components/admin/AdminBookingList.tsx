'use client'
import { useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatDate, formatTime } from '@/lib/utils'
import { formatZAR, WASH_PACKAGE_LABELS } from '@/lib/utils/pricing'
import type { WashPackageKey } from '@/lib/utils/pricing'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { BookingStatus } from '@/types'
import { UserCheck } from 'lucide-react'

interface Booking {
  id: string; booking_date: string; pickup_time: string; status: BookingStatus
  total: number; wash_package: string; driver_id: string | null
  vehicle: { make: string; model: string; registration: string } | null
  customer: { full_name: string | null; email: string; phone: string | null } | null
  driver: { full_name: string | null } | null
}
interface Driver { id: string; full_name: string | null; email: string }

export default function AdminBookingList({ bookings, drivers }: { bookings: Booking[]; drivers: Driver[] }) {
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selected, setSelected]   = useState<Record<string, string>>({})

  async function assignDriver(bookingId: string) {
    const driverId = selected[bookingId]
    if (!driverId) { toast.error('Select a driver first'); return }
    setAssigning(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Driver assigned')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setAssigning(null)
    }
  }

  const getPackageLabel = (pkg: string): string => {
    return WASH_PACKAGE_LABELS[pkg as WashPackageKey] ?? pkg
  }

  return (
    <div className="glass rounded-2xl overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-white/8">
            {['Customer','Vehicle','Package','Date','Total','Driver','Status','Assign'].map(h => (
              <th key={h} className="text-left text-xs text-white/30 uppercase tracking-wider px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
              <td className="px-4 py-3">
                <p className="text-white">{b.customer?.full_name ?? '—'}</p>
                <p className="text-white/30 text-xs">{b.customer?.email}</p>
              </td>
              <td className="px-4 py-3 text-white/70">
                {b.vehicle?.make} {b.vehicle?.model}
                <br /><span className="text-white/30 text-xs">{b.vehicle?.registration}</span>
              </td>
              <td className="px-4 py-3 text-white/60">{getPackageLabel(b.wash_package)}</td>
              <td className="px-4 py-3 text-white/60">{formatDate(b.booking_date)}<br />{formatTime(b.pickup_time)}</td>
              <td className="px-4 py-3 text-white font-semibold">{formatZAR(b.total)}</td>
              <td className="px-4 py-3 text-white/50">{b.driver?.full_name ?? <span className="text-white/20">Unassigned</span>}</td>
              <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <select
                    className="input text-xs py-1.5 pr-6 w-32"
                    value={selected[b.id] ?? b.driver_id ?? ''}
                    onChange={e => setSelected(p => ({ ...p, [b.id]: e.target.value }))}
                  >
                    <option value="">Pick driver</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name ?? d.email}</option>
                    ))}
                  </select>
                  <Button size="sm" loading={assigning === b.id} onClick={() => assignDriver(b.id)}>
                    <UserCheck className="w-3 h-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-white/30">No bookings yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
