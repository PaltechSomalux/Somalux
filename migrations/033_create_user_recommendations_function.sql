-- ============================================================================
-- Migration 033: Create get_user_recommendations RPC Function
-- ============================================================================
-- Purpose: Provide personalized book recommendations based on user preferences
-- Parameters:
--   - p_user_id: UUID of the user
--   - p_limit: Number of recommendations to return (default 6)
-- Returns: (book_id, reason, recommendation_score)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_recommendations(
  p_user_id UUID,
  p_limit INT DEFAULT 6
)
RETURNS TABLE (book_id UUID, reason TEXT, recommendation_score NUMERIC)
LANGUAGE sql
STABLE
AS $$
  WITH user_preferences AS (
    -- Get user's read books and their ratings/interactions
    SELECT DISTINCT 
      b.category_id,
      b.author,
      COUNT(CASE WHEN br.user_id = p_user_id THEN 1 END) as interaction_count,
      AVG(COALESCE(br.rating, 0)) as avg_rating
    FROM public.books b
    LEFT JOIN public.book_ratings br ON b.id = br.book_id
    WHERE (br.user_id = p_user_id OR br.user_id IS NULL)
    GROUP BY b.category_id, b.author
  ),
  user_wishlist AS (
    -- Books user already has rated
    SELECT DISTINCT book_id FROM public.book_ratings WHERE user_id = p_user_id
  ),
  scored_books AS (
    SELECT 
      b.id as book_id,
      -- Scoring: category match + author match + popularity
      (
        COALESCE((SELECT COUNT(*) FROM user_preferences WHERE category_id = b.category_id), 0) * 3 +
        COALESCE((SELECT COUNT(*) FROM user_preferences WHERE author = b.author), 0) * 2 +
        COALESCE(b.downloads_count, 0) * 0.01 +
        COALESCE(b.views_count, 0) * 0.005 +
        COALESCE(b.rating, 0) * 5
      ) as score,
      CASE 
        WHEN b.category_id IN (SELECT category_id FROM user_preferences) THEN 'Based on your favorite categories'
        WHEN b.author IN (SELECT author FROM user_preferences) THEN 'From your favorite authors'
        ELSE 'Popular in your reading style'
      END as reason
    FROM public.books b
    WHERE b.id NOT IN (SELECT book_id FROM user_wishlist)
      AND b.category_id IS NOT NULL
    ORDER BY score DESC
  )
  SELECT 
    book_id,
    reason,
    score::NUMERIC as recommendation_score
  FROM scored_books
  LIMIT p_limit;
$$;

-- Add documentation
COMMENT ON FUNCTION get_user_recommendations(UUID, INT) IS 'Generate personalized book recommendations for a user based on their reading history, ratings, and preferences. Used in BookPanel.jsx for recommendation carousel.';

-- ============================================================================
-- Optional: Create indexes to optimize this query
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_book_ratings_user_id ON public.book_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_book_ratings_book_id ON public.book_ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_author ON public.books(author);

-- ============================================================================
-- Summary of Changes
-- ============================================================================
-- 1. Created get_user_recommendations(p_user_id, p_limit) RPC function
-- 2. Returns (book_id, reason, recommendation_score) tuples
-- 3. Scores books based on:
--    - Category matches (3x weight)
--    - Author matches (2x weight)
--    - Popularity (downloads, views, ratings)
-- 4. Excludes books already rated by user
-- 5. Added indexes for faster user preference lookups
