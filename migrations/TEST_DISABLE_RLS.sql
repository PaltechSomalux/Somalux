-- ============================================================
-- TEST: TEMPORARILY DISABLE RLS TO CHECK IF THAT'S THE ISSUE
-- This will help us diagnose if RLS is blocking the reads
-- ============================================================

-- Disable RLS temporarily
ALTER TABLE first_login_tracking DISABLE ROW LEVEL SECURITY;

-- Test query - try to read all records
SELECT COUNT(*) as total_records FROM first_login_tracking;

-- Show sample data
SELECT 
  id,
  user_id,
  first_login_at,
  device_type,
  browser,
  operating_system,
  ip_address
FROM first_login_tracking 
LIMIT 5;

SELECT 'RLS disabled for testing!' as status;
