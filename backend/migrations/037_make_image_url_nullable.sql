-- ============================================================
-- FIX: MAKE image_url COLUMN NULLABLE FOR VIDEO ADS
-- ============================================================

-- The image_url column needs to be nullable for video ads
-- (video ads don't have image URLs)

ALTER TABLE ads 
ALTER COLUMN image_url DROP NOT NULL;

-- Add default NULL for image_url if it was set to something else
ALTER TABLE ads 
ALTER COLUMN image_url SET DEFAULT NULL;

-- Verify the change
-- SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'image_url';
