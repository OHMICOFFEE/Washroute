'use client'
import { cn } from '@/lib/utils'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface PinDisplayProps {
  pin: string | null
  label: string
  locked?: boolean
  lockedMessage?: string
  className?: string
}

export default function PinDisplay({ pin, label, locked, lockedMessage, className }: PinDisplayProps) {
  const [visible, setVisible] = useState(false)

  if (locked || !pin) {
    return (
      <div className={cn('glass rounded-2xl p-5 text-center', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <Lock className="w-5 h-5 text-white/30" />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm text-white/30">
              {lockedMessage ?? 'PIN locked until driver confirms return'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('glass rounded-2xl p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center justify-center gap-2">
        {visible
          ? pin.split('').map((digit, i) => (
              <span
                key={i}
                className="w-10 h-14 glass rounded-xl flex items-center justify-center pin-digit"
              >
                {digit}
              </span>
            ))
          : Array.from({ length: pin.length }).map((_, i) => (
              <span
                key={i}
                className="w-10 h-14 glass rounded-xl flex items-center justify-center text-3xl text-white/30"
              >
                •
              </span>
            ))}
      </div>
      <p className="text-center text-xs text-white/30 mt-3">
        Keep this PIN safe. Share only with the driver.
      </p>
    </div>
  )
}
