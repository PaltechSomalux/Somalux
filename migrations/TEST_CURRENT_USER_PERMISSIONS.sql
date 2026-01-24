-- ============================================================
-- TEST RLS POLICY BY CHECKING CURRENT USER ROLE
-- This helps diagnose why admins can't see other users' data
-- ============================================================

-- Check current authenticated user
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM profiles WHERE id = auth.uid()) as current_user_role;

-- Check if current user is admin/super_admin/editor
SELECT 
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'editor') as is_admin;

-- Try to select first_login_tracking records
-- This should work if RLS allows it
SELECT COUNT(*) as record_count FROM first_login_tracking;

-- Try to select a specific user's first login data
-- Replace UUID with an actual user ID from the table
SELECT * FROM first_login_tracking 
WHERE user_id != auth.uid()
LIMIT 1;
