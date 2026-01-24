-- ============================================================
-- VERIFY FIRST_LOGIN_TRACKING TABLE STRUCTURE
-- Shows all columns in the table
-- ============================================================

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'first_login_tracking'
ORDER BY ordinal_position;
