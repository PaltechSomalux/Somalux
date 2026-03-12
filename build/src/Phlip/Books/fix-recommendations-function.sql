-- ============================================
-- FIX AMBIGUOUS COLUMN REFERENCE IN RECOMMENDATIONS
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop and recreate the function with proper column qualifications
DROP FUNCTION IF EXISTS get_user_recommendations(UUID, INTEGER);

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;

-- ============================================
-- DONE! Now test with:
-- SELECT * FROM get_user_recommendations('your-user-uuid', 10);
-- ============================================
