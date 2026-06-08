'use client'
import React from 'react'
import { useDemoStore, type TimeEntry } from '@/lib/demo/store'
import { useState } from 'react'
import { Check, Clock, Edit2, X } from 'lucide-react'
import toast from 'react-hot-toast'

function formatDuration(entry: TimeEntry): string {
  if (!entry.clock_out) return 'Active'
  const ms   = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
  const mins = Math.floor(ms / 60000) - entry.break_mins
  const h    = Math.floor(mins / 60)
  const m    = mins % 60
  return `${h}h ${m}m`
}

function earnings(entry: TimeEntry, rate: number): string {
  if (!entry.clock_out) return '—'
  const ms   = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
  const hrs  = (Math.floor(ms / 60000) - entry.break_mins) / 60
  return `R${(hrs * rate).toFixed(0)}`
}

function getMonths(entries: TimeEntry[]): string[] {
  const months = new Set(entries.map(e => e.date.slice(0, 7)))
  return Array.from(months).sort().reverse()
}

export default function TimesheetsPage() {
  const store  = useDemoStore()
  const months = getMonths(store.timeEntries)
  const [month,       setMonth]       = useState(months[0] ?? new Date().toISOString().slice(0, 7))
  const [editEntry,   setEditEntry]   = useState<string | null>(null)
  const [editIn,      setEditIn]      = useState('')
  const [editOut,     setEditOut]     = useState('')
  const [editBreak,   setEditBreak]   = useState('')
  const [editNotes,   setEditNotes]   = useState('')

  const monthEntries = store.timeEntries
    .filter(e => e.date.startsWith(month))
    .sort((a, b) => b.clock_in.localeCompare(a.clock_in))

  function startEdit(e: TimeEntry) {
    setEditEntry(e.id)
    setEditIn(e.clock_in.slice(0, 16))
    setEditOut(e.clock_out?.slice(0, 16) ?? '')
    setEditBreak(String(e.break_mins))
    setEditNotes(e.notes)
  }

  function saveEdit() {
    if (!editEntry) return
    store.updateTimeEntry(editEntry, {
      clock_in:   new Date(editIn).toISOString(),
      clock_out:  editOut ? new Date(editOut).toISOString() : null,
      break_mins: parseInt(editBreak) || 0,
      notes:      editNotes,
    })
    setEditEntry(null)
    toast.success('Time entry updated')
  }

  function approveAll() {
    monthEntries
      .filter(e => e.clock_out && !e.approved)
      .forEach(e => store.approveTimeEntry(e.id))
    toast.success('All completed entries approved')
  }

  // Summary per staff
  const staffSummary = store.staff.map(s => {
    const entries = monthEntries.filter(e => e.staff_id === s.id && e.clock_out)
    const hrs     = entries.reduce((sum, e) => {
      const ms = new Date(e.clock_out!).getTime() - new Date(e.clock_in).getTime()
      return sum + (Math.floor(ms / 60000) - e.break_mins) / 60
    }, 0)
    return { ...s, hrs, pay: hrs * s.hourly_rate, entries: entries.length }
  }).filter(s => s.entries > 0)

  const totalPay = staffSummary.reduce((s, m) => s + m.pay, 0)
  const pending  = monthEntries.filter(e => e.clock_out && !e.approved).length

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <p className="caption">Workforce</p>
        <h1 className="display mt-0.5">Timesheets</h1>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(months.length > 0 ? months : [new Date().toISOString().slice(0, 7)]).map(m => (
          <button key={m} onClick={() => setMonth(m)}
            className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border-2 transition-all flex-shrink-0"
            style={month === m
              ? { background: 'var(--brand-primary)', color: '#fff', border: '2px solid var(--brand-primary)' }
              : { background: 'var(--surface-inset)', color: 'var(--text-secondary)', border: '2px solid var(--surface-border)' }
            }>
            {new Date(m + '-01').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
          </button>
        ))}
      </div>

      {/* Staff pay summary */}
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
            {staffSummary.map((s, i, arr) => (
              <div key={s.id} className="list-item"
                style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: 'var(--brand-primary)' }}>
                  {s.first_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{s.first_name} {s.last_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {s.hrs.toFixed(1)} hrs · {s.entries} shift{s.entries !== 1 ? 's' : ''} · R{s.hourly_rate}/hr
                  </p>
                </div>
                <span className="font-bold" style={{ color: 'var(--brand-primary)' }}>R{s.pay.toFixed(0)}</span>
              </div>
            ))}
            <div className="list-item" style={{ borderBottom: 'none', background: 'var(--surface-inset)' }}>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Total Payroll</p>
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--brand-primary)' }}>R{totalPay.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Time entries */}
      <div>
        <h2 className="heading mb-3">All Shifts</h2>
        {monthEntries.length === 0 ? (
          <div className="card p-10 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No shifts recorded this month</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthEntries.map(entry => {
              const staff = store.staff.find(s => s.id === entry.staff_id)
              const isEditing = editEntry === entry.id
              return (
                <div key={entry.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{entry.staff_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.approved && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(52,199,89,0.1)', color: '#34c759' }}>✓ Approved</span>
                      )}
                      {!entry.clock_out && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse"
                          style={{ background: 'rgba(52,199,89,0.15)', color: '#34c759' }}>● Active</span>
                      )}
                      <button onClick={() => isEditing ? setEditEntry(null) : startEdit(entry)}
                        style={{ color: 'var(--text-tertiary)' }}>
                        {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--surface-border)' }}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="label">Clock In</label>
                          <input className="input text-sm" type="datetime-local" value={editIn} onChange={e => setEditIn(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="label">Clock Out</label>
                          <input className="input text-sm" type="datetime-local" value={editOut} onChange={e => setEditOut(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="label">Break (mins)</label>
                          <input className="input text-sm" type="number" value={editBreak} onChange={e => setEditBreak(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="label">Notes</label>
                          <input className="input text-sm" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-primary flex-1 py-2 text-sm" onClick={saveEdit}>Save</button>
                        {!entry.approved && entry.clock_out && (
                          <button className="btn py-2 text-sm flex items-center gap-1.5"
                            style={{ background: 'rgba(52,199,89,0.1)', color: '#34c759' }}
                            onClick={() => { store.approveTimeEntry(entry.id); setEditEntry(null); toast.success('Approved') }}>
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="label" style={{ fontSize: '10px' }}>Clock In</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {new Date(entry.clock_in).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="label" style={{ fontSize: '10px' }}>Clock Out</p>
                        <p className="text-sm font-medium" style={{ color: entry.clock_out ? 'var(--text-primary)' : '#34c759' }}>
                          {entry.clock_out
                            ? new Date(entry.clock_out).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                            : 'Active'}
                        </p>
                      </div>
                      <div>
                        <p className="label" style={{ fontSize: '10px' }}>Duration / Pay</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>
                          {formatDuration(entry)}
                          {entry.clock_out && staff && (
                            <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>
                              · {earnings(entry, staff.hourly_rate)}
                            </span>
                          )}
                        </p>
                      </div>
                      {entry.notes && (
                        <div className="col-span-3">
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>📝 {entry.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
