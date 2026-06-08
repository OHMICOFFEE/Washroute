'use client'
import React, { useState } from 'react'
import { useDemoStore, type StaffMember } from '@/lib/demo/store'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, DollarSign, Calendar, Edit2, Check, Trash2, AlertTriangle, CheckCircle2, ToggleLeft, ToggleRight, Phone, Building2, X, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<StaffMember['role'], string> = {
  driver:'Driver', washer:'Car Washer', supervisor:'Supervisor', admin_staff:'Admin', other:'Other',
}
const ROLE_COLORS: Record<StaffMember['role'], string> = {
  driver:'#007aff', washer:'#34c759', supervisor:'#ff9500', admin_staff:'#af52de', other:'#8e8e93',
}
const BANKS = ['ABSA','Capitec','FNB','Nedbank','Standard Bank','African Bank','TymeBank','Discovery Bank','Investec','Other']
const SA_PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape']

function hoursFromEntries(entries: { clock_in: string; clock_out: string | null; break_mins: number }[]) {
  return entries.filter(e => e.clock_out).reduce((sum, e) => {
    const ms = new Date(e.clock_out!).getTime() - new Date(e.clock_in).getTime()
    return sum + (Math.floor(ms/60000) - e.break_mins) / 60
  }, 0)
}

type Section = 'overview' | 'kyc' | 'shifts'

