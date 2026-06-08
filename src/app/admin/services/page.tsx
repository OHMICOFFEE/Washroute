'use client'
import { useDemoStore } from '@/lib/demo/store'
import { useState } from 'react'
import { WASH_PACKAGE_LABELS, WASH_PRICES, EXTRA_PRICES, EXTRA_LABELS, COLLECTION_FEE, CONCIERGE_FEE } from '@/lib/utils/pricing'
import { Pencil, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminServicesPage() {
  const store = useDemoStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const vehicles = [
    { id: 'car' as const,        label: 'Car'          },
    { id: 'suv_bakkie' as const, label: 'SUV & Bakkie' },
    { id: 'panel_van' as const,  label: 'Panel Van'    },
    { id: 'motorbike' as const,  label: 'Motorbike'    },
  ]

  function getPrice(code: string, base: number): number {
    return store.customPrices[code] ?? base
  }

  function startEdit(code: string, current: number) {
    setEditing(code)
    setEditVal(String(current))
  }

  function saveEdit(code: string) {
    const price = parseFloat(editVal)
    if (isNaN(price) || price < 0) { toast.error('Invalid price'); return }
    store.updatePricing(code, price)
    setEditing(null)
    toast.success('Price updated!')
  }

  function PriceCell({ code, base }: { code: string; base: number }) {
    const current = getPrice(code, base)
    const changed = store.customPrices[code] !== undefined && store.customPrices[code] !== base
    return editing === code ? (
      <div className="flex items-center gap-2">
        <input className="input text-sm py-1 w-24" value={editVal}
          onChange={e => setEditVal(e.target.value)} autoFocus type="number"
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(code); if (e.key === 'Escape') setEditing(null) }} />
        <button onClick={() => saveEdit(code)} className="text-green-500"><Check className="w-4 h-4" /></button>
        <button onClick={() => setEditing(null)} style={{ color: 'var(--text-tertiary)' }}><X className="w-4 h-4" /></button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm" style={{ color: changed ? '#ff9500' : 'var(--brand-primary)' }}>R{current}</span>
        {changed && <span className="text-[10px] text-white px-1.5 py-0.5 rounded" style={{ background: '#ff9500' }}>edited</span>}
        <button onClick={() => startEdit(code, current)} style={{ color: 'var(--text-tertiary)' }}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 anim-fadeup stagger">
      <div className="pt-2">
        <p className="caption">Admin</p>
        <h1 className="display mt-0.5">Service Pricing</h1>
        <p className="caption mt-1">Tap ✏️ to edit any price. Changes apply immediately.</p>
      </div>

      {vehicles.map(v => {
        const prices = WASH_PRICES[v.id]
        if (!prices) return null
        return (
          <div key={v.id}>
            <h2 className="heading mb-3">{v.label}</h2>
            <div className="list-group">
              {(Object.entries(prices) as [string, number][]).map(([pkg, base], i, arr) => (
                <div key={pkg} className="list-item" style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                  <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                    {WASH_PACKAGE_LABELS[pkg as keyof typeof WASH_PACKAGE_LABELS] ?? pkg}
                  </span>
                  <PriceCell code={`${v.id}_${pkg}`} base={base} />
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div>
        <h2 className="heading mb-3">Add-On Extras</h2>
        <div className="list-group">
          {Object.entries(EXTRA_PRICES).map(([code, base], i, arr) => (
            <div key={code} className="list-item" style={{ borderBottom: i < arr.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
              <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{EXTRA_LABELS[code]}</span>
              <PriceCell code={`extra_${code}`} base={base} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="heading mb-3">Fees</h2>
        <div className="list-group">
          <div className="list-item">
            <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>Collection Fee (flat rate · 1hr lead time)</span>
            <PriceCell code="fee_collection" base={COLLECTION_FEE} />
          </div>
          <div className="list-item" style={{ borderBottom: 'none' }}>
            <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>Vehicle Concierge</span>
            <PriceCell code="fee_concierge" base={CONCIERGE_FEE} />
          </div>
        </div>
      </div>

      {Object.keys(store.customPrices).length > 0 && (
        <button className="btn btn-secondary w-full text-sm"
          onClick={() => { Object.keys(store.customPrices).forEach(k => store.updatePricing(k, -1)); toast.success('Prices reset') }}>
          Reset All to Defaults
        </button>
      )}
    </div>
  )
}
