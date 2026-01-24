-- ============================================================
-- ALLOW ALL USERS TO VIEW FIRST LOGIN DATA
-- Everyone can see everyone's first login information
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "view_own_first_login" ON first_login_tracking;
DROP POLICY IF EXISTS "view_all_first_login" ON first_login_tracking;
DROP POLICY IF EXISTS "insert_own_first_login" ON first_login_tracking;
DROP POLICY IF EXISTS "prevent_update_first_login" ON first_login_tracking;

-- Allow all authenticated users to READ all first login records
CREATE POLICY "view_all_first_login_data"
  ON first_login_tracking
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to INSERT only their own records
CREATE POLICY "insert_own_first_login_data"
  ON first_login_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Prevent any updates (immutable)
CREATE POLICY "prevent_first_login_updates"
  ON first_login_tracking
  FOR UPDATE
  TO authenticated
  USING (false);

-- Verify
SELECT policyname, qual FROM pg_policies WHERE tablename='first_login_tracking';

SELECT 'RLS policies updated - all users can view all first login data!' as status;
