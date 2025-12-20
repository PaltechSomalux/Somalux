-- CRITICAL: Disable RLS on both tables to allow bulk uploads with service role

-- Disable RLS on books table (this was blocking inserts)
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;

-- Disable RLS on book_submissions (already done but double-check)
ALTER TABLE public.book_submissions DISABLE ROW LEVEL SECURITY;

-- Make books.uploaded_by nullable too (for consistency)
ALTER TABLE public.books 
ALTER COLUMN uploaded_by DROP NOT NULL;

-- Verify changes
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('books', 'book_submissions');
