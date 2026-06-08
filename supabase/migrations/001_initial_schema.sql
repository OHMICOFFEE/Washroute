-- ============================================================
-- Ohmi Pay Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('customer', 'driver', 'admin');
CREATE TYPE vehicle_type AS ENUM ('car_suv_bakkie', 'motorbike');
CREATE TYPE pickup_type AS ENUM ('standard', 'express');
CREATE TYPE wash_package AS ENUM ('quick_shine', 'signature_wash', 'executive_detail');
CREATE TYPE fuel_type AS ENUM ('95_unleaded', 'diesel_50ppm');
CREATE TYPE fuel_station AS ENUM ('engen', 'sasol');
CREATE TYPE fuel_amount AS ENUM ('500', '1000', '1500');
CREATE TYPE oil_option AS ENUM (
  'determine_correct',
  'no_oil_required',
  'customer_supplies',
  'castrol_magnatec_5w30',
  'castrol_magnatec_10w40',
  'castrol_gtx_20w50',
  'shell_helix_hx5',
  'shell_helix_hx7',
  'shell_helix_ultra',
  'mobil1_5w30',
  'mobil1_0w40'
);
CREATE TYPE booking_status AS ENUM (
  'pending_payment',
  'confirmed',
  'driver_assigned',
  'driver_en_route',
  'pickup_arrived',
  'pickup_verified',
  'vehicle_collected',
  'at_wash_facility',
  'wash_in_progress',
  'concierge_in_progress',
  'returning_vehicle',
  'delivery_arrived',
  'delivery_pin_released',
  'delivery_verified',
  'completed',
  'cancelled'
);
CREATE TYPE photo_type AS ENUM ('before', 'after', 'fuel_receipt', 'damage', 'odometer');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_provider AS ENUM ('placeholder', 'payfast', 'yoco', 'ozow', 'peach');

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT,
  phone        TEXT,
  role         user_role NOT NULL DEFAULT 'customer',
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VEHICLES
-- ============================================================

CREATE TABLE vehicles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type      vehicle_type NOT NULL DEFAULT 'car_suv_bakkie',
  make              TEXT NOT NULL,
  model             TEXT NOT NULL,
  variant           TEXT,
  registration      TEXT NOT NULL,
  year              INT,
  color             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DRIVERS
-- ============================================================

