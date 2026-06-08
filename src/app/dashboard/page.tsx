'use client'
import Link from 'next/link'
import { useDemoStore } from '@/lib/demo/store'
import StatusBadge from '@/components/ui/StatusBadge'
import type { BookingStatus } from '@/types'
import { formatZAR, WASH_PACKAGE_LABELS } from '@/lib/utils/pricing'
import type { WashPackageKey } from '@/lib/utils/pricing'
import { ChevronRight, PlusCircle, Car, Clock, Shield, Sparkles, UserCircle, FileText, AlertCircle } from 'lucide-react'
import { getBrandConfig } from '@/config/brand'

export default function CustomerDashboard() {
  const store   = useDemoStore()
  const brand   = getBrandConfig()
  const active  = store.bookings.filter(b => !['completed','cancelled'].includes(b.status))
  const recent  = store.bookings.filter(b => ['completed','cancelled'].includes(b.status)).slice(0, 5)

  return (
    <div className="space-y-5 anim-fadeup stagger">

      {/* Greeting */}
      <div className="pt-2">
        <p className="caption">Good day 👋</p>
        <h1 className="display mt-0.5">My Bookings</h1>
      </div>

      {/* Hero Book Now */}
      <Link href="/bookings/new">
        <div className="hero-card p-6 cursor-pointer active:opacity-90 transition-opacity">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-white/70 text-sm font-medium">Premium Wash</span>
              <h2 className="text-white text-2xl font-bold mt-1 tracking-tight">Book a pickup</h2>
              <p className="text-white/60 text-sm mt-1">We collect, wash & return your vehicle</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-5 inline-flex items-center gap-1.5 bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            Schedule now <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Link>

      {/* Profile prompt */}
      {!store.customerProfile && (
        <Link href="/dashboard/profile">
          <div className="card flex items-center gap-3 p-4 cursor-pointer active:opacity-80"
            style={{ border: '1.5px solid rgba(255,149,0,0.4)', background: 'rgba(255,149,0,0.04)' }}>
            <AlertCircle className="w-5 h-5 shrink-0" style={{ color: '#ff9500' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: '#ff9500' }}>Complete your profile</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Add your name, ID and contact details to receive invoices</p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </Link>
      )}

      {/* Active bookings */}
      {active.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
            <h2 className="heading">Active</h2>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--brand-primary)' }}>
              {active.length}
            </span>
          </div>
          <div className="space-y-2">
            {active.map(b => (
              <Link key={b.id} href={`/bookings/${b.id}`}>
                <div className="card flex items-center gap-4 p-4 cursor-pointer active:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--brand-subtle)' }}>
                    <Car className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {b.make} {b.model}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {WASH_PACKAGE_LABELS[b.wash_package as WashPackageKey] ?? b.wash_package} · {b.booking_date} · {b.pickup_time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={b.status as BookingStatus} />
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      {recent.length > 0 && (
        <div>
          <h2 className="heading mb-3">Completed</h2>
          <div className="list-group">
            {recent.map((b, i, arr) => (
              <Link key={b.id} href={`/bookings/${b.id}`}>
                <div className="list-item cursor-pointer" style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                  <Car className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{b.make} {b.model}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.booking_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>{formatZAR(b.total)}</span>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {store.bookings.length === 0 && (
        <>
          {/* Quick info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <Clock className="w-5 h-5 mb-3" style={{ color: 'var(--brand-primary)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>9:30 AM – 3:30 PM</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Pickup window daily</p>
            </div>
            <div className="card p-4">
              <Shield className="w-5 h-5 mb-3" style={{ color: 'var(--brand-primary)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>PIN-secured</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Safe handover every time</p>
            </div>
          </div>

          {/* Prices */}
          <div>
            <h2 className="heading mb-3">Prices From</h2>
            <div className="list-group">
              {[
                { v: 'Car — Wash & Go',          p: 'R60'  },
                { v: 'Car — Full House',          p: 'R120' },
                { v: 'SUV & Bakkie — Full House', p: 'R140' },
                { v: 'Panel Van — Full House',    p: 'R200' },
                { v: 'Custom Detailing',          p: 'From R850' },
              ].map((item, i, arr) => (
                <div key={item.v} className="list-item" style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                  <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{item.v}</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--brand-primary)' }}>{item.p}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  )
}
