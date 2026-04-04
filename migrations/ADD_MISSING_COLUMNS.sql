-- =====================================================
-- Migration: Add Missing Database Columns
-- =====================================================
-- This fixes database schema issues causing 400/500 errors
-- NOTE: Run this in your Supabase SQL Editor

-- IMPORTANT: If you get errors about "IF NOT EXISTS" syntax,
-- it means your profiles table doesn't exist yet. 
-- In that case, use COMPREHENSIVE_MIGRATION.sql instead.

-- Step 1: Add subscription columns to profiles table
-- These columns are required by the backend updateUserTier function
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- Comments:
-- subscription_tier: The user's subscription plan ('free', 'basic', 'premium', 'premium_pro')
-- subscription_started_at: Stores the date when a user's subscription tier begins
-- subscription_expires_at: Stores the date when a user's subscription tier expires
-- role: User role for access control ('viewer', 'editor', 'admin')
-- last_active_at: Tracks when the user was last active
-- All are set when updating user tiers via the admin verification panel

-- =====================================================
-- OPTIONAL: Create missing tables for past paper tracking
-- =====================================================
-- WARNING: Only run these if you want to track paper views and downloads
-- If you don't need this tracking, comment them out

-- Step 2 (OPTIONAL): Create past_paper_views table
-- CREATE TABLE IF NOT EXISTS past_paper_views (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   paper_id UUID NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
--   user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
--   viewed_at TIMESTAMP DEFAULT NOW(),
--   ip_address TEXT,
--   user_agent TEXT,
--   UNIQUE(paper_id, user_id, viewed_at)
-- );
-- 
-- CREATE INDEX IF NOT EXISTS idx_past_paper_views_paper_id ON past_paper_views(paper_id);
-- CREATE INDEX IF NOT EXISTS idx_past_paper_views_user_id ON past_paper_views(user_id);
-- CREATE INDEX IF NOT EXISTS idx_past_paper_views_viewed_at ON past_paper_views(viewed_at DESC);

-- Step 3 (OPTIONAL): Create past_paper_downloads table
-- CREATE TABLE IF NOT EXISTS past_paper_downloads (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   paper_id UUID NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
--   user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
--   downloaded_at TIMESTAMP DEFAULT NOW(),
--   ip_address TEXT,
--   user_agent TEXT,
--   UNIQUE(paper_id, user_id, downloaded_at)
-- );
-- 
-- CREATE INDEX IF NOT EXISTS idx_past_paper_downloads_paper_id ON past_paper_downloads(paper_id);
-- CREATE INDEX IF NOT EXISTS idx_past_paper_downloads_user_id ON past_paper_downloads(user_id);
-- CREATE INDEX IF NOT EXISTS idx_past_paper_downloads_downloaded_at ON past_paper_downloads(downloaded_at DESC);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the changes:

-- Check if all subscription columns exist in profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('subscription_tier', 'subscription_started_at', 'subscription_expires_at')
ORDER BY column_name;

-- Check if past_paper_views table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'past_paper_views';

-- Check if past_paper_downloads table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'past_paper_downloads';
