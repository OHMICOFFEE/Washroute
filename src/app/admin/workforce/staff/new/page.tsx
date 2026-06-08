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
            <div className="flex flex-col
