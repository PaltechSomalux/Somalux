-- Add tracking for past paper views, likes, downloads, and bookmarks
-- This migration enhances past paper analytics

-- Step 1: Add views_count, likes_count, bookmarks_count to past_papers table if not exists
ALTER TABLE public.past_papers
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

ALTER TABLE public.past_papers
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE public.past_papers
ADD COLUMN IF NOT EXISTS bookmarks_count INTEGER DEFAULT 0;

-- Step 2: Create table to track individual user likes for past papers
CREATE TABLE IF NOT EXISTS public.past_paper_likes (
  id BIGSERIAL PRIMARY KEY,
  past_paper_id UUID NOT NULL REFERENCES public.past_papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one like per user per paper
  UNIQUE(past_paper_id, user_id),
  
  CONSTRAINT fk_past_paper_likes_paper FOREIGN KEY (past_paper_id) REFERENCES past_papers(id) ON DELETE CASCADE
);

-- Step 3: Create table to track individual user bookmarks for past papers
CREATE TABLE IF NOT EXISTS public.past_paper_bookmarks (
  id BIGSERIAL PRIMARY KEY,
  past_paper_id UUID NOT NULL REFERENCES public.past_papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one bookmark per user per paper
  UNIQUE(past_paper_id, user_id),
  
  CONSTRAINT fk_past_paper_bookmarks_paper FOREIGN KEY (past_paper_id) REFERENCES past_papers(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_past_paper_likes_paper_id ON public.past_paper_likes(past_paper_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_likes_user_id ON public.past_paper_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_bookmarks_paper_id ON public.past_paper_bookmarks(past_paper_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_bookmarks_user_id ON public.past_paper_bookmarks(user_id);

-- Step 4: Create RPC function to increment past paper views
DROP FUNCTION IF EXISTS increment_past_paper_views(UUID);

CREATE FUNCTION increment_past_paper_views(p_paper_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE past_papers 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_paper_id
  RETURNING views_count INTO v_count;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create RPC function to toggle past paper likes
DROP FUNCTION IF EXISTS toggle_past_paper_like(UUID, UUID);

CREATE FUNCTION toggle_past_paper_like(
  p_paper_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_liked BOOLEAN;
  v_count INTEGER;
BEGIN
  -- Check if user already liked this paper
  v_liked := EXISTS(
    SELECT 1 FROM past_paper_likes 
    WHERE past_paper_id = p_paper_id 
    AND user_id = p_user_id
  );
  
  IF v_liked THEN
    -- Remove the like
    DELETE FROM past_paper_likes 
    WHERE past_paper_id = p_paper_id 
    AND user_id = p_user_id;
  ELSE
    -- Add the like
    INSERT INTO past_paper_likes (past_paper_id, user_id) 
    VALUES (p_paper_id, p_user_id)
    ON CONFLICT (past_paper_id, user_id) DO NOTHING;
  END IF;
  
  -- Get updated count
  SELECT COUNT(*) INTO v_count 
  FROM past_paper_likes 
  WHERE past_paper_id = p_paper_id;
  
  -- Update the past_papers table
  UPDATE past_papers 
  SET likes_count = v_count 
  WHERE id = p_paper_id;
  
  -- Return the new state
  v_result := json_build_object(
    'liked', NOT v_liked,
    'count', v_count
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create RPC function to toggle past paper bookmarks
DROP FUNCTION IF EXISTS toggle_past_paper_bookmark(UUID, UUID);

CREATE FUNCTION toggle_past_paper_bookmark(
  p_paper_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_bookmarked BOOLEAN;
  v_count INTEGER;
BEGIN
  -- Check if user already bookmarked this paper
  v_bookmarked := EXISTS(
    SELECT 1 FROM past_paper_bookmarks 
    WHERE past_paper_id = p_paper_id 
    AND user_id = p_user_id
  );
  
  IF v_bookmarked THEN
    -- Remove the bookmark
    DELETE FROM past_paper_bookmarks 
    WHERE past_paper_id = p_paper_id 
    AND user_id = p_user_id;
  ELSE
    -- Add the bookmark
    INSERT INTO past_paper_bookmarks (past_paper_id, user_id) 
    VALUES (p_paper_id, p_user_id)
    ON CONFLICT (past_paper_id, user_id) DO NOTHING;
  END IF;
  
  -- Get updated count
  SELECT COUNT(*) INTO v_count 
  FROM past_paper_bookmarks 
  WHERE past_paper_id = p_paper_id;
  
  -- Update the past_papers table
  UPDATE past_papers 
  SET bookmarks_count = v_count 
  WHERE id = p_paper_id;
  
  -- Return the new state
  v_result := json_build_object(
    'bookmarked', NOT v_bookmarked,
    'count', v_count
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Enable RLS on past_paper_likes and past_paper_bookmarks tables
ALTER TABLE public.past_paper_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_paper_bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to insert their own paper likes" ON public.past_paper_likes;
DROP POLICY IF EXISTS "Allow users to delete their own paper likes" ON public.past_paper_likes;
DROP POLICY IF EXISTS "Allow anyone to view paper likes" ON public.past_paper_likes;
DROP POLICY IF EXISTS "Allow users to insert their own paper bookmarks" ON public.past_paper_bookmarks;
DROP POLICY IF EXISTS "Allow users to delete their own paper bookmarks" ON public.past_paper_bookmarks;
DROP POLICY IF EXISTS "Allow anyone to view paper bookmarks" ON public.past_paper_bookmarks;

-- Policies for past_paper_likes
CREATE POLICY "Allow users to insert their own paper likes"
  ON public.past_paper_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow users to delete their own paper likes"
  ON public.past_paper_likes
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow anyone to view paper likes"
  ON public.past_paper_likes
  FOR SELECT
  USING (true);

-- Policies for past_paper_bookmarks
CREATE POLICY "Allow users to insert their own paper bookmarks"
  ON public.past_paper_bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow users to delete their own paper bookmarks"
  ON public.past_paper_bookmarks
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow anyone to view paper bookmarks"
  ON public.past_paper_bookmarks
  FOR SELECT
  USING (true);
