'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type DemoBookingStatus =
  | 'pending_payment' | 'confirmed' | 'driver_assigned' | 'driver_en_route'
  | 'pickup_arrived' | 'pickup_verified' | 'vehicle_collected'
  | 'at_wash_facility' | 'wash_in_progress' | 'returning_vehicle'
  | 'delivery_arrived' | 'delivery_pin_released' | 'delivery_verified'
  | 'completed' | 'cancelled'

export interface DemoBooking {
  id:               string
  created_at:       string
  customer_name:    string
  customer_cell?:   string
  vehicle_type:     string
  make:             string
  model:            string
  colour:           string
  registration:     string
  pickup_address:   string
  delivery_address: string
  same_address:     boolean
  booking_date:     string
  pickup_time:      string
  pickup_type:      string
  wash_package:     string
  extras:           string[]
  concierge:        boolean
  fuel_refill:      boolean
  fuel_station:     string
  fuel_type:        string
  fuel_amount:      string
  oil:              string
  total:            number
  status:           DemoBookingStatus
  driver_id:        string | null
  pickup_pin:       string
  delivery_pin:     string
  delivery_pin_released: boolean
  notes:            string
  status_history:   { status: DemoBookingStatus; time: string; by: string }[]
  actual_fuel_cost?:      number
  actual_oil_cost?:       number
  fuel_credit?:           number
  odometer?:              string
  fuel_level?:            string
  damage_notes?:          string
  odometer_out?:          string
  odometer_in?:           string
  photos_pickup?:         string[]
  photos_delivery?:       string[]
  photos_damage?:         string[]
  pin_attempts?:          number
  pin_locked?:            boolean
  delivery_pin_attempts?: number
  delivery_pin_locked?:   boolean
  cancelled_at?:          string
  cancelled_by?:          string
  cancellation_reason?:   string
  cancellation_fee?:      number
  edit_requested?:        boolean
  payment_method?:        'pay_online_now' | 'pos_on_pickup' | 'cash_on_pickup'
  payment_collected?:     boolean
  payment_collected_method?: 'cash' | 'card' | 'online'
}

export interface DemoDriver {
  id:          string
  name:        string
  email:       string
  available:   boolean
  active_jobs: number
}

export interface DemoMessage {
  id:         string
  booking_id: string
  from:       'driver' | 'admin' | 'customer'
  from_name:  string
  to:         'driver' | 'admin' | 'customer' | 'all'
  text:       string
  time:       string
  read:       boolean
}

export interface WashCredit {
  id:            string
  booking_id:    string
  customer_name: string
  amount:        number
  reason:        string
  created_at:    string
  expires_at:    string
  used:          boolean
  used_at?:      string
}

export interface StaffMember {
  id:               string
  first_name:       string
  last_name:        string
  role:             'driver' | 'washer' | 'supervisor' | 'admin_staff' | 'other'
  phone:            string
  email:            string
  id_number:        string
  id_type:          'sa_id' | 'passport' | 'other'
  street_address:   string
  suburb:           string
  city:             string
  province:         string
  postal_code:      string
  country:          string
  bank_name:        string
  bank_account:     string
  bank_branch:      string
  emergency_name:   string
  emergency_phone:  string
  hourly_rate:      number
  active:           boolean
  kyc_complete:     boolean
  notes:            string
  created_at:       string
  start_date:       string
  licence_number:   string
  licence_expiry:   string
  licence_code:     string
  licence_uploaded: boolean
}

export interface TimeEntry {
  id:          string
  staff_id:    string
  staff_name:  string
  clock_in:    string
  clock_out:   string | null
  break_mins:  number
  notes:       string
  date:        string
  approved:    boolean
  approved_by: string | null
}

export interface CustomerProfile {
  id:             string
  first_name:     string
  last_name:      string
  id_number:      string
  id_type:        'sa_id' | 'passport' | 'other'
  cell:           string
  alt_cell:       string
  email:          string
  street_address: string
  suburb:         string
  city:           string
  province:       string
  postal_code:    string
  country:        string
  created_at:     string
  credit_balance: number
  notes:          string
}

export interface SavedVehicle {
  id:           string
  make:         string
  model:        string
  year:         string
  colour:       string
  registration: string
  vehicle_type: string
  is_primary:   boolean
}

