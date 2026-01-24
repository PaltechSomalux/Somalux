-- =====================================================
-- Fix: RLS Policies for subscription columns in profiles
-- =====================================================
-- The profiles table might have RLS policies that prevent reading new columns

-- First, check current RLS status and policies
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- List all policies on profiles table
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles';

-- =====================================================
-- ADD POLICIES IF NEEDED
-- =====================================================
-- If RLS is enabled but policies are too restrictive, add these:

-- Policy 1: Allow users to read their own profile (including subscription_tier)
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Allow service role (admin) to update any profile
-- Note: Service role usually bypasses RLS, but let's be explicit
CREATE POLICY "Service role can update profiles"
ON profiles FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- Grant permissions on new columns
-- =====================================================
-- Make sure the authenticated users can see subscription columns
GRANT SELECT (subscription_tier, subscription_started_at, subscription_expires_at) ON profiles TO authenticated;
GRANT UPDATE (subscription_tier, subscription_started_at, subscription_expires_at) ON profiles TO authenticated;

-- =====================================================
-- Test query (should work now)
-- =====================================================
-- This should return your profile with subscription columns visible
SELECT id, email, subscription_tier, subscription_started_at, subscription_expires_at
FROM profiles
WHERE id = auth.uid()
LIMIT 1;
