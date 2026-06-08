'use client'
import { useDemoStore, type DemoBookingStatus } from '@/lib/demo/store'
import toast from 'react-hot-toast'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import type { BookingStatus } from '@/types'
import { WASH_PACKAGE_LABELS } from '@/lib/utils/pricing'
import type { WashPackageKey } from '@/lib/utils/pricing'
import { Car, ChevronRight, Clock, CheckCircle, Zap, Truck, Sparkles } from 'lucide-react'

const DRIVER_ID = 'driver-1'

// Status phase grouping for visual highlighting
const PHASE_COLORS: Partial<Record<DemoBookingStatus, { bg: string; border: string; label: string; icon: typeof Car }>> = {
  driver_assigned:      { bg: 'rgba(0,122,255,0.06)',   border: 'rgba(0,122,255,0.3)',   label: 'Awaiting Departure', icon: Clock  },
  driver_en_route:      { bg: 'rgba(0,122,255,0.08)',   border: '#007aff',               label: 'En Route to Pickup', icon: Car    },
  pickup_arrived:       { bg: 'rgba(255,149,0,0.08)',   border: '#ff9500',               label: '📍 Arrived — Pickup', icon: Zap   },
  vehicle_collected:    { bg: 'rgba(175,82,222,0.08)',  border: '#af52de',               label: 'Vehicle in Custody', icon: Car    },
  at_wash_facility:     { bg: 'rgba(90,200,250,0.08)',  border: '#32ade6',               label: 'At Wash Facility',   icon: Sparkles },
  wash_in_progress:     { bg: 'rgba(90,200,250,0.1)',   border: '#007aff',               label: '🧼 Washing',         icon: Sparkles },
  returning_vehicle:    { bg: 'rgba(52,199,89,0.08)',   border: '#34c759',               label: '🚗 Returning',       icon: Truck  },
  delivery_arrived:     { bg: 'rgba(52,199,89,0.1)',    border: '#34c759',               label: '📍 Arrived — Delivery', icon: Zap },
  delivery_pin_released:{ bg: 'rgba(52,199,89,0.12)',   border: '#30d158',               label: '🔓 PIN Released',    icon: Zap    },
}

export default function DriverDashboard() {
  const store  = useDemoStore()
  const myJobs = store.bookings.filter(b => b.driver_id === DRIVER_ID && !['completed','cancelled'].includes(b.status))
  const done   = store.bookings.filter(b => b.driver_id === DRIVER_ID && b.status === 'completed')

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <p className="caption">Driver Portal</p>
        <h1 className="display mt-0.5">My Jobs</h1>
      </div>

      {/* Status bar */}
      <div className="card p-4 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: '#34c759', boxShadow: '0 0 0 3px rgba(52,199,89,0.2)' }} />
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>John Mokoena — Online</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ready to accept jobs</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl" style={{ color: 'var(--brand-primary)' }}>{myJobs.length}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>active</p>
        </div>
      </div>

      {/* Active jobs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
          <h2 className="heading">Active Jobs</h2>
          {myJobs.length > 0 && (
            <span className="ml-auto text-xs font-bold text-white px-2 py-0.5 rounded-full"
              style={{ background: 'var(--brand-primary)' }}>{myJobs.length}</span>
          )}
        </div>

        {myJobs.length === 0 ? (
          <div className="card p-10 text-center">
            <Car className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="heading text-[15px]">No active jobs</p>
            <p className="caption text-sm mt-1">Jobs assigned by admin will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myJobs.map(job => {
              const phase = PHASE_COLORS[job.status]
              const PhaseIcon = phase?.icon ?? Car
              return (
                <Link key={job.id} href={`/driver/jobs/${job.id}`}>
                  <div className="rounded-2xl p-4 cursor-pointer transition-all active:opacity-80"
                    style={{
                      background:   phase?.bg   ?? 'var(--surface-card)',
                      border:       `2px solid ${phase?.border ?? 'var(--surface-border)'}`,
                      boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
                    }}>
                    {/* Phase label */}
                    {phase && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="w-2 h-2 rounded-full animate-pulse"
                          style={{ background: phase.border }} />
                        <span className="text-xs font-bold uppercase tracking-wide"
                          style={{ color: phase.border }}>
                          {phase.label}
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: phase?.bg ?? 'var(--brand-subtle)', border: `1px solid ${phase?.border ?? 'var(--brand-border)'}` }}>
                        <PhaseIcon className="w-5 h-5" style={{ color: phase?.border ?? 'var(--brand-primary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {job.make} {job.model} · {job.registration}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {WASH_PACKAGE_LABELS[job.wash_package as WashPackageKey] ?? job.wash_package} · {job.booking_date} {job.pickup_time}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {job.pickup_address}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Unassigned jobs - driver can request */}
      {(() => {
        const unassigned = store.bookings.filter(b => !b.driver_id && b.status === 'confirmed')
        if (unassigned.length === 0) return null
        return (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4" style={{ color: '#ff9500' }} />
              <h2 className="heading">Available Jobs</h2>
              <span className="ml-auto text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#ff9500' }}>
                {unassigned.length}
              </span>
            </div>
            <div className="space-y-2">
              {unassigned.map(job => (
                <div key={job.id} className="card p-4 space-y-3"
                  style={{ border: '1.5px solid rgba(255,149,0,0.4)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{job.make} {job.model} · {job.registration}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{job.booking_date} at {job.pickup_time}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{job.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.2)' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#ff9500' }} />
                    <p className="text-xs" style={{ color: '#ff9500' }}>Accepting requires admin confirmation</p>
                  </div>
                  <button
                    onClick={() => {
                      store.assignDriver(job.id, DRIVER_ID)
                      toast.success('Job accepted — pending admin confirmation')
                    }}
                    className="btn btn-primary w-full py-2.5 text-sm font-bold">
                    ✋ Accept This Job
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Completed */}
      {done.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <h2 className="heading">Completed Today</h2>
          </div>
          <div className="list-group">
            {done.slice(0, 5).map((job, i, arr) => (
              <Link key={job.id} href={`/driver/jobs/${job.id}`}>
                <div className="list-item cursor-pointer"
                  style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                  <Car className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {job.make} {job.model} · {job.registration}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{job.booking_date}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: 'rgba(52,199,89,0.1)', color: '#34c759' }}>Done</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
