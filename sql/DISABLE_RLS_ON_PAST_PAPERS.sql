-- Disable RLS on past_papers table as well
ALTER TABLE public.past_papers DISABLE ROW LEVEL SECURITY;

-- Make uploaded_by nullable
ALTER TABLE public.past_papers
ALTER COLUMN uploaded_by DROP NOT NULL;

-- Verify
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('books', 'book_submissions', 'past_papers');
