-- ================================================================
-- SARANG LIVING — Sample Products Seed Data
-- Run this in your Supabase SQL Editor after schema.sql
-- ================================================================

INSERT INTO public.products (title, slug, price, original_price, category, description, images, is_bestseller, is_new_arrival, in_stock, stock_quantity, rating, review_count)
VALUES
  ('Minimalist Matte Pastel Claw Clip', 'minimalist-matte-pastel-claw-clip', 149.00, 249.00, 'claw-clips', 'Korean style non-slip pastel claw clip designed for effortless updos and all-day hold.', '["/products/claw-clip-1.jpg"]'::jsonb, true, true, true, 45, 4.9, 28),
  ('Silk Satin Oversized Scrunchie Set', 'silk-satin-oversized-scrunchie-set', 199.00, 299.00, 'scrunchies', 'Set of 3 premium mulberry silk feel scrunchies that prevent hair breakage and creasing.', '["/products/scrunchie-set-1.jpg"]'::jsonb, true, false, true, 60, 4.8, 34),
  ('Vintage Velvet Hair Bow Clip', 'vintage-velvet-hair-bow-clip', 229.00, 349.00, 'hair-bows', 'Elegant velvet hair bow with french barrette clip for romantic half-up hair styling.', '["/products/hair-bow-1.jpg"]'::jsonb, false, true, true, 30, 4.9, 19),
  ('Pearl & Crystal Padded Headband', 'pearl-crystal-padded-headband', 299.00, 499.00, 'headbands', 'Statement padded headband adorned with faux pearls and micro-crystals for special occasions.', '["/products/headband-1.jpg"]'::jsonb, true, true, true, 25, 5.0, 42),
  ('Korean Aesthetic Pastel Journal Set', 'korean-aesthetic-pastel-journal-set', 349.00, 499.00, 'stationery', 'Grid lined hardcover aesthetic journal with matching pastel sticky notes and gel pen.', '["/products/stationery-1.jpg"]'::jsonb, false, true, true, 40, 4.7, 15),
  ('Chic Tortoise Shell Jumbo Claw Clip', 'chic-tortoise-shell-jumbo-claw-clip', 179.00, 279.00, 'claw-clips', 'Durable acetate jumbo hair clip perfect for thick or long hair. Smooth rounded teeth.', '["/products/claw-clip-2.jpg"]'::jsonb, true, false, true, 50, 4.9, 51)
ON CONFLICT (slug) DO UPDATE 
SET 
  price = EXCLUDED.price,
  title = EXCLUDED.title,
  category = EXCLUDED.category;
