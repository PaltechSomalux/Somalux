-- Add view and download tracking functions for past papers
-- This should be run in your Supabase SQL editor
-- IMPORTANT: Run this AFTER the main campus-pastpapers-setup.sql

-- =====================================================
-- DROP OLD FUNCTIONS (if they exist with wrong types)
-- =====================================================
DROP FUNCTION IF EXISTS increment_past_paper_views(BIGINT);
DROP FUNCTION IF EXISTS increment_past_paper_downloads(BIGINT);
DROP FUNCTION IF EXISTS increment_past_paper_views(UUID);
DROP FUNCTION IF EXISTS increment_past_paper_downloads(UUID);

-- =====================================================
-- FUNCTION: Increment Views Count
-- =====================================================
CREATE OR REPLACE FUNCTION increment_past_paper_views(paper_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE past_papers
  SET views = COALESCE(views, 0) + 1,
      updated_at = NOW()
  WHERE id = paper_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_past_paper_views TO authenticated;

-- Comment
COMMENT ON FUNCTION increment_past_paper_views IS 'Increments the view count for a past paper';

-- =====================================================
-- FUNCTION: Increment Downloads Count
-- =====================================================
CREATE OR REPLACE FUNCTION increment_past_paper_downloads(paper_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE past_papers
  SET downloads = COALESCE(downloads, 0) + 1,
      updated_at = NOW()
  WHERE id = paper_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_past_paper_downloads TO authenticated;

-- Comment
COMMENT ON FUNCTION increment_past_paper_downloads IS 'Increments the download count for a past paper';

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_past_papers_views ON past_papers(views DESC);
CREATE INDEX IF NOT EXISTS idx_past_papers_downloads ON past_papers(downloads DESC);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, verify with:
-- SELECT * FROM past_papers ORDER BY downloads DESC LIMIT 5;
-- SELECT * FROM past_papers ORDER BY views DESC LIMIT 5;