CREATE TABLE drivers (
  id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_number  TEXT,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  current_lat     DECIMAL(10, 8),
  current_lng     DECIMAL(11, 8),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVICE CATALOG
-- ============================================================

CREATE TABLE service_catalog (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  price        DECIMAL(10, 2) NOT NULL,
  category     TEXT NOT NULL, -- 'wash', 'extra', 'concierge', 'fuel', 'pickup'
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS
-- ============================================================

CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  driver_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  vehicle_id            UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,

  -- Location
  pickup_address        TEXT NOT NULL,
  delivery_address      TEXT NOT NULL,
  same_address          BOOLEAN NOT NULL DEFAULT FALSE,

  -- Schedule
  booking_date          DATE NOT NULL,
  pickup_time           TIME NOT NULL,
  pickup_type           pickup_type NOT NULL DEFAULT 'standard',

  -- Wash
  wash_package          wash_package NOT NULL,
  wash_price            DECIMAL(10, 2) NOT NULL,

  -- Concierge
  concierge_selected    BOOLEAN NOT NULL DEFAULT FALSE,
  concierge_fee         DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fuel_refill           BOOLEAN NOT NULL DEFAULT FALSE,
  fuel_type             fuel_type,
  fuel_station          fuel_station,
  fuel_amount           fuel_amount,
  fuel_price            DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tyre_pressure         BOOLEAN NOT NULL DEFAULT FALSE,
  water_topup           BOOLEAN NOT NULL DEFAULT FALSE,
  oil_check             BOOLEAN NOT NULL DEFAULT FALSE,
  oil_option            oil_option,

  -- Pricing
  extras_total          DECIMAL(10, 2) NOT NULL DEFAULT 0,
  express_fee           DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal              DECIMAL(10, 2) NOT NULL,
  total                 DECIMAL(10, 2) NOT NULL,

  -- Security
  pickup_pin_hash       TEXT NOT NULL,
  delivery_pin_hash     TEXT NOT NULL,
  delivery_pin_released BOOLEAN NOT NULL DEFAULT FALSE,
  pickup_pin_plain      TEXT, -- temporary plain for display to customer at booking creation only
  delivery_pin_plain    TEXT, -- revealed only after delivery_arrived

  -- Status
  status                booking_status NOT NULL DEFAULT 'pending_payment',
  admin_notes           TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKING EXTRAS (junction)
-- ============================================================

CREATE TABLE booking_extras (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_code TEXT NOT NULL,
  service_name TEXT NOT NULL,
  price        DECIMAL(10, 2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKING STATUS EVENTS (audit trail)
-- ============================================================

CREATE TABLE booking_status_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status       booking_status NOT NULL,
  changed_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes        TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VEHICLE CONDITION REPORTS
-- ============================================================

CREATE TABLE vehicle_condition_reports (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  odometer              INT,
  fuel_level            TEXT, -- 'empty', '1/4', '1/2', '3/4', 'full'
  damage_notes          TEXT,
  valuables_removed     BOOLEAN NOT NULL DEFAULT FALSE,
  customer_signature_url TEXT,
  driver_signature_url  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKING PHOTOS
-- ============================================================

CREATE TABLE booking_photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  photo_type    photo_type NOT NULL,
  storage_path  TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'booking-photos',
  file_name     TEXT,
  file_size     INT,
  uploaded_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DELIVERY PROOFS
-- ============================================================

CREATE TABLE delivery_proofs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  delivery_pin_verified BOOLEAN NOT NULL DEFAULT FALSE,
  proof_signature_url   TEXT,
  gps_lat               DECIMAL(10, 8),
  gps_lng               DECIMAL(11, 8),
  notes                 TEXT,
  completed_at          TIMESTAMPTZ
);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  amount           DECIMAL(10, 2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'ZAR',
  provider         payment_provider NOT NULL DEFAULT 'placeholder',
  provider_ref     TEXT,
  status           payment_status NOT NULL DEFAULT 'pending',
  payload          JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_driver ON bookings(driver_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_booking_photos_booking ON booking_photos(booking_id);
CREATE INDEX idx_booking_extras_booking ON booking_extras(booking_id);
CREATE INDEX idx_status_events_booking ON booking_status_events(booking_id);
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_service_catalog_updated BEFORE UPDATE ON service_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_drivers_updated BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is driver
CREATE OR REPLACE FUNCTION is_driver()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_condition_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON profiles
  FOR ALL USING (is_admin());

-- VEHICLES
CREATE POLICY "vehicles_own" ON vehicles
  FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "vehicles_admin" ON vehicles
  FOR ALL USING (is_admin());
CREATE POLICY "vehicles_driver_read" ON vehicles
  FOR SELECT USING (
    is_driver() AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.vehicle_id = vehicles.id
        AND bookings.driver_id = auth.uid()
    )
  );

-- BOOKINGS
CREATE POLICY "bookings_customer_own" ON bookings
  FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "bookings_driver_assigned" ON bookings
  FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "bookings_driver_update" ON bookings
  FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "bookings_admin" ON bookings
  FOR ALL USING (is_admin());

-- BOOKING EXTRAS
CREATE POLICY "extras_customer" ON booking_extras
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_extras.booking_id AND bookings.customer_id = auth.uid())
  );
CREATE POLICY "extras_driver" ON booking_extras
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_extras.booking_id AND bookings.driver_id = auth.uid())
  );
CREATE POLICY "extras_admin" ON booking_extras FOR ALL USING (is_admin());

-- BOOKING STATUS EVENTS
CREATE POLICY "status_events_customer" ON booking_status_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_status_events.booking_id AND bookings.customer_id = auth.uid())
  );
CREATE POLICY "status_events_driver" ON booking_status_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_status_events.booking_id AND bookings.driver_id = auth.uid())
  );
CREATE POLICY "status_events_admin" ON booking_status_events FOR ALL USING (is_admin());

-- CONDITION REPORTS
CREATE POLICY "condition_customer" ON vehicle_condition_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = vehicle_condition_reports.booking_id AND bookings.customer_id = auth.uid())
  );
CREATE POLICY "condition_driver" ON vehicle_condition_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = vehicle_condition_reports.booking_id AND bookings.driver_id = auth.uid())
  );
CREATE POLICY "condition_admin" ON vehicle_condition_reports FOR ALL USING (is_admin());

-- BOOKING PHOTOS
CREATE POLICY "photos_customer" ON booking_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_photos.booking_id AND bookings.customer_id = auth.uid())
  );
CREATE POLICY "photos_driver" ON booking_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_photos.booking_id AND bookings.driver_id = auth.uid())
  );
CREATE POLICY "photos_admin" ON booking_photos FOR ALL USING (is_admin());

-- DELIVERY PROOFS
CREATE POLICY "proofs_customer" ON delivery_proofs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = delivery_proofs.booking_id AND bookings.customer_id = auth.uid())
  );
CREATE POLICY "proofs_driver" ON delivery_proofs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = delivery_proofs.booking_id AND bookings.driver_id = auth.uid())
  );
CREATE POLICY "proofs_admin" ON delivery_proofs FOR ALL USING (is_admin());

-- PAYMENTS
CREATE POLICY "payments_customer" ON payments
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "payments_admin" ON payments FOR ALL USING (is_admin());

-- SERVICE CATALOG (public read)
CREATE POLICY "service_catalog_read" ON service_catalog
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "service_catalog_admin" ON service_catalog
  FOR ALL USING (is_admin());

-- DRIVERS
CREATE POLICY "drivers_self" ON drivers
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "drivers_admin" ON drivers FOR ALL USING (is_admin());
CREATE POLICY "drivers_customer_read" ON drivers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.driver_id = drivers.id AND bookings.customer_id = auth.uid())
  );
