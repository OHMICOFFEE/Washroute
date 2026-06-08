'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutGrid, Plus, Car, Users, Settings, ChevronRight, Briefcase, UserCircle, Clock, FileText, CreditCard } from 'lucide-react'
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
    { href: '/admin/drivers',  label: 'Drivers',  icon: Users      },
    { href: '/admin/services',   label: 'Services',   icon: Settings   },
    { href: '/admin/workforce',  label: 'Workforce',  icon: Briefcase  },
    { href: '/admin/customers',  label: 'Customers',  icon: UserCircle },
    { href: '/admin/timesheets', label: 'Timesheets', icon: Clock      },
    { href: '/admin/invoices',   label: 'Invoices',   icon: FileText   },
    { href: '/admin/payments',   label: 'Payments',   icon: CreditCard },
  ],
}

export default function DemoNavbar({ role }: { role: 'customer' | 'driver' | 'admin' }) {
  const pathname = usePathname()
  const brand    = useBrand()
  const nav      = navMap[role]

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
        <div className="flex items-center justify-around max-w-sm mx-auto px-4">
          {nav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}>
                <button className="flex flex-col items-center gap-1 py-1 px-4 transition-all">
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
        </div>
      </div>
    </>
  )
}
