'use client'
import { useState } from 'react'
import type { ServiceCatalog } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatZAR } from '@/lib/utils/pricing'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Pencil, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'

export default function AdminServiceManager({ services }: { services: ServiceCatalog[] }) {
  const [items, setItems]     = useState(services)
  const [editing, setEditing] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editName, setEditName]   = useState('')
  const [saving, setSaving]       = useState(false)

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('service_catalog').update({
        name:  editName,
        price: parseFloat(editPrice),
      }).eq('id', id)
      if (error) throw error
      setItems(prev => prev.map(s => s.id === id ? { ...s, name: editName, price: parseFloat(editPrice) } : s))
      setEditing(null)
      toast.success('Saved')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient()
    const { error } = await supabase.from('service_catalog').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    setItems(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
  }

  const categories = Array.from(new Set(items.map(s => s.category)))

  return (
    <div className="space-y-8">
      {categories.map(cat => (
        <div key={cat}>
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 capitalize">{cat}</h2>
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Service', 'Price', 'Active', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs text-white/30 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.filter(s => s.category === cat).map(s => (
                  <tr key={s.id} className="border-b border-white/4">
                    <td className="px-4 py-3">
                      {editing === s.id
                        ? <input className="input text-sm py-1" value={editName} onChange={e => setEditName(e.target.value)} />
                        : <span className="text-white">{s.name}</span>
                      }
                      <p className="text-white/30 text-xs">{s.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      {editing === s.id
                        ? <Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-24 py-1" />
                        : <span className="text-white font-medium">{formatZAR(s.price)}</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(s.id, s.is_active)} className="text-white/50 hover:text-white transition-colors">
                        {s.is_active
                          ? <ToggleRight className="w-5 h-5 text-teal-400" />
                          : <ToggleLeft className="w-5 h-5 text-white/20" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {editing === s.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" loading={saving} onClick={() => saveEdit(s.id)}><Check className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(s.id); setEditPrice(String(s.price)); setEditName(s.name) }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
