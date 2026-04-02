-- =====================================================
-- Migration 035: Migrate Past Papers Data to New Columns
-- =====================================================
-- Purpose: Populate new columns (unit_code, unit_name, faculty) 
-- from old columns (course_code, subject) to ensure data displays
-- =====================================================

-- Migrate course_code to unit_code if unit_code is empty
UPDATE past_papers
SET unit_code = course_code
WHERE unit_code IS NULL AND course_code IS NOT NULL;

-- Migrate subject to faculty if faculty is empty
UPDATE past_papers
SET faculty = subject
WHERE faculty IS NULL AND subject IS NOT NULL;

-- If unit_name is still empty, try to extract from title
UPDATE past_papers
SET unit_name = SUBSTRING(title FROM POSITION(' - ' IN title) + 3)
WHERE unit_name IS NULL 
AND title LIKE '% - %';

-- If title is in format "CODE - NAME", keep it as is
-- Otherwise, ensure unit_code and unit_name are at least populated with a placeholder
UPDATE past_papers
SET unit_code = COALESCE(unit_code, CONCAT('PP-', SUBSTRING(id::text, 1, 8)))
WHERE unit_code IS NULL;

UPDATE past_papers
SET unit_name = COALESCE(unit_name, title)
WHERE unit_name IS NULL;

UPDATE past_papers
SET faculty = COALESCE(faculty, 'General')
WHERE faculty IS NULL;

-- Ensure year is populated from exam_year if available
UPDATE past_papers
SET year = exam_year
WHERE year IS NULL AND exam_year IS NOT NULL;

-- Ensure file_path is populated from file_url if available
UPDATE past_papers
SET file_path = file_url
WHERE file_path IS NULL AND file_url IS NOT NULL;

-- Ensure views column is synced with views_count
UPDATE past_papers
SET views = views_count
WHERE views IS NULL AND views_count IS NOT NULL;

-- Verify migrations
SELECT 
  COUNT(*) as total_records,
  COUNT(unit_code) as with_unit_code,
  COUNT(unit_name) as with_unit_name,
  COUNT(faculty) as with_faculty
FROM past_papers;
