-- Check past_paper_submissions for missing required fields
SELECT 
  id,
  unit_name,
  unit_code,
  faculty,
  year,
  created_at
FROM past_paper_submissions
WHERE unit_name IS NULL 
   OR unit_code IS NULL 
   OR faculty IS NULL 
   OR year IS NULL
ORDER BY created_at DESC;

-- Show counts
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN unit_name IS NULL THEN 1 ELSE 0 END) as missing_unit_name,
  SUM(CASE WHEN unit_code IS NULL THEN 1 ELSE 0 END) as missing_unit_code,
  SUM(CASE WHEN faculty IS NULL THEN 1 ELSE 0 END) as missing_faculty,
  SUM(CASE WHEN year IS NULL THEN 1 ELSE 0 END) as missing_year
FROM past_paper_submissions;
