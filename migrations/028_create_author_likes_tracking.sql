-- ============================================================================
-- Author Likes & Loves System - Tables and Views for Engagement Counts
-- ============================================================================
-- Creates tables and views that track author like and love counts
-- Note: Authors are stored as TEXT in books table, not as separate author records

-- ============================================================================
-- LIKES SYSTEM
-- ============================================================================

-- Step 1: Create author_likes table
CREATE TABLE IF NOT EXISTS public.author_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  like_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, author_name)
);

-- Enable RLS on author_likes
ALTER TABLE public.author_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all author likes" ON public.author_likes;
DROP POLICY IF EXISTS "Users can insert their own author likes" ON public.author_likes;
DROP POLICY IF EXISTS "Users can delete their own author likes" ON public.author_likes;

-- RLS Policies for author_likes
CREATE POLICY "Users can view all author likes" ON public.author_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own author likes" ON public.author_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own author likes" ON public.author_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Step 2: Create view for author like counts (counts ALL records, not just is_active)
CREATE OR REPLACE VIEW public.author_likes_counts AS
SELECT 
  author_name,
  COUNT(*) as likes_count
FROM public.author_likes
GROUP BY author_name;

-- Step 3: Create indexes for performance on author_likes table
CREATE INDEX IF NOT EXISTS idx_author_likes_author_name ON public.author_likes(author_name);
CREATE INDEX IF NOT EXISTS idx_author_likes_user_id ON public.author_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_author_likes_is_active ON public.author_likes(is_active);
CREATE INDEX IF NOT EXISTS idx_author_likes_date ON public.author_likes(like_date DESC);

-- ============================================================================
-- LOVES SYSTEM
-- ============================================================================

-- Step 4: Create author_loves table
CREATE TABLE IF NOT EXISTS public.author_loves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  love_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, author_name)
);

-- Enable RLS on author_loves
ALTER TABLE public.author_loves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all author loves" ON public.author_loves;
DROP POLICY IF EXISTS "Users can insert their own author loves" ON public.author_loves;
DROP POLICY IF EXISTS "Users can delete their own author loves" ON public.author_loves;

-- RLS Policies for author_loves
CREATE POLICY "Users can view all author loves" ON public.author_loves
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own author loves" ON public.author_loves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own author loves" ON public.author_loves
  FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Create view for author love counts (counts ALL records, not just is_active)
CREATE OR REPLACE VIEW public.author_loves_counts AS
SELECT 
  author_name,
  COUNT(*) as loves_count
FROM public.author_loves
GROUP BY author_name;

-- Step 6: Create indexes for performance on author_loves table
CREATE INDEX IF NOT EXISTS idx_author_loves_author_name ON public.author_loves(author_name);
CREATE INDEX IF NOT EXISTS idx_author_loves_user_id ON public.author_loves(user_id);
CREATE INDEX IF NOT EXISTS idx_author_loves_is_active ON public.author_loves(is_active);
CREATE INDEX IF NOT EXISTS idx_author_loves_date ON public.author_loves(love_date DESC);

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

-- Step 7: Add comments explaining the system
COMMENT ON TABLE public.author_likes IS 'Tracks which users have liked which authors (using author_name TEXT field). Is_active flag for soft deletes.';
COMMENT ON TABLE public.author_loves IS 'Tracks which users have loved which authors (using author_name TEXT field). Is_active flag for soft deletes.';
COMMENT ON VIEW public.author_likes_counts IS 'Aggregated like counts for each author by author_name. Shows total active likes per author.';
COMMENT ON VIEW public.author_loves_counts IS 'Aggregated love counts for each author by author_name. Shows total active loves per author.';
