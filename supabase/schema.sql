-- ================================================================
-- SARANG LIVING — Supabase Database Schema  (Phase 1)
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor)
--
-- This script is idempotent — safe to re-run on an existing database.
-- It DROPS and recreates: products, order_items, categories
-- It preserves:          profiles, addresses, orders
-- ================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Admin check — used by RLS policies
-- Returns TRUE if the currently authenticated user has role = 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Auto-update updated_at column on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- DROP TABLES BEING REDESIGNED (reverse dependency order)
-- ================================================================

DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.categories;

-- ================================================================
-- 2. CATEGORIES TABLE (NEW)
-- ================================================================

CREATE TABLE public.categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT UNIQUE NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  parent_category TEXT NOT NULL DEFAULT 'Hair Accessories',
  description     TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- ================================================================
-- 3. PRODUCTS TABLE (REDESIGNED)
-- ================================================================

CREATE TABLE public.products (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku              TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  price            NUMERIC(10, 2) NOT NULL,
  compare_at_price NUMERIC(10, 2),
  category_id      UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  description      TEXT,
  images           JSONB NOT NULL DEFAULT '[]'::jsonb,
  stock_quantity   INT NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- Auto-update updated_at on product changes
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- 4. PROFILES TABLE (Extends Supabase Auth users)
--    Uses IF NOT EXISTS to preserve existing user data
-- ================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  phone      TEXT,
  avatar_url TEXT,
  role       TEXT DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 5. SAVED ADDRESSES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.addresses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone          TEXT NOT NULL,
  street         TEXT NOT NULL,
  city           TEXT NOT NULL,
  state          TEXT NOT NULL,
  postal_code    TEXT NOT NULL,
  is_default     BOOLEAN DEFAULT false,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 6. ORDERS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email       TEXT NOT NULL,
  total_amount     NUMERIC(10, 2) NOT NULL,
  payment_status   TEXT NOT NULL DEFAULT 'pending',
  payment_method   TEXT DEFAULT 'cod',
  shipping_status  TEXT NOT NULL DEFAULT 'processing',
  shipping_address JSONB NOT NULL,
  tracking_number  TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 7. ORDER ITEMS TABLE (recreated — depends on new products table)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  quantity      INT NOT NULL,
  price         NUMERIC(10, 2) NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- ── Categories ──────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public categories view" ON public.categories;
CREATE POLICY "Public categories view"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can insert categories" ON public.categories;
CREATE POLICY "Admin can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update categories" ON public.categories;
CREATE POLICY "Admin can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete categories" ON public.categories;
CREATE POLICY "Admin can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_admin());

-- ── Products ────────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public products view" ON public.products;
CREATE POLICY "Public products view"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can insert products" ON public.products;
CREATE POLICY "Admin can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update products" ON public.products;
CREATE POLICY "Admin can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete products" ON public.products;
CREATE POLICY "Admin can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- ── Profiles ────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── Addresses ───────────────────────────────────────────────────
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
CREATE POLICY "Users can view own addresses"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
CREATE POLICY "Users can insert own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
CREATE POLICY "Users can update own addresses"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
CREATE POLICY "Users can delete own addresses"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ── Orders ──────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Order Items ─────────────────────────────────────────────────
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND public.orders.user_id = auth.uid()
    )
  );

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-create profile row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
