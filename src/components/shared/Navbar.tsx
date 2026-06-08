'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import {
  LayoutDashboard, Car, PlusCircle, Users, Settings,
  Wrench, LogOut, Menu, X, ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import type { Profile } from '@/types'

interface NavbarProps {
  profile: Profile
}

const customerNav = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/bookings/new',  label: 'New Booking',   icon: PlusCircle },
]
const driverNav = [
  { href: '/driver', label: 'My Jobs',    icon: Car },
]
const adminNav = [
  { href: '/admin', label: 'Overview',    icon: LayoutDashboard },
  { href: '/admin/bookings',  label: 'Bookings',    icon: Car },
  { href: '/admin/drivers',   label: 'Drivers',     icon: Users },
  { href: '/admin/services',  label: 'Services',    icon: Wrench },
]

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen]   = useState(false)
  const [menu, setMenu]   = useState(false)

  const nav = profile.role === 'admin'  ? adminNav
            : profile.role === 'driver' ? driverNav
            : customerNav

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-16 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-glow">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-white hidden sm:block">
              Ohmi Pay
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  pathname === item.href
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Profile menu */}
            <div className="relative">
              <button
                onClick={() => setMenu(!menu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600/40 border border-indigo-500/40 flex items-center justify-center text-xs font-semibold text-indigo-300">
                  {getInitials(profile.full_name ?? profile.email)}
                </div>
                <span className="hidden sm:block max-w-[120px] truncate">
                  {profile.full_name ?? profile.email}
                </span>
                <ChevronDown className="w-3 h-3 text-white/30" />
              </button>
              {menu && (
                <div className="absolute right-0 top-full mt-1 w-48 glass rounded-xl overflow-hidden shadow-card z-50">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs text-white/30 uppercase tracking-wider">{profile.role}</p>
                    <p className="text-sm text-white truncate">{profile.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg text-white/50 hover:bg-white/5"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {open && (
        <div className="fixed inset-x-0 top-16 z-40 glass-strong border-b border-white/5 md:hidden">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {nav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors',
                  pathname === item.href
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {menu && (
        <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
      )}
    </>
  )
}
