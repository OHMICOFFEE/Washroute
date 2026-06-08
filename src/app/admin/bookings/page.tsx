'use client'
import { useDemoStore } from '@/lib/demo/store'
import { useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { BookingStatus } from '@/types'
import { formatZAR, WASH_PACKAGE_LABELS } from '@/lib/utils/pricing'
import type { WashPackageKey } from '@/lib/utils/pricing'
import { Car, UserCheck, ChevronDown, MessageCircle, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import MessageThread from '@/components/messaging/MessageThread'

export default function AdminBookingsPage() {
  const store = useDemoStore()
  const [assignMap,     setAssignMap]     = useState<Record<string, string>>({})
  const [filter,        setFilter]        = useState('all')
  const [openMessages,  setOpenMessages]  = useState<string | null>(null)

  const filtered = filter === 'all'
    ? store.bookings
    : store.bookings.filter(b => b.status === filter)

  // Count per status for badges
  const counts: Record<string, number> = { all: store.bookings.length }
  store.bookings.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1 })

  function assignDriver(bookingId: string) {
    const driverId = assignMap[bookingId]
    if (!driverId) { toast.error('Select a driver first'); return }
    store.assignDriver(bookingId, driverId)
    toast.success('Driver assigned!')
  }

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <p className="caption">Admin</p>
        <h1 className="display mt-0.5">Bookings</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all',                 label: 'All'         },
          { key: 'confirmed',           label: 'Confirmed'   },
          { key: 'driver_assigned',     label: 'Assigned'    },
          { key: 'driver_en_route',     label: 'En Route'    },
          { key: 'vehicle_collected',   label: 'Collected'   },
          { key: 'wash_in_progress',    label: 'Washing'     },
          { key: 'returning_vehicle',   label: 'Returning'   },
          { key: 'delivery_arrived',    label: 'Delivery'    },
          { key: 'completed',           label: 'Completed'   },
          { key: 'cancelled',           label: 'Cancelled'   },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border-2 transition-all flex-shrink-0"
            style={filter === f.key
              ? { background: 'var(--brand-primary)', color: '#fff', border: '2px solid var(--brand-primary)' }
              : { background: 'var(--surface-inset)', color: 'var(--text-secondary)', border: '2px solid var(--surface-border)' }
            }>
            {f.label}
            {(counts[f.key] || 0) > 0 && (
              <span className="ml-1.5 opacity-70">({counts[f.key]})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Car className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No bookings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const unread = store.unreadCount(b.id, 'admin')
            const isOpen = openMessages === b.id
            return (
              <div key={b.id} className="card-elevated p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{b.make} {b.model}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {b.registration}{b.colour ? ` · ${b.colour}` : ''} · #{b.id}
                    </p>
                  </div>
                  <StatusBadge status={b.status as BookingStatus} />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Date',    val: `${b.booking_date} ${b.pickup_time}` },
                    { label: 'Package', val: WASH_PACKAGE_LABELS[b.wash_package as WashPackageKey] ?? b.wash_package },
                    { label: 'Pickup',  val: b.pickup_address },
                    { label: 'Total',   val: formatZAR(b.total) },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="label" style={{ fontSize: '10px' }}>{item.label}</p>
                      <p className="text-sm truncate" style={{ color: item.label === 'Total' ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: item.label === 'Total' ? 700 : 400 }}>
                        {item.val}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Concierge actuals */}
                {b.actual_fuel_cost !== undefined && (
                  <div className="p-2 rounded-xl text-xs space-y-0.5" style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)' }}>
                    <p className="font-semibold" style={{ color: '#ff9500' }}>⛽ Concierge Actuals (Driver reported)</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Fuel: R{b.actual_fuel_cost} (requested R{b.fuel_amount})</p>
                    {b.fuel_credit && b.fuel_credit > 0 && <p style={{ color: '#007aff' }}>💳 Credit owed to customer: R{b.fuel_credit}</p>}
                    {b.actual_oil_cost && <p style={{ color: 'var(--text-secondary)' }}>Oil: R{b.actual_oil_cost}</p>}
                  </div>
                )}

                {/* Assign driver */}
                <div className="pt-2 border-t" style={{ borderColor: 'var(--surface-border)' }}>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select className="input text-sm py-2 pr-8 w-full appearance-none"
                        value={assignMap[b.id] ?? b.driver_id ?? ''}
                        onChange={e => setAssignMap(m => ({ ...m, [b.id]: e.target.value }))}>
                        <option value="">{b.driver_id ? store.drivers.find(d => d.id === b.driver_id)?.name ?? 'Unknown' : 'Assign a driver...'}</option>
                        {store.drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} {d.active_jobs > 0 ? `(${d.active_jobs} active)` : '· Available'}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <button onClick={() => assignDriver(b.id)} className="btn btn-primary py-2 px-4 text-sm flex items-center gap-1.5 shrink-0">
                      <UserCheck className="w-4 h-4" />
                      {b.driver_id ? 'Reassign' : 'Assign'}
                    </button>
                  </div>
                </div>

                {/* Messages toggle */}
                <button onClick={() => setOpenMessages(isOpen ? null : b.id)}
                  className="btn btn-secondary w-full flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Messages</span>
                    {unread > 0 && (
                      <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: '#ff3b30' }}>{unread}</span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isOpen && (
                  <MessageThread bookingId={b.id} role="admin" roleName="Admin" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
