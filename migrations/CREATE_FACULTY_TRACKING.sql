-- Create faculty views and likes tracking tables
-- This enables consistent view and like counts across all browsers and users

-- Step 1: Create faculty_views table to track individual user views per faculty
CREATE TABLE IF NOT EXISTS public.faculty_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  faculty_name TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, faculty_name)
);

-- Step 2: Create faculty_likes table to track individual user likes per faculty
CREATE TABLE IF NOT EXISTS public.faculty_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  faculty_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, faculty_name)
);

-- Step 3: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_faculty_views_user_id ON public.faculty_views(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_views_faculty_name ON public.faculty_views(faculty_name);
CREATE INDEX IF NOT EXISTS idx_faculty_likes_user_id ON public.faculty_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_likes_faculty_name ON public.faculty_likes(faculty_name);

-- Step 4: Enable RLS on both tables
ALTER TABLE public.faculty_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_likes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for faculty_views
-- Allow users to see their own views and select their own data for updates
DROP POLICY IF EXISTS "Users can view their own faculty views" ON public.faculty_views;
CREATE POLICY "Users can view their own faculty views"
  ON public.faculty_views
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert/update their own faculty views" ON public.faculty_views;
CREATE POLICY "Users can insert/update their own faculty views"
  ON public.faculty_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own faculty views" ON public.faculty_views;
CREATE POLICY "Users can update their own faculty views"
  ON public.faculty_views
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 6: Create RLS policies for faculty_likes
-- Allow users to insert/delete their own likes, but view all likes aggregated
DROP POLICY IF EXISTS "Users can view all faculty likes" ON public.faculty_likes;
CREATE POLICY "Users can view all faculty likes"
  ON public.faculty_likes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own faculty likes" ON public.faculty_likes;
CREATE POLICY "Users can insert their own faculty likes"
  ON public.faculty_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own faculty likes" ON public.faculty_likes;
CREATE POLICY "Users can delete their own faculty likes"
  ON public.faculty_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Create RPC function to get aggregated like counts across all users
DROP FUNCTION IF EXISTS get_faculty_like_counts();
CREATE FUNCTION get_faculty_like_counts()
RETURNS TABLE (faculty_name TEXT, count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    faculty_name,
    COUNT(*) as count
  FROM public.faculty_likes
  GROUP BY faculty_name
  ORDER BY faculty_name;
$$;

-- Step 8: Grant permissions to authenticated users
GRANT SELECT ON public.faculty_views TO authenticated;
GRANT INSERT ON public.faculty_views TO authenticated;
GRANT UPDATE ON public.faculty_views TO authenticated;
GRANT SELECT ON public.faculty_likes TO authenticated;
GRANT INSERT ON public.faculty_likes TO authenticated;
GRANT DELETE ON public.faculty_likes TO authenticated;

-- Step 9: Verify tables are created
SELECT 'faculty_views' as table_name, COUNT(*) as row_count FROM public.faculty_views
UNION ALL
SELECT 'faculty_likes' as table_name, COUNT(*) as row_count FROM public.faculty_likes;
