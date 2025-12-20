-- Patch: Make uploaded_by nullable in book_submissions
-- This allows submissions from users not in auth.users (e.g., automated uploads)
ALTER TABLE public.book_submissions
ALTER COLUMN uploaded_by DROP NOT NULL,
DROP CONSTRAINT book_submissions_uploaded_by_fkey,
ADD CONSTRAINT book_submissions_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
