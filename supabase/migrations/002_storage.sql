-- ============================================================
-- Ohmi Pay Storage Buckets
-- Migration: 002_storage.sql
-- Run in Supabase SQL Editor after creating storage buckets
-- ============================================================

-- Create storage buckets (run via Supabase dashboard OR these SQL statements)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('booking-photos', 'booking-photos', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('signatures',     'signatures',     false, 2097152,  ARRAY['image/png','image/svg+xml']),
  ('receipts',       'receipts',       false, 5242880,  ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS Policies ────────────────────────────────────

-- booking-photos: drivers can upload, customers/admins can read their own
CREATE POLICY "photos_upload_driver" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'booking-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('driver', 'admin')
    )
  );

CREATE POLICY "photos_read_customer" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'booking-photos'
    AND (
      -- Admin can read all
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      OR
      -- Customer can read photos of their bookings
      EXISTS (
        SELECT 1 FROM public.bookings b
        JOIN public.booking_photos bp ON bp.booking_id = b.id
        WHERE b.customer_id = auth.uid()
          AND bp.storage_path = storage.objects.name
      )
      OR
      -- Driver can read photos of assigned bookings
      EXISTS (
        SELECT 1 FROM public.bookings b
        JOIN public.booking_photos bp ON bp.booking_id = b.id
        WHERE b.driver_id = auth.uid()
          AND bp.storage_path = storage.objects.name
      )
    )
  );

-- signatures bucket
CREATE POLICY "signatures_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "signatures_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'signatures');

-- receipts bucket
CREATE POLICY "receipts_upload_driver" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('driver', 'admin'))
  );

CREATE POLICY "receipts_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.customer_id = auth.uid()
          AND EXISTS (
            SELECT 1 FROM public.booking_photos bp
            WHERE bp.booking_id = b.id AND bp.storage_path = storage.objects.name
          )
      )
    )
  );
