-- ============================================
-- FINAL SCHEMA FIX - Add Missing Columns
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing columns to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS pages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS publisher TEXT;

-- Update the updated_at column if it doesn't exist
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace function to update updated_at
CREATE OR REPLACE FUNCTION update_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for books updated_at
DROP TRIGGER IF EXISTS set_books_updated_at ON public.books;
CREATE TRIGGER set_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION update_books_updated_at();

-- Create book_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.book_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

-- Create book_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.book_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_book_likes_book_id ON public.book_likes(book_id);
CREATE INDEX IF NOT EXISTS idx_book_likes_user_id ON public.book_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_book_id ON public.book_comments(book_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_user_id ON public.book_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);

-- Enable RLS
ALTER TABLE public.book_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for books - Allow public read
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
CREATE POLICY "Anyone can view books"
  ON public.books
  FOR SELECT
  USING (true);

-- RLS Policies for categories - Allow public read
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- RLS Policies for book_likes
DROP POLICY IF EXISTS "Anyone can view book likes" ON public.book_likes;
CREATE POLICY "Anyone can view book likes"
  ON public.book_likes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can like books" ON public.book_likes;
CREATE POLICY "Authenticated users can like books"
  ON public.book_likes
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can unlike books" ON public.book_likes;
CREATE POLICY "Users can unlike books"
  ON public.book_likes
  FOR DELETE
  USING (true);

-- RLS Policies for book_comments
DROP POLICY IF EXISTS "Anyone can view book comments" ON public.book_comments;
CREATE POLICY "Anyone can view book comments"
  ON public.book_comments
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.book_comments;
CREATE POLICY "Authenticated users can comment"
  ON public.book_comments
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their comments" ON public.book_comments;
CREATE POLICY "Users can delete their comments"
  ON public.book_comments
  FOR DELETE
  USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_comments;

-- Grant permissions
GRANT ALL ON public.books TO anon, authenticated;
GRANT ALL ON public.categories TO anon, authenticated;
GRANT ALL ON public.book_likes TO anon, authenticated;
GRANT ALL ON public.book_comments TO anon, authenticated;

-- ============================================
-- DONE! Schema is now complete
-- ============================================
