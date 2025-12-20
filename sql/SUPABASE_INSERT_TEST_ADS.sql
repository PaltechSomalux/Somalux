-- ============================================================
-- INSERT TEST ADS FOR HOMEPAGE, CATEGORIES, AND PASTPAPERS
-- ============================================================
-- Run this in your Supabase SQL Editor to add test ads

-- Test Ad 1: Homepage
INSERT INTO public.ads (
  title, 
  image_url, 
  placement, 
  is_active,
  countdown_seconds,
  is_skippable,
  created_at,
  updated_at
) VALUES (
  'Premium Books Collection',
  'https://via.placeholder.com/600x300?text=Premium+Books',
  'homepage',
  true,
  10,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Test Ad 2: Categories Page
INSERT INTO public.ads (
  title, 
  image_url, 
  placement, 
  is_active,
  countdown_seconds,
  is_skippable,
  created_at,
  updated_at
) VALUES (
  'Explore All Categories',
  'https://via.placeholder.com/600x300?text=Categories',
  'categories',
  true,
  10,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Test Ad 3: Past Papers Page
INSERT INTO public.ads (
  title, 
  image_url, 
  placement, 
  is_active,
  countdown_seconds,
  is_skippable,
  created_at,
  updated_at
) VALUES (
  'Past Papers Archive',
  'https://via.placeholder.com/600x300?text=Past+Papers',
  'pastpapers',
  true,
  10,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Test Ad 4: Another Homepage variant
INSERT INTO public.ads (
  title, 
  image_url, 
  placement, 
  is_active,
  countdown_seconds,
  is_skippable,
  created_at,
  updated_at
) VALUES (
  'Reading Challenge 2025',
  'https://via.placeholder.com/600x300?text=Reading+Challenge',
  'homepage',
  true,
  10,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Verify the ads were inserted
SELECT placement, COUNT(*) as ad_count, STRING_AGG(title, ', ') as titles
FROM public.ads
WHERE placement IN ('homepage', 'categories', 'pastpapers')
GROUP BY placement
ORDER BY placement;
