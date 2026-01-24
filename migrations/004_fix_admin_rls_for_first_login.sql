-- ============================================================
-- FIX RLS POLICIES FOR ALL USER TYPES
-- Ensures all users can see their own first login records
-- Ensures admins/editors/super_admin can see all users' records
-- ============================================================

-- 1. Users can view their own first login record
DROP POLICY IF EXISTS "Users can view their own first login record" ON first_login_tracking;
CREATE POLICY "Users can view their own first login record"
  ON first_login_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Admins, editors, and super_admin can view all first login records
DROP POLICY IF EXISTS "Admins can view all first login records" ON first_login_tracking;
CREATE POLICY "Admins can view all first login records"
  ON first_login_tracking FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'editor')
  );

-- 3. System can insert first login records (via backend)
DROP POLICY IF EXISTS "System can insert first login records" ON first_login_tracking;
CREATE POLICY "System can insert first login records"
  ON first_login_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verification
SELECT 'RLS policies configured for all user types' as status;
