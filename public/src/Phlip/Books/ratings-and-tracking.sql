-- ============================================
-- RATINGS & ADVANCED TRACKING SYSTEM
-- Book ratings, detailed view tracking, and recommendations
-- ============================================

-- 1. Create book_ratings table
CREATE TABLE IF NOT EXISTS public.book_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, user_id)  -- One rating per user per book
);

-- 2. Create detailed book_views table
CREATE TABLE IF NOT EXISTS public.book_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_ratings_book_id ON public.book_ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_book_ratings_user_id ON public.book_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_book_views_book_id ON public.book_views(book_id);
CREATE INDEX IF NOT EXISTS idx_book_views_user_id ON public.book_views(user_id);
CREATE INDEX IF NOT EXISTS idx_book_views_category_id ON public.book_views(category_id);
CREATE INDEX IF NOT EXISTS idx_book_views_viewed_at ON public.book_views(viewed_at DESC);

-- 4. Add rating columns to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 5. Create trigger to update book average rating
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate average rating and count for the book
  UPDATE public.books
  SET 
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      FROM public.book_ratings
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.book_ratings
      WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)
    )
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_rating_change ON public.book_ratings;

-- Create trigger on ratings
CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON public.book_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_book_rating();

-- 6. Create function to track book view with details
CREATE OR REPLACE FUNCTION track_book_view(
  p_book_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- Get book category
  SELECT category_id INTO v_category_id
  FROM public.books
  WHERE id = p_book_id;
  
  -- Insert view record
  INSERT INTO public.book_views (book_id, user_id, category_id)
  VALUES (p_book_id, p_user_id, v_category_id);
  
  -- Update book views count
  UPDATE public.books
  SET views = views + 1
  WHERE id = p_book_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to get user's book recommendations
CREATE OR REPLACE FUNCTION get_user_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  book_id UUID,
  recommendation_score DECIMAL,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_categories AS (
    -- Get categories user has viewed
    SELECT 
      bv.category_id,
      COUNT(*) as view_count
    FROM public.book_views bv
    WHERE bv.user_id = p_user_id AND bv.category_id IS NOT NULL
    GROUP BY bv.category_id
  ),
  user_viewed_books AS (
    -- Books user has already viewed
    SELECT DISTINCT bv.book_id as viewed_book_id
    FROM public.book_views bv
    WHERE bv.user_id = p_user_id
  )
  SELECT 
    b.id as book_id,
    (
      -- Score based on category match (40%)
      COALESCE(uc.view_count, 0) * 0.4 +
      -- Average rating (30%)
      COALESCE(b.average_rating, 0) * 0.3 +
      -- Popularity (views + downloads) (30%)
      (COALESCE(b.views, 0) + COALESCE(b.downloads, 0) * 2) * 0.0003
    )::DECIMAL as recommendation_score,
    CASE 
      WHEN uc.view_count > 0 THEN 'Based on your interest in ' || c.name
      WHEN b.average_rating >= 4.0 THEN 'Highly rated'
      ELSE 'Popular choice'
    END as reason
  FROM public.books b
  LEFT JOIN user_categories uc ON b.category_id = uc.category_id
  LEFT JOIN public.categories c ON b.category_id = c.id
  WHERE b.id NOT IN (SELECT uvb.viewed_book_id FROM user_viewed_books uvb)
    AND b.file_path IS NOT NULL
  ORDER BY recommendation_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 8. Enable RLS on new tables
ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_views ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for book_ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.book_ratings;
CREATE POLICY "Anyone can view ratings"
  ON public.book_ratings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can rate" ON public.book_ratings;
CREATE POLICY "Authenticated users can rate"
  ON public.book_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their ratings" ON public.book_ratings;
CREATE POLICY "Users can update their ratings"
  ON public.book_ratings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their ratings" ON public.book_ratings;
CREATE POLICY "Users can delete their ratings"
  ON public.book_ratings
  FOR DELETE
  USING (auth.uid() = user_id);

-- 10. RLS Policies for book_views
DROP POLICY IF EXISTS "Users can view their own views" ON public.book_views;
CREATE POLICY "Users can view their own views"
  ON public.book_views
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can view all" ON public.book_views;
CREATE POLICY "Service role can view all"
  ON public.book_views
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can track views" ON public.book_views;
CREATE POLICY "Authenticated users can track views"
  ON public.book_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 11. Enable realtime for ratings
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_ratings;

-- 12. Grant permissions
GRANT ALL ON public.book_ratings TO authenticated;
GRANT SELECT ON public.book_ratings TO anon;
GRANT ALL ON public.book_views TO authenticated;
GRANT EXECUTE ON FUNCTION track_book_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Rate a book (user must be authenticated)
-- INSERT INTO book_ratings (book_id, user_id, rating)
-- VALUES ('book-uuid', 'user-uuid', 5)
-- ON CONFLICT (book_id, user_id) 
-- DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW();

-- Track a view
-- SELECT track_book_view('book-uuid', 'user-uuid');

-- Get recommendations for a user
-- SELECT * FROM get_user_recommendations('user-uuid', 10);

-- Get user's rating for a book
-- SELECT rating FROM book_ratings 
-- WHERE book_id = 'book-uuid' AND user_id = 'user-uuid';

-- Get view statistics
-- SELECT 
--   b.title,
--   COUNT(DISTINCT bv.user_id) as unique_viewers,
--   COUNT(*) as total_views,
--   c.name as category
-- FROM book_views bv
-- JOIN books b ON b.id = bv.book_id
-- LEFT JOIN categories c ON c.id = bv.category_id
-- GROUP BY b.id, b.title, c.name
-- ORDER BY total_views DESC;

-- ============================================
-- DONE! 
-- ============================================
-- Now you have:
-- 1. ✅ Book ratings (1-5 stars) with one per user
-- 2. ✅ Automatic average rating calculation
-- 3. ✅ Detailed view tracking (who, what, when, category)
-- 4. ✅ Recommendation engine based on views and ratings
-- 5. ✅ RLS policies for security
-- 6. ✅ Realtime updates for ratings
-- ============================================
