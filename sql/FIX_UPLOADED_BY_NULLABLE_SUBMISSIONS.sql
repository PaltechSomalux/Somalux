-- =====================================================
-- FIX: Make uploaded_by nullable in past_paper_submissions
-- =====================================================

-- Step 1: Drop the existing constraint
ALTER TABLE public.past_paper_submissions
DROP CONSTRAINT IF EXISTS past_paper_submissions_uploaded_by_fkey;

-- Step 2: Make the column nullable
ALTER TABLE public.past_paper_submissions
ALTER COLUMN uploaded_by DROP NOT NULL;

-- Step 3: Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE public.past_paper_submissions
ADD CONSTRAINT past_paper_submissions_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 4: Verify the change
SELECT 
  column_name, 
  is_nullable, 
  data_type,
  constraint_name
FROM information_schema.columns
LEFT JOIN information_schema.key_column_usage USING (column_name, table_name)
WHERE table_name = 'past_paper_submissions' AND column_name = 'uploaded_by';

-- Also check book_submissions for consistency
ALTER TABLE public.book_submissions
DROP CONSTRAINT IF EXISTS book_submissions_uploaded_by_fkey;

ALTER TABLE public.book_submissions
ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE public.book_submissions
ADD CONSTRAINT book_submissions_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Verify
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_name IN ('past_paper_submissions', 'book_submissions') 
AND column_name = 'uploaded_by'
ORDER BY table_name;
