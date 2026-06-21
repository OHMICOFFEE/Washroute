'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutGrid, Plus, Car, Users, Settings, ChevronRight, Briefcase, UserCircle, Clock, FileText, CreditCard, ClipboardList, MessageCircle, MoreHorizontal, X } from 'lucide-react'
import { useBrand } from './BrandProvider'
import BrandLogo from './BrandLogo'
import Image from 'next/image'

const navMap = {
  customer: [
    { href: '/dashboard',    label: 'Home',      icon: LayoutGrid },
    { href: '/bookings/new',   label: 'Book',    icon: Plus       },
    { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
  ],
  driver: [
    { href: '/driver', label: 'Jobs', icon: Car },
  ],
  admin: [
    { href: '/admin',          label: 'Overview', icon: LayoutGrid },
    { href: '/admin/bookings', label: 'Bookings', icon: Car        },
    { href: '/admin/registry', label: 'Registry', icon: ClipboardList },
    { href: '/admin/drivers',  label: 'Drivers',  icon: Users      },
    { href: '/admin/services',   label: 'Services',   icon: Settings   },
    { href: '/admin/workforce',  label: 'Workforce',  icon: Briefcase  },
    { href: '/admin/customers',  label: 'Customers',  icon: UserCircle },
    { href: '/admin/timesheets', label: 'Timesheets', icon: Clock      },
    { href: '/admin/invoices',   label: 'Invoices',   icon: FileText   },
    { href: '/admin/payments',   label: 'Payments',   icon: CreditCard },
    { href: '/admin/broadcast',  label: 'Broadcast',  icon: MessageCircle },
  ],
}

// On mobile, the bottom bar only has room for a few items before it gets
// cramped. Show these first, and tuck the rest behind a "More" sheet.
const MOBILE_PRIMARY_COUNT: Record<keyof typeof navMap, number> = {
  customer: 3,
  driver: 1,
  admin: 4,
}

export default function DemoNavbar({ role }: { role: 'customer' | 'driver' | 'admin' }) {
  const pathname = usePathname()
  const brand    = useBrand()
  const nav      = navMap[role]
  const [showMore, setShowMore] = useState(false)

  const primaryCount = MOBILE_PRIMARY_COUNT[role]
  const primaryNav   = nav.slice(0, primaryCount)
  const overflowNav  = nav.slice(primaryCount)
  const overflowActive = overflowNav.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))

  return (
    <>
      {/* Top bar */}
      <div className="topbar">
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
          <Link href="/demo">
            <BrandLogo size="sm" />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {nav.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <button className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    active ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)]'
                  )}
                  style={active ? { background: 'var(--brand-subtle)' } : {}}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </Link>
              )
            })}
          </div>

          <Link href="/demo">
            <button className="text-xs font-medium px-3 py-1.5 rounded-xl"
              style={{ background: 'var(--surface-inset)', color: 'var(--text-secondary)' }}>
              Switch Role
            </button>
          </Link>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="bottom-nav md:hidden">
        <div className="flex items-center justify-around max-w-sm mx-auto px-2">
          {primaryNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}>
                <button className="flex flex-col items-center gap-1 py-1 px-3 transition-all">
                  <item.icon className={cn('w-6 h-6 transition-colors', active ? '' : 'text-[var(--text-tertiary)]')}
                    style={active ? { color: 'var(--brand-primary)' } : {}} />
                  <span className={cn('text-xs font-medium transition-colors', active ? '' : 'text-[var(--text-tertiary)]')}
                    style={active ? { color: 'var(--brand-primary)' } : {}}>
                    {item.label}
                  </span>
                </button>
              </Link>
            )
          })}

          {overflowNav.length > 0 && (
            <button onClick={() => setShowMore(true)} className="flex flex-col items-center gap-1 py-1 px-3 transition-all">
              <MoreHorizontal className="w-6 h-6 transition-colors" style={overflowActive ? { color: 'var(--brand-primary)' } : { color: 'var(--text-tertiary)' }} />
              <span className="text-xs font-medium transition-colors" style={overflowActive ? { color: 'var(--brand-primary)' } : { color: 'var(--text-tertiary)' }}>
                More
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile "More" overflow sheet */}
      {showMore && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <div onClick={e => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8 space-y-1"
            style={{ background: 'var(--surface-card)', maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>More</p>
              <button onClick={() => setShowMore(false)} className="p-1.5 rounded-full" style={{ background: 'var(--surface-inset)' }}>
                <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            {overflowNav.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} onClick={() => setShowMore(false)}>
                  <div className="flex items-center gap-3 py-3 px-2 rounded-xl"
                    style={active ? { background: 'var(--brand-subtle)' } : {}}>
                    <item.icon className="w-5 h-5" style={{ color: active ? 'var(--brand-primary)' : 'var(--text-secondary)' }} />
                    <span className="text-sm font-medium" style={{ color: active ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}