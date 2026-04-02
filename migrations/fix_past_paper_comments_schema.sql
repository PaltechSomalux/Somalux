-- ============================================================================
-- FIX PAST PAPER COMMENTS SCHEMA TO MATCH BOOK COMMENTS
-- ============================================================================
-- Run this entire script once in Supabase SQL Editor
-- It will update all past_paper comment tables to match book_comments structure
-- ============================================================================

-- ============================================================================
-- Step 1: Fix past_paper_comments table
-- ============================================================================

-- Add missing columns
ALTER TABLE IF EXISTS public.past_paper_comments 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

ALTER TABLE IF EXISTS public.past_paper_comments 
ADD COLUMN IF NOT EXISTS media_url VARCHAR(500);

ALTER TABLE IF EXISTS public.past_paper_comments 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50);

ALTER TABLE IF EXISTS public.past_paper_comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Rename 'comment' column to 'text' if it exists
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name='past_paper_comments' AND column_name='comment') THEN
        ALTER TABLE public.past_paper_comments RENAME COLUMN "comment" TO "text";
    END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_past_paper_comments_paper_id ON public.past_paper_comments(paper_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_comments_user_id ON public.past_paper_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_comments_created_at ON public.past_paper_comments(created_at);

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view comments" ON public.past_paper_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.past_paper_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.past_paper_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.past_paper_comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.past_paper_comments;

-- Create new RLS policies matching book_comments
CREATE POLICY "Anyone can view past paper comments"
  ON public.past_paper_comments
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can insert past paper comments"
  ON public.past_paper_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own past paper comments"
  ON public.past_paper_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own past paper comments"
  ON public.past_paper_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all past paper comments"
  ON public.past_paper_comments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- Step 2: Create/fix past_paper_comment_likes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.past_paper_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.past_paper_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_past_paper_comment_likes_comment_id ON public.past_paper_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_comment_likes_user_id ON public.past_paper_comment_likes(user_id);

ALTER TABLE public.past_paper_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view past paper comment likes" ON public.past_paper_comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like past paper comments" ON public.past_paper_comment_likes;
DROP POLICY IF EXISTS "Users can unlike own past paper likes" ON public.past_paper_comment_likes;

CREATE POLICY "Anyone can view past paper comment likes"
  ON public.past_paper_comment_likes
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can like past paper comments"
  ON public.past_paper_comment_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own past paper likes"
  ON public.past_paper_comment_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- Step 3: Create/fix past_paper_replies table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.past_paper_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.past_paper_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  text TEXT NOT NULL,
  media_url VARCHAR(500),
  media_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_past_paper_replies_comment_id ON public.past_paper_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_replies_user_id ON public.past_paper_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_replies_created_at ON public.past_paper_replies(created_at);

ALTER TABLE public.past_paper_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view past paper replies" ON public.past_paper_replies;
DROP POLICY IF EXISTS "Authenticated users can insert past paper replies" ON public.past_paper_replies;
DROP POLICY IF EXISTS "Users can update own past paper replies" ON public.past_paper_replies;
DROP POLICY IF EXISTS "Users can delete own past paper replies" ON public.past_paper_replies;
DROP POLICY IF EXISTS "Admins can manage all past paper replies" ON public.past_paper_replies;

CREATE POLICY "Anyone can view past paper replies"
  ON public.past_paper_replies
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can insert past paper replies"
  ON public.past_paper_replies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own past paper replies"
  ON public.past_paper_replies
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own past paper replies"
  ON public.past_paper_replies
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all past paper replies"
  ON public.past_paper_replies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- Step 4: Grant permissions
-- ============================================================================

GRANT SELECT ON public.past_paper_comments TO authenticated;
GRANT INSERT ON public.past_paper_comments TO authenticated;
GRANT UPDATE ON public.past_paper_comments TO authenticated;
GRANT DELETE ON public.past_paper_comments TO authenticated;

GRANT SELECT ON public.past_paper_comment_likes TO authenticated;
GRANT INSERT ON public.past_paper_comment_likes TO authenticated;
GRANT DELETE ON public.past_paper_comment_likes TO authenticated;

GRANT SELECT ON public.past_paper_replies TO authenticated;
GRANT INSERT ON public.past_paper_replies TO authenticated;
GRANT UPDATE ON public.past_paper_replies TO authenticated;
GRANT DELETE ON public.past_paper_replies TO authenticated;

-- ============================================================================
-- SETUP COMPLETE - Comments system now matches books!
-- ============================================================================
