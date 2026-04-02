-- ============================================================
-- ADD TEST ADS FOR HOMEPAGE, CATEGORIES, AND PASTPAPERS
-- ============================================================

-- Test Ad for Homepage
INSERT INTO ads (
  title, 
  description, 
  image_url, 
  placement, 
  status, 
  priority,
  ad_type,
  cta_text,
  cta_button_color,
  is_active
) VALUES (
  'Premium Books',
  'Discover exclusive premium content and unlock unlimited reading access',
  '/ads/test-homepage.jpg',
  'homepage',
  'active',
  1,
  'image',
  'Subscribe Now',
  '#007bff',
  true
)
ON CONFLICT DO NOTHING;

-- Test Ad for Categories
INSERT INTO ads (
  title, 
  description, 
  image_url, 
  placement, 
  status, 
  priority,
  ad_type,
  cta_text,
  cta_button_color,
  is_active
) VALUES (
  'Browse Categories',
  'Explore thousands of books organized by category',
  '/ads/test-categories.jpg',
  'categories',
  'active',
  1,
  'image',
  'Browse',
  '#28a745',
  true
)
ON CONFLICT DO NOTHING;

-- Test Ad for Past Papers
INSERT INTO ads (
  title, 
  description, 
  image_url, 
  placement, 
  status, 
  priority,
  ad_type,
  cta_text,
  cta_button_color,
  is_active
) VALUES (
  'Past Papers Archive',
  'Access comprehensive past papers collection for exam preparation',
  '/ads/test-pastpapers.jpg',
  'pastpapers',
  'active',
  1,
  'image',
  'View Papers',
  '#ffc107',
  true
)
ON CONFLICT DO NOTHING;

-- Another ad variant for homepage (so there are choices)
INSERT INTO ads (
  title, 
  description, 
  image_url, 
  placement, 
  status, 
  priority,
  ad_type,
  cta_text,
  cta_button_color,
  is_active
) VALUES (
  'Reading Challenge',
  'Join our reading challenge and earn badges',
  '/ads/test-challenge.jpg',
  'homepage',
  'active',
  2,
  'image',
  'Join Now',
  '#17a2b8',
  true
)
ON CONFLICT DO NOTHING;
