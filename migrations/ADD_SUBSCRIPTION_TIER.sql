-- =====================================================
-- ADD SUBSCRIPTION TIER SYSTEM
-- =====================================================
-- Add subscription tier tracking to profiles table
-- Tiers: basic (default), premium, premium_pro

-- Step 1: Add subscription tier column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'basic'
CHECK (subscription_tier IN ('basic', 'premium', 'premium_pro'));

-- Step 2: Add subscription date column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Add subscription expiry column (for future auto-renewal logic)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Step 4: Create an audit table for subscription changes
CREATE TABLE IF NOT EXISTS public.subscription_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_tier VARCHAR(50),
  to_tier VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Step 5: Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_user_id ON public.subscription_changes(user_id);

-- Step 6: Verify the changes
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('subscription_tier', 'subscription_started_at', 'subscription_expires_at')
ORDER BY ordinal_position;

-- Result should show 3 new columns
