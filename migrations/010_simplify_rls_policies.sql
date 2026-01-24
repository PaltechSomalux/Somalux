-- ============================================================
-- SIMPLIFY RLS POLICIES FOR FIRST_LOGIN_TRACKING
-- Make sure all authenticated users can read their own records
-- And admins can read all records
-- ============================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own first login record" ON first_login_tracking;
DROP POLICY IF EXISTS "Admins can view all first login records" ON first_login_tracking;
DROP POLICY IF EXISTS "System can insert first login records" ON first_login_tracking;
DROP POLICY IF EXISTS "Users cannot update their first login record" ON first_login_tracking;

-- Create simplified SELECT policy for users (can see own records)
CREATE POLICY "view_own_first_login"
  ON first_login_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create SELECT policy for admins/editors (can see all)
CREATE POLICY "view_all_first_login"
  ON first_login_tracking
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'editor')
  );

-- Create INSERT policy (users can insert their own)
CREATE POLICY "insert_own_first_login"
  ON first_login_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Prevent updates (first login is immutable)
CREATE POLICY "prevent_update_first_login"
  ON first_login_tracking
  FOR UPDATE
  TO authenticated
  USING (false);

-- Verify policies
SELECT policyname, qual FROM pg_policies WHERE tablename='first_login_tracking';

SELECT 'RLS policies simplified!' as status;
