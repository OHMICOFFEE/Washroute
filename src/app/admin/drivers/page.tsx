'use client'
import { useDemoStore } from '@/lib/demo/store'
import { useState } from 'react'
import { Users, UserPlus, Car, Circle, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDriversPage() {
  const store = useDemoStore()
  const [showAdd, setShowAdd] = useState(false)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [adding,   setAdding]   = useState(false)

  function addDriver() {
    if (!name || !email) { toast.error('Name and email required'); return }
    setAdding(true)
    setTimeout(() => {
      store.addDriver({ name, email, available: true })
      toast.success('Driver added!')
      setName(''); setEmail(''); setShowAdd(false); setAdding(false)
    }, 500)
  }

  return (
    <div className="space-y-5 anim-fadeup">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <p className="caption">Admin</p>
          <h1 className="display mt-0.5">Drivers</h1>
        </div>
        <button className="btn btn-primary py-2.5 px-4 text-sm flex items-center gap-2" onClick={() => setShowAdd(!showAdd)}>
          <UserPlus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      {/* Add driver form */}
      {showAdd && (
        <div className="card-elevated p-5 space-y-4" style={{ border: '2px solid var(--brand-primary)' }}>
          <h3 className="heading">New Driver Account</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="label">Full Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="John Driver" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="driver@example.com" />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary flex-1" onClick={addDriver} disabled={adding}>
              {adding ? 'Adding...' : 'Add Driver'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Driver list */}
      {store.drivers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="heading">No drivers yet</p>
          <p className="caption text-sm mt-1">Add your first driver above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {store.drivers.map(d => (
            <div key={d.id} className="card p-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: 'var(--brand-primary)' }}>
                  {d.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{d.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <Circle className={`w-2.5 h-2.5 ${d.available ? 'text-green-500 fill-green-500' : 'text-red-400 fill-red-400'}`} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {d.available ? 'Available' : 'Busy'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <Car className="w-3 h-3" />
                    {d.active_jobs} active {d.active_jobs === 1 ? 'job' : 'jobs'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
