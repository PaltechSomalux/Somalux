-- =====================================================
-- FIX SUBMISSIONS WITH MISSING REQUIRED FIELDS
-- =====================================================
-- This script fixes old past_paper_submissions that may be missing
-- unit_name, unit_code, faculty, or year fields

UPDATE past_paper_submissions
SET 
  unit_name = COALESCE(unit_name, 'Untitled'),
  unit_code = COALESCE(unit_code, 'UNKNOWN'),
  faculty = COALESCE(faculty, 'General'),
  year = COALESCE(year, EXTRACT(YEAR FROM created_at)::INTEGER)
WHERE unit_name IS NULL 
   OR unit_code IS NULL 
   OR faculty IS NULL 
   OR year IS NULL;

-- Verify the fix
SELECT 
  COUNT(*) as total_fixed,
  SUM(CASE WHEN unit_name = 'Untitled' THEN 1 ELSE 0 END) as fixed_unit_name,
  SUM(CASE WHEN unit_code = 'UNKNOWN' THEN 1 ELSE 0 END) as fixed_unit_code,
  SUM(CASE WHEN faculty = 'General' THEN 1 ELSE 0 END) as fixed_faculty
FROM past_paper_submissions
WHERE unit_name = 'Untitled' 
   OR unit_code = 'UNKNOWN' 
   OR faculty = 'General';
