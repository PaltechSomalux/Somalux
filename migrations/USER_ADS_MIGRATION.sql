-- =====================================================
-- Migration: Create User Ad Submissions Table
-- =====================================================
-- This creates the schema for user-submitted advertisements
-- Run this in your Supabase SQL Editor

-- Step 1: Create user_ads table for user submissions
CREATE TABLE IF NOT EXISTS user_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  
  -- Basic Ad Information
  title TEXT NOT NULL,
  description TEXT,
  ad_type TEXT DEFAULT 'image' CHECK (ad_type IN ('image', 'video')),
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  video_duration INTEGER DEFAULT 0,
  
  -- Call to Action
  click_url TEXT NOT NULL,
  cta_text TEXT DEFAULT 'Learn More',
  cta_button_color TEXT DEFAULT '#00a884',
  
  -- Placement & Scheduling
  placement TEXT DEFAULT 'homepage',
  start_date DATE,
  end_date DATE,
  
  -- Budget & Performance
  budget DECIMAL(10, 2) DEFAULT 0,
  daily_budget DECIMAL(10, 2) DEFAULT 0,
  cost_per_click DECIMAL(10, 4) DEFAULT 0.5,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_dismisses INTEGER DEFAULT 0,
  
  -- Targeting
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 100,
  target_gender TEXT DEFAULT 'all' CHECK (target_gender IN ('all', 'male', 'female')),
  target_devices TEXT DEFAULT '["mobile","tablet","desktop"]', -- JSON array stored as text
  target_locations TEXT, -- JSON array of locations
  target_interests TEXT, -- JSON array of interests
  
  -- Advanced Settings
  priority TEXT DEFAULT 'medium',
  frequency_cap INTEGER DEFAULT 0,
  conversion_tracking BOOLEAN DEFAULT false,
  conversion_url TEXT,
  ab_test_group TEXT DEFAULT 'control',
  ab_test_id UUID,
  pixel_id VARCHAR(255),
  
  -- Campaign
  campaign_id UUID,
  campaign_name VARCHAR(255),
  
  -- Additional Fields  
  budget_spent DECIMAL(10, 2) DEFAULT 0,
  countdown_seconds INTEGER DEFAULT 10,
  is_skippable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  video_thumbnail_url VARCHAR(2048),
  
  -- Status & Approval
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_ads_user_id ON user_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ads_status ON user_ads(status);
CREATE INDEX IF NOT EXISTS idx_user_ads_created_at ON user_ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ads_ad_type ON user_ads(ad_type);
CREATE INDEX IF NOT EXISTS idx_user_ads_user_email ON user_ads(user_email);

-- Step 3: Create RLS (Row Level Security) policies
ALTER TABLE user_ads ENABLE ROW LEVEL SECURITY;

-- Use conditional creation to avoid "policy already exists" errors when running migration multiple times
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ads' AND policyname = 'Users can view own ads'
  ) THEN
    CREATE POLICY "Users can view own ads" ON user_ads
      FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ads' AND policyname = 'Users can create own ads'
  ) THEN
    CREATE POLICY "Users can create own ads" ON user_ads
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ads' AND policyname = 'Admins can create ads for users'
  ) THEN
    CREATE POLICY "Admins can create ads for users" ON user_ads
      FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ads' AND policyname = 'Users can update own pending ads'
  ) THEN
    CREATE POLICY "Users can update own pending ads" ON user_ads
      FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
      WITH CHECK (auth.uid() = user_id AND status = 'pending');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ads' AND policyname = 'Admins can view all ads'
  ) THEN
    CREATE POLICY "Admins can view all ads" ON user_ads
      FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_ads' AND policyname = 'Admins can manage ads'
  ) THEN
    CREATE POLICY "Admins can manage ads" ON user_ads
      FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin')
      WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  END IF;
END
$$;

-- Step 4: Ensure requests table has ad_type column (for filtering ad submissions)
-- Note: The requests table stores detailed ad data in the metadata JSONB field
-- Frontend extracts fields like image_url, video_url, placement, etc. from metadata
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS ad_type TEXT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the changes:

-- Check if user_ads table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_ads';

-- Check columns in user_ads table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_ads' 
ORDER BY ordinal_position;

-- Check requests table has ad columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' AND column_name LIKE '%ad%' 
ORDER BY column_name;

-- View all user submissions (admin only)
-- SELECT id, user_name, title, ad_type, status, created_at 
-- FROM user_ads 
-- ORDER BY created_at DESC;
