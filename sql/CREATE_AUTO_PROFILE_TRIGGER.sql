-- =====================================================
-- TRIGGER: Auto-create profile when user signs up
-- =====================================================
-- This ensures profiles are created automatically for new auth users
-- Superadmins get admin role, all others get viewer role

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE 
      WHEN NEW.email IN ('campuslives254@gmail.com', 'paltechsomalux@gmail.com') THEN 'admin'
      ELSE 'viewer'
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Also update profile on user metadata changes
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Step 4: Verify triggers are created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table = 'users'
ORDER BY trigger_name;

-- Step 5: Test by checking for orphaned users
SELECT 
  au.id,
  au.email,
  p.full_name,
  CASE 
    WHEN p.id IS NULL THEN '⚠️ Profile missing'
    ELSE '✅ Has profile'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 20;

-- Display count
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as with_profiles,
  COUNT(CASE WHEN p.id IS NULL THEN 1 END) as orphaned_users
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;
