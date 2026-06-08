import type { BookingFormState, PriceBreakdown, FuelAmount, VehicleCategory } from '@/types'

// ─── Wash packages per vehicle category ──────────────────────

export type WashPackageKey = 'full_house' | 'wash_and_go' | 'wash_and_dry' | 'full_house_polish' | 'inside_only' | 'custom_detail'
export type WashPackage = WashPackageKey

export const WASH_PACKAGE_LABELS: Record<WashPackageKey, string> = {
  full_house:        'Full House',
  wash_and_go:       'Wash & Go',
  wash_and_dry:      'Wash & Dry',
  full_house_polish: 'Full House & Polish',
  inside_only:       'Inside Only',
  custom_detail:     'Custom Detailing',
}
export const WASH_LABELS = WASH_PACKAGE_LABELS

export const WASH_PACKAGE_DESCRIPTIONS: Record<WashPackageKey, string> = {
  full_house:        'Full exterior wash, interior vacuum, windows & dashboard clean.',
  wash_and_go:       'Quick exterior wash and rinse.',
  wash_and_dry:      'Exterior wash, rinse and hand dry.',
  full_house_polish: 'Full house service plus hand polish and wax.',
  inside_only:       'Interior vacuum, wipe-down and window clean only.',
  custom_detail:     'Fully custom detailing — ceramic coating, paint correction, full restoration.',
}

export const WASH_PRICES: Record<VehicleCategory, Partial<Record<WashPackageKey, number>>> = {
  car: {
    full_house:        120,
    wash_and_go:        60,
    wash_and_dry:       90,
    full_house_polish: 200,
    inside_only:        60,
    custom_detail:     850,
  },
  suv_bakkie: {
    full_house:        140,
    wash_and_go:        70,
    wash_and_dry:      110,
    full_house_polish: 220,
    inside_only:        70,
    custom_detail:     850,
  },
  panel_van: {
    full_house:        200,
    wash_and_go:       100,
    wash_and_dry:      150,
    full_house_polish: 300,
    inside_only:       100,
    custom_detail:     850,
  },
  motorbike: {
    full_house:        120,
    wash_and_go:        60,
    wash_and_dry:       90,
    custom_detail:     850,
  },
}

export function getWashPrice(category: VehicleCategory, pkg: WashPackageKey, customPrice?: number): number {
  if (pkg === 'custom_detail') return customPrice ?? WASH_PRICES[category]?.['custom_detail'] ?? 850
  return WASH_PRICES[category]?.[pkg] ?? 0
}

export function getAvailablePackages(category: VehicleCategory): WashPackageKey[] {
  return Object.keys(WASH_PRICES[category] ?? {}) as WashPackageKey[]
}

// ─── Extras ──────────────────────────────────────────────────

export const EXTRA_PRICES: Record<string, number> = {
  engine_bay_clean:  80,
  seat_shampoo:     150,
  pet_hair_removal: 100,
  spray_wax:         90,
}

export const EXTRA_LABELS: Record<string, string> = {
  engine_bay_clean:  'Engine Bay Clean',
  seat_shampoo:      'Seat Shampoo',
  pet_hair_removal:  'Pet Hair Removal',
  spray_wax:         'Spray Wax Protection',
}

// ─── Fuel ────────────────────────────────────────────────────

export type FuelAmountValue = '250' | '500' | '750' | '1000'

export const FUEL_AMOUNTS: FuelAmountValue[] = ['250', '500', '750', '1000']

export const FUEL_PRICES: Record<string, number> = {
  '250':  250,
  '500':  500,
  '750':  750,
  '1000': 1000,
}

// Petrol stations and their available fuel types + oils
export const PETROL_STATIONS = {
  engen: {
    label: 'ENGEN',
    fuels: ['95 Unleaded', 'Diesel 50ppm'],
    oils: [
      'Castrol GTX 20W50',
      'Castrol Magnatec 5W30',
      'Castrol Magnatec 10W40',
      'Castrol Edge 5W40',
    ],
  },
  sasol: {
    label: 'SASOL',
    fuels: ['95 Unleaded', '93 Unleaded', 'Diesel 50ppm'],
    oils: [
      'Shell Helix HX3 20W50',
      'Shell Helix HX5 15W40',
      'Shell Helix HX6 10W40',
      'Shell Helix HX7 10W40',
      'Shell Helix HX7 Professional AV 5W30',
      'Shell Helix Ultra 5W30',
      'Shell Helix Ultra 5W40',
      'Shell Helix Ultra ECT 5W30',
      'Shell Helix Ultra Racing 10W60',
    ],
  },
  bp: {
    label: 'BP',
    fuels: ['95 Unleaded', '93 Unleaded', 'Diesel 50ppm'],
    oils: [
      'Castrol GTX 20W50',
      'Castrol Magnatec 5W30',
      'Castrol Magnatec 10W40',
      'Castrol Edge 5W40',
      'Castrol Edge 5W30',
    ],
  },
  total: {
    label: 'TOTAL / TotalEnergies',
    fuels: ['95 Unleaded', '93 Unleaded', 'Diesel 50ppm'],
    oils: [
      'Total Quartz 7000 10W40',
      'Total Quartz 9000 5W40',
      'Total Quartz INEO 5W30',
      'Total Rubia TIR 8900 10W40',
    ],
  },
  astron: {
    label: 'Astron Energy',
    fuels: ['95 Unleaded', '93 Unleaded', 'Diesel 50ppm'],
    oils: [
      'Havoline 20W50',
      'Havoline Pro-DS 5W30',
      'Havoline Pro-DS 10W40',
      'Delo Gold Ultra 10W40',
    ],
  },
  shell: {
    label: 'SHELL (Vivo Energy)',
    fuels: ['95 Unleaded', 'V-Power 95', '93 Unleaded', 'Diesel 50ppm'],
    oils: [
      'Shell Helix HX5 15W40',
      'Shell Helix HX7 10W40',
      'Shell Helix Ultra 5W30',
      'Shell Helix Ultra ECT 5W30',
      'Shell Helix Ultra Racing 10W60',
    ],
  },
} as const

