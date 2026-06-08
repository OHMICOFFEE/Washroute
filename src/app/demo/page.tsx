import Link from 'next/link'
import { Car, Shield, Users, ChevronRight } from 'lucide-react'
import { getBrandConfig } from '@/config/brand'
import Image from 'next/image'

export default function DemoPage() {
  const brand = getBrandConfig()

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: '100vh' }} className="flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm space-y-5 anim-fadeup">

        {/* Logo */}
        <div className="text-center mb-8">
          {brand.logoUrl ? (
            <div className="flex justify-center mb-4">
              <Image src={brand.logoUrl} alt={brand.name} width={80} height={80} className="object-contain rounded-2xl" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--brand-primary)' }}>
              <Car className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="display">{brand.name}</h1>
          <p className="caption mt-1">{brand.tagline}</p>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          {[
            {
              href: '/dashboard', role: 'Customer', icon: Car,
              desc: 'Book a wash, track your vehicle',
              color: 'var(--brand-primary)',
            },
            {
              href: '/driver', role: 'Driver', icon: Shield,
              desc: 'View jobs, verify PINs, complete handovers',
              color: '#ff9500',
            },
            {
              href: '/admin', role: 'Admin', icon: Users,
              desc: 'Manage bookings, drivers, services',
              color: '#007aff',
            },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <div className="list-group">
                <div className="list-item">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}15` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="heading text-[15px]">{item.role}</p>
                    <p className="caption text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-tertiary)' }}>
          Demo mode · Powered by Ohmi Pay
        </p>
      </div>
    </div>
  )
}
