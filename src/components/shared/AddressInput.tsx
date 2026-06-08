'use client'
import { useState, useEffect, useRef } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'

interface Props {
  value:       string
  onChange:    (val: string) => void
  placeholder: string
  label:       string
}

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

export default function AddressInput({ value, onChange, placeholder, label }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [loading,     setLoading]     = useState(false)
  const ref     = useRef<HTMLDivElement>(null)
  const timeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  async function handleInput(val: string) {
    onChange(val)
    clearTimeout(timeout.current)
    if (val.length < 4) { setSuggestions([]); setOpen(false); return }

    timeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        // Google Places if key available
        const googleKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY
        if (googleKey) {
          const res  = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(val)}&components=country:za&key=${googleKey}&types=address`)
          const data = await res.json()
          if (data.predictions?.length) {
            setSuggestions(data.predictions.map((p: { description: string }) => ({
              display_name: p.description, lat: '', lon: '',
            })))
            setOpen(true)
            setLoading(false)
            return
          }
        }
        // Fallback: Nominatim (free, no key needed)
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ', South Africa')}&format=json&addressdetails=1&limit=5&countrycodes=za`, {
          headers: { 'Accept-Language': 'en' }
        })
        const data: Suggestion[] = await res.json()
        setSuggestions(data.slice(0, 5))
        setOpen(data.length > 0)
      } catch {
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  function select(s: Suggestion) {
    // Clean up Nominatim's verbose display names
    const parts = s.display_name.split(',')
    const clean = parts.slice(0, 4).join(',').trim()
    onChange(clean)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="label">{label}</label>
      <div className="relative" ref={ref}>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
          {loading
            ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            : value && <button type="button" onClick={() => { onChange(''); setSuggestions([]); setOpen(false) }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              </button>
          }
          <input
            className="input"
            style={{ paddingLeft: '38px', paddingRight: '32px' }}
            value={value}
            onChange={e => handleInput(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
        </div>
        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden"
            style={{ background: 'var(--surface-card)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid var(--surface-border)' }}>
            {suggestions.map((s, i) => (
              <button key={i} type="button" onClick={() => select(s)}
                className="w-full text-left px-4 py-3 text-sm flex items-start gap-3 transition-colors hover:bg-[var(--surface-inset)]"
                style={{ borderBottom: i < suggestions.length-1 ? '1px solid var(--surface-border)' : 'none' }}>
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--brand-primary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