export interface Invoice {
  id:             string
  invoice_number: string
  booking_id:     string
  customer_id:    string
  customer_name:  string
  customer_cell:  string
  customer_email: string
  items:          { description: string; amount: number; vat_note?: string }[]
  subtotal:       number
  vat:            number
  total:          number
  status:         'paid' | 'unpaid' | 'cancelled'
  created_at:     string
  paid_at:        string | null
}

export interface PaymentRequest {
  id:             string
  invoice_id:     string
  booking_id:     string
  customer_name:  string
  customer_cell:  string
  customer_email: string
  amount:         number
  method:         'whatsapp' | 'email' | 'both'
  status:         'sent' | 'viewed' | 'paid' | 'failed'
  sent_at:        string
  paid_at:        string | null
  reference:      string
  notes:          string
}

interface DemoStore {
  bookings:             DemoBooking[]
  drivers:              DemoDriver[]
  messages:             DemoMessage[]
  customPrices:         Record<string, number>
  credits:              WashCredit[]
  staff:                StaffMember[]
  timeEntries:          TimeEntry[]
  customerProfile:      CustomerProfile | null
  invoices:             Invoice[]
  savedVehicles:        SavedVehicle[]
  paymentRequests:      PaymentRequest[]
  addBooking:           (b: Omit<DemoBooking, 'id' | 'created_at' | 'status_history'>) => string
  updateBookingStatus:  (id: string, status: DemoBookingStatus, by?: string) => void
  updateBookingDetails: (id: string, patch: Partial<DemoBooking>) => void
  assignDriver:         (bookingId: string, driverId: string) => void
  releaseDeliveryPin:   (bookingId: string) => void
  markPaymentCollected: (bookingId: string, method: 'cash' | 'card' | 'online') => void
  regeneratePin:        (bookingId: string, which: 'pickup' | 'delivery') => string
  addDriver:            (d: Omit<DemoDriver, 'id' | 'active_jobs'>) => void
  getBooking:           (id: string) => DemoBooking | undefined
  sendMessage:          (msg: Omit<DemoMessage, 'id' | 'time' | 'read'>) => void
  getMessages:          (bookingId: string) => DemoMessage[]
  markMessagesRead:     (bookingId: string, role: DemoMessage['from']) => void
  unreadCount:          (bookingId: string, role: DemoMessage['from']) => number
  updatePricing:        (code: string, price: number) => void
  addCredit:            (c: Omit<WashCredit, 'id' | 'created_at' | 'expires_at' | 'used'>) => void
  useCredit:            (id: string) => void
  getActiveCredits:     (customerName?: string) => WashCredit[]
  addStaff:             (s: Omit<StaffMember, 'id' | 'created_at'>) => void
  updateStaff:          (id: string, patch: Partial<StaffMember>) => void
  deleteStaff:          (id: string) => void
  clockIn:              (staffId: string, notes?: string) => string
  clockOut:             (entryId: string, breakMins?: number) => void
  updateTimeEntry:      (id: string, patch: Partial<TimeEntry>) => void
  approveTimeEntry:     (id: string) => void
  deleteTimeEntry:      (id: string) => void
  getStaffEntries:      (staffId: string, month?: string) => TimeEntry[]
  setCustomerProfile:   (p: Omit<CustomerProfile, 'id' | 'created_at' | 'credit_balance'>) => void
  updateCustomerProfile:(patch: Partial<CustomerProfile>) => void
  createInvoice:        (bookingId: string) => string
  getInvoice:           (id: string) => Invoice | undefined
  markInvoicePaid:      (id: string) => void
  addSavedVehicle:      (v: Omit<SavedVehicle, 'id'>) => void
  updateSavedVehicle:   (id: string, patch: Partial<SavedVehicle>) => void
  deleteSavedVehicle:   (id: string) => void
  sendPaymentRequest:   (req: Omit<PaymentRequest, 'id' | 'sent_at'>) => string
  updatePaymentRequest: (id: string, patch: Partial<PaymentRequest>) => void
  getBookingInvoice:    (bookingId: string) => Invoice | undefined
}

const STORAGE_KEY = 'ohmi_demo_store_v2'

function generateId() { return Math.random().toString(36).slice(2, 10).toUpperCase() }
function now() { return new Date().toISOString() }

function load() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function save(data: object) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

