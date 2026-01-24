-- ============================================================
-- VERIFY RLS POLICIES AND TEST READ ACCESS
-- ============================================================

-- 1. Check if RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname='first_login_tracking';

-- 2. List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename='first_login_tracking'
ORDER BY policyname;

-- 3. Test - count all records (should work for authenticated users)
SELECT COUNT(*) as total_records FROM first_login_tracking;

-- 4. Show sample data
SELECT 
  id,
  user_id,
  first_login_at,
  first_login_date,
  first_login_time,
  timezone,
  device_type,
  browser,
  operating_system,
  ip_address
FROM first_login_tracking 
LIMIT 5;
