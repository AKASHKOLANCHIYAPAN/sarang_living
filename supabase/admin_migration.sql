-- ================================================================
-- SARANG LIVING — Admin Dashboard Migration (Non-Destructive)
-- Safe to run on the live database. Idempotent where practical.
--
-- This migration:
--   1. Fixes Nails category parent → Hair Accessories
--   2. Adds Stationery & Gift Accessories classifications
--   3. Adds admin RLS policies for orders (admin can view/update all)
--   4. Adds admin RLS policies for profiles (admin can view all for auth)
--   5. Creates product-images storage bucket + policies
--
-- DOES NOT: drop tables, delete products, recreate categories, truncate data
-- ================================================================

-- ================================================================
-- 1. FIX: Nails category parent_category
-- Currently parent_category = 'Nails', should be 'Hair Accessories'
-- This preserves the existing Nails row ID — no duplicate created.
-- ================================================================
UPDATE public.categories
SET parent_category = 'Hair Accessories'
WHERE slug = 'nails'
  AND parent_category != 'Hair Accessories';

-- ================================================================
-- 2. ADD: Top-level classifications (parent_category IS NULL)
-- These represent the classification tier above categories.
-- 'Hair Accessories' doesn't need a row — it's the parent_category
-- value on existing child rows. But for the admin dropdown to work
-- properly, we create explicit classification rows.
-- ================================================================

-- Hair Accessories classification (may already exist as parent text)
INSERT INTO public.categories (name, slug, parent_category, description)
VALUES (
  'Hair Accessories',
  'hair-accessories',
  'Hair Accessories',
  'Complete range of hair accessories including clips, bows, headbands, and more.'
)
ON CONFLICT (slug) DO NOTHING;

-- Stationery classification
INSERT INTO public.categories (name, slug, parent_category, description)
VALUES (
  'Stationery',
  'stationery',
  'Stationery',
  'Korean-minimalist stationery, planners, and desk accessories.'
)
ON CONFLICT (slug) DO NOTHING;

-- Gift Accessories classification
INSERT INTO public.categories (name, slug, parent_category, description)
VALUES (
  'Gift Accessories',
  'gift-accessories',
  'Gift Accessories',
  'Curated gift boxes, wrapping, and accessories for every occasion.'
)
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- 3. ADMIN RLS: Orders — Allow admin to view and update all orders
-- ================================================================
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
CREATE POLICY "Admin can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update all orders" ON public.orders;
CREATE POLICY "Admin can update all orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- ================================================================
-- 4. ADMIN RLS: Order Items — Allow admin to view all order items
-- ================================================================
DROP POLICY IF EXISTS "Admin can view all order items" ON public.order_items;
CREATE POLICY "Admin can view all order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin());

-- ================================================================
-- 5. ADMIN RLS: Profiles — Allow admin to view all profiles
-- Required for admin auth checks and customer management
-- ================================================================
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- ================================================================
-- 6. STORAGE: Create product-images bucket
-- Run in Supabase Dashboard > Storage or via SQL
-- NOTE: Storage bucket creation via SQL may require superuser.
-- If this fails, create the bucket manually in the dashboard.
-- ================================================================

-- Insert bucket if not exists (Supabase storage schema)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 7. STORAGE POLICIES: product-images bucket
-- Public read, admin-only write/update/delete
-- ================================================================

-- Allow public read access (for storefront to display images)
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow admin to upload product images
DROP POLICY IF EXISTS "Admin can upload product images" ON storage.objects;
CREATE POLICY "Admin can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Allow admin to update product images
DROP POLICY IF EXISTS "Admin can update product images" ON storage.objects;
CREATE POLICY "Admin can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Allow admin to delete product images
DROP POLICY IF EXISTS "Admin can delete product images" ON storage.objects;
CREATE POLICY "Admin can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );
