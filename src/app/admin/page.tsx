'use client'
import { useDemoStore } from '@/lib/demo/store'
import Link from 'next/link'
import { Car, Users, DollarSign, Activity, ChevronRight, TrendingUp, Gift } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { BookingStatus } from '@/types'
import { formatZAR, WASH_PACKAGE_LABELS } from '@/lib/utils/pricing'
import type { WashPackageKey } from '@/lib/utils/pricing'

export default function AdminDashboard() {
  const store    = useDemoStore()
  const active   = store.bookings.filter(b => !['completed','cancelled','pending_payment'].includes(b.status))
  const completed = store.bookings.filter(b => b.status === 'completed')
  const revenue  = completed.reduce((s, b) => s + b.total, 0)

  const stats = [
    { label: 'Total Bookings', value: store.bookings.length.toString(), icon: Car,        color: 'var(--brand-primary)' },
    { label: 'Active Jobs',    value: active.length.toString(),         icon: Activity,   color: '#ff9500'              },
    { label: 'Drivers',        value: store.drivers.length.toString(),  icon: Users,      color: '#007aff'              },
    { label: 'Revenue',        value: formatZAR(revenue),               icon: DollarSign, color: '#34c759'              },
  ]

  return (
    <div className="space-y-6 anim-fadeup stagger">
      <div className="pt-2">
        <p className="caption">Admin Dashboard</p>
        <h1 className="display mt-0.5">Overview</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            <p className="font-medium text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="heading mb-3">Management</h2>
        <div className="list-group">
          {[
            { href: '/admin/bookings', label: 'Manage Bookings', desc: `${store.bookings.length} total · ${active.length} active`, icon: Car },
            { href: '/admin/drivers',  label: 'Manage Drivers',  desc: `${store.drivers.length} registered`,                        icon: Users },
            { href: '/admin/services', label: 'Edit Pricing',    desc: 'View and update services',                                  icon: DollarSign },
          ].map((item, i, arr) => (
            <Link key={item.href} href={item.href}>
              <div className="list-item cursor-pointer" style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--brand-subtle)' }}>
                  <item.icon className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="heading">Recent Bookings</h2>
          <Link href="/admin/bookings">
            <span className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>See all →</span>
          </Link>
        </div>
        {store.bookings.length === 0 ? (
          <div className="card p-10 text-center">
            <Car className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No bookings yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>They will appear here once customers start booking.</p>
          </div>
        ) : (
          <div className="list-group">
            {store.bookings.slice(0, 5).map((b, i, arr) => (
              <Link key={b.id} href={`/admin/bookings`}>
                <div className="list-item cursor-pointer" style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--brand-subtle)' }}>
                    <Car className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.make} {b.model} · {b.registration}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {WASH_PACKAGE_LABELS[b.wash_package as WashPackageKey] ?? b.wash_package} · {b.booking_date}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>{formatZAR(b.total)}</span>
                    <StatusBadge status={b.status as BookingStatus} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Credits */}
      {store.credits.filter(c => !c.used && new Date(c.expires_at) > new Date()).length > 0 && (
        <div>
          <h2 className="heading mb-3">Outstanding Credits</h2>
          <div className="list-group">
            {store.credits
              .filter(c => !c.used && new Date(c.expires_at) > new Date())
              .map((c, i, arr) => (
              <div key={c.id} className="list-item"
                style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                <Gift className="w-4 h-4 shrink-0" style={{ color: '#34c759' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.customer_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.reason}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    Expires {new Date(c.expires_at).toLocaleDateString('en-ZA')}
                  </p>
                </div>
                <span className="font-bold text-sm" style={{ color: '#34c759' }}>R{c.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
