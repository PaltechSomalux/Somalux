-- =====================================================
-- COMPLETE PAST PAPERS APPROVAL FLOW FIX
-- =====================================================

-- Step 1: Ensure past_papers table has proper columns
ALTER TABLE public.past_papers
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS faculty TEXT,
ADD COLUMN IF NOT EXISTS unit_code TEXT,
ADD COLUMN IF NOT EXISTS unit_name TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS exam_type TEXT;

-- Step 2: Enable RLS on past_papers if not already enabled
ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for past_papers
-- Policy 1: Allow public SELECT
CREATE POLICY IF NOT EXISTS "Public read past_papers"
ON public.past_papers
FOR SELECT
USING (is_active = true);

-- Policy 2: Allow authenticated users to INSERT (only for future uploads)
CREATE POLICY IF NOT EXISTS "Allow authenticated insert past_papers"
ON public.past_papers
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Allow users to UPDATE their own records
CREATE POLICY IF NOT EXISTS "Allow update own past_papers"
ON public.past_papers
FOR UPDATE
USING (auth.uid()::text = uploaded_by::text OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Policy 4: Allow admins to DELETE
CREATE POLICY IF NOT EXISTS "Allow admin delete past_papers"
ON public.past_papers
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Step 4: Enable RLS on past_paper_submissions
ALTER TABLE public.past_paper_submissions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to INSERT
CREATE POLICY IF NOT EXISTS "Allow authenticated insert submissions"
ON public.past_paper_submissions
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy 2: Allow users to view their own submissions
CREATE POLICY IF NOT EXISTS "Allow view own submissions"
ON public.past_paper_submissions
FOR SELECT
USING (auth.uid()::text = uploaded_by::text OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Policy 3: Allow admins to view all submissions
CREATE POLICY IF NOT EXISTS "Allow admin view all submissions"
ON public.past_paper_submissions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Policy 4: Allow admins to UPDATE submissions
CREATE POLICY IF NOT EXISTS "Allow admin update submissions"
ON public.past_paper_submissions
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Step 5: Verify the migration
SELECT 
  table_name,
  policy_name,
  rows,
  enabled
FROM pg_tables t
LEFT JOIN pg_policies p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
WHERE t.tablename IN ('past_papers', 'past_paper_submissions')
ORDER BY table_name, policy_name;

-- Show table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('past_papers', 'past_paper_submissions')
ORDER BY table_name, ordinal_position;

-- Count submissions by status
SELECT status, COUNT(*) as count
FROM past_paper_submissions
GROUP BY status;

-- Count approved papers
SELECT COUNT(*) as approved_papers
FROM past_papers
WHERE is_active = true;