export default function StaffDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const store   = useDemoStore()
  const staff   = store.staff.find(s => s.id === id)

  const [section,    setSection]    = useState<Section>('overview')
  const [editing,    setEditing]    = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [form,       setForm]       = useState<Partial<StaffMember>>({})

  // Simplified time entry — just start and end
  const today = new Date().toISOString().split('T')[0]
  const [shiftDate, setShiftDate]   = useState(today)
  const [startTime, setStartTime]   = useState('08:00')
  const [endTime,   setEndTime]     = useState('17:00')

  if (!staff) {
    return (
      <div className="pt-2 text-center py-20">
        <p className="heading">Staff member not found</p>
        <button className="btn btn-secondary mt-4" onClick={() => router.push('/admin/workforce')}>← Back</button>
      </div>
    )
  }

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const allEntries   = store.getStaffEntries(staff.id)
  const thisMonth    = new Date().toISOString().slice(0, 7)
  const monthEntries = store.getStaffEntries(staff.id, thisMonth)
  const monthHours   = hoursFromEntries(monthEntries)
  const monthPay     = monthHours * staff.hourly_rate
  const totalHours   = hoursFromEntries(allEntries)

  function startEdit() {
    setForm({ ...staff })
    setEditing(true)
  }

  function saveEdit() {
    store.updateStaff(staff.id, {
      ...form,
      kyc_complete: !!(form.id_number && form.bank_account && form.emergency_name && form.street_address),
    })
    setEditing(false)
    toast.success('Updated')
  }

  function handleDelete() {
    store.deleteStaff(staff.id)
    toast.success(`${staff.first_name} ${staff.last_name} removed`)
    router.push('/admin/workforce')
  }

  function addShift() {
    if (!startTime || !endTime) { toast.error('Start and end time required'); return }
    const clockInISO  = new Date(`${shiftDate}T${startTime}:00`).toISOString()
    const clockOutISO = new Date(`${shiftDate}T${endTime}:00`).toISOString()
    if (new Date(clockOutISO) <= new Date(clockInISO)) { toast.error('End time must be after start time'); return }
    const entryId = store.clockIn(staff.id)
    store.clockOut(entryId, 0)
    store.updateTimeEntry(entryId, {
      clock_in:  clockInISO,
      clock_out: clockOutISO,
      date:      shiftDate,
    })
    toast.success('Shift added')
  }

  // Group entries by month
  const byMonth: Record<string, typeof allEntries> = {}
  allEntries.forEach(e => { const m = e.date.slice(0,7); if (!byMonth[m]) byMonth[m] = []; byMonth[m].push(e) })

  return (
    <div className="space-y-5 anim-fadeup pb-8">

      {/* Header */}
      <div className="pt-2">
        <button onClick={() => router.push('/admin/workforce')}
          className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: 'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> Workforce
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
              style={{ background: staff.active ? ROLE_COLORS[staff.role] : '#8e8e93' }}>
              {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="title">{staff.first_name} {staff.last_name}</h1>
                {staff.kyc_complete
                  ? <CheckCircle2 className="w-4 h-4" style={{ color: '#34c759' }} />
                  : <AlertTriangle className="w-4 h-4" style={{ color: '#ff9500' }} />
                }
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${ROLE_COLORS[staff.role]}15`, color: ROLE_COLORS[staff.role] }}>
                  {ROLE_LABELS[staff.role]}
                </span>
                {!staff.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'rgba(142,142,147,0.15)', color:'#8e8e93' }}>Inactive</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={startEdit} className="p-2" style={{ color: 'var(--text-secondary)' }}><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => setShowDelete(true)} className="p-2" style={{ color: '#ff3b30' }}><Trash2 className="w-4 h-4" /></button>
            <button onClick={() => store.updateStaff(staff.id, { active: !staff.active })}
              style={{ color: staff.active ? '#34c759' : 'var(--text-tertiary)' }}>
              {staff.active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface-inset)' }}>
        {(['overview','kyc','shifts'] as Section[]).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
            style={section === s
              ? { background:'var(--surface-card)', color:'var(--brand-primary)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }
              : { color:'var(--text-tertiary)' }
            }>
            {s}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {section === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center"><p className="text-lg font-bold" style={{ color:'var(--brand-primary)' }}>R{monthPay.toFixed(0)}</p><p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>This Month</p></div>
            <div className="card p-3 text-center"><p className="text-lg font-bold" style={{ color:'var(--text-primary)' }}>{monthHours.toFixed(1)}h</p><p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>Hours</p></div>
            <div className="card p-3 text-center"><p className="text-lg font-bold" style={{ color:'var(--text-primary)' }}>{totalHours.toFixed(0)}h</p><p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>All Time</p></div>
          </div>

          <div className="list-group">
            {staff.phone && <div className="list-item"><Phone className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} /><div className="flex-1"><p className="text-xs" style={{ color:'var(--text-tertiary)' }}>Cell</p><p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{staff.phone}</p></div></div>}
            {staff.email && <div className="list-item"><Phone className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} /><div className="flex-1"><p className="text-xs" style={{ color:'var(--text-tertiary)' }}>Email</p><p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{staff.email}</p></div></div>}
            <div className="list-item" style={{ borderBottom:'none' }}><DollarSign className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} /><div className="flex-1"><p className="text-xs" style={{ color:'var(--text-tertiary)' }}>Hourly Rate</p><p className="text-sm font-bold" style={{ color:'var(--brand-primary)' }}>R{staff.hourly_rate}/hr</p></div></div>
          </div>

          {/* Add shift — simple start/end time */}
          <div className="card-elevated p-5 space-y-4" style={{ border:'2px solid var(--brand-primary)' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color:'var(--brand-primary)' }} />
              <h3 className="heading">Add Shift</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Date</label>
              <input className="input" type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} max={today} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="label">Start Time</label>
                <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label">End Time</label>
                <input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
            {startTime && endTime && endTime > startTime && (
              <div className="p-3 rounded-xl text-center" style={{ background:'var(--surface-inset)' }}>
                <p className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>
                  {(() => {
                    const mins = (parseInt(endTime.split(':')[0])*60 + parseInt(endTime.split(':')[1])) -
                                 (parseInt(startTime.split(':')[0])*60 + parseInt(startTime.split(':')[1]))
                    const h = Math.floor(mins/60), m = mins%60
                    return `${h}h ${m}m · R${((mins/60)*staff.hourly_rate).toFixed(0)}`
                  })()}
                </p>
              </div>
            )}
            <button className="btn btn-primary w-full py-3 font-bold" onClick={addShift}>
              + Add Shift
            </button>
          </div>
        </div>
      )}

      {/* KYC */}
      {section === 'kyc' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl"
            style={{ background: staff.kyc_complete ? 'rgba(52,199,89,0.08)' : 'rgba(255,149,0,0.08)', border:`1px solid ${staff.kyc_complete ? 'rgba(52,199,89,0.3)' : 'rgba(255,149,0,0.3)'}` }}>
            {staff.kyc_complete ? <CheckCircle2 className="w-4 h-4" style={{ color:'#34c759' }} /> : <AlertTriangle className="w-4 h-4" style={{ color:'#ff9500' }} />}
            <p className="text-sm font-medium" style={{ color: staff.kyc_complete ? '#34c759' : '#ff9500' }}>
              {staff.kyc_complete ? 'KYC Complete' : 'KYC Incomplete'}
            </p>
          </div>

          {[
            { title:'Personal', rows:[
              { l:'Full Name', v:`${staff.first_name} ${staff.last_name}` },
              { l:'ID Type',   v: staff.id_type === 'passport' ? 'Passport' : staff.id_type === 'other' ? 'Other Doc' : 'SA ID' },
              { l:'ID Number', v: staff.id_number || '—' },
              { l:'Cell',      v: staff.phone || '—' },
              { l:'Email',     v: staff.email || '—' },
            ]},
            { title:'Address', rows:[
              { l:'Street',   v: staff.street_address || '—' },
              { l:'Suburb',   v: staff.suburb || '—' },
              { l:'City',     v: staff.city || '—' },
              { l:'Province', v: staff.province || '—' },
              { l:'Postal',   v: staff.postal_code || '—' },
              { l:'Country',  v: staff.country || '—' },
            ]},
            { title:'Banking', rows:[
              { l:'Bank',    v: staff.bank_name || '—' },
              { l:'Account', v: staff.bank_account || '—' },
              { l:'Branch',  v: staff.bank_branch || '—' },
            ]},
            { title:'Emergency Contact', rows:[
              { l:'Name',   v: staff.emergency_name || '—' },
              { l:'Number', v: staff.emergency_phone || '—' },
            ]},
            ...(staff.role === 'driver' ? [{ title:"Driver's Licence", rows:[
              { l:'Number',   v: staff.licence_number || '—' },
              { l:'Code',     v: staff.licence_code   || '—' },
              { l:'Expiry',   v: staff.licence_expiry || '—' },
              { l:'Uploaded', v: staff.licence_uploaded ? '✓ On file' : '⚠️ Not uploaded' },
            ]}] : []),
          ].map(group => (
            <div key={group.title}>
              <h2 className="heading mb-3">{group.title}</h2>
              <div className="list-group">
                {group.rows.map((r,i,arr) => (
                  <div key={r.l} className="list-item" style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                    <p className="text-xs w-20 shrink-0" style={{ color:'var(--text-tertiary)' }}>{r.l}</p>
                    <p className="text-sm font-medium" style={{ color: r.v === '—' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{r.v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={startEdit} className="btn btn-primary w-full flex items-center gap-2">
            <Edit2 className="w-4 h-4" /> Edit KYC Details
          </button>
        </div>
      )}

      {/* SHIFTS */}
      {section === 'shifts' && (
        <div className="space-y-4">
          {Object.entries(byMonth).sort(([a],[b]) => b.localeCompare(a)).map(([month, entries]) => {
            const hrs = hoursFromEntries(entries)
            const pay = hrs * staff.hourly_rate
            return (
              <div key={month}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="heading">{new Date(month+'-01').toLocaleDateString('en-ZA', { month:'long', year:'numeric' })}</h2>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color:'var(--brand-primary)' }}>R{pay.toFixed(0)}</p>
                    <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>{hrs.toFixed(1)}h</p>
                  </div>
                </div>
                <div className="list-group">
                  {entries.sort((a,b) => b.clock_in.localeCompare(a.clock_in)).map((e,i,arr) => {
                    const ms  = e.clock_out ? new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime() : 0
                    const dur = Math.floor(ms/60000)
                    const h   = Math.floor(dur/60), m = dur%60
                    return (
                      <div key={e.id} className="list-item" style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                        <Calendar className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>
                            {new Date(e.date+'T00:00:00').toLocaleDateString('en-ZA', { weekday:'short', day:'numeric', month:'short' })}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>
                            {new Date(e.clock_in).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' })}
                            {e.clock_out ? ` → ${new Date(e.clock_out).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' })}` : ' → Active'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {e.clock_out ? (
                            <>
                              <p className="text-sm font-bold" style={{ color:'var(--brand-primary)' }}>R{((dur/60)*staff.hourly_rate).toFixed(0)}</p>
                              <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>{h}h {m}m</p>
                            </>
                          ) : <span className="text-xs font-semibold" style={{ color:'#34c759' }}>Active</span>}
                        </div>
                        {e.approved && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {allEntries.length === 0 && (
            <div className="card p-10 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2" style={{ color:'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color:'var(--text-secondary)' }}>No shifts recorded yet</p>
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background:'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" style={{ background:'var(--surface-card)' }}>
            <div className="flex items-center justify-between">
              <h2 className="heading">Edit Staff Member</h2>
              <button onClick={() => setEditing(false)}><X className="w-5 h-5" style={{ color:'var(--text-secondary)' }} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="label">First Name</label><input className="input" value={form.first_name??''} onChange={e => set('first_name', e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><label className="label">Last Name</label><input className="input" value={form.last_name??''} onChange={e => set('last_name', e.target.value)} /></div>
            </div>
            <div className="flex flex-col gap-1.5"><label className="label">ID Type</label>
              <select className="input" value={form.id_type??'sa_id'} onChange={e => set('id_type', e.target.value)}>
                <option value="sa_id">SA ID</option><option value="passport">Passport</option><option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5"><label className="label">ID Number</label><input className="input" value={form.id_number??''} onChange={e => set('id_number', e.target.value)} /></div>
            <div className="flex flex-col gap-1.5"><label className="label">Cell</label><input className="input" value={form.phone??''} onChange={e => set('phone', e.target.value)} /></div>
            <div className="flex flex-col gap-1.5"><label className="label">Email</label><input className="input" value={form.email??''} onChange={e => set('email', e.target.value)} /></div>
            <div className="flex flex-col gap-1.5"><label className="label">Street Address</label><input className="input" value={form.street_address??''} onChange={e => set('street_address', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="label">Suburb</label><input className="input" value={form.suburb??''} onChange={e => set('suburb', e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><label className="label">City</label><input className="input" value={form.city??''} onChange={e => set('city', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="label">Province</label>
                <select className="input" value={form.province??''} onChange={e => set('province', e.target.value)}>
                  <option value="">Select...</option>{SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}<option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5"><label className="label">Postal Code</label><input className="input" value={form.postal_code??''} onChange={e => set('postal_code', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="label">Hourly Rate (R)</label><input className="input" type="number" value={form.hourly_rate??''} onChange={e => set('hourly_rate', parseFloat(e.target.value)||0)} /></div>
              <div className="flex flex-col gap-1.5"><label className="label">Role</label><select className="input" value={form.role??''} onChange={e => set('role', e.target.value)}>{Object.entries(ROLE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            </div>
            <div className="flex flex-col gap-1.5"><label className="label">Bank</label><select className="input" value={form.bank_name??''} onChange={e => set('bank_name', e.target.value)}><option value="">Select...</option>{BANKS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="label">Account Number</label><input className="input" value={form.bank_account??''} onChange={e => set('bank_account', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="label">Emergency Name</label><input className="input" value={form.emergency_name??''} onChange={e => set('emergency_name', e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><label className="label">Emergency Number</label><input className="input" value={form.emergency_phone??''} onChange={e => set('emergency_phone', e.target.value)} /></div>
            </div>
            {staff.role === 'driver' && (
              <div className="space-y-3 pt-3 border-t" style={{ borderColor:'var(--surface-border)' }}>
                <p className="label" style={{ color:'var(--brand-primary)' }}>🪪 Driver's Licence</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5"><label className="label">Licence No.</label><input className="input" value={form.licence_number??''} onChange={e => set('licence_number', e.target.value)} /></div>
                  <div className="flex flex-col gap-1.5"><label className="label">Expiry</label><input className="input" type="date" value={form.licence_expiry??''} onChange={e => set('licence_expiry', e.target.value)} /></div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="label">Licence Code</label>
                  <select className="input" value={form.licence_code??''} onChange={e => set('licence_code', e.target.value)}>
                    <option value="">Select...</option>
                    {['A','A1','B','C1','C','EB','EC1','EC'].map(c => <option key={c} value={c}>Code {c}</option>)}
                  </select>
                </div>
                <label className="btn btn-secondary w-full text-sm py-2.5 cursor-pointer flex items-center justify-center gap-2">
                  📷 {form.licence_uploaded ? 'Replace Licence Doc' : 'Upload Licence'}
                  <input type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) set('licence_uploaded', true) }} />
                </label>
                {form.licence_uploaded && <p className="text-xs text-center" style={{ color:'#34c759' }}>✓ Licence on file</p>}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button className="btn btn-secondary flex-1" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary flex-1 py-3 font-bold" onClick={saveEdit}><Check className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4" style={{ background:'var(--surface-card)' }}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background:'rgba(255,59,48,0.1)' }}>
                <Trash2 className="w-7 h-7" style={{ color:'#ff3b30' }} />
              </div>
              <h3 className="heading">Remove Staff Member?</h3>
              <p className="caption text-sm mt-2">This permanently deletes {staff.first_name} {staff.last_name} and all their records.</p>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="btn flex-1 font-bold" style={{ background:'#ff3b30', color:'#fff' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
