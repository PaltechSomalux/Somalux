-- Fix Missing Profile Records
-- This ensures all users in auth.users have corresponding profiles
-- Superadmins get admin role, all others get viewer role

INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  au.email,
  CASE 
    WHEN au.email IN ('campuslives254@gmail.com', 'paltechsomalux@gmail.com') THEN 'admin'
    ELSE 'viewer'
  END,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT COUNT(*) as missing_profiles
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles);

-- If result is 0, all profiles are fixed!
