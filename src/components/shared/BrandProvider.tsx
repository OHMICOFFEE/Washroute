'use client'
import { createContext, useContext, useEffect } from 'react'
import type { BrandConfig } from '@/config/brand'

const BrandContext = createContext<BrandConfig | null>(null)

export function useBrand(): BrandConfig {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used within BrandProvider')
  return ctx
}

export function BrandProvider({ config, children }: { config: BrandConfig; children: React.ReactNode }) {
  useEffect(() => {
    // Inject CSS variables into :root
    const root = document.documentElement
    Object.entries(config.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [config])

  return (
    <BrandContext.Provider value={config}>
      {children}
    </BrandContext.Provider>
  )
}
