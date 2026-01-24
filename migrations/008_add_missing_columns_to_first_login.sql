-- ============================================================
-- ADD MISSING COLUMNS TO FIRST_LOGIN_TRACKING
-- Adds browser, operating_system, device_type, timezone, user_agent columns
-- ============================================================

-- Add missing columns if they don't exist
ALTER TABLE first_login_tracking
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS operating_system TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Verify columns were added
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'first_login_tracking'
ORDER BY ordinal_position;

SELECT 'Missing columns added!' as status;
