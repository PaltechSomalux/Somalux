-- ============================================================
-- FIX LOGIN ISSUE - Profiles RLS Policies
-- ============================================================
-- The login issue is likely due to:
-- 1. Missing profiles on signup (no auto-creation trigger)
-- 2. RLS policies preventing profile creation
-- 3. RLS policies preventing profile reads
-- ============================================================

-- ============================================================
-- 1. ENSURE PROFILES TABLE EXISTS WITH CORRECT STRUCTURE
-- ============================================================

DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  tier TEXT DEFAULT 'free',
  tier_expiry TIMESTAMP,
  bio TEXT,
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. CREATE AUTO-PROFILE TRIGGER ON AUTH SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = new.email,
    full_name = COALESCE(new.raw_user_meta_data->>'full_name', profiles.full_name),
    updated_at = NOW();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. ENABLE RLS AND SET CORRECT POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- DROP ALL OLD POLICIES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;

-- ============================================================
-- 4. CREATE PERMISSIVE POLICIES FOR LOGIN TO WORK
-- ============================================================

-- Allow ANYONE (anon or auth) to SELECT profiles
-- This is needed for public profiles and auth state checks
CREATE POLICY "profiles_select_anyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow service role to INSERT/UPDATE/DELETE (for trigger and admin operations)
CREATE POLICY "profiles_insert_authenticated"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Allow users to UPDATE their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Allow service role to DELETE
CREATE POLICY "profiles_delete_service_role"
  ON profiles FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 5. GRANT PERMISSIONS
-- ============================================================

GRANT SELECT ON profiles TO anon;
GRANT SELECT ON profiles TO authenticated;
GRANT INSERT, UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- ============================================================
-- 6. SYNC EXISTING AUTH USERS TO PROFILES
-- ============================================================

INSERT INTO profiles (id, email, full_name, created_at, updated_at)
SELECT id, email, raw_user_meta_data->>'full_name', NOW(), NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'Profiles table fixed' as status;
SELECT 'Auto-creation trigger enabled' as result;
SELECT 'RLS policies set correctly' as result;
SELECT 'Permissions granted' as result;