export type PetrolStationKey = keyof typeof PETROL_STATIONS

// ─── Credit system ────────────────────────────────────────────

export interface FuelCredit {
  amountPaid:   number
  amountUsed:   number
  creditBalance: number
  message:      string
}

export function calculateFuelCredit(amountRequested: number, actualCost: number): FuelCredit {
  const creditBalance = amountRequested - actualCost
  const hasCredit     = creditBalance > 0
  return {
    amountPaid:    amountRequested,
    amountUsed:    actualCost,
    creditBalance: hasCredit ? creditBalance : 0,
    message: hasCredit
      ? `R${creditBalance.toFixed(0)} credit will be applied to your next wash.`
      : 'No credit — fuel filled to requested amount.',
  }
}

// ─── Other fees ───────────────────────────────────────────────

export const COLLECTION_FEE = 150
// Flat collection fee - R150 with 1hr lead time
export const CONCIERGE_FEE  = 100

// ─── Price calculation ────────────────────────────────────────

export function calculatePrice(form: Partial<BookingFormState>): PriceBreakdown {
  const category    = (form.vehicle_category ?? 'car') as VehicleCategory
  const pkg         = (form.wash_package ?? 'full_house') as WashPackageKey
  const wash_price  = getWashPrice(category, pkg, form.custom_detail_price)
  const extras_total  = (form.extras ?? []).reduce((s, c) => s + (EXTRA_PRICES[c] ?? 0), 0)
  const express_fee   = COLLECTION_FEE // Flat collection fee R150
  const concierge_fee = form.concierge_selected ? CONCIERGE_FEE : 0
  const fuel_price    = form.concierge_selected && form.fuel_refill && form.fuel_amount
    ? (FUEL_PRICES[form.fuel_amount] ?? 0) : 0
  const subtotal = wash_price + extras_total + express_fee + concierge_fee + fuel_price
  return { wash_price, extras_total, express_fee, concierge_fee, fuel_price, subtotal, total: subtotal }
}

export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount)
}

export const STATUS_LABELS: Record<string, string> = {
  pending_payment:       'Pending Payment',
  confirmed:             'Confirmed',
  driver_assigned:       'Driver Assigned',
  driver_en_route:       'Driver En Route',
  pickup_arrived:        'Driver Arrived for Pickup',
  pickup_verified:       'Pickup Verified',
  vehicle_collected:     'Vehicle Collected',
  at_wash_facility:      'At Wash Facility',
  wash_in_progress:      'Wash in Progress',
  concierge_in_progress: 'Concierge in Progress',
  returning_vehicle:     'Returning Your Vehicle',
  delivery_arrived:      'Driver Arrived for Delivery',
  delivery_pin_released: 'Delivery PIN Released',
  delivery_verified:     'Delivery Verified',
  completed:             'Completed',
  cancelled:             'Cancelled',
}

export const STATUS_COLORS: Record<string, string> = {
  pending_payment:       'text-yellow-400',
  confirmed:             'text-blue-400',
  driver_assigned:       'text-blue-400',
  driver_en_route:       'text-indigo-400',
  pickup_arrived:        'text-indigo-400',
  pickup_verified:       'text-purple-400',
  vehicle_collected:     'text-purple-400',
  at_wash_facility:      'text-cyan-400',
  wash_in_progress:      'text-cyan-400',
  concierge_in_progress: 'text-teal-400',
  returning_vehicle:     'text-teal-400',
  delivery_arrived:      'text-green-400',
  delivery_pin_released: 'text-green-400',
  delivery_verified:     'text-green-400',
  completed:             'text-emerald-400',
  cancelled:             'text-red-400',
}

export const OIL_LABELS: Record<string, string> = {
  determine_correct:      'Determine Correct Oil for My Vehicle',
  no_oil_required:        'No Oil Required',
  customer_supplies:      'I Will Supply My Own Oil',
  castrol_magnatec_5w30:  'Castrol Magnatec 5W30',
  castrol_magnatec_10w40: 'Castrol Magnatec 10W40',
  castrol_gtx_20w50:      'Castrol GTX 20W50',
  shell_helix_hx5:        'Shell Helix HX5',
  shell_helix_hx7:        'Shell Helix HX7',
  shell_helix_ultra:      'Shell Helix Ultra',
  mobil1_5w30:            'Mobil 1 5W30',
  mobil1_0w40:            'Mobil 1 0W40',
}

export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export { getTimeSlots, formatSlotDisplay } from './timeslots'
