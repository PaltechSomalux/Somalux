-- ============================================================
-- POPULATE DEVICE, BROWSER, OS, AND IP DATA FOR EXISTING RECORDS
-- Updates backfilled records with default values
-- ============================================================

-- Update all backfilled records with device information
UPDATE first_login_tracking
SET 
  device_type = CASE WHEN device_type IS NULL OR device_type = '' THEN 'desktop' ELSE device_type END,
  browser = CASE WHEN browser IS NULL OR browser = '' THEN 'Browser Unknown' ELSE browser END,
  operating_system = CASE WHEN operating_system IS NULL OR operating_system = '' THEN 'OS Unknown' ELSE operating_system END,
  ip_address = CASE WHEN ip_address IS NULL OR ip_address = '' THEN 'Not Captured' ELSE ip_address END
WHERE device_type IS NULL OR browser IS NULL OR operating_system IS NULL OR ip_address IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN device_type IS NOT NULL THEN 1 END) as with_device,
  COUNT(CASE WHEN browser IS NOT NULL THEN 1 END) as with_browser,
  COUNT(CASE WHEN operating_system IS NOT NULL THEN 1 END) as with_os,
  COUNT(CASE WHEN ip_address IS NOT NULL THEN 1 END) as with_ip
FROM first_login_tracking;

SELECT 'Device info populated!' as status;
