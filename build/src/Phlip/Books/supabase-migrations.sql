-- ============================================
-- SUPABASE MIGRATIONS FOR BOOK LIKES & COMMENTS
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create book_likes table
CREATE TABLE IF NOT EXISTS public.book_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

-- 2. Create book_comments table
CREATE TABLE IF NOT EXISTS public.book_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_likes_book_id ON public.book_likes(book_id);
CREATE INDEX IF NOT EXISTS idx_book_likes_user_id ON public.book_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_book_id ON public.book_comments(book_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_user_id ON public.book_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_created_at ON public.book_comments(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.book_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for book_likes
-- Allow anyone to read likes
CREATE POLICY "Anyone can view book likes"
  ON public.book_likes
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own likes
CREATE POLICY "Users can insert their own likes"
  ON public.book_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "Users can delete their own likes"
  ON public.book_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create RLS policies for book_comments
-- Allow anyone to read comments
CREATE POLICY "Anyone can view book comments"
  ON public.book_comments
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own comments
CREATE POLICY "Users can insert their own comments"
  ON public.book_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.book_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.book_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for book_comments updated_at
CREATE TRIGGER update_book_comments_updated_at
  BEFORE UPDATE ON public.book_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable Realtime for both tables
-- Note: You may need to enable this in the Supabase Dashboard under
-- Database > Replication if the SQL commands below don't work

ALTER PUBLICATION supabase_realtime ADD TABLE public.book_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_comments;

-- ============================================
-- OPTIONAL: Grant permissions (if needed)
-- ============================================
GRANT ALL ON public.book_likes TO authenticated;
GRANT ALL ON public.book_comments TO authenticated;
GRANT SELECT ON public.book_likes TO anon;
GRANT SELECT ON public.book_comments TO anon;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Go to Supabase Dashboard > Authentication > Providers
-- 2. Enable Google OAuth provider
-- 3. Add your OAuth credentials (Client ID & Secret)
-- 4. Add authorized redirect URLs
-- 5. Test the authentication flow in your app
-- ============================================
