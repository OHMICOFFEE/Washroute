'use client'
import React, { useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import Link from 'next/link'
import { Send, CheckCircle, Clock, MessageCircle, Mail, DollarSign, ChevronRight } from 'lucide-react'
import { formatZAR } from '@/lib/utils/pricing'
import toast from 'react-hot-toast'

export default function AdminPaymentsPage() {
  const store  = useDemoStore()
  const [filter, setFilter] = useState<'all'|'sent'|'paid'>('all')

  const requests = (store.paymentRequests ?? [])
    .filter(r => filter === 'all' || r.status === filter)
    .sort((a,b) => b.sent_at.localeCompare(a.sent_at))

  const totalSent = (store.paymentRequests ?? []).filter(r => r.status !== 'paid').reduce((s,r) => s + r.amount, 0)
  const totalPaid = (store.paymentRequests ?? []).filter(r => r.status === 'paid').reduce((s,r) => s + r.amount, 0)

  // Unpaid invoices that don't have a payment request yet
  const pendingInvoices = store.invoices.filter(inv =>
    inv.status === 'unpaid' &&
    !(store.paymentRequests ?? []).some(r => r.invoice_id === inv.id && r.status !== 'failed')
  )

  function sendRequest(inv: typeof store.invoices[0]) {
    if (!inv.customer_cell && !inv.customer_email) { toast.error('No contact details'); return }
    const ref = `PAY-${inv.invoice_number}`
    store.sendPaymentRequest({
      invoice_id:    inv.id,
      booking_id:    inv.booking_id,
      customer_name: inv.customer_name,
      customer_cell: inv.customer_cell,
      customer_email:inv.customer_email,
      amount:        inv.total,
      method:        inv.customer_cell ? 'whatsapp' : 'email',
      status:        'sent',
      paid_at:       null,
      reference:     ref,
      notes:         '',
    })
    if (inv.customer_cell) {
      const num = '27' + inv.customer_cell.replace(/^0/,'').replace(/\s/g,'')
      const msg = encodeURIComponent(
        `Hi ${inv.customer_name} 👋\n\n*Payment Request — ${formatZAR(inv.total)}*\n\nInvoice: ${inv.invoice_number}\nRef: ${ref}\n\nPlease make payment and reply with proof of payment.\n\nThank you! 🚗`
      )
      window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
    } else {
      const subject = encodeURIComponent(`Payment Request — ${formatZAR(inv.total)}`)
      const body    = encodeURIComponent(`Dear ${inv.customer_name},\n\nPayment of ${formatZAR(inv.total)} is due for invoice ${inv.invoice_number}.\n\nRef: ${ref}\n\nKind regards`)
      window.open(`mailto:${inv.customer_email}?subject=${subject}&body=${body}`)
    }
    toast.success('Payment request sent')
  }

  function markPaid(reqId: string, invId: string) {
    store.updatePaymentRequest(reqId, { status: 'paid', paid_at: new Date().toISOString() })
    store.markInvoicePaid(invId)
    toast.success('Payment recorded')
  }

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <p className="caption">Admin</p>
        <h1 className="display mt-0.5">Payments</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <DollarSign className="w-5 h-5 mb-2" style={{ color:'#34c759' }} />
          <p className="text-xl font-bold" style={{ color:'var(--text-primary)' }}>{formatZAR(totalPaid)}</p>
          <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>Total Collected</p>
        </div>
        <div className="card p-4">
          <Clock className="w-5 h-5 mb-2" style={{ color:'#ff9500' }} />
          <p className="text-xl font-bold" style={{ color:'var(--text-primary)' }}>{formatZAR(totalSent)}</p>
          <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>Outstanding</p>
        </div>
      </div>

      {/* Pending invoices — quick send */}
      {pendingInvoices.length > 0 && (
        <div>
          <h2 className="heading mb-3">🔔 Awaiting Payment Request</h2>
          <div className="space-y-2">
            {pendingInvoices.map(inv => (
              <div key={inv.id} className="card p-4 flex items-center gap-3"
                style={{ border:'1.5px solid rgba(255,149,0,0.3)' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>{inv.customer_name}</p>
                  <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>{inv.invoice_number}</p>
                </div>
                <p className="font-bold shrink-0" style={{ color:'#ff9500' }}>{formatZAR(inv.total)}</p>
                <button onClick={() => sendRequest(inv)}
                  className="btn btn-primary py-2 px-3 text-xs flex items-center gap-1.5 shrink-0">
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all','sent','paid'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
            style={filter === f
              ? { background:'var(--brand-primary)', color:'#fff', border:'2px solid var(--brand-primary)' }
              : { background:'var(--surface-inset)', color:'var(--text-secondary)', border:'2px solid var(--surface-border)' }
            }>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Payment requests list */}
      <div>
        <h2 className="heading mb-3">Payment Requests</h2>
        {requests.length === 0 ? (
          <div className="card p-10 text-center">
            <Send className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color:'var(--text-secondary)' }}>No payment requests yet</p>
            <p className="text-xs mt-1" style={{ color:'var(--text-tertiary)' }}>Send requests from the invoices page or the list above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="card-elevated p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>{req.customer_name}</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>
                      Ref: {req.reference} · {new Date(req.sent_at).toLocaleDateString('en-ZA')}
                    </p>
                    {req.customer_cell && <p className="text-xs mt-0.5" style={{ color:'var(--text-tertiary)' }}>📱 {req.customer_cell}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold" style={{ color: req.status === 'paid' ? '#34c759' : 'var(--brand-primary)' }}>
                      {formatZAR(req.amount)}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={req.status === 'paid'
                        ? { background:'rgba(52,199,89,0.1)', color:'#34c759' }
                        : { background:'rgba(255,149,0,0.1)', color:'#ff9500' }
                      }>
                      {req.status === 'paid' ? '✓ Paid' : 'Sent'}
                    </span>
                  </div>
                </div>

                {req.status !== 'paid' && (
                  <div className="flex gap-2 pt-1 border-t" style={{ borderColor:'var(--surface-border)' }}>
                    {req.customer_cell && (
                      <button onClick={() => {
                        const num = '27'+req.customer_cell.replace(/^0/,'').replace(/\s/g,'')
                        const msg = encodeURIComponent(`Hi ${req.customer_name}, following up on payment of ${formatZAR(req.amount)}. Ref: ${req.reference}`)
                        window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
                      }}
                        className="btn flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                        style={{ background:'rgba(37,211,102,0.1)', color:'#25D366' }}>
                        <MessageCircle className="w-3.5 h-3.5" /> Follow Up
                      </button>
                    )}
                    <button onClick={() => markPaid(req.id, req.invoice_id)}
                      className="btn flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                      style={{ background:'rgba(52,199,89,0.1)', color:'#34c759' }}>
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                    </button>
                    <Link href={`/admin/invoices/${req.invoice_id}`}
                      className="btn btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5">
                      Invoice <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
