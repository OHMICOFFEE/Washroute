-- ============================================================
-- Ohmi Pay Seed Data
-- ============================================================

-- SERVICE CATALOG
INSERT INTO service_catalog (code, name, description, price, category, sort_order) VALUES
-- Wash packages
('quick_shine',        'Quick Shine',        'Exterior wash and dry. Fast and effective.',                       120.00, 'wash',      1),
('signature_wash',     'Signature Wash',     'Full exterior wash, interior vacuum, windows cleaned.',            220.00, 'wash',      2),
('executive_detail',   'Executive Detail',   'Complete detailing — exterior, interior, tyre dressing, polish.', 450.00, 'wash',      3),

-- Extras
('engine_bay_clean',   'Engine Bay Clean',   'Professional engine bay degreasing and rinse.',                    80.00, 'extra',     1),
('seat_shampoo',       'Seat Shampoo',       'Deep-clean fabric or leather seats.',                             150.00, 'extra',     2),
('pet_hair_removal',   'Pet Hair Removal',   'Full interior pet hair extraction.',                              100.00, 'extra',     3),
('spray_wax',          'Spray Wax Protection','Hydrophobic spray wax applied to paintwork.',                     90.00, 'extra',     4),

-- Concierge
('concierge_fee',      'Vehicle Concierge',  'Tyre pressure check, windscreen water top-up, oil level check.', 100.00, 'concierge', 1),

-- Pickup types
('standard_pickup',    'Standard Pickup',    'Scheduled pickup within a 2-hour window.',                          0.00, 'pickup',    1),
('express_pickup',     'Express Pickup',     'Priority pickup within 30 minutes.',                               75.00, 'pickup',    2),

-- Fuel amounts (price is the fuel value itself, billed at cost)
('fuel_500',           'Fuel R500',          'R500 fuel top-up at selected station.',                           500.00, 'fuel',      1),
('fuel_1000',          'Fuel R1000',         'R1000 fuel top-up at selected station.',                         1000.00, 'fuel',      2),
('fuel_1500',          'Fuel R1500',         'R1500 fuel top-up at selected station.',                         1500.00, 'fuel',      3);

-- ============================================================
-- TEST PROFILES (create via Supabase Auth dashboard or use
-- supabase CLI: supabase auth import)
-- IDs here are illustrative — replace with real auth.users IDs
-- after creating test accounts.
-- ============================================================

-- To create test users, use the Supabase dashboard under
-- Authentication > Users > Add User, then run:
--
-- UPDATE profiles SET role = 'admin'  WHERE email = 'admin@ohmi-pay.co.za';
-- UPDATE profiles SET role = 'driver' WHERE email = 'driver@ohmi-pay.co.za';
--
-- Then insert the driver record:
-- INSERT INTO drivers (id) SELECT id FROM profiles WHERE email = 'driver@ohmi-pay.co.za';

-- Example vehicles (add after creating customer test user)
-- INSERT INTO vehicles (customer_id, vehicle_type, make, model, variant, registration, year, color)
-- VALUES
--   ('<customer-uuid>', 'car_suv_bakkie', 'BMW',       '3 Series', '320i Sport',       'CA 123-456', 2021, 'Alpine White'),
--   ('<customer-uuid>', 'car_suv_bakkie', 'Toyota',    'Fortuner',  '2.8 GD-6 4x4',    'CA 789-012', 2022, 'Graphite Grey'),
--   ('<customer-uuid>', 'motorbike',      'Kawasaki',  'Ninja 400', 'ABS',              'CA 321-654', 2020, 'Lime Green');
