-- ============================================================================
-- Migration 031: Fix Author Ratings Display and Persistence
-- ============================================================================
-- 1. Updates author_engagement_stats view to include actual author ratings
-- 2. Adds followers_count aggregation
-- 3. Ensures average_rating comes from author_ratings table, not books
-- 4. Fixes engagement score calculation

-- Drop and recreate the view with corrected logic
DROP VIEW IF EXISTS public.author_engagement_stats CASCADE;

CREATE VIEW public.author_engagement_stats AS
SELECT 
  an.author_name,
  COUNT(DISTINCT b.id) as books_count,
  COALESCE(SUM(b.downloads_count), 0) as total_downloads,
  COALESCE(SUM(b.views_count), 0) as total_views,
  -- Use actual author ratings, not book ratings
  COALESCE(AVG(NULLIF(ar.rating_value::NUMERIC, 0)), 0)::NUMERIC as average_rating,
  COALESCE(alc.likes_count, 0) as likes_count,
  COALESCE(alvc.loves_count, 0) as loves_count,
  COALESCE((SELECT COUNT(*) FROM public.author_comments ac WHERE ac.author_name = an.author_name), 0) as comments_count,
  COALESCE((SELECT COUNT(*) FROM public.author_ratings ar2 WHERE ar2.author_name = an.author_name), 0) as ratings_count,
  COALESCE((SELECT COUNT(*) FROM public.author_shares ash WHERE ash.author_name = an.author_name), 0) as shares_count,
  COALESCE(afc.followers_count, 0) as followers_count,
  -- Calculate engagement score: weighted sum of all metrics
  (
    COALESCE(alc.likes_count, 0) * 1 +
    COALESCE(alvc.loves_count, 0) * 2 +
    COALESCE((SELECT COUNT(*) FROM public.author_comments ac WHERE ac.author_name = an.author_name), 0) * 3 +
    COALESCE((SELECT COUNT(*) FROM public.author_ratings ar2 WHERE ar2.author_name = an.author_name), 0) * 2 +
    COALESCE(afc.followers_count, 0) * 1.5 +
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
  SELECT DISTINCT author_name FROM public.author_followers
  UNION
  SELECT DISTINCT author_name FROM public.author_shares
  UNION
  SELECT DISTINCT author FROM public.books WHERE author IS NOT NULL
) an
LEFT JOIN public.author_likes_counts alc ON an.author_name = alc.author_name
LEFT JOIN public.author_loves_counts alvc ON an.author_name = alvc.author_name
LEFT JOIN public.author_ratings ar ON an.author_name = ar.author_name
LEFT JOIN (
  SELECT author_name, COUNT(*) as followers_count 
  FROM public.author_followers 
  WHERE is_active = true
  GROUP BY author_name
) afc ON an.author_name = afc.author_name
LEFT JOIN public.books b ON an.author_name = b.author
GROUP BY 
  an.author_name,
  alc.likes_count,
  alvc.loves_count,
  afc.followers_count;

-- Add documentation
COMMENT ON VIEW public.author_engagement_stats IS 'Comprehensive engagement statistics for authors, aggregating actual author ratings, likes, loves, comments, ratings, shares, and followers data. Average rating comes from author_ratings table.';

-- ============================================================================
-- Add indexes for rating aggregation performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_author_ratings_author_name ON public.author_ratings(author_name);
CREATE INDEX IF NOT EXISTS idx_author_ratings_user_id ON public.author_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_author_followers_author_name ON public.author_followers(author_name);
CREATE INDEX IF NOT EXISTS idx_author_followers_is_active ON public.author_followers(is_active);

-- ============================================================================
-- Summary of Changes
-- ============================================================================
-- 1. author_engagement_stats now pulls average_rating from author_ratings table
-- 2. Added followers_count from author_followers aggregation
-- 3. Added shares_count from author_shares aggregation
-- 4. Fixed engagement_score calculation to include followers and updated weights
-- 5. Added indexes for better performance on author ratings and followers lookups
