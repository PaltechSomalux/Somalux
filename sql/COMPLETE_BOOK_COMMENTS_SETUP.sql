-- ============================================================================
-- COMPLETE BOOK COMMENTS SYSTEM - SINGLE SETUP SCRIPT
-- ============================================================================
-- Run this entire script once in Supabase SQL Editor
-- It will create the exec_sql function AND all book comment tables
-- ============================================================================

-- ============================================================================
-- Step 1: Create exec_sql RPC Function (if doesn't exist)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
DECLARE
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- ============================================================================
-- Step 2: Create Book Comments System Tables
-- ============================================================================

-- Book Comments Table
CREATE TABLE IF NOT EXISTS public.book_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  text TEXT NOT NULL,
  media_url VARCHAR(500),
  media_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_comments_book_id ON public.book_comments(book_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_user_id ON public.book_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_book_comments_created_at ON public.book_comments(created_at);

ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view book comments" ON public.book_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.book_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.book_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.book_comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.book_comments;

CREATE POLICY "Anyone can view book comments"
  ON public.book_comments
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.book_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.book_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.book_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
  ON public.book_comments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Book Comment Likes Table
CREATE TABLE IF NOT EXISTS public.book_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.book_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_book_comment_likes_comment_id ON public.book_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_book_comment_likes_user_id ON public.book_comment_likes(user_id);

ALTER TABLE public.book_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.book_comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON public.book_comment_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON public.book_comment_likes;

CREATE POLICY "Anyone can view comment likes"
  ON public.book_comment_likes
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can like comments"
  ON public.book_comment_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON public.book_comment_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Book Comment Replies Table
CREATE TABLE IF NOT EXISTS public.book_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.book_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  text TEXT NOT NULL,
  media_url VARCHAR(500),
  media_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_replies_comment_id ON public.book_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_book_replies_user_id ON public.book_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_book_replies_created_at ON public.book_replies(created_at);

ALTER TABLE public.book_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view replies" ON public.book_replies;
DROP POLICY IF EXISTS "Authenticated users can insert replies" ON public.book_replies;
DROP POLICY IF EXISTS "Users can update own replies" ON public.book_replies;
DROP POLICY IF EXISTS "Users can delete own replies" ON public.book_replies;
DROP POLICY IF EXISTS "Admins can manage all replies" ON public.book_replies;

CREATE POLICY "Anyone can view replies"
  ON public.book_replies
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can insert replies"
  ON public.book_replies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies"
  ON public.book_replies
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies"
  ON public.book_replies
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all replies"
  ON public.book_replies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.book_comments TO authenticated;
GRANT INSERT ON public.book_comments TO authenticated;
GRANT UPDATE ON public.book_comments TO authenticated;
GRANT DELETE ON public.book_comments TO authenticated;

GRANT SELECT ON public.book_comment_likes TO authenticated;
GRANT INSERT ON public.book_comment_likes TO authenticated;
GRANT DELETE ON public.book_comment_likes TO authenticated;

GRANT SELECT ON public.book_replies TO authenticated;
GRANT INSERT ON public.book_replies TO authenticated;
GRANT UPDATE ON public.book_replies TO authenticated;
GRANT DELETE ON public.book_replies TO authenticated;

-- ============================================================================
-- Setup Complete! Now restart your application
-- ============================================================================
