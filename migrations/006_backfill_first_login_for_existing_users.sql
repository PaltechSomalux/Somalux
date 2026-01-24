-- ============================================================
-- BACKFILL FIRST LOGIN TRACKING FOR EXISTING USERS
-- Creates first login records for all users based on their created_at
-- This allows testing without waiting for new logins
-- ============================================================

-- Insert first login records for users who don't have one yet
-- Using only the columns that definitely exist
INSERT INTO first_login_tracking (
  user_id, 
  first_login_at, 
  first_login_date, 
  first_login_time
)
SELECT 
  p.id,
  COALESCE(p.created_at, NOW()),
  (COALESCE(p.created_at, NOW()))::date,
  (COALESCE(p.created_at, NOW()))::time
FROM profiles p
WHERE p.id NOT IN (SELECT user_id FROM first_login_tracking)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the backfill
SELECT COUNT(*) as total_first_login_records FROM first_login_tracking;
SELECT 'Backfill complete!' as status;
