-- =====================================================
-- COPY & PASTE THIS ENTIRE SECTION INTO SUPABASE SQL EDITOR
-- =====================================================
-- This will fix ALL 400 errors and missing column issues

-- =====================================================
-- STEP 1: CREATE PROFILES TABLE (if it doesn't exist)
-- =====================================================

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

-- =====================================================
-- STEP 2: ADD MISSING COLUMNS (if they don't exist)
-- =====================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'viewer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- =====================================================
-- STEP 3: CREATE INDEXES (for performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies first (safe to do)
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role to manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow service role full access" ON public.profiles;

-- Create policy: Allow users to read their own profile
CREATE POLICY "Allow users to read their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy: Allow service role (backend) to do everything
CREATE POLICY "Allow service role full access" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- VERIFICATION QUERIES - RUN THESE TO VERIFY SUCCESS
-- =====================================================

-- 1. Check all columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY column_name;

-- 2. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 3. Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 4. Count total profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 5. Check one sample profile (if any exist)
SELECT id, subscription_tier, role, created_at 
FROM public.profiles 
LIMIT 1;

-- =====================================================
-- COPY EVERYTHING ABOVE AND PASTE INTO SUPABASE
-- =====================================================
-- Then click RUN button (or Ctrl+Enter)
-- Look for "Query successful" message at the bottom
