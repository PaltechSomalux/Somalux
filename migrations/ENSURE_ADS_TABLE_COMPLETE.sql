-- =====================================================
-- Migration: Ensure ADS Table Has All Necessary Columns
-- =====================================================
-- This ensures the ads table has all columns needed to maintain
-- perfect parity with user_ads table for unified display

-- Add user tracking columns (for tracking ad origin)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Add approval tracking columns
ALTER TABLE ads ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add video thumbnail column if missing
ALTER TABLE ads ADD COLUMN IF NOT EXISTS video_thumbnail_url VARCHAR(2048);

-- Ensure description column exists
ALTER TABLE ads ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure status column exists (might only have is_active before)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';

-- Add JSONB-compatible targeting columns for consistency
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ab_test_group VARCHAR(50) DEFAULT 'control';

-- Add campaign columns if missing
ALTER TABLE ads ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS campaign_name VARCHAR(255);

-- Add missing budget/performance columns
ALTER TABLE ads ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS countdown_seconds INTEGER DEFAULT 10;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS is_skippable BOOLEAN DEFAULT true;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS total_impressions INTEGER DEFAULT 0;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0;

-- =====================================================
-- Also ensure user_ads table has all the same columns
-- =====================================================

-- Remove overly strict CHECK constraints on status and priority if they exist
ALTER TABLE user_ads DROP CONSTRAINT IF EXISTS user_ads_priority_check;
ALTER TABLE user_ads DROP CONSTRAINT IF EXISTS user_ads_status_check;

-- Add any missing performance/tracking columns to user_ads
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS countdown_seconds INTEGER DEFAULT 10;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS is_skippable BOOLEAN DEFAULT true;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS video_thumbnail_url VARCHAR(2048);
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS campaign_name VARCHAR(255);
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS ab_test_id UUID;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS pixel_id VARCHAR(255);
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS target_locations TEXT;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS target_interests TEXT;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS total_dismisses INTEGER DEFAULT 0;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS total_impressions INTEGER DEFAULT 0;
ALTER TABLE user_ads ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0;

-- If ad_analytics enforces a foreign key to ads.id, user-submitted ad IDs will fail
-- when inserting analytics rows for `user_ads` entries. Drop the strict FK so
-- `ad_analytics.ad_id` can record events for both `ads` and `user_ads` ids.
ALTER TABLE ad_analytics DROP CONSTRAINT IF EXISTS ad_analytics_ad_id_fkey;

-- Optional: If you prefer to keep source context, add an `ad_source` column
-- and a `submitted_ad_id` column to map user-submitted ads explicitly.
ALTER TABLE ad_analytics ADD COLUMN IF NOT EXISTS ad_source VARCHAR(32) DEFAULT 'ads';
ALTER TABLE ad_analytics ADD COLUMN IF NOT EXISTS submitted_ad_id UUID;

-- =====================================================
-- VERIFICATION & COMPARISON QUERIES
-- =====================================================

-- Find columns in ads but NOT in user_ads
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'ads' 
  AND column_name NOT IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'user_ads'
  )
ORDER BY column_name;

-- Check all columns in ads table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ads' 
ORDER BY column_name;

-- Check all columns in user_ads table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_ads' 
ORDER BY column_name;

-- Compare column counts
SELECT 
  'ads' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'ads'
UNION ALL
SELECT 
  'user_ads' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'user_ads';
