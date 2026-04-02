-- ============================================================================
-- Migration 034: Fix Profiles RLS - Add INSERT Policy
-- ============================================================================
-- Purpose: Allow authenticated users to INSERT their own profiles
-- The existing policies only allow SELECT and UPDATE, but not INSERT
-- This causes 403 Forbidden when code tries to create a new profile
-- ============================================================================

-- Add INSERT policy for profiles
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Add DELETE policy for completeness
CREATE POLICY "Users can delete their own profile" ON profiles
FOR DELETE USING (auth.uid() = id);

-- ============================================================================
-- Verify existing policies
-- ============================================================================
-- The following policies should now exist on the profiles table:
-- 1. "Profiles are viewable by everyone" - SELECT (anyone can read)
-- 2. "Users can update their own profile" - UPDATE (users can update own)
-- 3. "Users can insert their own profile" - INSERT (NEW - users can create own)
-- 4. "Users can delete their own profile" - DELETE (NEW - users can delete own)

-- ============================================================================
-- Summary of Changes
-- ============================================================================
-- 1. Added INSERT policy allowing users to create their own profile
-- 2. Added DELETE policy allowing users to delete their own profile
-- 3. Fixes 403 Forbidden errors when upserting profiles
-- 4. Maintains security by checking auth.uid() = id
