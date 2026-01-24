-- =====================================================
-- Fix: Admin tier updates RLS policy
-- =====================================================
-- Ensure the Supabase service role can update subscription columns

-- Check current RLS policies on profiles table
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

-- If needed, add a policy that allows the service role to update profiles
-- (Service role bypasses RLS by default, but let's ensure the columns exist)

-- Verify subscription columns exist and are updateable
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Verify the columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name LIKE 'subscription%'
ORDER BY column_name;

-- Manually test the update (this should work since we're using supabaseAdmin service role)
-- Uncomment to test with an actual UUID:
-- UPDATE profiles 
-- SET subscription_tier = 'premium', 
--     subscription_started_at = NOW(), 
--     subscription_expires_at = NOW() + INTERVAL '1 year'
-- WHERE id = 'YOUR_USER_ID_HERE'
-- RETURNING id, subscription_tier, subscription_started_at, subscription_expires_at;
