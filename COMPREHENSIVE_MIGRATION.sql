-- =====================================================
-- DIAGNOSTIC: Check profiles table structure
-- =====================================================

-- First, verify the profiles table exists and show its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if any RLS policies exist on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- =====================================================
-- MIGRATION: Ensure profiles table and all columns exist
-- =====================================================

-- Step 1: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_active_at timestamp with time zone,
  subscription_tier text DEFAULT 'free',
  subscription_started_at timestamp with time zone,
  subscription_expires_at timestamp with time zone,
  role text DEFAULT 'viewer'
);

-- Step 2: Add missing columns if they don't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'viewer';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Step 4: Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies to allow users to read their own profile
CREATE POLICY "Allow users to read their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Step 6: Create RLS policy to allow service role (backend) to read all profiles
CREATE POLICY "Allow service role to manage profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- =====================================================
-- VERIFICATION: Check the final state
-- =====================================================

-- Verify all columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY column_name;

-- Count total profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Check a sample profile (if any exist)
SELECT id, email, display_name, subscription_tier, role FROM public.profiles LIMIT 1;
