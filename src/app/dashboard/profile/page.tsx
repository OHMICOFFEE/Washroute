'use client'
import React, { useState } from 'react'
import { useDemoStore, type SavedVehicle } from '@/lib/demo/store'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Edit2, Check, Gift, ChevronRight, Phone, Mail, MapPin, CreditCard, FileText, Car, Plus, Trash2, Star } from 'lucide-react'
import { formatZAR } from '@/lib/utils/pricing'
import { CAR_MAKES, CAR_MAKES_MODELS, MOTORBIKE_MAKES, MOTORBIKE_MAKES_MODELS, VEHICLE_COLOURS } from '@/lib/utils/vehicles'
import toast from 'react-hot-toast'

const SA_PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','North West','Northern Cape','Western Cape',
]

const EMPTY_PERSONAL = {
  first_name:'', last_name:'', id_number:'', id_type:'sa_id' as 'sa_id'|'passport'|'other',
  cell:'', alt_cell:'', email:'', notes:'',
}
const EMPTY_ADDRESS = {
  street_address:'', suburb:'', city:'', province:'', postal_code:'', country:'South Africa',
}

type Step = 'view' | 'personal' | 'address' | 'vehicles'

export default function ProfilePage() {
  const store   = useDemoStore()
  const router  = useRouter()
  const profile = store.customerProfile
  const [step, setStep] = useState<Step>(profile ? 'view' : 'personal')

  const [personal, setPersonal] = useState({
    ...EMPTY_PERSONAL,
    ...(profile ? { first_name:profile.first_name, last_name:profile.last_name, id_number:profile.id_number, id_type:profile.id_type ?? 'sa_id', cell:profile.cell, alt_cell:profile.alt_cell ?? '', email:profile.email, notes:profile.notes ?? '' } : {}),
  })
  const [address, setAddress] = useState({
    ...EMPTY_ADDRESS,
    ...(profile ? { street_address:profile.street_address ?? '', suburb:profile.suburb ?? '', city:profile.city ?? '', province:profile.province ?? '', postal_code:profile.postal_code ?? '', country:profile.country ?? 'South Africa' } : {}),
  })

  // Vehicle form
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [vForm, setVForm] = useState({ make:'', model:'', year:'', colour:'', registration:'', vehicle_type:'car', is_primary:false })
  const isMotorbike = vForm.vehicle_type === 'motorbike'
  const makes  = isMotorbike ? MOTORBIKE_MAKES : CAR_MAKES
  const models = vForm.make ? (isMotorbike ? MOTORBIKE_MAKES_MODELS[vForm.make] : CAR_MAKES_MODELS[vForm.make]) ?? [] : []

  const activeCredits = store.getActiveCredits()
  const totalCredit   = activeCredits.reduce((s, c) => s + c.amount, 0)
  const punchCard     = store.punchCard
  const stamps        = punchCard?.stamps ?? 0
  const freeWashReady = punchCard?.free_wash_available ?? false

  function savePersonal() {
    if (!personal.first_name || !personal.last_name || !personal.cell) {
      toast.error('First name, last name and cell required'); return
    }
    setStep('address')
  }

  function saveAddress() {
    const data = { ...personal, ...address, credit_balance: profile?.credit_balance ?? 0 }
    if (profile) {
      store.updateCustomerProfile(data)
      toast.success('Profile updated')
    } else {
      store.setCustomerProfile(data)
      toast.success('Profile saved')
    }
    setStep('view')
  }

  function addVehicle() {
    if (!vForm.make || !vForm.model || !vForm.registration) { toast.error('Make, model and registration required'); return }
    store.addSavedVehicle({ ...vForm })
    toast.success('Vehicle saved')
    setVForm({ make:'', model:'', year:'', colour:'', registration:'', vehicle_type:'car', is_primary:false })
    setShowAddVehicle(false)
  }

  const sp = (k: string, v: string) => setPersonal(f => ({ ...f, [k]: v }))
  const sa = (k: string, v: string) => setAddress(f => ({ ...f, [k]: v }))
  const sv = (k: string, v: unknown) => setVForm(f => ({ ...f, [k]: v, ...(k === 'vehicle_type' ? { make:'', model:'' } : {}) }))

  // ── PERSONAL STEP ──
  if (step === 'personal') return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <button onClick={() => profile ? setStep('view') : router.push('/dashboard')}
          className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color:'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> {profile ? 'Back' : 'Home'}
        </button>
        <h1 className="display">Personal Details</h1>
        <p className="caption mt-1">Step 1 of 2 — your information</p>
      </div>
      <div className="flex gap-1.5">
        {[{l:'Personal',d:true},{l:'Address',d:false}].map(s => (
          <div key={s.l} className="flex-1">
            <div className="h-1.5 rounded-full" style={{ background: s.d ? 'var(--brand-primary)' : 'var(--surface-border)' }} />
            <p className="text-[10px] mt-1" style={{ color: s.d ? 'var(--brand-primary)' : 'var(--text-tertiary)' }}>{s.l}</p>
          </div>
        ))}
      </div>
      <div className="card-elevated p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5"><label className="label">First Name *</label><input className="input" value={personal.first_name} onChange={e => sp('first_name', e.target.value)} placeholder="John" /></div>
          <div className="flex flex-col gap-1.5"><label className="label">Last Name *</label><input className="input" value={personal.last_name} onChange={e => sp('last_name', e.target.value)} placeholder="Smith" /></div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">ID Type</label>
          <div className="grid grid-cols-3 gap-2">
            {([['sa_id','SA ID'],['passport','Passport'],['other','Other']] as const).map(([k,v]) => (
              <div key={k} onClick={() => sp('id_type', k)}
                className="option-card cursor-pointer text-center py-2.5 text-sm font-medium"
                style={personal.id_type === k ? { borderColor:'var(--brand-primary)', background:'var(--brand-subtle)', color:'var(--brand-primary)' } : { color:'var(--text-primary)' }}>
                {v}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">{personal.id_type === 'sa_id' ? 'SA ID Number' : personal.id_type === 'passport' ? 'Passport Number' : 'Document Number'}</label>
          <input className="input" value={personal.id_number}
            onChange={e => sp('id_number', personal.id_type === 'sa_id' ? e.target.value.replace(/\D/g,'').slice(0,13) : e.target.value)}
            placeholder={personal.id_type === 'sa_id' ? '0000000000000' : 'Enter number'} />
          {personal.id_type === 'sa_id' && personal.id_number.length > 0 && personal.id_number