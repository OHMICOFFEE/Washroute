'use client'
import React from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, ChevronRight } from 'lucide-react'
import { formatZAR } from '@/lib/utils/pricing'

export default function InvoicesPage() {
  const store  = useDemoStore()
  const router = useRouter()

  const paid   = store.invoices.filter(i => i.status === 'paid')
  const unpaid = store.invoices.filter(i => i.status === 'unpaid')

  function StatusPill({ status }: { status: string }) {
    const styles: Record<string, { bg: string; color: string }> = {
      paid:      { bg: 'rgba(52,199,89,0.1)',   color: '#34c759' },
      unpaid:    { bg: 'rgba(255,149,0,0.1)',    color: '#ff9500' },
      cancelled: { bg: 'rgba(255,59,48,0.1)',    color: '#ff3b30' },
    }
    const s = styles[status] ?? styles.unpaid
    return (
      <span className="pill text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <button onClick={() => router.push('/dashboard/profile')}
          className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: 'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> Profile
        </button>
        <h1 className="display">Invoices</h1>
      </div>

      {store.invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="heading text-[15px]">No invoices yet</p>
          <p className="caption text-sm mt-1">Invoices are generated automatically after each booking.</p>
        </div>
      ) : (
        <>
          {unpaid.length > 0 && (
            <div>
              <h2 className="heading mb-3">Outstanding</h2>
              <div className="space-y-2">
                {unpaid.map(inv => (
                  <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}>
                    <div className="card flex items-center gap-4 p-4 cursor-pointer active:opacity-80"
                      style={{ border: '1px solid rgba(255,149,0,0.3)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(255,149,0,0.1)' }}>
                        <FileText className="w-5 h-5" style={{ color: '#ff9500' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{inv.invoice_number}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(inv.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-sm" style={{ color: '#ff9500' }}>{formatZAR(inv.total)}</p>
                          <StatusPill status={inv.status} />
                        </div>
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div>
              <h2 className="heading mb-3">Paid</h2>
              <div className="list-group">
                {paid.map((inv, i, arr) => (
                  <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`}>
                    <div className="list-item cursor-pointer"
                      style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                      <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{inv.invoice_number}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-sm" style={{ color: 'var(--brand-primary)' }}>{formatZAR(inv.total)}</span>
                        <StatusPill status={inv.status} />
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
