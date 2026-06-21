'use client'
import { useState, useEffect, useCallback } from 'react'

const ACTIVE_DRIVER_KEY = 'ohmi_active_driver_id'
const DEFAULT_DRIVER_ID = 'driver-1'

/**
 * Demo-mode "driver login" — persists which driver is currently using the
 * device in localStorage, so the driver app filters jobs to whoever is
 * picked here instead of being hardcoded to a single driver.
 *
 * This is NOT real authentication. It exists purely so multiple drivers can
 * be tested/demoed on the same device by switching who's "active" via the
 * picker in the driver header.
 */
export function useActiveDriver() {
  const [activeDriverId, setActiveDriverIdState] = useState<string>(DEFAULT_DRIVER_ID)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_DRIVER_KEY)
      if (stored) setActiveDriverIdState(stored)
    } catch {}
  }, [])

  const setActiveDriverId = useCallback((id: string) => {
    setActiveDriverIdState(id)
    try { localStorage.setItem(ACTIVE_DRIVER_KEY, id) } catch {}
  }, [])

  return { activeDriverId, setActiveDriverId }
}