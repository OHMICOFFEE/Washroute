# Ohmi Pay 🚗✨

**Premium car wash and vehicle concierge booking platform.**

Ohmi Pay allows existing clients to schedule vehicle pickup, wash, fuel refill, tyre/water/oil checks, secure chain-of-custody handover, and payment — all from a luxury mobile-first web app.

---

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Framework    | Next.js 14 (App Router)                 |
| Language     | TypeScript                              |
| Styling      | Tailwind CSS (dark luxury theme)        |
| Auth         | Supabase Auth                           |
| Database     | Supabase Postgres + RLS                 |
| Storage      | Supabase Storage                        |
| Payments     | Pluggable: PayFast / Yoco / Ozow / Peach|
| Deployment   | Vercel                                  |

---

## Project Structure

```
ohmi-pay/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, Register
│   │   ├── (customer)/       # Dashboard, Bookings
│   │   ├── (driver)/         # Driver Dashboard, Job Detail
│   │   ├── (admin)/          # Admin Dashboard, Bookings, Drivers, Services
│   │   └── api/              # REST API routes
│   ├── components/
│   │   ├── ui/               # Button, Input, Select, Card, StatusBadge, PinDisplay
│   │   ├── booking/          # BookingWizard + 6 step components
│   │   ├── driver/           # DriverJobActions
│   │   ├── admin/            # AdminBookingList, AdminServiceManager, AdminDriverManager
│   │   └── shared/           # Navbar, BookingTimeline
│   ├── lib/
│   │   ├── supabase/         # client.ts, server.ts, middleware.ts
│   │   └── utils/            # pricing.ts, payments.ts, index.ts
│   ├── types/                # index.ts — all TypeScript types
│   └── middleware.ts          # Auth + role-guard middleware
├── supabase/
│   ├── migrations/           # 001_initial_schema.sql, 002_storage.sql
│   └── seed/                 # 001_seed.sql
└── ...config files
```

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_ORG/ohmi-pay.git
cd ohmi-pay
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Copy your **service_role key** (keep this secret — server-side only)

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
PIN_SECRET=your-random-32-char-secret
PAYMENT_PROVIDER=placeholder
```

### 4. Run database migrations

In the **Supabase SQL Editor** (or via CLI), run in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_storage.sql
supabase/seed/001_seed.sql
```

**Or with Supabase CLI:**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 5. Create test users

In **Supabase Dashboard → Authentication → Users → Add User**:

| Email                        | Password     | Role     |
|------------------------------|--------------|----------|
| admin@ohmi-pay.co.za        | Admin1234!   | admin    |
| driver@ohmi-pay.co.za       | Driver1234!  | driver   |
| customer@ohmi-pay.co.za     | Customer123! | customer |

Then run these SQL commands to set roles:

```sql
UPDATE profiles SET role = 'admin'  WHERE email = 'admin@ohmi-pay.co.za';
UPDATE profiles SET role = 'driver' WHERE email = 'driver@ohmi-pay.co.za';

-- Create driver record
INSERT INTO drivers (id)
SELECT id FROM profiles WHERE email = 'driver@ohmi-pay.co.za';
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Booking Flow

1. **Customer** logs in → **New Booking**
2. Step 1: Select / add vehicle (type, make, model, registration)
3. Step 2: Pickup address, delivery address, date, time slot (15-min intervals 06:00–18:00), standard/express
4. Step 3: Wash package (Quick Shine R120 / Signature R220 / Executive R450)
5. Step 4: Extras (engine bay, seat shampoo, pet hair, spray wax)
6. Step 5: Vehicle Concierge — tyre/water/oil checks + optional fuel refill
7. Step 6: Review with live price → Confirm & Pay
8. **Pickup PIN** displayed immediately in booking detail
9. **Delivery PIN** locked until driver marks vehicle returned

---

## Security & Chain of Custody

| Event                   | Action                                              |
|-------------------------|-----------------------------------------------------|
| Booking created         | Pickup PIN generated + hashed (bcrypt)              |
| Driver arrives          | Driver captures odometer, fuel, photos, damage notes |
| Customer provides PIN   | Server-side bcrypt verify → custody transferred     |
| Wash & concierge done   | Driver updates status; customer sees live timeline  |
| Driver returns          | Driver taps "Arrived at Delivery"                   |
| Delivery PIN released   | New PIN generated server-side; shown to customer    |
| Customer provides PIN   | Server-side verify → booking marked complete        |

**PINs are NEVER stored in plain text (except the temporary `_plain` columns for display, which are cleared on completion).**

---

## Booking Statuses

```
pending_payment → confirmed → driver_assigned → driver_en_route →
pickup_arrived → pickup_verified → vehicle_collected →
at_wash_facility → wash_in_progress → returning_vehicle →
delivery_arrived → delivery_pin_released → delivery_verified → completed
```

Also: `cancelled` (from most states), `concierge_in_progress` (parallel to wash).

---

## Payment Integration

The payment module is in `src/lib/utils/payments.ts`. Switch provider by setting:

```env
PAYMENT_PROVIDER=payfast   # or yoco, ozow, peach, placeholder
```

Add the corresponding keys to `.env.local`. Each provider has its own function — the factory `initPayment()` routes automatically.

**PayFast setup:**
```env
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn
```

**Yoco setup:**
```env
YOCO_SECRET_KEY=sk_test_...
```

**Ozow setup:**
```env
OZOW_SITE_CODE=XXX-XXX-XXX
OZOW_API_KEY=...
```

**Peach Payments:**
```env
PEACH_ACCESS_TOKEN=OGE4...
PEACH_ENTITY_ID=8a82...
```

---

## Roles

| Role     | Capabilities                                                                              |
|----------|-------------------------------------------------------------------------------------------|
| customer | Create bookings, view own bookings, see pickup PIN, see delivery PIN once released        |
| driver   | View assigned jobs, verify PINs, upload photos, advance booking status                   |
| admin    | View all bookings, assign drivers, manage services & pricing, view payments & photos      |

---

## API Routes

| Method | Route                                    | Description                          |
|--------|------------------------------------------|--------------------------------------|
| POST   | `/api/bookings`                          | Create booking (generates PINs)      |
| PATCH  | `/api/bookings/[id]/status`              | Advance booking status               |
| PATCH  | `/api/bookings/[id]/assign`              | Admin assigns driver                 |
| POST   | `/api/bookings/[id]/condition`           | Save pickup condition report         |
| POST   | `/api/bookings/[id]/release-delivery-pin`| Release delivery PIN                 |
| POST   | `/api/verify-pin`                        | Verify pickup or delivery PIN        |
| POST   | `/api/upload`                            | Upload photo to Supabase Storage     |
| POST   | `/api/payments`                          | Initiate payment                     |
| POST   | `/api/admin/create-driver`               | Admin creates driver account         |

---

## GitHub Setup

```bash
git init
git add .
git commit -m "feat: initial Ohmi Pay codebase"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/ohmi-pay.git
git push -u origin main
```

---

## Vercel Deployment

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
2. Select the `ohmi-pay` repository
3. Add all environment variables from `.env.local` in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` → set to your Vercel URL (e.g. `https://ohmi-pay.vercel.app`)
   - `PIN_SECRET`
   - `PAYMENT_PROVIDER`
   - Payment provider keys as needed
