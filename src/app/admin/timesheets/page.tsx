'use client'
import React, { useState } from 'react'
import { useDemoStore, type TimeEntry } from '@/lib/demo/store'
import Link from 'next/link'
import { Check, Clock, Edit2, X, Trash2, Printer, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

function formatDur(entry: TimeEntry): string {
  if (!entry.clock_out) return 'Active'
  const ms   = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
  const mins = Math.floor(ms / 60000) - entry.break_mins
  return `${Math.floor(mins/60)}h ${mins%60}m`
}

function calcPay(entry: TimeEntry, rate: number): number {
  if (!entry.clock_out) return 0
  const ms  = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
  return ((Math.floor(ms/60000) - entry.break_mins) / 60) * rate
}

function getMonths(entries: TimeEntry[]): string[] {
  return Array.from(new Set(entries.map(e => e.date.slice(0,7)))).sort().reverse()
}

export default function TimesheetsPage() {
  const store  = useDemoStore()
  const months = getMonths(store.timeEntries)
  const [month,      setMonth]      = useState(months[0] ?? new Date().toISOString().slice(0,7))
  const [editEntry,  setEditEntry]  = useState<string|null>(null)
  const [editIn,     setEditIn]     = useState('')
  const [editOut,    setEditOut]    = useState('')
  const [editBreak,  setEditBreak]  = useState('')
  const [editNotes,  setEditNotes]  = useState('')
  const [showPayslip,setShowPayslip]= useState<string|null>(null)

  const monthEntries = store.timeEntries
    .filter(e => e.date.startsWith(month))
    .sort((a,b) => b.clock_in.localeCompare(a.clock_in))

  const pending = monthEntries.filter(e => e.clock_out && !e.approved).length

  const staffSummary = store.staff.map(s => {
    const entries = monthEntries.filter(e => e.staff_id === s.id && e.clock_out)
    const hrs     = entries.reduce((sum,e) => {
      const ms = new Date(e.clock_out!).getTime() - new Date(e.clock_in).getTime()
      return sum + (Math.floor(ms/60000) - e.break_mins) / 60
    }, 0)
    return { ...s, hrs, pay: hrs * s.hourly_rate, entries: entries.length }
  }).filter(s => s.entries > 0)

  function startEdit(e: TimeEntry) {
    setEditEntry(e.id)
    setEditIn(e.clock_in.slice(0,16))
    setEditOut(e.clock_out?.slice(0,16) ?? '')
    setEditBreak(String(e.break_mins))
    setEditNotes(e.notes)
  }

  function saveEdit() {
    if (!editEntry) return
    store.updateTimeEntry(editEntry, {
      clock_in:   new Date(editIn).toISOString(),
      clock_out:  editOut ? new Date(editOut).toISOString() : null,
      break_mins: parseInt(editBreak)||0,
      notes:      editNotes,
    })
    setEditEntry(null)
    toast.success('Entry updated')
  }

  function deleteEntry(id: string) {
    if (!confirm('Delete this time entry?')) return
    store.deleteTimeEntry(id)
    toast.success('Entry deleted')
  }

  function approveAll() {
    monthEntries.filter(e => e.clock_out && !e.approved).forEach(e => store.approveTimeEntry(e.id))
    toast.success('All entries approved')
  }

  const totalPay = staffSummary.reduce((s,m) => s + m.pay, 0)

  // Payslip modal
  const payslipStaff = showPayslip ? store.staff.find(s => s.id === showPayslip) : null
  const payslipEntries = showPayslip ? monthEntries.filter(e => e.staff_id === showPayslip && e.clock_out) : []
  const payslipHrs = payslipEntries.reduce((sum,e) => {
    const ms = new Date(e.clock_out!).getTime() - new Date(e.clock_in).getTime()
    return sum + (Math.floor(ms/60000) - e.break_mins) / 60
  }, 0)
  const payslipPay = payslipStaff ? payslipHrs * payslipStaff.hourly_rate : 0

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <p className="caption">Admin</p>
        <h1 className="display mt-0.5">Timesheets & Pay</h1>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(months.length > 0 ? months : [new Date().toISOString().slice(0,7)]).map(m => (
          <button key={m} onClick={() => setMonth(m)}
            className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border-2 transition-all flex-shrink-0"
            style={month === m
              ? { background:'var(--brand-primary)', color:'#fff', border:'2px solid var(--brand-primary)' }
              : { background:'var(--surface-inset)', color:'var(--text-secondary)', border:'2px solid var(--surface-border)' }
            }>
            {new Date(m+'-01').toLocaleDateString('en-ZA', { month:'long', year:'numeric' })}
          </button>
        ))}
      </div>

      {/* Pay summary */}
      {staffSummary.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading">Pay Summary</h2>
            {pending > 0 && (
              <button onClick={approveAll} className="btn btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Approve All ({pending})
              </button>
            )}
          </div>
          <div className="list-group">
            {staffSummary.map((s,i,arr) => (
              <div key={s.id} className="list-item"
                style={{ borderBottom: i<arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background:'var(--brand-primary)' }}>
                  {s.first_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color:'var(--text-primary)' }}>{s.first_name} {s.last_name}</p>
                  <p className="text-xs" style={{ color:'var(--text-secondary)' }}>{s.hrs.toFixed(1)}h · {s.entries} shifts · R{s.hourly_rate}/hr</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold" style={{ color:'var(--brand-primary)' }}>R{s.pay.toFixed(0)}</span>
                  <button onClick={() => setShowPayslip(s.id)}
                    className="btn btn-secondary py-1 px-2 text-xs flex items-center gap-1">
                    <Printer className="w-3 h-3" /> Payslip
                  </button>
                </div>
              </div>
            ))}
            <div className="list-item" style={{ borderBottom:'none', background:'var(--surface-inset)' }}>
              <div className="flex-1"><p className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>Total Payroll</p></div>
              <span className="font-bold text-lg" style={{ color:'var(--brand-primary)' }}>R{totalPay.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* All shifts */}
      <div>
        <h2 className="heading mb-3">All Shifts</h2>
        {monthEntries.length === 0 ? (
          <div className="card p-10 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color:'var(--text-secondary)' }}>No shifts this month</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthEntries.map(entry => {
              const staff   = store.staff.find(s => s.id === entry.staff_id)
              const isEdit  = editEntry === entry.id
              const pay     = staff ? calcPay(entry, staff.hourly_rate) : 0
              return (
                <div key={entry.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>{entry.staff_name}</p>
                      <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>
                        {new Date(entry.date+'T00:00:00').toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {entry.approved && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:'rgba(52,199,89,0.1)', color:'#34c759' }}>✓</span>}
                      <button onClick={() => isEdit ? setEditEntry(null) : startEdit(entry)} style={{ color:'var(--text-tertiary)' }}>
                        {isEdit ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteEntry(entry.id)} style={{ color:'#ff3b30' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEdit ? (
                    <div className="space-y-3 pt-2 border-t" style={{ borderColor:'var(--surface-border)' }}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5"><label className="label">Clock In</label><input className="input text-sm" type="datetime-local" value={editIn} onChange={e => setEditIn(e.target.value)} /></div>
                        <div className="flex flex-col gap-1.5"><label className="label">Clock Out</label><input className="input text-sm" type="datetime-local" value={editOut} onChange={e => setEditOut(e.target.value)} /></div>
                        <div className="flex flex-col gap-1.5"><label className="label">Break (mins)</label><input className="input text-sm" type="number" value={editBreak} onChange={e => setEditBreak(e.target.value)} /></div>
                        <div className="flex flex-col gap-1.5"><label className="label">Notes</label><input className="input text-sm" value={editNotes} onChange={e => setEditNotes(e.target.value)} /></div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-primary flex-1 py-2 text-sm" onClick={saveEdit}>Save</button>
                        {!entry.approved && entry.clock_out && (
                          <button className="btn py-2 text-sm flex items-center gap-1.5"
                            style={{ background:'rgba(52,199,89,0.1)', color:'#34c759' }}
                            onClick={() => { store.approveTimeEntry(entry.id); setEditEntry(null); toast.success('Approved') }}>
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div><p className="label" style={{ fontSize:'10px' }}>In</p><p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{new Date(entry.clock_in).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' })}</p></div>
                      <div><p className="label" style={{ fontSize:'10px' }}>Out</p><p className="text-sm font-medium" style={{ color: entry.clock_out ? 'var(--text-primary)' : '#34c759' }}>{entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' }) : 'Active'}</p></div>
                      <div><p className="label" style={{ fontSize:'10px' }}>Duration / Pay</p><p className="text-sm font-bold" style={{ color:'var(--brand-primary)' }}>{formatDur(entry)}{entry.clock_out && staff ? <span className="text-xs font-normal ml-1" style={{ color:'var(--text-secondary)' }}>· R{pay.toFixed(0)}</span> : null}</p></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Payslip modal */}
      {showPayslip && payslipStaff && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background:'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" style={{ background:'var(--surface-card)' }}>
            <div className="flex items-center justify-between">
              <h2 className="heading">Payslip</h2>
              <button onClick={() => setShowPayslip(null)}><X className="w-5 h-5" style={{ color:'var(--text-secondary)' }} /></button>
            </div>

            {/* Payslip content */}
            <div className="card p-5 space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-lg" style={{ color:'var(--text-primary)' }}>{payslipStaff.first_name} {payslipStaff.last_name}</p>
                  <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>{payslipStaff.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color:'var(--brand-primary)' }}>
                    {new Date(month+'-01').toLocaleDateString('en-ZA', { month:'long', year:'numeric' })}
                  </p>
                  <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>R{payslipStaff.hourly_rate}/hr</p>
                </div>
              </div>

              <div className="h-px" style={{ background:'var(--surface-border)' }} />

              <div className="space-y-2">
                {payslipEntries.map((e,i) => {
                  const ms  = new Date(e.clock_out!).getTime() - new Date(e.clock_in).getTime()
                  const dur = Math.floor(ms/60000) - e.break_mins
                  return (
                    <div key={i} className="flex justify-between text-sm py-1" style={{ borderBottom:'1px solid var(--surface-border)' }}>
                      <span style={{ color:'var(--text-primary)' }}>
                        {new Date(e.date+'T00:00:00').toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'short' })}
                      </span>
                      <span style={{ color:'var(--text-secondary)' }}>
                        {new Date(e.clock_in).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' })} – {new Date(e.clock_out!).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' })}
                      </span>
                      <span className="font-medium" style={{ color:'var(--brand-primary)' }}>R{((dur/60)*payslipStaff.hourly_rate).toFixed(0)}</span>
                    </div>
                  )
                })}
              </div>

              <div className="h-px" style={{ background:'var(--surface-border)' }} />

              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span style={{ color:'var(--text-secondary)' }}>Total Hours</span><span style={{ color:'var(--text-primary)' }}>{payslipHrs.toFixed(2)} hrs</span></div>
                <div className="flex justify-between text-sm"><span style={{ color:'var(--text-secondary)' }}>Rate</span><span style={{ color:'var(--text-primary)' }}>R{payslipStaff.hourly_rate}/hr</span></div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span style={{ color:'var(--text-primary)' }}>Net Pay</span>
                  <span style={{ color:'var(--brand-primary)' }}>R{payslipPay.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-center" style={{ color:'var(--text-tertiary)' }}>
                Bank: {payslipStaff.bank_name || '—'} · Acc: {payslipStaff.bank_account || '—'}
              </p>
            </div>

            <button onClick={() => window.print()} className="btn btn-primary w-full py-3 font-bold flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> Print / Save Payslip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
