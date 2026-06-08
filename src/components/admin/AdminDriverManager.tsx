'use client'
import { useState } from 'react'
import { getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { UserPlus, Car, Circle } from 'lucide-react'

interface DriverProfile {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  driver_record: { is_available: boolean; license_number: string | null } | null
}

interface Props {
  drivers: DriverProfile[]
  jobCounts: Record<string, number>
}

export default function AdminDriverManager({ drivers, jobCounts }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newEmail, setNewEmail]       = useState('')
  const [newName, setNewName]         = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [adding, setAdding] = useState(false)

  async function addDriver() {
    if (!newEmail || !newPassword) { toast.error('Email and password required'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/admin/create-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Driver account created')
      setShowAdd(false)
      setNewEmail(''); setNewName(''); setNewPassword('')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setAdding(false)
    }
  }

  async function toggleAvailability(driverId: string, current: boolean) {
    const supabase = createClient()
    const { error } = await supabase.from('drivers').update({ is_available: !current }).eq('id', driverId)
    if (error) { toast.error('Failed'); return }
    toast.success(current ? 'Marked unavailable' : 'Marked available')
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Add driver */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(!showAdd)} variant="ghost">
          <UserPlus className="w-4 h-4" />
          Add Driver
        </Button>
      </div>

      {showAdd && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white">New Driver Account</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Driver" />
            <Input label="Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="driver@example.com" />
          </div>
          <Input label="Temporary Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 chars" />
          <div className="flex gap-3">
            <Button loading={adding} onClick={addDriver}>Create Driver</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Driver grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {drivers.map(d => {
          const isAvailable = d.driver_record?.is_available ?? true
          const activeJobs  = jobCounts[d.id] ?? 0
          return (
            <div key={d.id} className="glass rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center font-semibold text-indigo-300">
                  {getInitials(d.full_name ?? d.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{d.full_name ?? '—'}</p>
                  <p className="text-white/40 text-xs truncate">{d.email}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isAvailable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  <Circle className="w-2 h-2 fill-current" />
                  {isAvailable ? 'Available' : 'Busy'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-white/50">
                <Car className="w-4 h-4" />
                <span>{activeJobs} active {activeJobs === 1 ? 'job' : 'jobs'}</span>
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => toggleAvailability(d.id, isAvailable)}
              >
                {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
              </Button>
            </div>
          )
        })}

        {drivers.length === 0 && (
          <div className="col-span-3 glass rounded-2xl p-10 text-center">
            <p className="text-white/40">No drivers yet. Add your first driver above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
