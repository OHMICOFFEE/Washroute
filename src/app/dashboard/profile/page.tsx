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
          {personal.id_type === 'sa_id' && personal.id_number.length > 0 && personal.id_number.length < 13 && (
            <p className="text-xs" style={{ color:'#ff9500' }}>SA ID is 13 digits ({personal.id_number.length}/13)</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5"><label className="label">Cell Number *</label><input className="input" value={personal.cell} onChange={e => sp('cell', e.target.value)} placeholder="082 000 0000" inputMode="tel" /></div>
          <div className="flex flex-col gap-1.5"><label className="label">Alt. Cell</label><input className="input" value={personal.alt_cell} onChange={e => sp('alt_cell', e.target.value)} placeholder="Optional" inputMode="tel" /></div>
        </div>
        <div className="flex flex-col gap-1.5"><label className="label">Email Address</label><input className="input" type="email" value={personal.email} onChange={e => sp('email', e.target.value)} placeholder="john@example.com" /></div>
      </div>
      <button className="btn btn-primary w-full py-3 font-bold" onClick={savePersonal}>
        Continue to Address →
      </button>
    </div>
  )

  // ── ADDRESS STEP ──
  if (step === 'address') return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <button onClick={() => setStep('personal')}
          className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color:'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="display">Home Address</h1>
        <p className="caption mt-1">Step 2 of 2 — this auto-fills your pickup/delivery addresses</p>
      </div>
      <div className="flex gap-1.5">
        {[{l:'Personal',d:true},{l:'Address',d:true}].map(s => (
          <div key={s.l} className="flex-1">
            <div className="h-1.5 rounded-full" style={{ background:'var(--brand-primary)' }} />
            <p className="text-[10px] mt-1" style={{ color:'var(--brand-primary)' }}>{s.l} ✓</p>
          </div>
        ))}
      </div>
      <div className="card-elevated p-5 space-y-4">
        <div className="flex flex-col gap-1.5"><label className="label">Street Address *</label><input className="input" value={address.street_address} onChange={e => sa('street_address', e.target.value)} placeholder="e.g. 12 Oak Street" /></div>
        <div className="flex flex-col gap-1.5"><label className="label">Suburb *</label><input className="input" value={address.suburb} onChange={e => sa('suburb', e.target.value)} placeholder="e.g. Rondebosch" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5"><label className="label">City *</label><input className="input" value={address.city} onChange={e => sa('city', e.target.value)} placeholder="e.g. Cape Town" /></div>
          <div className="flex flex-col gap-1.5"><label className="label">Postal Code *</label><input className="input" value={address.postal_code} onChange={e => sa('postal_code', e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="7700" inputMode="numeric" /></div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">Province *</label>
          <select className="input" value={address.province} onChange={e => sa('province', e.target.value)}>
            <option value="">Select province...</option>
            {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5"><label className="label">Country</label><input className="input" value={address.country} onChange={e => sa('country', e.target.value)} placeholder="South Africa" /></div>
      </div>
      <button className="btn btn-primary w-full py-3 font-bold" onClick={saveAddress}>
        <Check className="w-4 h-4" /> Save Profile
      </button>
    </div>
  )

  // ── VEHICLES STEP ──
  if (step === 'vehicles') return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <button onClick={() => setStep('view')} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color:'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> Profile
        </button>
        <div className="flex items-center justify-between">
          <h1 className="display">My Vehicles</h1>
          <button onClick={() => setShowAddVehicle(v => !v)} className="btn btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {showAddVehicle && (
        <div className="card-elevated p-5 space-y-4" style={{ border:'2px solid var(--brand-primary)' }}>
          <h3 className="heading">Register a Vehicle</h3>
          <div className="flex flex-col gap-1.5">
            <label className="label">Vehicle Type</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['car',       '🚗 Car',            'Hatchback, Sedan, Coupe'],
                ['suv_bakkie','🚙 SUV & Bakkie',   'SUV, 4×4, Pickup Truck'],
                ['panel_van', '🚐 Panel Van',      'Minibus, Kombi, Van'],
                ['motorbike', '🏍️ Motorbike',      'Any bike or scooter'],
              ] as const).map(([k,v,sub]) => (
                <div key={k} onClick={() => sv('vehicle_type', k)}
                  className="option-card cursor-pointer py-2.5"
                  style={vForm.vehicle_type === k ? { borderColor:'var(--brand-primary)', background:'var(--brand-subtle)' } : {}}>
                  <p className="text-sm font-semibold" style={{ color: vForm.vehicle_type === k ? 'var(--brand-primary)' : 'var(--text-primary)' }}>{v}</p>
                  <p className="text-xs mt-0.5" style={{ color:'var(--text-tertiary)' }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label">Make *</label>
              <select className="input" value={vForm.make} onChange={e => sv('make', e.target.value)}>
                <option value="">Select...</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Model *</label>
              <select className="input" value={vForm.model} onChange={e => sv('model', e.target.value)} disabled={!vForm.make}>
                <option value="">{vForm.make ? 'Select...' : 'Pick make first'}</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Year</label>
              <select className="input" value={vForm.year} onChange={e => sv('year', e.target.value)}>
                <option value="">Any</option>
                {Array.from({ length:30 }, (_,i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Colour</label>
              <select className="input" value={vForm.colour} onChange={e => sv('colour', e.target.value)}>
                <option value="">Select...</option>
                {VEHICLE_COLOURS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5"><label className="label">Registration *</label><input className="input" value={vForm.registration} onChange={e => sv('registration', e.target.value.toUpperCase())} placeholder="CA 123-456" /></div>
          <div className="flex items-center gap-3 cursor-pointer py-1" onClick={() => sv('is_primary', !vForm.is_primary)}>
            <div className="check-box" style={vForm.is_primary ? { background:'var(--brand-primary)', borderColor:'var(--brand-primary)' } : {}}>
              {vForm.is_primary && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>Set as primary vehicle</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary flex-1 py-3 font-bold" onClick={addVehicle}>Save Vehicle</button>
            <button className="btn btn-secondary" onClick={() => setShowAddVehicle(false)}>Cancel</button>
          </div>
        </div>
      )}

      {store.savedVehicles.length === 0 && !showAddVehicle ? (
        <div className="card p-10 text-center">
          <Car className="w-10 h-10 mx-auto mb-3" style={{ color:'var(--text-tertiary)' }} />
          <p className="heading text-[15px]">No vehicles saved</p>
          <p className="caption text-sm mt-1">Add your vehicles so they auto-fill when booking.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {store.savedVehicles.map(v => (
            <div key={v.id} className="card p-4 flex items-center gap-3"
              style={v.is_primary ? { border:'1.5px solid var(--brand-primary)' } : {}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background:'var(--brand-subtle)' }}>
                <Car className="w-5 h-5" style={{ color:'var(--brand-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>{v.make} {v.model}</p>
                  {v.is_primary && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />}
                </div>
                <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>
                  {v.registration}{v.colour ? ` · ${v.colour}` : ''}{v.year ? ` · ${v.year}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => store.updateSavedVehicle(v.id, { is_primary: !v.is_primary })}
                  style={{ color: v.is_primary ? '#ff9500' : 'var(--text-tertiary)' }}>
                  <Star className={`w-4 h-4 ${v.is_primary ? 'fill-yellow-400' : ''}`} />
                </button>
                <button onClick={() => { store.deleteSavedVehicle(v.id); toast.success('Vehicle removed') }}
                  style={{ color:'#ff3b30' }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── VIEW ──
  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color:'var(--brand-primary)' }}>
          <ChevronLeft className="w-4 h-4" /> Home
        </button>
        <div className="flex items-center justify-between">
          <h1 className="display">My Profile</h1>
          <button onClick={() => setStep('personal')} style={{ color:'var(--brand-primary)' }}><Edit2 className="w-5 h-5" /></button>
        </div>
      </div>

      {totalCredit > 0 && (
        <div className="card p-4 flex items-center gap-3" style={{ background:'rgba(52,199,89,0.06)', border:'2px solid rgba(52,199,89,0.3)' }}>
          <Gift className="w-5 h-5 shrink-0" style={{ color:'#34c759' }} />
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color:'#34c759' }}>Wash Credit Available</p>
            <p className="text-xs mt-0.5" style={{ color:'var(--text-secondary)' }}>{activeCredits.length} credit{activeCredits.length>1?'s':''} · expires in 3 months</p>
          </div>
          <span className="font-bold text-lg" style={{ color:'#34c759' }}>{formatZAR(totalCredit)}</span>
        </div>
      )}

      {/* Loyalty Punch Card */}
      <div className="card-elevated p-5 space-y-4" style={{ border: freeWashReady ? '2px solid var(--brand-primary)' : '1.5px solid var(--surface-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              🎁 Loyalty Punch Card
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {freeWashReady ? 'Your FREE wash is ready to redeem!' : `${3 - stamps} more wash${3 - stamps !== 1 ? 'es' : ''} until a free one`}
            </p>
          </div>
          {punchCard && punchCard.total_earned > 0 && (
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}>
              {punchCard.total_earned} earned
            </span>
          )}
        </div>

        <div className="flex gap-3 justify-center py-2">
          {[0, 1, 2].map(i => {
            const filled = i < stamps
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                  style={{
                    background: filled ? 'var(--brand-primary)' : 'var(--surface-inset)',
                    border: filled ? 'none' : '2px dashed var(--surface-border)',
                    boxShadow: filled ? 'var(--neon-glow-sm, none)' : 'none',
                  }}>
                  {filled ? '🚗' : ''}
                </div>
                <p className="text-[10px] font-semibold" style={{ color: filled ? 'var(--brand-primary)' : 'var(--text-tertiary)' }}>
                  Wash {i + 1}
                </p>
              </div>
            )
          })}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
              style={{
                background: freeWashReady ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'var(--surface-inset)',
                border: freeWashReady ? 'none' : '2px dashed var(--surface-border)',
                boxShadow: freeWashReady ? '0 0 24px rgba(249,115,22,0.4)' : 'none',
              }}>
              {freeWashReady ? '⭐' : '🎁'}
            </div>
            <p className="text-[10px] font-semibold" style={{ color: freeWashReady ? 'var(--brand-primary)' : 'var(--text-tertiary)' }}>
              FREE
            </p>
          </div>
        </div>

        {freeWashReady && (
          <div className="p-3 rounded-xl text-center" style={{ background: 'var(--brand-subtle)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>
              🎉 Your next wash is FREE — discount will apply automatically at checkout!
            </p>
          </div>
        )}
      </div>

      {profile && (
        <>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0" style={{ background:'var(--brand-primary)' }}>
              {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color:'var(--text-primary)' }}>{profile.first_name} {profile.last_name}</p>
              <p className="text-sm mt-0.5" style={{ color:'var(--text-secondary)' }}>Since {new Date(profile.created_at).toLocaleDateString('en-ZA', { month:'long', year:'numeric' })}</p>
            </div>
          </div>

          <div className="list-group">
            {[
              { icon:CreditCard, label: profile.id_type === 'passport' ? 'Passport' : 'SA ID', value:profile.id_number||'—' },
              { icon:Phone,      label:'Cell',    value:profile.cell||'—' },
              { icon:Mail,       label:'Email',   value:profile.email||'—' },
              { icon:MapPin,     label:'Address', value:profile.street_address ? `${profile.street_address}, ${profile.suburb}, ${profile.city}, ${profile.province} ${profile.postal_code}` : '—' },
            ].map((item, i, arr) => (
              <div key={item.label} className="list-item" style={{ borderBottom: i<arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                <item.icon className="w-4 h-4 shrink-0" style={{ color:'var(--text-tertiary)' }} />
                <div className="flex-1">
                  <p className="text-xs" style={{ color:'var(--text-tertiary)' }}>{item.label}</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color:'var(--text-primary)' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="heading">My Vehicles</h2>
          <button onClick={() => setStep('vehicles')} className="text-sm font-medium" style={{ color:'var(--brand-primary)' }}>
            {store.savedVehicles.length > 0 ? 'Manage →' : 'Add Vehicle →'}
          </button>
        </div>
        {store.savedVehicles.length === 0 ? (
          <div className="card p-5 text-center cursor-pointer" onClick={() => setStep('vehicles')}
            style={{ border:'1.5px dashed var(--surface-border)' }}>
            <Car className="w-7 h-7 mx-auto mb-2" style={{ color:'var(--text-tertiary)' }} />
            <p className="text-sm font-medium" style={{ color:'var(--text-secondary)' }}>No vehicles saved yet</p>
            <p className="text-xs mt-1" style={{ color:'var(--text-tertiary)' }}>Tap to pre-register your vehicle</p>
          </div>
        ) : (
          <div className="list-group">
            {store.savedVehicles.slice(0,3).map((v,i,arr) => (
              <div key={v.id} className="list-item" style={{ borderBottom: i<arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                <Car className="w-4 h-4 shrink-0" style={{ color:'var(--brand-primary)' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{v.make} {v.model} {v.is_primary ? '⭐' : ''}</p>
                  <p className="text-xs" style={{ color:'var(--text-secondary)' }}>{v.registration}{v.colour ? ` · ${v.colour}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => router.push('/dashboard/invoices')}
        className="btn btn-secondary w-full flex items-center justify-between py-3">
        <div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>My Invoices & Payments</span></div>
        <ChevronRight className="w-4 h-4" style={{ color:'var(--brand-primary)' }} />
      </button>
    </div>
  )
}