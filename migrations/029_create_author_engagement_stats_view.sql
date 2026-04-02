-- ============================================================================
-- Author Engagement Statistics View
-- ============================================================================
-- Creates a comprehensive view for author engagement metrics
-- Aggregates data from books, likes, loves, comments, and ratings

CREATE OR REPLACE VIEW public.author_engagement_stats AS
SELECT 
  an.author_name,
  COUNT(DISTINCT b.id) as books_count,
  COALESCE(SUM(b.downloads_count), 0) as total_downloads,
  COALESCE(SUM(b.views_count), 0) as total_views,
  COALESCE(AVG(NULLIF(b.rating, 0)), 0) as average_rating,
  COALESCE(alc.likes_count, 0) as likes_count,
  COALESCE(alvc.loves_count, 0) as loves_count,
  COALESCE((SELECT COUNT(*) FROM public.author_comments ac WHERE ac.author_name = an.author_name), 0) as comments_count,
  COALESCE((SELECT COUNT(*) FROM public.author_ratings ar WHERE ar.author_name = an.author_name), 0) as ratings_count,
  0 as shares_count,
  0 as followers_count,
  -- Calculate engagement score: weighted sum of all metrics
  (
    COALESCE(alc.likes_count, 0) * 1 +
    COALESCE(alvc.loves_count, 0) * 2 +
    COALESCE((SELECT COUNT(*) FROM public.author_comments ac WHERE ac.author_name = an.author_name), 0) * 3 +
    COALESCE((SELECT COUNT(*) FROM public.author_ratings ar WHERE ar.author_name = an.author_name), 0) * 2 +
    (COALESCE(SUM(b.views_count), 0) / NULLIF(GREATEST(COUNT(DISTINCT b.id), 1), 0)) * 0.1
  )::NUMERIC as engagement_score,
  NOW() as last_updated
FROM (
  -- Get unique author names from all sources
  SELECT DISTINCT author_name FROM public.author_likes_counts
  UNION
  SELECT DISTINCT author_name FROM public.author_loves_counts
  UNION
  SELECT DISTINCT author_name FROM public.author_comments
  UNION
  SELECT DISTINCT author_name FROM public.author_ratings
  UNION
  SELECT DISTINCT author FROM public.books WHERE author IS NOT NULL
) an
LEFT JOIN public.author_likes_counts alc ON an.author_name = alc.author_name
LEFT JOIN public.author_loves_counts alvc ON an.author_name = alvc.author_name
LEFT JOIN public.books b ON an.author_name = b.author
GROUP BY 
  an.author_name,
  alc.likes_count,
  alvc.loves_count;

-- Add documentation
COMMENT ON VIEW public.author_engagement_stats IS 'Comprehensive engagement statistics for authors, aggregating likes, loves, comments, ratings, and shares data';