4. Click **Deploy**

**After deployment:**
- Update `NEXT_PUBLIC_APP_URL` to your production URL
- Add the Vercel domain to Supabase → Authentication → URL Configuration → Site URL and Redirect URLs
- Re-deploy to pick up the updated URL

---

## Database Schema Summary

| Table                    | Purpose                                      |
|--------------------------|----------------------------------------------|
| `profiles`               | Auth users + role (customer/driver/admin)    |
| `vehicles`               | Customer vehicles                            |
| `bookings`               | Core booking record with all fields          |
| `booking_extras`         | Selected add-on extras per booking           |
| `booking_status_events`  | Full audit trail of status changes           |
| `vehicle_condition_reports` | Pickup condition capture                  |
| `booking_photos`         | Before/after/receipt photo metadata          |
| `delivery_proofs`        | Delivery completion record                   |
| `payments`               | Payment records per booking                  |
| `service_catalog`        | Admin-managed services and pricing           |
| `drivers`                | Driver-specific profile data                 |

All tables have **Row Level Security** enabled:
- Customers see only their own data
- Drivers see only assigned bookings
- Admins see everything

---

## Environment Variable Reference

| Variable                      | Required | Description                                      |
|-------------------------------|----------|--------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | ✅       | Your Supabase project URL                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅     | Supabase anon/public key                         |
| `SUPABASE_SERVICE_ROLE_KEY`   | ✅       | Service role key (server-side only, never expose)|
| `NEXT_PUBLIC_APP_URL`         | ✅       | App base URL for payment callbacks               |
| `PIN_SECRET`                  | ✅       | Random secret for PIN operations                 |
| `PAYMENT_PROVIDER`            | ✅       | `placeholder` / `payfast` / `yoco` / `ozow` / `peach` |
| `PAYFAST_MERCHANT_ID`         | ⚡       | PayFast merchant ID                              |
| `PAYFAST_MERCHANT_KEY`        | ⚡       | PayFast merchant key                             |
| `PAYFAST_PASSPHRASE`          | ⚡       | PayFast passphrase                               |
| `YOCO_SECRET_KEY`             | ⚡       | Yoco secret key                                  |
| `OZOW_SITE_CODE`              | ⚡       | Ozow site code                                   |
| `OZOW_API_KEY`                | ⚡       | Ozow API key                                     |
| `PEACH_ACCESS_TOKEN`          | ⚡       | Peach Payments access token                      |
| `PEACH_ENTITY_ID`             | ⚡       | Peach Payments entity ID                         |

⚡ = required only for that provider

---

## Local Supabase Development (Optional)

```bash
npm install -g supabase
supabase init
supabase start
# Runs local Postgres on port 54322, Studio on 54323
```

---

## License

Private — Ohmi Pay. All rights reserved.
