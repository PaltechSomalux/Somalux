-- ============================================================
-- UPDATE BACKFILLED RECORDS WITH DEVICE INFORMATION
-- Populates the newly added columns with realistic values
-- ============================================================

-- Update all backfilled records with complete device information
UPDATE first_login_tracking
SET 
  timezone = CASE WHEN timezone IS NULL THEN 'UTC' ELSE timezone END,
  device_type = CASE WHEN device_type IS NULL THEN 'desktop' ELSE device_type END,
  browser = CASE WHEN browser IS NULL THEN 'Browser Unknown' ELSE browser END,
  operating_system = CASE WHEN operating_system IS NULL THEN 'OS Unknown' ELSE operating_system END,
  ip_address = CASE WHEN ip_address IS NULL THEN 'Not Captured' ELSE ip_address END,
  user_agent = CASE WHEN user_agent IS NULL THEN 'Not Captured' ELSE user_agent END,
  location = CASE WHEN location IS NULL THEN 'Unknown Location' ELSE location END;

-- Verify the update
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN device_type IS NOT NULL AND device_type != '' THEN 1 END) as with_device,
  COUNT(CASE WHEN browser IS NOT NULL AND browser != '' THEN 1 END) as with_browser,
  COUNT(CASE WHEN operating_system IS NOT NULL AND operating_system != '' THEN 1 END) as with_os,
  COUNT(CASE WHEN ip_address IS NOT NULL AND ip_address != '' THEN 1 END) as with_ip,
  COUNT(CASE WHEN timezone IS NOT NULL AND timezone != '' THEN 1 END) as with_timezone
FROM first_login_tracking;

SELECT 'Device information updated!' as status;
