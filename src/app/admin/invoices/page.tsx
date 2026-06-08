'use client'
import React, { useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import Link from 'next/link'
import { FileText, Search, ChevronRight, Mail, MessageCircle, CheckCircle } from 'lucide-react'
import { formatZAR } from '@/lib/utils/pricing'
import toast from 'react-hot-toast'

export default function AdminInvoicesPage() {
  const store  = useDemoStore()
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<'all'|'paid'|'unpaid'>('all')

  const filtered = store.invoices
    .filter(i => filter === 'all' || i.status === filter)
    .filter(i => {
      const q = search.toLowerCase()
      return !q || i.customer_name.toLowerCase().includes(q) ||
             i.invoice_number.toLowerCase().includes(q) ||
             i.customer_cell.includes(q) ||
             i.customer_email.toLowerCase().includes(q)
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const totalRevenue  = store.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const totalOutstanding = store.invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.total, 0)
  const counts = {
    all:    store.invoices.length,
    paid:   store.invoices.filter(i => i.status === 'paid').length,
    unpaid: store.invoices.filter(i => i.status === 'unpaid').length,
  }

  function sendWhatsApp(inv: typeof store.invoices[0]) {
    if (!inv.customer_cell) { toast.error('No cell number on file'); return }
    const num = '27' + inv.customer_cell.replace(/^0/, '').replace(/\s/g, '')
    const msg = encodeURIComponent(
      `Hi ${inv.customer_name}, please find your invoice ${inv.invoice_number} for ${formatZAR(inv.total)}.\n\nTo view your invoice, please log into the Ohmi Pay app.\n\nThank you for your business!`
    )
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
    toast.success('WhatsApp opened')
  }

  function sendEmail(inv: typeof store.invoices[0]) {
    if (!inv.customer_email) { toast.error('No email on file'); return }
    const subject = encodeURIComponent(`Invoice ${inv.invoice_number} — ${formatZAR(inv.total)}`)
    const body    = encodeURIComponent(
      `Dear ${inv.customer_name},\n\nPlease find attached your invoice ${inv.invoice_number}.\n\nAmount Due: ${formatZAR(inv.total)}\nBooking Reference: ${inv.booking_id}\n\nThank you for your business.\n\nKind regards,\nOhmi Pay`
    )
    window.open(`mailto:${inv.customer_email}?subject=${subject}&body=${body}`)
    toast.success('Email client opened')
  }

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <p className="caption">Admin</p>
        <h1 className="display mt-0.5">Invoices</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-2xl font-bold" style={{ color: '#34c759' }}>{formatZAR(totalRevenue)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Total Revenue (Paid)</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold" style={{ color: '#ff9500' }}>{formatZAR(totalOutstanding)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Outstanding</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
        <input className="input" style={{ paddingLeft: '38px' }}
          placeholder="Search by name, invoice number, cell or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all','unpaid','paid'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all flex-shrink-0"
            style={filter === f
              ? { background: 'var(--brand-primary)', color: '#fff', border: '2px solid var(--brand-primary)' }
              : { background: 'var(--surface-inset)', color: 'var(--text-secondary)', border: '2px solid var(--surface-border)' }
            }>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {counts[f] > 0 && <span className="ml-1.5 opacity-70">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="heading text-[15px]">No invoices</p>
          <p className="caption text-sm mt-1">Invoices are auto-generated when customers book.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <div key={inv.id} className="card-elevated p-4 space-y-3"
              style={inv.status === 'unpaid' ? { border: '1.5px solid rgba(255,149,0,0.3)' } : {}}>

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{inv.invoice_number}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={inv.status === 'paid'
                        ? { background: 'rgba(52,199,89,0.1)', color: '#34c759' }
                        : { background: 'rgba(255,149,0,0.1)', color: '#ff9500' }
                      }>
                      {inv.status === 'paid' ? '✓ Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {inv.customer_name} · {new Date(inv.created_at).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg" style={{ color: inv.status === 'paid' ? '#34c759' : 'var(--brand-primary)' }}>
                    {formatZAR(inv.total)}
                  </p>
                </div>
              </div>

              {/* Contact + booking ref */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {inv.customer_cell && (
                  <div style={{ color: 'var(--text-secondary)' }}>📱 {inv.customer_cell}</div>
                )}
                {inv.customer_email && (
                  <div className="truncate" style={{ color: 'var(--text-secondary)' }}>✉️ {inv.customer_email}</div>
                )}
                <div style={{ color: 'var(--text-tertiary)' }}>Ref: #{inv.booking_id}</div>
                {inv.paid_at && (
                  <div style={{ color: '#34c759' }}>Paid: {new Date(inv.paid_at).toLocaleDateString('en-ZA')}</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'var(--surface-border)' }}>
                <Link href={`/admin/invoices/${inv.id}`} className="btn btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> View Invoice
                </Link>
                {inv.customer_cell && (
                  <button onClick={() => sendWhatsApp(inv)}
                    className="btn flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                    style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}>
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                )}
                {inv.customer_email && (
                  <button onClick={() => sendEmail(inv)}
                    className="btn btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                )}
                {inv.status === 'unpaid' && (
                  <button onClick={() => { store.markInvoicePaid(inv.id); toast.success('Marked as paid') }}
                    className="btn flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                    style={{ background: 'rgba(52,199,89,0.1)', color: '#34c759' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
