'use client'
import React, { useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import Link from 'next/link'
import { Users, Search, ChevronRight, MapPin, Phone, Mail, Gift } from 'lucide-react'
import { formatZAR } from '@/lib/utils/pricing'

export default function AdminCustomersPage() {
  const store   = useDemoStore()
  const [search, setSearch] = useState('')

  // In demo mode we only have one customer profile
  // When auth connects this will be a full list
  const customers = store.customerProfile ? [store.customerProfile] : []

  const filtered = customers.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase()
    const q    = search.toLowerCase()
    return name.includes(q) || c.cell.includes(q) || c.email.toLowerCase().includes(q) || c.id_number.includes(q)
  })

  // Group A-Z
  const grouped: Record<string, typeof filtered> = {}
  filtered
    .sort((a, b) => a.last_name.localeCompare(b.last_name))
    .forEach(c => {
      const letter = c.last_name.charAt(0).toUpperCase()
      if (!grouped[letter]) grouped[letter] = []
      grouped[letter].push(c)
    })

  const totalBookings = (customerId: string) =>
    store.bookings.filter(b => b.customer_name !== 'Demo Customer' || store.customerProfile?.id === customerId).length

  const totalSpend = (customerId: string) =>
    store.invoices.filter(i => i.customer_id === customerId && i.status === 'paid').reduce((s, i) => s + i.total, 0)

  const activeCredit = (customerName: string) =>
    store.getActiveCredits(customerName).reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <p className="caption">Admin</p>
        <h1 className="display mt-0.5">Customers</h1>
        <p className="caption mt-1">{customers.length} registered customer{customers.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
        <input className="input" style={{ paddingLeft: '38px' }} placeholder="Search by name, cell, email or ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {customers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="heading text-[15px]">No customers yet</p>
          <p className="caption text-sm mt-1">Customers appear here once they complete their profile registration.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No customers match your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([letter, group]) => (
            <div key={letter}>
              {/* Letter header */}
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                  style={{ background: 'var(--brand-primary)' }}>{letter}</span>
                <div className="h-px flex-1" style={{ background: 'var(--surface-border)' }} />
              </div>

              <div className="space-y-2">
                {group.map(c => {
                  const credit  = activeCredit(`${c.first_name} ${c.last_name}`)
                  const spend   = totalSpend(c.id)
                  const bookings = store.bookings.length
                  return (
                    <div key={c.id} className="card p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
                            style={{ background: 'var(--brand-primary)' }}>
                            {c.first_name.charAt(0)}{c.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{c.first_name} {c.last_name}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                              {c.id_type === 'passport' ? 'Passport' : c.id_type === 'other' ? 'ID' : 'SA ID'}: {c.id_number || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm" style={{ color: 'var(--brand-primary)' }}>{formatZAR(spend)}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>total spend</p>
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="grid grid-cols-2 gap-2">
                        {c.cell && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{c.cell}</span>
                          </div>
                        )}
                        {c.alt_cell && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{c.alt_cell}</span>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-2 col-span-2">
                            <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{c.email}</span>
                          </div>
                        )}
                        {c.street_address && (
                          <div className="flex items-start gap-2 col-span-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                              {c.street_address}, {c.suburb}, {c.city}, {c.province} {c.postal_code}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: 'var(--surface-border)' }}>
                        <div className="flex-1 text-center">
                          <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{bookings}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>bookings</p>
                        </div>
                        <div className="w-px h-8" style={{ background: 'var(--surface-border)' }} />
                        <div className="flex-1 text-center">
                          <p className="font-bold text-base" style={{ color: 'var(--brand-primary)' }}>{formatZAR(spend)}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>total paid</p>
                        </div>
                        {credit > 0 && <>
                          <div className="w-px h-8" style={{ background: 'var(--surface-border)' }} />
                          <div className="flex-1 text-center">
                            <p className="font-bold text-base" style={{ color: '#34c759' }}>{formatZAR(credit)}</p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>credit</p>
                          </div>
                        </>}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {c.cell && (
                          <a href={`tel:${c.cell}`} className="btn btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                        )}
                        {c.cell && (
                          <a href={`https://wa.me/27${c.cell.replace(/^0/,'').replace(/\s/g,'')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="btn flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                            style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}>
                            💬 WhatsApp
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="btn btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> Email
                          </a>
                        )}
                      </div>
                      <Link href={`/admin/customers/${c.id}`}
                        className="btn btn-secondary w-full text-xs py-2 flex items-center justify-center gap-1.5 mt-1">
                        View Full Profile & History <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
