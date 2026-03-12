-- ============================================
-- FIX BOOKS TABLE SCHEMA
-- Add missing columns required by BookPanel
-- ============================================

-- Add missing columns to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'Unknown Author',
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS isbn TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS publisher TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some default categories
INSERT INTO public.categories (name) VALUES
  ('Fiction'),
  ('Non-Fiction'),
  ('Science'),
  ('Technology'),
  ('History'),
  ('Biography'),
  ('Self-Help'),
  ('Business'),
  ('Academic'),
  ('Literature')
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraint for category_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'books_category_id_fkey'
  ) THEN
    ALTER TABLE public.books
    ADD CONSTRAINT books_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.categories(id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_views ON public.books(views DESC);
CREATE INDEX IF NOT EXISTS idx_books_downloads ON public.books(downloads DESC);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read categories
CREATE POLICY IF NOT EXISTS "Anyone can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- Only authenticated users can manage categories
CREATE POLICY IF NOT EXISTS "Authenticated users can manage categories"
  ON public.categories
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Update file_url to file_path if needed
UPDATE public.books
SET file_path = file_url
WHERE file_path IS NULL AND file_url IS NOT NULL;

-- ============================================
-- OPTIONAL: Sample data update
-- Assign random categories to existing books without one
-- ============================================
DO $$
DECLARE
  default_category_id UUID;
BEGIN
  SELECT id INTO default_category_id 
  FROM public.categories 
  WHERE name = 'Fiction' 
  LIMIT 1;
  
  UPDATE public.books
  SET category_id = default_category_id
  WHERE category_id IS NULL;
END $$;

-- ============================================
-- DONE! Your books table now has all required columns
-- ============================================
