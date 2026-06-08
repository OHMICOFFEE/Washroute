'use client'
import React, { useState } from 'react'
import { useDemoStore, type StaffMember } from '@/lib/demo/store'
import Link from 'next/link'
import { Users, Clock, Plus, ChevronRight, DollarSign, Calendar, AlertTriangle, CheckCircle2, Search } from 'lucide-react'

const ROLE_LABELS: Record<StaffMember['role'], string> = {
  driver:      'Driver',
  washer:      'Car Washer',
  supervisor:  'Supervisor',
  admin_staff: 'Admin',
  other:       'Other',
}

const ROLE_COLORS: Record<StaffMember['role'], string> = {
  driver:      '#007aff',
  washer:      '#34c759',
  supervisor:  '#ff9500',
  admin_staff: '#af52de',
  other:       '#8e8e93',
}

function thisMonth() { return new Date().toISOString().slice(0, 7) }

function calcMonthHours(entries: { clock_in: string; clock_out: string | null; break_mins: number }[]) {
  return entries.filter(e => e.clock_out).reduce((sum, e) => {
    const ms = new Date(e.clock_out!).getTime() - new Date(e.clock_in).getTime()
    return sum + (Math.floor(ms / 60000) - e.break_mins) / 60
  }, 0)
}

export default function WorkforcePage() {
  const store   = useDemoStore()
  const [search, setSearch]   = useState('')
  const [roleFilter, setRole] = useState<StaffMember['role'] | 'all'>('all')

  const filtered = store.staff.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || s.phone.includes(search)
    const matchRole   = roleFilter === 'all' || s.role === roleFilter
    return matchSearch && matchRole
  })

  const active   = store.staff.filter(s => s.active)
  const inactive = store.staff.filter(s => !s.active)
  const kycMissing = store.staff.filter(s => !s.kyc_complete)

  const clockedInIds = new Set(
    store.timeEntries.filter(e => !e.clock_out).map(e => e.staff_id)
  )

  const monthPayroll = store.staff.reduce((sum, s) => {
    const hrs = calcMonthHours(store.getStaffEntries(s.id, thisMonth()))
    return sum + hrs * s.hourly_rate
  }, 0)

  return (
    <div className="space-y-6 anim-fadeup">

      {/* Header */}
      <div className="pt-2 flex items-start justify-between gap-3">
        <div>
          <p className="caption">Admin</p>
          <h1 className="display mt-0.5">Workforce</h1>
        </div>
        <Link href="/admin/workforce/staff/new">
          <button className="btn btn-primary py-2.5 px-4 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <Users className="w-5 h-5 mb-2" style={{ color: 'var(--brand-primary)' }} />
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{active.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Active Staff</p>
          {inactive.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{inactive.length} inactive</p>
          )}
        </div>
        <div className="card p-4">
          <Clock className="w-5 h-5 mb-2" style={{ color: '#34c759' }} />
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{clockedInIds.size}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>On Shift Now</p>
        </div>
        <div className="card p-4">
          <DollarSign className="w-5 h-5 mb-2" style={{ color: '#ff9500' }} />
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>R{monthPayroll.toFixed(0)}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Est. Payroll This Month</p>
        </div>
        <div className="card p-4">
          <Calendar className="w-5 h-5 mb-2" style={{ color: '#007aff' }} />
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {store.timeEntries.filter(e => !e.approved && e.clock_out).length}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Shifts Pending Approval</p>
        </div>
      </div>

      {/* KYC warning */}
      {kycMissing.length > 0 && (
        <div className="card flex items-center gap-3 p-4"
          style={{ border: '1.5px solid rgba(255,59,48,0.3)', background: 'rgba(255,59,48,0.04)' }}>
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#ff3b30' }} />
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#ff3b30' }}>
              {kycMissing.length} staff member{kycMissing.length > 1 ? 's' : ''} with incomplete KYC
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {kycMissing.map(s => `${s.first_name} ${s.last_name}`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="list-group">
        <Link href="/admin/workforce/timesheets">
          <div className="list-item cursor-pointer">
            <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--brand-primary)' }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Timesheets & Pay</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Review and approve staff hours</p>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </Link>
      </div>

      {/* Search + filter */}
      {store.staff.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
            <input className="input" style={{ paddingLeft: '38px' }} placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'driver', 'washer', 'supervisor', 'admin_staff', 'other'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border-2 transition-all flex-shrink-0"
                style={roleFilter === r
                  ? { background: 'var(--brand-primary)', color: '#fff', border: '2px solid var(--brand-primary)' }
                  : { background: 'var(--surface-inset)', color: 'var(--text-secondary)', border: '2px solid var(--surface-border)' }
                }>
                {r === 'all' ? 'All' : ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Staff list */}
      {store.staff.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="heading text-[15px]">No staff added yet</p>
          <p className="caption text-sm mt-1">Add your first staff member to get started.</p>
          <Link href="/admin/workforce/staff/new">
            <button className="btn btn-primary mt-4">+ Add First Staff Member</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const isClockedIn  = clockedInIds.has(s.id)
            const monthHours   = calcMonthHours(store.getStaffEntries(s.id, thisMonth()))
            const activeEntry  = store.timeEntries.find(e => e.staff_id === s.id && !e.clock_out)
            const shiftMins    = activeEntry ? Math.floor((Date.now() - new Date(activeEntry.clock_in).getTime()) / 60000) : 0

            return (
              <Link key={s.id} href={`/admin/workforce/staff/${s.id}`}>
                <div className="card p-4 cursor-pointer active:opacity-80 transition-opacity">
                  <div className="flex items-start gap-3">

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base"
                        style={{ background: s.active ? ROLE_COLORS[s.role] : '#8e8e93' }}>
                        {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                      </div>
                      {isClockedIn && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {s.first_name} {s.last_name}
                        </p>
                        {!s.active && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: 'rgba(142,142,147,0.15)', color: '#8e8e93' }}>Inactive</span>
                        )}
                        {!s.kyc_complete && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}>KYC pending</span>
                        )}
                        {s.kyc_complete && (
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#34c759' }} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${ROLE_COLORS[s.role]}12`, color: ROLE_COLORS[s.role] }}>
                          {ROLE_LABELS[s.role]}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>R{s.hourly_rate}/hr</span>
                        {s.phone && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.phone}</span>}
                      </div>
                      {isClockedIn && (
                        <p className="text-xs mt-1 font-medium" style={{ color: '#34c759' }}>
                          🟢 On shift · {Math.floor(shiftMins/60)}h {shiftMins%60}m
                        </p>
                      )}
                    </div>

                    {/* Right side */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm" style={{ color: 'var(--brand-primary)' }}>
                        R{(monthHours * s.hourly_rate).toFixed(0)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{monthHours.toFixed(1)}h</p>
                      <ChevronRight className="w-4 h-4 mt-1 ml-auto" style={{ color: 'var(--text-tertiary)' }} />
                    </div>

                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
