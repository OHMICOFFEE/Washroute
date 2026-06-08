'use client'
import React, { useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Car, FileText, Gauge, Fuel, Camera, Phone, Mail, MapPin, CreditCard, ChevronRight } from 'lucide-react'
import { formatZAR, WASH_PACKAGE_LABELS } from '@/lib/utils/pricing'
import type { WashPackageKey } from '@/lib/utils/pricing'
import Link from 'next/link'

export default function AdminCustomerDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const store    = useDemoStore()
  const profile  = store.customerProfile?.id === id ? store.customerProfile : null
  const [tab, setTab] = useState<'profile'|'history'|'invoices'>('profile')

  if (!profile) {
    return (
      <div className="pt-2 text-center py-20">
        <p className="heading">Customer not found</p>
        <button className="btn btn-secondary mt-4" onClick={() => router.push('/admin/customers')}>← Back</button>
      </div>
    )
  }

  const bookings  = store.bookings.filter(b => b.customer_name === `${profile.first_name} ${profile.last_name}` || store.invoices.some(i => i.customer_id === id && i.booking_id === b.id))
  const invoices  = store.invoices.filter(i => i.customer_id === id)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const credits   = store.getActiveCredits(`${profile.first_name} ${profile.last_name}`)

  return (
    <div className="space-y-5 anim-fadeup pb-8">
      <div className="pt-2">
        <button onClick={() => router.push('/admin/customers')}
          className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color:'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> Customers
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0"
            style={{ background:'var(--brand-primary)' }}>
            {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
          </div>
          <div>
            <h1 className="title">{profile.first_name} {profile.last_name}</h1>
            <p className="caption mt-0.5">Customer since {new Date(profile.created_at).toLocaleDateString('en-ZA', { month:'long', year:'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center"><p className="font-bold text-lg" style={{ color:'var(--brand-primary)' }}>{bookings.length}</p><p className="text-xs" style={{ color:'var(--text-secondary)' }}>Bookings</p></div>
        <div className="card p-3 text-center"><p className="font-bold text-lg" style={{ color:'#34c759' }}>{formatZAR(totalPaid)}</p><p className="text-xs" style={{ color:'var(--text-secondary)' }}>Spent</p></div>
        <div className="card p-3 text-center"><p className="font-bold text-lg" style={{ color:'#ff9500' }}>{formatZAR(credits.reduce((s,c)=>s+c.amount,0))}</p><p className="text-xs" style={{ color:'var(--text-secondary)' }}>Credits</p></div>
      </div>

      {/* Contact actions */}
      <div className="flex gap-2">
        {profile.cell && <a href={`tel:${profile.cell}`} className="btn btn-secondary flex-1 text-sm py-2.5 flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Call</a>}
        {profile.cell && <a href={`https://wa.me/27${profile.cell.replace(/^0/,'').replace(/\s/g,'')}`} target="_blank" rel="noopener noreferrer" className="btn flex-1 text-sm py-2.5 flex items-center justify-center gap-1.5" style={{ background:'rgba(37,211,102,0.1)', color:'#25D366' }}>💬 WhatsApp</a>}
        {profile.email && <a href={`mailto:${profile.email}`} className="btn btn-secondary flex-1 text-sm py-2.5 flex items-center justify-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</a>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background:'var(--surface-inset)' }}>
        {(['profile','history','invoices'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
            style={tab === t
              ? { background:'var(--surface-card)', color:'var(--brand-primary)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }
              : { color:'var(--text-tertiary)' }
            }>
            {t}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <div className="space-y-4">
          <div className="list-group">
            {[
              { icon:CreditCard, label: profile.id_type === 'passport' ? 'Passport' : 'SA ID', value: profile.id_number||'—' },
              { icon:Phone,      label:'Cell',      value: profile.cell||'—' },
              { icon:Phone,      label:'Alt. Cell', value: profile.alt_cell||'—' },
              { icon:Mail,       label:'Email',     value: profile.email||'—' },
            ].filter(i => i.value !== '—').map((item,i,arr) => (
              <div key={item.label} className="list-item" style={{ borderBottom: i<arr.length-1?'1px solid var(--surface-border)':'none' }}>
                <item.icon className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} />
                <div className="flex-1"><p className="text-xs" style={{ color:'var(--text-tertiary)' }}>{item.label}</p><p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{item.value}</p></div>
              </div>
            ))}
          </div>

          {profile.street_address && (
            <div className="list-group">
              <div className="list-item" style={{ borderBottom:'none' }}>
                <MapPin className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} />
                <div className="flex-1">
                  <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>Address</p>
                  <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{profile.street_address}</p>
                  <p className="text-sm" style={{ color:'var(--text-secondary)' }}>{profile.suburb}, {profile.city}</p>
                  <p className="text-sm" style={{ color:'var(--text-secondary)' }}>{profile.province} {profile.postal_code}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB — vehicle history with odometer, photos, fuel */}
      {tab === 'history' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="card p-10 text-center">
              <Car className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color:'var(--text-secondary)' }}>No booking history yet</p>
            </div>
          ) : (
            bookings.sort((a,b) => b.created_at.localeCompare(a.created_at)).map(b => {
              const invoice = store.invoices.find(i => i.booking_id === b.id)
              return (
                <div key={b.id} className="card-elevated p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold" style={{ color:'var(--text-primary)' }}>{b.make} {b.model}</p>
                      <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>{b.registration} · {b.colour}</p>
                      <p className="text-xs mt-0.5" style={{ color:'var(--text-tertiary)' }}>{b.booking_date} at {b.pickup_time}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm" style={{ color:'var(--brand-primary)' }}>{formatZAR(b.total)}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={b.status === 'completed' ? { background:'rgba(52,199,89,0.1)', color:'#34c759' } : { background:'rgba(255,149,0,0.1)', color:'#ff9500' }}>
                        {b.status.replace(/_/g,' ')}
                      </span>
                    </div>
                  </div>

                  {/* Wash details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div style={{ color:'var(--text-secondary)' }}>
                      🚿 {WASH_PACKAGE_LABELS[b.wash_package as WashPackageKey] ?? b.wash_package}
                    </div>
                    {b.concierge && <div style={{ color:'var(--text-secondary)' }}>🔧 Concierge</div>}
                    {b.fuel_refill && <div style={{ color:'var(--text-secondary)' }}>⛽ Fuel: R{b.fuel_amount} ({b.fuel_type})</div>}
                    {b.extras.length > 0 && <div style={{ color:'var(--text-secondary)' }}>✨ {b.extras.join(', ')}</div>}
                  </div>

                  {/* Odometer readings */}
                  {(b.odometer_out || b.odometer_in) && (
                    <div className="p-3 rounded-xl space-y-2" style={{ background:'var(--surface-inset)' }}>
                      <p className="text-xs font-bold flex items-center gap-1.5" style={{ color:'var(--text-primary)' }}>
                        <Gauge className="w-3.5 h-3.5" style={{ color:'var(--brand-primary)' }} /> Odometer Record
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {b.odometer_out && <div><p style={{ color:'var(--text-tertiary)' }}>Out</p><p className="font-bold" style={{ color:'var(--text-primary)' }}>{b.odometer_out} km</p></div>}
                        {b.odometer_in  && <div><p style={{ color:'var(--text-tertiary)' }}>In</p><p className="font-bold" style={{ color:'var(--text-primary)' }}>{b.odometer_in} km</p></div>}
                        {b.odometer_out && b.odometer_in && (
                          <div><p style={{ color:'var(--text-tertiary)' }}>Distance</p><p className="font-bold" style={{ color:'var(--brand-primary)' }}>{Math.abs(parseInt(b.odometer_in)-parseInt(b.odometer_out))} km</p></div>
                        )}
                      </div>
                      {b.fuel_level && <p className="text-xs" style={{ color:'var(--text-secondary)' }}>Fuel on collection: {b.fuel_level}</p>}
                    </div>
                  )}

                  {/* Concierge actuals */}
                  {b.actual_fuel_cost !== undefined && (
                    <div className="p-3 rounded-xl space-y-1" style={{ background:'var(--surface-inset)' }}>
                      <p className="text-xs font-bold" style={{ color:'var(--text-primary)' }}>⛽ Concierge Actuals</p>
                      {b.actual_fuel_cost !== undefined && <p className="text-xs" style={{ color:'var(--text-secondary)' }}>Fuel dispensed: {formatZAR(b.actual_fuel_cost)}</p>}
                      {b.fuel_credit && b.fuel_credit > 0 && <p className="text-xs" style={{ color:'#34c759' }}>Credit issued: {formatZAR(b.fuel_credit)}</p>}
                    </div>
                  )}

                  {/* Photos */}
                  {((b.photos_pickup?.length ?? 0) > 0 || (b.photos_delivery?.length ?? 0) > 0) && (
                    <div className="space-y-2">
                      {(b.photos_pickup?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color:'var(--text-secondary)' }}>
                            <Camera className="w-3.5 h-3.5" /> Pickup Photos ({b.photos_pickup!.length})
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {b.photos_pickup!.map((_, i) => (
                              <div key={i} className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background:'rgba(0,122,255,0.08)' }}>
                                <span className="text-2xl">📷</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(b.photos_delivery?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color:'var(--text-secondary)' }}>
                            <Camera className="w-3.5 h-3.5" /> After-Wash Photos ({b.photos_delivery!.length})
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {b.photos_delivery!.map((_, i) => (
                              <div key={i} className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background:'rgba(52,199,89,0.08)' }}>
                                <span className="text-2xl">📸</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(b.photos_damage?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color:'#ff9500' }}>
                            ⚠️ Damage Photos ({b.photos_damage!.length})
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {b.photos_damage!.map((_, i) => (
                              <div key={i} className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background:'rgba(255,149,0,0.1)' }}>
                                <span className="text-2xl">🔴</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Invoice link */}
                  {invoice && (
                    <Link href={`/admin/invoices/${invoice.id}`}>
                      <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor:'var(--surface-border)', color:'var(--brand-primary)' }}>
                        <FileText className="w-4 h-4" />
                        <p className="text-sm font-medium">{invoice.invoice_number} · {formatZAR(invoice.total)}</p>
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </div>
                    </Link>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* INVOICES TAB */}
      {tab === 'invoices' && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="card p-10 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color:'var(--text-secondary)' }}>No invoices yet</p>
            </div>
          ) : (
            invoices.sort((a,b) => b.created_at.localeCompare(a.created_at)).map(inv => (
              <Link key={inv.id} href={`/admin/invoices/${inv.id}`}>
                <div className="card flex items-center gap-4 p-4 cursor-pointer"
                  style={inv.status === 'unpaid' ? { border:'1.5px solid rgba(255,149,0,0.3)' } : {}}>
                  <FileText className="w-5 h-5 shrink-0" style={{ color: inv.status === 'paid' ? '#34c759' : '#ff9500' }} />
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>{inv.invoice_number}</p>
                    <p className="text-xs" style={{ color:'var(--text-secondary)' }}>
                      {new Date(inv.created_at).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm" style={{ color: inv.status === 'paid' ? '#34c759' : '#ff9500' }}>{formatZAR(inv.total)}</p>
                    <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>{inv.status}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} />
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
