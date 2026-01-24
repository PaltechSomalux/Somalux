-- ============================================================
-- DIAGNOSTIC QUERIES FOR FIRST LOGIN TRACKING
-- These queries help diagnose why first login data is empty
-- ============================================================

-- 1. Check if the table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'first_login_tracking'
) as table_exists;

-- 2. Check table structure (should show 13 columns)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'first_login_tracking' 
ORDER BY ordinal_position;

-- 3. Check how many records exist in the table
SELECT COUNT(*) as total_first_login_records FROM first_login_tracking;

-- 4. Show sample records (if any exist)
SELECT 
  id, 
  user_id, 
  first_login_at, 
  device_type, 
  browser, 
  operating_system, 
  ip_address, 
  timezone,
  created_at
FROM first_login_tracking 
LIMIT 10;

-- 5. Check RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname='first_login_tracking';

-- 6. List all RLS policies for first_login_tracking
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename='first_login_tracking';

-- 7. Check if migrations were applied (verify the table has correct columns)
SELECT COUNT(*) as column_count FROM information_schema.columns 
WHERE table_name = 'first_login_tracking';

-- 8. Check all users in profiles table
SELECT COUNT(*) as total_users FROM profiles;
