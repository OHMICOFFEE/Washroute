'use client'
import React, { useState } from 'react'
import { useDemoStore, type StaffMember } from '@/lib/demo/store'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<StaffMember['role'], string> = {
  driver:'Driver', washer:'Car Washer', supervisor:'Supervisor', admin_staff:'Admin', other:'Other',
}
const BANKS = ['ABSA','Capitec','FNB','Nedbank','Standard Bank','African Bank','TymeBank','Discovery Bank','Investec','Other']
const SA_PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape']
type Tab = 'personal' | 'address' | 'employment' | 'banking' | 'emergency'
const TABS: { key: Tab; label: string }[] = [
  { key: 'personal',   label: 'Personal'   },
  { key: 'address',    label: 'Address'    },
  { key: 'employment', label: 'Employment' },
  { key: 'banking',    label: 'Banking'    },
  { key: 'emergency',  label: 'Emergency'  },
]

export default function NewStaffPage() {
  const store  = useDemoStore()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('personal')
  const [form, setForm] = useState({
    first_name:'', last_name:'', id_number:'', id_type:'sa_id' as 'sa_id'|'passport'|'other',
    phone:'', email:'',
    street_address:'', suburb:'', city:'', province:'', postal_code:'', country:'South Africa',
    role:'washer' as StaffMember['role'], hourly_rate:45,
    start_date: new Date().toISOString().split('T')[0], notes:'',
    bank_name:'', bank_account:'', bank_branch:'',
    emergency_name:'', emergency_phone:'',
    active:true, kyc_complete:false,
    licence_number:'', licence_expiry:'', licence_code:'', licence_uploaded:false,
  })
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const personalDone   = !!(form.first_name && form.last_name && form.id_number && form.phone)
  const addressDone    = !!(form.street_address && form.suburb && form.city && form.province)
  const employmentDone = !!(form.role && form.hourly_rate)
  const bankingDone    = !!(form.bank_name && form.bank_account)
  const emergencyDone  = !!(form.emergency_name && form.emergency_phone)
  const licenceDone    = form.role !== 'driver' || !!(form.licence_number && form.licence_expiry && form.licence_uploaded)
  const kycComplete    = personalDone && addressDone && bankingDone && emergencyDone && licenceDone
  const canSave        = personalDone && employmentDone

  function save() {
    if (!canSave) { toast.error('Complete required fields'); return }
    store.addStaff({ ...form, kyc_complete: kycComplete })
    toast.success(`${form.first_name} ${form.last_name} added`)
    router.push('/admin/workforce')
  }

  const tabIdx = TABS.findIndex(t => t.key === tab)

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <button onClick={() => router.push('/admin/workforce')}
          className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: 'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> Workforce
        </button>
        <h1 className="display mt-0.5">Add Staff Member</h1>
        <p className="caption mt-1">Complete all sections for full KYC registration.</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>KYC Progress</p>
          {kycComplete
            ? <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#34c759' }}><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>
            : <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{[personalDone,addressDone,bankingDone,emergencyDone].filter(Boolean).length}/4 sections</span>
          }
        </div>
        <div className="flex gap-1.5">
          {[
            { l:'Personal',  d: personalDone  },
            { l:'Address',   d: addressDone   },
            { l:'Banking',   d: bankingDone   },
            { l:'Emergency', d: emergencyDone },
            { l:'Licence',   d: licenceDone   },
          ].filter(s => s.l !== 'Licence' || form.role === 'driver').map(s => (
            <div key={s.l} className="flex-1">
              <div className="h-1.5 rounded-full transition-all" style={{ background: s.d ? '#34c759' : 'var(--surface-border)' }} />
              <p className="text-[9px] mt-1 text-center" style={{ color: s.d ? '#34c759' : 'var(--text-tertiary)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface-inset)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all"
            style={tab === t.key
              ? { background: 'var(--surface-card)', color: 'var(--brand-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: 'var(--text-tertiary)' }
            }>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card-elevated p-5 space-y-4">

        {tab === 'personal' && <>
          <h2 className="heading">Personal Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="label">First Name *</label><input className="input" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Thabo" /></div>
            <div className="flex flex-col gap-1.5"><label className="label">Last Name *</label><input className="input" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Nkosi" /></div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label">ID / Document Type</label>
            <div className="grid grid-cols-3 gap-2">
              {([['sa_id','SA ID'],['passport','Passport'],['other','Other Doc']] as const).map(([k,v]) => (
                <div key={k} onClick={() => set('id_type', k)}
                  className="option-card cursor-pointer text-center py-2.5 text-sm font-medium"
                  style={form.id_type === k ? { borderColor:'var(--brand-primary)', background:'var(--brand-subtle)', color:'var(--brand-primary)' } : { color:'var(--text-primary)' }}>
                  {v}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label">{form.id_type === 'sa_id' ? 'SA ID Number *' : form.id_type === 'passport' ? 'Passport Number *' : 'Document Number *'}</label>
            <input className="input" value={form.id_number}
              onChange={e => set('id_number', form.id_type === 'sa_id' ? e.target.value.replace(/\D/g,'').slice(0,13) : e.target.value)}
              placeholder={form.id_type === 'sa_id' ? '0000000000000' : 'Enter number'}
              inputMode={form.id_type === 'sa_id' ? 'numeric' : 'text'} />
            {form.id_type === 'sa_id' && form.id_number.length > 0 && form.id_number.length < 13 && (
              <p className="text-xs" style={{ color: '#ff9500' }}>SA ID is 13 digits ({form.id_number.length}/13)</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5"><label className="label">Cell Number *</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="082 000 0000" inputMode="tel" /></div>
          <div className="flex flex-col gap-1.5"><label className="label">Email Address</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="thabo@example.com" /></div>
        </>}

        {tab === 'address' && <>
          <h2 className="heading">Residential Address</h2>
          <div className="flex flex-col gap-1.5"><label className="label">Street Address *</label><input className="input" value={form.street_address} onChange={e => set('street_address', e.target.value)} placeholder="e.g. 12 Oak Street" /></div>
          <div className="flex flex-col gap-1.5"><label className="label">Suburb *</label><input className="input" value={form.suburb} onChange={e => set('suburb', e.target.value)} placeholder="e.g. Rondebosch" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="label">City *</label><input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Cape Town" /></div>
            <div className="flex flex-col gap-1.5"><label className="label">Postal Code</label><input className="input" value={form.postal_code} onChange={e => set('postal_code', e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="7700" inputMode="numeric" /></div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label">Province *</label>
            <select className="input" value={form.province} onChange={e => set('province', e.target.value)}>
              <option value="">Select province...</option>
              {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              <option value="Other">Other (non-SA)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5"><label className="label">Country</label><input className="input" value={form.country} onChange={e => set('country', e.target.value)} placeholder="South Africa" /></div>
        </>}

        {tab === 'employment' && <>
          <h2 className="heading">Employment Details</h2>
          <div className="flex flex-col gap-1.5">
            <label className="label">Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ROLE_LABELS) as [StaffMember['role'], string][]).map(([k,v]) => (
                <div key={k} onClick={() => set('role', k)}
                  className="option-card cursor-pointer flex items-center gap-2 py-3"
                  style={form.role === k ? { borderColor:'var(--brand-primary)', background:'var(--brand-subtle)' } : {}}>
                  <div className="w-3 h-3 rounded-full border-2" style={form.role === k ? { background:'var(--brand-primary)', borderColor:'var(--brand-primary)' } : { borderColor:'var(--surface-border)' }} />
                  <span className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5"><label className="label">Hourly Rate (R) *</label><input className="input" type="number" value={form.hourly_rate} onChange={e => set('hourly_rate', parseFloat(e.target.value)||0)} /></div>
            <div className="flex flex-col gap-1.5"><label className="label">Start Date</label><input className="input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
          </div>
          <div className="flex flex-col gap-1.5"><label className="label">Notes</label><textarea className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." /></div>

          {form.role === 'driver' && (
            <div className="space-y-3 pt-3 border-t" style={{ borderColor:'var(--surface-border)' }}>
              <p className="label text-xs font-bold" style={{ color:'var(--brand-primary)' }}>🪪 Driver's Licence (Required for Drivers)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="label">Licence Number</label>
                  <input className="input" value={form.licence_number} onChange={e => set('licence_number', e.target.value)} placeholder="e.g. 12345678901" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="label">Expiry Date</label>
                  <input className="input" type="date" value={form.licence_expiry} onChange={e => set('licence_expiry', e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label">Licence Code</label>
                <select className="input" value={form.licence_code} onChange={e => set('licence_code', e.target.value)}>
                  <option value="">Select code...</option>
                  <option value="A">Code A — Motorcycle</option>
                  <option value="A1">Code A1 — Light Motorcycle</option>
                  <option value="B">Code B — Motor Vehicle (&lt;3 500kg)</option>
                  <option value="C1">Code C1 — Heavy Motor Vehicle</option>
                  <option value="C">Code C — Extra Heavy Motor Vehicle</option>
                  <option value="EB">Code EB — Motor Vehicle (automatic)</option>
                  <option value="EC1">Code EC1 — Articulated Motor Vehicle</option>
                  <option value="EC">Code EC — Extra Heavy Articulated</option>
                </select>
              </div>
              <div>
                <label className="label mb-2">Upload Licence Photo</label>
                <label className="btn btn-secondary w-full text-sm py-3 cursor-pointer flex items-center justify-center gap-2">
                  📷 Upload Driver's Licence
                  <input type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) { set('licence_uploaded', true); toast.success('Licence uploaded') } }} />
                </label>
                {form.licence_uploaded && (
                  <p className="text-xs mt-1 text-center" style={{ color:'#34c759' }}>✓ Licence document uploaded</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 cursor-pointer py-1" onClick={() => set('active', !form.active)}>
            <div className="check-box" style={form.active ? { background:'var(--brand-primary)', borderColor:'var(--brand-primary)' } : {}}>
              {form.active && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>Active (currently employed)</p>
          </div>
        </>}

        {tab === 'banking' && <>
          <h2 className="heading">Banking Details</h2>
          <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background:'rgba(0,122,255,0.06)', border:'1px solid rgba(0,122,255,0.15)' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color:'#007aff' }} />
            <p style={{ color:'#007aff' }}>Stored securely. Used for salary payments only.</p>
          </div>
          <div className="flex flex-col gap-1.5"><label className="label">Bank Name *</label><select className="input" value={form.bank_name} onChange={e => set('bank_name', e.target.value)}><option value="">Select bank...</option>{BANKS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
          <div className="flex flex-col gap-1.5"><label className="label">Account Number *</label><input className="input" value={form.bank_account} onChange={e => set('bank_account', e.target.value.replace(/\D/g,''))} placeholder="000000000" inputMode="numeric" /></div>
          <div className="flex flex-col gap-1.5"><label className="label">Branch Code</label><input className="input" value={form.bank_branch} onChange={e => set('bank_branch', e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="e.g. 250655" inputMode="numeric" /></div>
        </>}

        {tab === 'emergency' && <>
          <h2 className="heading">Emergency Contact</h2>
          <div className="flex flex-col gap-1.5"><label className="label">Contact Name *</label><input className="input" value={form.emergency_name} onChange={e => set('emergency_name', e.target.value)} placeholder="Full name" /></div>
          <div className="flex flex-col gap-1.5"><label className="label">Contact Number *</label><input className="input" value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)} placeholder="082 000 0000" inputMode="tel" /></div>
        </>}
      </div>

      <div className="flex gap-3">
        {tabIdx > 0 && <button className="btn btn-secondary" onClick={() => setTab(TABS[tabIdx-1].key)}>← Back</button>}
        {tabIdx < TABS.length-1
          ? <button className="btn btn-primary flex-1" onClick={() => setTab(TABS[tabIdx+1].key)}>Continue →</button>
          : <button className="btn btn-primary flex-1 py-3 font-bold" onClick={save} disabled={!canSave}>
              {kycComplete ? '✅ Save with Full KYC' : '💾 Save Staff Member'}
            </button>
        }
      </div>
    </div>
  )
}
