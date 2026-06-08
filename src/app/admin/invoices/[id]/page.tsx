'use client'
import React, { useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Mail, MessageCircle, CheckCircle, Send } from 'lucide-react'
import { formatZAR } from '@/lib/utils/pricing'
import { getBrandConfig } from '@/config/brand'
import toast from 'react-hot-toast'

export default function AdminInvoiceDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const store   = useDemoStore()
  const invoice = store.getInvoice(id)
  const brand   = getBrandConfig()
  const [sending, setSending] = useState(false)

  if (!invoice) {
    return (
      <div className="pt-2 text-center py-20">
        <p className="heading">Invoice not found</p>
        <button className="btn btn-secondary mt-4" onClick={() => router.push('/admin/invoices')}>← Back</button>
      </div>
    )
  }

  const statusColor = invoice.status === 'paid' ? '#34c759' : '#ff9500'
  const vatItems    = invoice.items.filter(i => i.vat_note !== 'zero_rated')
  const zeroItems   = invoice.items.filter(i => i.vat_note === 'zero_rated')

  function sendWhatsApp() {
    if (!invoice.customer_cell) { toast.error('No cell number on record'); return }
    const num = '27' + invoice.customer_cell.replace(/^0/, '').replace(/\s/g, '')
    const msg = encodeURIComponent(
      `Hi ${invoice.customer_name} 👋\n\nYour invoice *${invoice.invoice_number}* is ready.\n\n` +
      `*Amount Due: ${formatZAR(invoice.total)}*\n` +
      `Date: ${new Date(invoice.created_at).toLocaleDateString('en-ZA')}\n` +
      `Ref: #${invoice.booking_id}\n\n` +
      `To view your full invoice, log into the Ohmi Pay app.\n\nThank you! 🚗✨`
    )
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
    toast.success('WhatsApp opened')
  }

  function sendEmail() {
    if (!invoice.customer_email) { toast.error('No email address on record'); return }
    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number} — ${formatZAR(invoice.total)}`)
    const body = encodeURIComponent(
      `Dear ${invoice.customer_name},\n\n` +
      `Please find your invoice details below.\n\n` +
      `Invoice Number: ${invoice.invoice_number}\n` +
      `Date: ${new Date(invoice.created_at).toLocaleDateString('en-ZA')}\n` +
      `Booking Reference: #${invoice.booking_id}\n\n` +
      `--- CHARGES ---\n` +
      invoice.items.map(i => `${i.description}: ${i.amount > 0 ? formatZAR(i.amount) : 'Included'}${i.vat_note === 'zero_rated' ? ' (Zero-rated)' : ''}`).join('\n') +
      `\n\nSubtotal (excl. VAT): ${formatZAR(invoice.subtotal)}` +
      `\nVAT (15%): ${formatZAR(invoice.vat)}` +
      `\nTOTAL: ${formatZAR(invoice.total)}\n\n` +
      `Status: ${invoice.status.toUpperCase()}\n\n` +
      `Thank you for your business.\n\nKind regards,\n${brand.name}`
    )
    window.open(`mailto:${invoice.customer_email}?subject=${subject}&body=${body}`)
    toast.success('Email client opened')
  }

  function sendPaymentRequest() {
    if (!invoice.customer_cell && !invoice.customer_email) {
      toast.error('No contact details on record'); return
    }
    setSending(true)
    const ref = `PAY-${invoice.invoice_number}`
    store.sendPaymentRequest({
      invoice_id:    invoice.id,
      booking_id:    invoice.booking_id,
      customer_name: invoice.customer_name,
      customer_cell: invoice.customer_cell,
      customer_email:invoice.customer_email,
      amount:        invoice.total,
      method:        invoice.customer_cell ? 'whatsapp' : 'email',
      status:        'sent',
      paid_at:       null,
      reference:     ref,
      notes:         '',
    })

    if (invoice.customer_cell) {
      const num = '27' + invoice.customer_cell.replace(/^0/, '').replace(/\s/g, '')
      const msg = encodeURIComponent(
        `Hi ${invoice.customer_name} 👋\n\n` +
        `*Payment Request — ${formatZAR(invoice.total)}*\n\n` +
        `Invoice: ${invoice.invoice_number}\n` +
        `Reference: ${ref}\n\n` +
        `Please make payment and reply to this message with your proof of payment.\n\n` +
        `_${brand.name}_`
      )
      window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
    } else if (invoice.customer_email) {
      const subject = encodeURIComponent(`Payment Request — ${formatZAR(invoice.total)} — ${invoice.invoice_number}`)
      const body = encodeURIComponent(
        `Dear ${invoice.customer_name},\n\n` +
        `This is a payment request for ${formatZAR(invoice.total)}.\n\n` +
        `Invoice: ${invoice.invoice_number}\nReference: ${ref}\n\n` +
        `Please make payment and reply with proof of payment.\n\nKind regards,\n${brand.name}`
      )
      window.open(`mailto:${invoice.customer_email}?subject=${subject}&body=${body}`)
    }
    setSending(false)
    toast.success('Payment request sent')
  }

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <button onClick={() => router.push('/admin/invoices')}
          className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: 'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> Invoices
        </button>
        <div className="flex items-center justify-between">
          <h1 className="display">Invoice Detail</h1>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: `${statusColor}15`, color: statusColor }}>
            {invoice.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        {invoice.customer_cell && (
          <button onClick={sendWhatsApp}
            className="btn py-3 flex items-center justify-center gap-2 font-semibold"
            style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}>
            <MessageCircle className="w-4 h-4" /> Send via WhatsApp
          </button>
        )}
        {invoice.customer_email && (
          <button onClick={sendEmail}
            className="btn btn-secondary py-3 flex items-center justify-center gap-2 font-semibold">
            <Mail className="w-4 h-4" /> Send via Email
          </button>
        )}
        {invoice.status === 'unpaid' && (
          <button onClick={sendPaymentRequest} disabled={sending}
            className="btn btn-primary py-3 flex items-center justify-center gap-2 font-semibold col-span-2">
            <Send className="w-4 h-4" /> Send Payment Request
          </button>
        )}
        {invoice.status === 'unpaid' && (
          <button onClick={() => { store.markInvoicePaid(invoice.id); toast.success('Marked as paid') }}
            className="btn py-3 flex items-center justify-center gap-2 font-semibold col-span-2"
            style={{ background: 'rgba(52,199,89,0.1)', color: '#34c759' }}>
            <CheckCircle className="w-4 h-4" /> Mark as Paid
          </button>
        )}
      </div>

      {/* Invoice document */}
      <div className="card-elevated p-5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>{brand.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{brand.tagline}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{invoice.invoice_number}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(invoice.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="h-px" style={{ background: 'var(--surface-border)' }} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="label mb-1">Bill To</p>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{invoice.customer_name}</p>
            {invoice.customer_cell  && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{invoice.customer_cell}</p>}
            {invoice.customer_email && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{invoice.customer_email}</p>}
          </div>
          <div className="text-right">
            <p className="label mb-1">Booking Ref</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>#{invoice.booking_id}</p>
            {invoice.paid_at && (
              <div className="mt-2">
                <p className="label">Paid On</p>
                <p className="text-sm font-medium" style={{ color: '#34c759' }}>
                  {new Date(invoice.paid_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="h-px" style={{ background: 'var(--surface-border)' }} />

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

        {zeroItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="label">Fuel (Zero-Rated)</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(0,122,255,0.1)', color: '#007aff' }}>No VAT</span>
            </div>
            <div className="space-y-2">
              {zeroItems.map((item, i) => (
                <div key={i} className="flex justify-between py-2 text-sm"
                  style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                  <span className="font-medium shrink-0 ml-4"
                    style={{ color: item.amount < 0 ? '#34c759' : 'var(--text-primary)' }}>
                    {item.amount < 0 ? `−${formatZAR(Math.abs(item.amount))}` : formatZAR(item.amount)}
                  </span>
                </div>
              ))}
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Zero-rated per VAT Act No. 89 of 1991, Schedule 2.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal (excl. VAT)</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatZAR(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>VAT @ 15%</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatZAR(invoice.vat)}</span>
          </div>
          {zeroItems.length > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Fuel (zero-rated)</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatZAR(zeroItems.reduce((s, i) => s + i.amount, 0))}</span>
            </div>
          )}
          <div className="h-px" style={{ background: 'var(--surface-border)' }} />
          <div className="flex justify-between items-baseline pt-1">
            <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Total</span>
            <span className="font-bold text-2xl" style={{ color: 'var(--brand-primary)' }}>{formatZAR(invoice.total)}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl text-center" style={{ background: 'var(--surface-inset)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Thank you for your business. For queries contact {brand.email ?? 'us'}.
          </p>
        </div>
      </div>
    </div>
  )
}
