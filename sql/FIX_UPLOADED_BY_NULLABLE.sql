-- CRITICAL FIX: Make uploaded_by nullable in book_submissions table
-- Run this in Supabase SQL Editor to allow automated bulk uploads
-- This change allows submissions to be created without requiring a valid auth.users reference

-- Step 1: Drop the existing NOT NULL constraint and foreign key
ALTER TABLE public.book_submissions
DROP CONSTRAINT IF EXISTS book_submissions_uploaded_by_fkey;

ALTER TABLE public.book_submissions
ALTER COLUMN uploaded_by DROP NOT NULL;

-- Step 2: Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE public.book_submissions
ADD CONSTRAINT book_submissions_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'book_submissions' AND column_name = 'uploaded_by';
