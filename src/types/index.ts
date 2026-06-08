export type UserRole      = 'customer' | 'driver' | 'admin'
export type VehicleType   = 'car_suv_bakkie' | 'motorbike'
export type VehicleCategory = 'car' | 'suv_bakkie' | 'panel_van' | 'motorbike'
export type PickupType    = 'standard' | 'express'
export type WashPackage   = 'full_house' | 'wash_and_go' | 'wash_and_dry' | 'full_house_polish' | 'inside_only' | 'custom_detail'
export type FuelType      = '95_unleaded' | 'diesel_50ppm'
export type FuelStation   = 'engen' | 'sasol'
export type FuelAmount    = '500' | '1000' | '1500'
export type OilOption     =
  | 'determine_correct' | 'no_oil_required' | 'customer_supplies'
  | 'castrol_magnatec_5w30' | 'castrol_magnatec_10w40' | 'castrol_gtx_20w50'
  | 'shell_helix_hx5' | 'shell_helix_hx7' | 'shell_helix_ultra'
  | 'mobil1_5w30' | 'mobil1_0w40'
export type PhotoType     = 'before' | 'after' | 'fuel_receipt' | 'damage' | 'odometer'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentProvider = 'placeholder' | 'payfast' | 'yoco' | 'ozow' | 'peach'

export type BookingStatus =
  | 'pending_payment' | 'confirmed' | 'driver_assigned' | 'driver_en_route'
  | 'pickup_arrived' | 'pickup_verified' | 'vehicle_collected'
  | 'at_wash_facility' | 'wash_in_progress' | 'concierge_in_progress'
  | 'returning_vehicle' | 'delivery_arrived' | 'delivery_pin_released'
  | 'delivery_verified' | 'completed' | 'cancelled'

export interface Profile {
  id: string; email: string; full_name: string | null; phone: string | null
  role: UserRole; avatar_url: string | null; created_at: string; updated_at: string
}

export interface Vehicle {
  id: string; customer_id: string; vehicle_type: VehicleType
  make: string; model: string; variant: string | null; registration: string
  year: number | null; color: string | null; is_active: boolean
  created_at: string; updated_at: string
}

export interface Booking {
  id: string; customer_id: string; driver_id: string | null; vehicle_id: string
  pickup_address: string; delivery_address: string; same_address: boolean
  booking_date: string; pickup_time: string; pickup_type: PickupType
  vehicle_category: VehicleCategory
  wash_package: WashPackage; wash_price: number
  concierge_selected: boolean; concierge_fee: number
  fuel_refill: boolean; fuel_type: FuelType | null; fuel_station: FuelStation | null
  fuel_amount: FuelAmount | null; fuel_price: number
  tyre_pressure: boolean; water_topup: boolean; oil_check: boolean; oil_option: OilOption | null
  extras_total: number; express_fee: number; subtotal: number; total: number
  pickup_pin_hash: string; delivery_pin_hash: string
  delivery_pin_released: boolean; pickup_pin_plain: string | null; delivery_pin_plain: string | null
  status: BookingStatus; admin_notes: string | null; created_at: string; updated_at: string
}

export interface BookingExtra {
  id: string; booking_id: string; service_code: string; service_name: string
  price: number; created_at: string
}

export interface BookingStatusEvent {
  id: string; booking_id: string; status: BookingStatus
  changed_by: string | null; notes: string | null
  metadata: Record<string, unknown> | null; created_at: string
}

export interface VehicleConditionReport {
  id: string; booking_id: string; odometer: number | null; fuel_level: string | null
  damage_notes: string | null; valuables_removed: boolean
  customer_signature_url: string | null; driver_signature_url: string | null; created_at: string
}

export interface BookingPhoto {
  id: string; booking_id: string; photo_type: PhotoType; storage_path: string
  storage_bucket: string; file_name: string | null; file_size: number | null
  uploaded_by: string | null; created_at: string
}

export interface DeliveryProof {
  id: string; booking_id: string; delivery_pin_verified: boolean
  proof_signature_url: string | null; gps_lat: number | null; gps_lng: number | null
  notes: string | null; completed_at: string | null
}

export interface Payment {
  id: string; booking_id: string; customer_id: string; amount: number
  currency: string; provider: PaymentProvider; provider_ref: string | null
  status: PaymentStatus; payload: Record<string, unknown> | null
  created_at: string; updated_at: string
}

export interface ServiceCatalog {
  id: string; code: string; name: string; description: string | null
  price: number; category: string; is_active: boolean; sort_order: number
  created_at: string; updated_at: string
}

export interface Driver {
  id: string; license_number: string | null; is_available: boolean
  current_lat: number | null; current_lng: number | null
  notes: string | null; created_at: string; updated_at: string
}

export interface BookingWithRelations extends Booking {
  customer?: Profile; driver?: Profile; vehicle?: Vehicle
  extras?: BookingExtra[]; photos?: BookingPhoto[]
  status_events?: BookingStatusEvent[]
  condition_report?: VehicleConditionReport
  delivery_proof?: DeliveryProof; payment?: Payment
}

export interface BookingFormState {
  vehicle_id: string; vehicle_type: VehicleType
  vehicle_category: VehicleCategory
  make: string; model: string; variant: string; registration: string
  pickup_address: string; delivery_address: string; same_address: boolean
  booking_date: string; pickup_time: string; pickup_type: PickupType
  wash_package: WashPackage; extras: string[]
  concierge_selected: boolean; fuel_refill: boolean
  fuel_type: FuelType | null; fuel_station: FuelStation | null; fuel_amount: FuelAmount | null
  tyre_pressure: boolean; water_topup: boolean; oil_check: boolean; oil_option: OilOption | null
  custom_detail_price?: number; custom_detail_notes?: string
}

export interface PriceBreakdown {
  wash_price: number; extras_total: number; express_fee: number
  concierge_fee: number; fuel_price: number; subtotal: number; total: number
}

export interface ApiResponse<T = void> {
  data?: T; error?: string
}
