-- ============================================================
-- FIRST LOGIN TRACKING TABLE
-- Captures exact time and date when a user first logs in
-- ============================================================

-- Create the first_login_tracking table
CREATE TABLE IF NOT EXISTS first_login_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_login_at TIMESTAMP WITH TIME ZONE NOT NULL,
  first_login_date DATE NOT NULL,
  first_login_time TIME WITH TIME ZONE NOT NULL,
  timezone TEXT, -- 'UTC', 'EST', 'PST', etc. - captured from browser
  ip_address TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  user_agent TEXT,
  browser TEXT,
  operating_system TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_first_login_tracking_user_id ON first_login_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_first_login_tracking_first_login_date ON first_login_tracking(first_login_date);
CREATE INDEX IF NOT EXISTS idx_first_login_tracking_created_at ON first_login_tracking(created_at);

-- Enable Row Level Security
ALTER TABLE first_login_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Users can view their own first login record
DROP POLICY IF EXISTS "Users can view their own first login record" ON first_login_tracking;
CREATE POLICY "Users can view their own first login record"
  ON first_login_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Admins can view all first login records
DROP POLICY IF EXISTS "Admins can view all first login records" ON first_login_tracking;
CREATE POLICY "Admins can view all first login records"
  ON first_login_tracking FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'editor')
  );

-- 3. System can insert first login records (via trigger/backend)
DROP POLICY IF EXISTS "System can insert first login records" ON first_login_tracking;
CREATE POLICY "System can insert first login records"
  ON first_login_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can NOT update their own first login record (prevents tampering)
DROP POLICY IF EXISTS "Users cannot update their first login record" ON first_login_tracking;
CREATE POLICY "Users cannot update their first login record"
  ON first_login_tracking FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Grant permissions
GRANT SELECT ON first_login_tracking TO authenticated;
GRANT INSERT ON first_login_tracking TO authenticated;

-- Verification
SELECT 'First login tracking table created successfully' as status;
