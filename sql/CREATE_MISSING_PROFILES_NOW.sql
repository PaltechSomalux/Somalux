-- =====================================================
-- Create missing profiles for existing users
-- =====================================================

-- Insert profiles for all users missing them
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify all users now have profiles
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as with_profiles,
  COUNT(CASE WHEN p.id IS NULL THEN 1 END) as missing_profiles
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;

-- Show the newly created profiles
SELECT 
  id,
  email,
  full_name,
  created_at
FROM profiles
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
