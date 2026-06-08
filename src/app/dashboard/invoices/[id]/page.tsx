'use client'
import React from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Download, Check } from 'lucide-react'
import { formatZAR } from '@/lib/utils/pricing'
import { getBrandConfig } from '@/config/brand'
import toast from 'react-hot-toast'

export default function InvoiceDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const store   = useDemoStore()
  const invoice = store.getInvoice(id)
  const brand   = getBrandConfig()

  if (!invoice) {
    return (
      <div className="pt-2 text-center py-20">
        <p className="heading">Invoice not found</p>
        <button className="btn btn-secondary mt-4" onClick={() => router.push('/dashboard/invoices')}>← Back</button>
      </div>
    )
  }

  function markPaid() {
    store.markInvoicePaid(id)
    toast.success('Invoice marked as paid')
  }

  const statusColor = invoice.status === 'paid' ? '#34c759' : '#ff9500'

  // Split items into VAT-able and zero-rated
  const vatItems      = invoice.items.filter(i => i.vat_note !== 'zero_rated')
  const zeroRateItems = invoice.items.filter(i => i.vat_note === 'zero_rated')

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2 print:hidden">
        <button onClick={() => router.push('/dashboard/invoices')}
          className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: 'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> Invoices
        </button>
        <div className="flex items-center justify-between">
          <h1 className="display">Invoice</h1>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn btn-secondary py-2 px-3 text-sm flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Save / Print
            </button>
            {invoice.status === 'unpaid' && (
              <button onClick={markPaid} className="btn btn-primary py-2 px-3 text-sm flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Mark Paid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice document */}
      <div className="card-elevated p-6 space-y-5 print:shadow-none">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>{brand.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{brand.tagline}</p>
            {brand.email && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{brand.email}</p>}
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: `${statusColor}15`, color: statusColor }}>
              {invoice.status.toUpperCase()}
            </span>
            <p className="font-bold text-lg mt-2" style={{ color: 'var(--text-primary)' }}>{invoice.invoice_number}</p>
          </div>
        </div>

        <div className="h-px" style={{ background: 'var(--surface-border)' }} />

        {/* Bill to + dates */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="label mb-2">Bill To</p>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{invoice.customer_name}</p>
            {invoice.customer_cell  && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{invoice.customer_cell}</p>}
            {invoice.customer_email && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{invoice.customer_email}</p>}
          </div>
          <div className="text-right space-y-2">
            <div>
              <p className="label">Invoice Date</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {new Date(invoice.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {invoice.paid_at && (
              <div>
                <p className="label">Paid On</p>
                <p className="text-sm" style={{ color: '#34c759' }}>
                  {new Date(invoice.paid_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="h-px" style={{ background: 'var(--surface-border)' }} />

        {/* VAT-able line items */}
        {vatItems.length > 0 && (
          <div>
            <p className="label mb-3">Services (VAT Inclusive)</p>
            <div className="space-y-2">
              {vatItems.map((item, i) => (
                <div key={i} className="flex justify-between py-2 text-sm"
                  style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                  <span className="font-medium shrink-0 ml-4" style={{ color: 'var(--text-primary)' }}>
                    {item.amount > 0 ? formatZAR(item.amount) : 'Included'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zero-rated items (fuel) */}
        {zeroRateItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="label">Fuel / Zero-Rated Items</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(0,122,255,0.1)', color: '#007aff' }}>No VAT</span>
            </div>
            <div className="space-y-2">
              {zeroRateItems.map((item, i) => (
                <div key={i} className="flex justify-between py-2 text-sm"
                  style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                  <span className="font-medium shrink-0 ml-4"
                    style={{ color: item.amount < 0 ? '#34c759' : 'var(--text-primary)' }}>
                    {item.amount < 0 ? `−${formatZAR(Math.abs(item.amount))}` : formatZAR(item.amount)}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  ⛽ Fuel is zero-rated in terms of the Value Added Tax Act (No. 89 of 1991), Schedule 2.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Services subtotal (excl. VAT)</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatZAR(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>VAT @ 15% (on services only)</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatZAR(invoice.vat)}</span>
          </div>
          {zeroRateItems.length > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Fuel (zero-rated, no VAT)</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {formatZAR(zeroRateItems.reduce((s, i) => s + i.amount, 0))}
              </span>
            </div>
          )}
          <div className="h-px" style={{ background: 'var(--surface-border)' }} />
          <div className="flex justify-between items-baseline pt-1">
            <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Total</span>
            <span className="font-bold text-2xl" style={{ color: 'var(--brand-primary)' }}>{formatZAR(invoice.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 rounded-xl text-center" style={{ background: 'var(--surface-inset)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Thank you for your business. For queries contact {brand.email ?? 'us'}.
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Booking ref: #{invoice.booking_id}</p>
        </div>
      </div>
    </div>
  )
}
