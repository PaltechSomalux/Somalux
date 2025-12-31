-- =====================================================
-- ADD NOT NULL CONSTRAINTS FOR REQUIRED FIELDS
-- =====================================================
-- Ensure past_papers table enforces required fields:
-- unit_name, unit_code, faculty, year must not be NULL

-- Drop existing constraints (if any)
ALTER TABLE public.past_papers
DROP CONSTRAINT IF EXISTS past_papers_unit_name_not_null,
DROP CONSTRAINT IF EXISTS past_papers_unit_code_not_null,
DROP CONSTRAINT IF EXISTS past_papers_faculty_not_null,
DROP CONSTRAINT IF EXISTS past_papers_year_not_null;

-- Backup: First, set default values for any existing NULL records
UPDATE public.past_papers SET unit_name = 'Untitled' WHERE unit_name IS NULL;
UPDATE public.past_papers SET unit_code = 'UNKNOWN' WHERE unit_code IS NULL;
UPDATE public.past_papers SET faculty = 'General' WHERE faculty IS NULL;
UPDATE public.past_papers SET year = 2024 WHERE year IS NULL;

-- Add NOT NULL constraints
ALTER TABLE public.past_papers
ALTER COLUMN unit_name SET NOT NULL,
ALTER COLUMN unit_code SET NOT NULL,
ALTER COLUMN faculty SET NOT NULL,
ALTER COLUMN year SET NOT NULL;

-- Same for past_paper_submissions table
UPDATE public.past_paper_submissions SET unit_name = 'Untitled' WHERE unit_name IS NULL;
UPDATE public.past_paper_submissions SET unit_code = 'UNKNOWN' WHERE unit_code IS NULL;
UPDATE public.past_paper_submissions SET faculty = 'General' WHERE faculty IS NULL;
UPDATE public.past_paper_submissions SET year = 2024 WHERE year IS NULL;

ALTER TABLE public.past_paper_submissions
ALTER COLUMN unit_name SET NOT NULL,
ALTER COLUMN unit_code SET NOT NULL,
ALTER COLUMN faculty SET NOT NULL,
ALTER COLUMN year SET NOT NULL;

-- Verify NOT NULL constraints were applied
SELECT 
  table_name,
  column_name,
  is_nullable,
  CASE WHEN is_nullable = 'NO' THEN '✓ NOT NULL' ELSE '✗ NULLABLE' END as constraint_status
FROM information_schema.columns
WHERE table_name IN ('past_papers', 'past_paper_submissions')
  AND column_name IN ('unit_name', 'unit_code', 'faculty', 'year')
ORDER BY table_name, column_name;
