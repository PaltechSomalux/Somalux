-- =====================================================
-- REMOVE NOT NULL CONSTRAINTS (REVERSE THE CHANGES)
-- =====================================================
-- This script removes the NOT NULL constraints added by ADD_NOT_NULL_CONSTRAINTS.sql

-- Remove NOT NULL constraints from past_papers
ALTER TABLE public.past_papers
ALTER COLUMN unit_name DROP NOT NULL,
ALTER COLUMN unit_code DROP NOT NULL,
ALTER COLUMN faculty DROP NOT NULL,
ALTER COLUMN year DROP NOT NULL;

-- Remove NOT NULL constraints from past_paper_submissions
ALTER TABLE public.past_paper_submissions
ALTER COLUMN unit_name DROP NOT NULL,
ALTER COLUMN unit_code DROP NOT NULL,
ALTER COLUMN faculty DROP NOT NULL,
ALTER COLUMN year DROP NOT NULL;

-- Verify constraints were removed
SELECT 
  table_name,
  column_name,
  is_nullable,
  CASE WHEN is_nullable = 'YES' THEN '✓ NULLABLE' ELSE '✗ NOT NULL' END as constraint_status
FROM information_schema.columns
WHERE table_name IN ('past_papers', 'past_paper_submissions')
  AND column_name IN ('unit_name', 'unit_code', 'faculty', 'year')
ORDER BY table_name, column_name;
