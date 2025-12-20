-- Migration 020: Add Missing Columns to Books Table
-- Issue: Admin bulk upload fails because books table lacks isbn, year, language, publisher columns
-- Solution: Add these columns to match book_submissions schema

-- Add missing columns to books table if they don't exist
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS isbn TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS publisher TEXT;

-- Verify the columns were added
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'books'
ORDER BY ordinal_position;
