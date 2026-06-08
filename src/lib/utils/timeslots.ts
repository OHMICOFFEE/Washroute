/**
 * WashRoute Time Slot System
 * ─────────────────────────
 * Pickup window: 09:30 — 15:30
 * Slots every 15 minutes
 * Standard pickup: 1 hour lead time (book by 08:30 for 09:30 slot)
 * Express pickup:  bumps slot 30 minutes earlier (09:30 → 09:00 effective)
 * Max bookings per slot configurable
 */

export const MAX_BOOKINGS_PER_SLOT = 3
export const SLOT_INTERVAL_MINS    = 15
export const FIRST_SLOT            = '09:30'
export const LAST_SLOT             = '15:30'
export const LEAD_TIME_MINS        = 60   // 1 hour standard lead time
export const EXPRESS_LEAD_MINS     = 30   // express bumps 30 min earlier

export function getTimeSlots(): string[] {
  const slots: string[] = []
  const [startH, startM] = FIRST_SLOT.split(':').map(Number)
  const [endH,   endM  ] = LAST_SLOT.split(':').map(Number)
  const startTotal = startH * 60 + startM
  const endTotal   = endH   * 60 + endM

  for (let mins = startTotal; mins <= endTotal; mins += SLOT_INTERVAL_MINS) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }
  return slots
}

export function formatSlotDisplay(slot: string): string {
  const [h, m] = slot.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12    = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${String(m).padStart(2,'0')} ${period}`
}

export function isSlotAvailable(slot: string, pickupType: 'standard' | 'express', bookingDate: string): boolean {
  const now   = new Date()
  const today = now.toISOString().split('T')[0]
  if (bookingDate !== today) return true // future dates always available by time

  const [h, m]    = slot.split(':').map(Number)
  const slotMins  = h * 60 + m
  const nowMins   = now.getHours() * 60 + now.getMinutes()
  const leadTime  = pickupType === 'express' ? EXPRESS_LEAD_MINS : LEAD_TIME_MINS

  return slotMins >= nowMins + leadTime
}

export function getEffectivePickupTime(slot: string, pickupType: 'standard' | 'express'): string {
  if (pickupType !== 'express') return slot
  // Express bumps 30 min earlier
  const [h, m] = slot.split(':').map(Number)
  const total  = h * 60 + m - EXPRESS_LEAD_MINS
  const eh     = Math.floor(total / 60)
  const em     = total % 60
  return `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`
}
