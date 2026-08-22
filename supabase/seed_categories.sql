-- ================================================================
-- PART 1: SEED CATEGORIES (10 items)
-- Run this FIRST in Supabase SQL Editor
-- ================================================================

INSERT INTO public.categories (name, slug, parent_category, description)
VALUES
  ('Claw Clips', 'claw-clips', 'Hair Accessories', 'From delicate mini clips to bold statement pieces — find the perfect claw clip for every hair moment.'),
  ('Scrunchies', 'scrunchies', 'Hair Accessories', 'Soft, stylish scrunchies in velvet, satin, pearl, and plaid — gentle on your hair, gorgeous on your wrist.'),
  ('Snap & Barrette Clips', 'snap-barrette-clips', 'Hair Accessories', 'Elegant snaps and barrettes — from pearl details to rhinestone sparkle.'),
  ('Bows', 'bows', 'Hair Accessories', 'Ribbon bows, rhinestone bows, striped bows — add a touch of sweetness to any look.'),
  ('Headbands', 'headbands', 'Hair Accessories', 'Padded, beaded, floral — headbands that elevate your everyday to editorial.'),
  ('Kids & Novelty Sets', 'kids-novelty-sets', 'Hair Accessories', 'Playful clip sets with cartoon characters and colorful designs — perfect for little ones.'),
  ('Ties & Elastics', 'ties-elastics', 'Hair Accessories', 'Hair ties, telephone cord rings, and elastic packs — essentials with a Sarang twist.'),
  ('Duck & Alligator Clips', 'duck-alligator-clips', 'Hair Accessories', 'Acetate, matte, and floral duck clips — the styling tool that doubles as an accessory.'),
  ('Pins & Forks', 'pins-forks', 'Hair Accessories', 'Elegant hair forks and pins for effortless updos.'),
  ('Nails', 'nails', 'Nails', 'Salon-quality press-on nails — instant glam, zero damage.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_category = EXCLUDED.parent_category,
  description = EXCLUDED.description;
