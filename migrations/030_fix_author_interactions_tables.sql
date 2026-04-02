-- ============================================================================
-- Migration 030: Fix Author Interactions Tables - RLS, Field Names, and Policies
-- ============================================================================
-- Fixes issues with author_followers, author_likes, author_loves, and author_ratings tables
-- 1. Enables RLS on all author interaction tables
-- 2. Creates proper policies for public access (reads) and authenticated writes
-- 3. Ensures field names are consistent (use user_id, author_name, rating_value)

-- ============================================================================
-- AUTHOR FOLLOWERS TABLE
-- ============================================================================

-- Enable RLS on author_followers
ALTER TABLE public.author_followers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view author followers" ON public.author_followers;
DROP POLICY IF EXISTS "Authenticated users can insert author follows" ON public.author_followers;
DROP POLICY IF EXISTS "Users can delete their own author follows" ON public.author_followers;

-- RLS Policy 1: Anyone can view author followers
CREATE POLICY "Anyone can view author followers"
  ON public.author_followers
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy 2: Authenticated users can insert follows
CREATE POLICY "Authenticated users can insert author follows"
  ON public.author_followers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Users can delete their own follows
CREATE POLICY "Users can delete their own author follows"
  ON public.author_followers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTHOR LIKES TABLE
-- ============================================================================

-- Enable RLS on author_likes
ALTER TABLE public.author_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view author likes" ON public.author_likes;
DROP POLICY IF EXISTS "Authenticated users can insert author likes" ON public.author_likes;
DROP POLICY IF EXISTS "Users can delete their own author likes" ON public.author_likes;

-- RLS Policy 1: Anyone can view author likes
CREATE POLICY "Anyone can view author likes"
  ON public.author_likes
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy 2: Authenticated users can insert likes
CREATE POLICY "Authenticated users can insert author likes"
  ON public.author_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Users can delete their own likes
CREATE POLICY "Users can delete their own author likes"
  ON public.author_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTHOR LOVES TABLE
-- ============================================================================

-- Enable RLS on author_loves
ALTER TABLE public.author_loves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view author loves" ON public.author_loves;
DROP POLICY IF EXISTS "Authenticated users can insert author loves" ON public.author_loves;
DROP POLICY IF EXISTS "Users can delete their own author loves" ON public.author_loves;

-- RLS Policy 1: Anyone can view author loves
CREATE POLICY "Anyone can view author loves"
  ON public.author_loves
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy 2: Authenticated users can insert loves
CREATE POLICY "Authenticated users can insert author loves"
  ON public.author_loves
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Users can delete their own loves
CREATE POLICY "Users can delete their own author loves"
  ON public.author_loves
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTHOR COMMENTS TABLE
-- ============================================================================

-- Enable RLS on author_comments
ALTER TABLE public.author_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view author comments" ON public.author_comments;
DROP POLICY IF EXISTS "Authenticated users can insert author comments" ON public.author_comments;
DROP POLICY IF EXISTS "Users can delete their own author comments" ON public.author_comments;

-- RLS Policy 1: Anyone can view author comments
CREATE POLICY "Anyone can view author comments"
  ON public.author_comments
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy 2: Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert author comments"
  ON public.author_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Users can delete their own comments
CREATE POLICY "Users can delete their own author comments"
  ON public.author_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTHOR RATINGS TABLE
-- ============================================================================

-- Enable RLS on author_ratings
ALTER TABLE public.author_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view author ratings" ON public.author_ratings;
DROP POLICY IF EXISTS "Authenticated users can insert author ratings" ON public.author_ratings;
DROP POLICY IF EXISTS "Users can update own author ratings" ON public.author_ratings;
DROP POLICY IF EXISTS "Users can delete own author ratings" ON public.author_ratings;

-- RLS Policy 1: Anyone can view author ratings
CREATE POLICY "Anyone can view author ratings"
  ON public.author_ratings
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy 2: Authenticated users can insert ratings
CREATE POLICY "Authenticated users can insert author ratings"
  ON public.author_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Users can update their own ratings
CREATE POLICY "Users can update own author ratings"
  ON public.author_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 4: Users can delete their own ratings
CREATE POLICY "Users can delete own author ratings"
  ON public.author_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTHOR SHARES TABLE
-- ============================================================================

-- Enable RLS on author_shares
ALTER TABLE public.author_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view author shares" ON public.author_shares;
DROP POLICY IF EXISTS "Authenticated users can insert author shares" ON public.author_shares;
DROP POLICY IF EXISTS "Users can delete their own author shares" ON public.author_shares;

-- RLS Policy 1: Anyone can view author shares
CREATE POLICY "Anyone can view author shares"
  ON public.author_shares
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy 2: Authenticated users can insert shares
CREATE POLICY "Authenticated users can insert author shares"
  ON public.author_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy 3: Users can delete their own shares
CREATE POLICY "Users can delete their own author shares"
  ON public.author_shares
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.author_followers IS 'Tracks which users follow which authors. Enables author interaction tracking.';
COMMENT ON TABLE public.author_likes IS 'Tracks which users like which authors. Enables author interaction tracking.';
COMMENT ON TABLE public.author_loves IS 'Tracks which users love which authors. Enables author interaction tracking.';
COMMENT ON TABLE public.author_comments IS 'Stores user comments on author profiles. Enables community engagement.';
COMMENT ON TABLE public.author_ratings IS 'Tracks user ratings for authors (1-5 stars). Enables quality feedback.';
COMMENT ON TABLE public.author_shares IS 'Tracks when users share author profiles. Enables social reach tracking.';