const DemoContext = createContext<DemoStore | null>(null)

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<{
    bookings:        DemoBooking[]
    drivers:         DemoDriver[]
    messages:        DemoMessage[]
    customPrices:    Record<string, number>
    credits:         WashCredit[]
    staff:           StaffMember[]
    timeEntries:     TimeEntry[]
    customerProfile: CustomerProfile | null
    invoices:        Invoice[]
    savedVehicles:   SavedVehicle[]
    paymentRequests: PaymentRequest[]
  }>({ bookings: [], drivers: [], messages: [], customPrices: {}, credits: [], staff: [], timeEntries: [], customerProfile: null, invoices: [], savedVehicles: [], paymentRequests: [] })

  useEffect(() => {
    const loaded = load()
    if (loaded) {
      setData({
        bookings: [], drivers: [], messages: [], customPrices: {},
        credits: [], staff: [], timeEntries: [], customerProfile: null,
        invoices: [], savedVehicles: [], paymentRequests: [],
        ...loaded,
      })
    } else {
      setData({
        bookings: [], messages: [], customPrices: {}, credits: [],
        staff: [], timeEntries: [], customerProfile: null,
        invoices: [], savedVehicles: [], paymentRequests: [],
        drivers: [
          { id: 'driver-1', name: 'John Mokoena',  email: 'john@speedwash.co.za',  available: true, active_jobs: 0 },
          { id: 'driver-2', name: 'Sipho Dlamini', email: 'sipho@speedwash.co.za', available: true, active_jobs: 0 },
        ],
      })
    }
  }, [])

  function update(fn: (d: typeof data) => typeof data) {
    setData(prev => { const next = fn(prev); save(next); return next })
  }

  const addBooking = useCallback((b: Omit<DemoBooking, 'id' | 'created_at' | 'status_history'>): string => {
    const id = generateId()
    const booking: DemoBooking = { ...b, id, created_at: now(), status_history: [{ status: b.status, time: now(), by: 'Customer' }] }
    update(d => ({ ...d, bookings: [booking, ...d.bookings] }))
    return id
  }, [])

  const updateBookingStatus = useCallback((id: string, status: DemoBookingStatus, by = 'System') => {
    update(d => ({
      ...d,
      bookings: d.bookings.map(b => b.id === id
        ? { ...b, status, status_history: [...b.status_history, { status, time: now(), by }] }
        : b
      ),
    }))
  }, [])

  const updateBookingDetails = useCallback((id: string, patch: Partial<DemoBooking>) => {
    update(d => ({ ...d, bookings: d.bookings.map(b => b.id === id ? { ...b, ...patch } : b) }))
  }, [])

  const assignDriver = useCallback((bookingId: string, driverId: string) => {
    update(d => ({
      ...d,
      bookings: d.bookings.map(b => b.id === bookingId
        ? { ...b, driver_id: driverId, status: 'driver_assigned', status_history: [...b.status_history, { status: 'driver_assigned' as DemoBookingStatus, time: now(), by: 'Admin' }] }
        : b
      ),
      drivers: d.drivers.map(dr => dr.id === driverId ? { ...dr, active_jobs: dr.active_jobs + 1 } : dr),
    }))
  }, [])

  const releaseDeliveryPin = useCallback((bookingId: string) => {
    update(d => ({
      ...d,
      bookings: d.bookings.map(b => b.id === bookingId
        ? { ...b, delivery_pin_released: true, status: 'delivery_pin_released', status_history: [...b.status_history, { status: 'delivery_pin_released' as DemoBookingStatus, time: now(), by: 'Driver' }] }
        : b
      ),
    }))
  }, [])

  const markPaymentCollected = useCallback((bookingId: string, method: 'cash' | 'card' | 'online') => {
    update(d => ({
      ...d,
      bookings: d.bookings.map(b => b.id === bookingId
        ? { ...b, payment_collected: true, payment_collected_method: method }
        : b
      ),
    }))
  }, [])

  const regeneratePin = useCallback((bookingId: string, which: 'pickup' | 'delivery'): string => {
    const newPin = String(Math.floor(100000 + Math.random() * 900000))
    update(d => ({
      ...d,
      bookings: d.bookings.map(b => {
        if (b.id !== bookingId) return b
        return which === 'pickup'
          ? { ...b, pickup_pin: newPin, pin_attempts: 0, pin_locked: false }
          : { ...b, delivery_pin: newPin, delivery_pin_attempts: 0, delivery_pin_locked: false }
      }),
    }))
    return newPin
  }, [])

  const addDriver = useCallback((d: Omit<DemoDriver, 'id' | 'active_jobs'>) => {
    const driver: DemoDriver = { ...d, id: `driver-${generateId()}`, active_jobs: 0 }
    update(prev => ({ ...prev, drivers: [...prev.drivers, driver] }))
  }, [])

  const getBooking = useCallback((id: string) => data.bookings.find(b => b.id === id), [data.bookings])

  const sendMessage = useCallback((msg: Omit<DemoMessage, 'id' | 'time' | 'read'>) => {
    const message: DemoMessage = { ...msg, id: generateId(), time: now(), read: false }
    update(d => ({ ...d, messages: [...d.messages, message] }))
  }, [])

  const getMessages = useCallback((bookingId: string) =>
    data.messages.filter(m => m.booking_id === bookingId), [data.messages])

  const markMessagesRead = useCallback((bookingId: string, role: DemoMessage['from']) => {
    update(d => ({
      ...d,
      messages: d.messages.map(m =>
        m.booking_id === bookingId && m.to === role ? { ...m, read: true } : m
      ),
    }))
  }, [])

  const unreadCount = useCallback((bookingId: string, role: DemoMessage['from']) =>
    data.messages.filter(m => m.booking_id === bookingId && m.to === role && !m.read).length,
  [data.messages])

  const updatePricing = useCallback((code: string, price: number) => {
    update(d => {
      if (price < 0) {
        const next = { ...d.customPrices }
        delete next[code]
        return { ...d, customPrices: next }
      }
      return { ...d, customPrices: { ...d.customPrices, [code]: price } }
    })
  }, [])

  const addCredit = useCallback((c: Omit<WashCredit, 'id' | 'created_at' | 'expires_at' | 'used'>) => {
    const created = new Date()
    const expires = new Date(created)
    expires.setMonth(expires.getMonth() + 3)
    const credit: WashCredit = { ...c, id: generateId(), created_at: created.toISOString(), expires_at: expires.toISOString(), used: false }
    update(d => ({ ...d, credits: [...(d.credits ?? []), credit] }))
  }, [])

  const useCredit = useCallback((id: string) => {
    update(d => ({ ...d, credits: d.credits.map(c => c.id === id ? { ...c, used: true, used_at: now() } : c) }))
  }, [])

  const getActiveCredits = useCallback((customerName?: string) => {
    const now2 = new Date()
    return (data.credits ?? []).filter(c =>
      !c.used && new Date(c.expires_at) > now2 && (!customerName || c.customer_name === customerName)
    )
  }, [data.credits])

  const addStaff = useCallback((s: Omit<StaffMember, 'id' | 'created_at'>) => {
    const member: StaffMember = { ...s, id: generateId(), created_at: now() }
    update(d => ({ ...d, staff: [...(d.staff ?? []), member] }))
  }, [])

  const updateStaff = useCallback((id: string, patch: Partial<StaffMember>) => {
    update(d => ({ ...d, staff: d.staff.map(s => s.id === id ? { ...s, ...patch } : s) }))
  }, [])

  const deleteStaff = useCallback((id: string) => {
    update(d => ({ ...d, staff: d.staff.filter(s => s.id !== id) }))
  }, [])

  const clockIn = useCallback((staffId: string, notes = ''): string => {
    const member = data.staff.find(s => s.id === staffId)
    const entry: TimeEntry = {
      id: generateId(), staff_id: staffId,
      staff_name: member ? `${member.first_name} ${member.last_name}` : 'Unknown',
      clock_in: now(), clock_out: null, break_mins: 0, notes,
      date: new Date().toISOString().split('T')[0], approved: false, approved_by: null,
    }
    update(d => ({ ...d, timeEntries: [...(d.timeEntries ?? []), entry] }))
    return entry.id
  }, [data.staff])

  const clockOut = useCallback((entryId: string, breakMins = 0) => {
    update(d => ({ ...d, timeEntries: d.timeEntries.map(e => e.id === entryId ? { ...e, clock_out: now(), break_mins: breakMins } : e) }))
  }, [])

  const updateTimeEntry = useCallback((id: string, patch: Partial<TimeEntry>) => {
    update(d => ({ ...d, timeEntries: d.timeEntries.map(e => e.id === id ? { ...e, ...patch } : e) }))
  }, [])

  const approveTimeEntry = useCallback((id: string) => {
    update(d => ({ ...d, timeEntries: d.timeEntries.map(e => e.id === id ? { ...e, approved: true, approved_by: 'Admin' } : e) }))
  }, [])

  const deleteTimeEntry = useCallback((id: string) => {
    update(d => ({ ...d, timeEntries: d.timeEntries.filter(e => e.id !== id) }))
  }, [])

  const getStaffEntries = useCallback((staffId: string, month?: string) => {
    return (data.timeEntries ?? []).filter(e => e.staff_id === staffId && (!month || e.date.startsWith(month)))
  }, [data.timeEntries])

  const setCustomerProfile = useCallback((p: Omit<CustomerProfile, 'id' | 'created_at' | 'credit_balance'>) => {
    const profile: CustomerProfile = { ...p, id: generateId(), created_at: now(), credit_balance: 0 }
    update(d => ({ ...d, customerProfile: profile }))
  }, [])

  const updateCustomerProfile = useCallback((patch: Partial<CustomerProfile>) => {
    update(d => ({ ...d, customerProfile: d.customerProfile ? { ...d.customerProfile, ...patch } : d.customerProfile }))
  }, [])

  const createInvoice = useCallback((bookingId: string): string => {
    const booking = data.bookings.find(b => b.id === bookingId)
    if (!booking) return ''
    const profile    = data.customerProfile
    const invoiceNum = `INV-${new Date().getFullYear()}-${String((data.invoices ?? []).length + 1).padStart(4, '0')}`
    const fuelAmount = booking.fuel_refill && booking.fuel_amount ? parseFloat(booking.fuel_amount) || 0 : 0
    const serviceTotal = booking.total - fuelAmount
    const subtotalVat  = parseFloat((serviceTotal / 1.15).toFixed(2))
    const vat          = parseFloat((serviceTotal - subtotalVat).toFixed(2))
    const items: { description: string; amount: number; vat_note?: string }[] = []
    const washLabel = booking.wash_package.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, (l: string) => l.toUpperCase())
    items.push({ description: washLabel, amount: serviceTotal * 0.7 })
    booking.extras.forEach(e => items.push({ description: e, amount: 0 }))
    items.push({ description: 'Collection Fee (flat rate)', amount: 150 })
    if (booking.concierge) {
      items.push({ description: 'Vehicle Concierge Service', amount: 100 })
      if (booking.oil && booking.oil !== '' && booking.oil !== 'No oil top-up needed') {
        items.push({ description: `Oil: ${booking.oil}`, amount: booking.actual_oil_cost ?? 0 })
      }
    }
    if (booking.odometer_out) items.push({ description: `Odometer on collection: ${booking.odometer_out} km`, amount: 0 })
    if (booking.odometer_in)  items.push({ description: `Odometer on return: ${booking.odometer_in} km`, amount: 0 })
    if (fuelAmount > 0) {
      items.push({ description: `Fuel Refill — ${booking.fuel_type} @ ${booking.fuel_station} (Zero-rated)`, amount: fuelAmount, vat_note: 'zero_rated' })
      if (booking.fuel_credit && booking.fuel_credit > 0) {
        items.push({ description: 'Fuel Credit (overpay refund to next wash)', amount: -booking.fuel_credit, vat_note: 'zero_rated' })
      }
    }
    const invoice: Invoice = {
      id: generateId(), invoice_number: invoiceNum, booking_id: bookingId,
      customer_id:    profile?.id ?? 'guest',
      customer_name:  profile ? `${profile.first_name} ${profile.last_name}` : booking.customer_name,
      customer_cell:  booking.customer_cell || profile?.cell || '',
      customer_email: profile?.email ?? '',
      items, subtotal: subtotalVat, vat, total: booking.total,
      status: 'unpaid', created_at: now(), paid_at: null,
    }
    update(d => ({ ...d, invoices: [invoice, ...(d.invoices ?? [])] }))
    return invoice.id
  }, [data.bookings, data.customerProfile, data.invoices])

  const getInvoice = useCallback((id: string) => (data.invoices ?? []).find(i => i.id === id), [data.invoices])

  const markInvoicePaid = useCallback((id: string) => {
    update(d => ({ ...d, invoices: d.invoices.map(i => i.id === id ? { ...i, status: 'paid' as const, paid_at: now() } : i) }))
  }, [])

  const sendPaymentRequest = useCallback((req: Omit<PaymentRequest, 'id' | 'sent_at'>) => {
    const pr: PaymentRequest = { ...req, id: generateId(), sent_at: now() }
    update(d => ({ ...d, paymentRequests: [pr, ...(d.paymentRequests ?? [])] }))
    return pr.id
  }, [])

  const updatePaymentRequest = useCallback((id: string, patch: Partial<PaymentRequest>) => {
    update(d => ({ ...d, paymentRequests: d.paymentRequests.map(r => r.id === id ? { ...r, ...patch } : r) }))
  }, [])

  const getBookingInvoice = useCallback((bookingId: string) =>
    data.invoices.find(i => i.booking_id === bookingId), [data.invoices])

  const addSavedVehicle = useCallback((v: Omit<SavedVehicle, 'id'>) => {
    const vehicle: SavedVehicle = { ...v, id: generateId() }
    update(d => ({ ...d, savedVehicles: [...(d.savedVehicles ?? []), vehicle] }))
  }, [])

  const updateSavedVehicle = useCallback((id: string, patch: Partial<SavedVehicle>) => {
    update(d => ({ ...d, savedVehicles: d.savedVehicles.map(v => v.id === id ? { ...v, ...patch } : v) }))
  }, [])

  const deleteSavedVehicle = useCallback((id: string) => {
    update(d => ({ ...d, savedVehicles: d.savedVehicles.filter(v => v.id !== id) }))
  }, [])

  return (
    <DemoContext.Provider value={{
      ...data,
      addBooking, updateBookingStatus, updateBookingDetails,
      assignDriver, releaseDeliveryPin, markPaymentCollected, regeneratePin, addDriver, getBooking,
      sendMessage, getMessages, markMessagesRead, unreadCount, updatePricing,
      addCredit, useCredit, getActiveCredits,
      addStaff, updateStaff, deleteStaff, clockIn, clockOut, updateTimeEntry, approveTimeEntry, deleteTimeEntry, getStaffEntries,
      setCustomerProfile, updateCustomerProfile, createInvoice, getInvoice, markInvoicePaid,
      savedVehicles: data.savedVehicles ?? [], addSavedVehicle, updateSavedVehicle, deleteSavedVehicle,
      paymentRequests: data.paymentRequests ?? [], sendPaymentRequest, updatePaymentRequest, getBookingInvoice,
    }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoStore(): DemoStore {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemoStore must be used within DemoStoreProvider')
  return ctx
}

export function getSlotBookingCount(bookings: DemoBooking[], date: string, slot: string): number {
  return bookings.filter(b => b.booking_date === date && b.pickup_time === slot && b.status !== 'cancelled').length
}

export const MAX_BOOKINGS_PER_SLOT = 3

export function createBookingFromForm(
  form: Record<string, unknown>,
  extras: string[],
  total: number,
  colour: string,
  stationLabel: string,
  fuelType: string,
  fuelAmount: string,
  oilChoice: string,
): Omit<DemoBooking, 'id' | 'created_at' | 'status_history'> {
  return {
    customer_name:    'Demo Customer',
    vehicle_type:     String(form.vehicle_category ?? 'car'),
    make:             String(form.make ?? ''),
    model:            String(form.model ?? ''),
    colour,
    registration:     String(form.registration ?? ''),
    pickup_address:   String(form.pickup_address ?? ''),
    delivery_address: form.same_address ? String(form.pickup_address ?? '') : String(form.delivery_address ?? ''),
    same_address:     Boolean(form.same_address),
    booking_date:     String(form.booking_date ?? ''),
    pickup_time:      String(form.pickup_time ?? ''),
    pickup_type:      String(form.pickup_type ?? 'standard'),
    wash_package:     String(form.wash_package ?? ''),
    extras,
    concierge:        Boolean(form.concierge_selected),
    fuel_refill:      Boolean(form.fuel_refill),
    fuel_station:     stationLabel,
    fuel_type:        fuelType,
    fuel_amount:      fuelAmount,
    oil:              oilChoice,
    total,
    status:           form.payment_method === 'pay_online_now' ? 'pending_payment' : 'confirmed',
    driver_id:        null,
    pickup_pin:       String(Math.floor(100000 + Math.random() * 900000)),
    delivery_pin:     String(Math.floor(100000 + Math.random() * 900000)),
    delivery_pin_released: false,
    notes:            String(form.custom_detail_notes ?? ''),
    payment_method:   (form.payment_method as 'pay_online_now' | 'pos_on_pickup' | 'cash_on_pickup') ?? 'cash_on_pickup',
    payment_collected: false,
  }
}