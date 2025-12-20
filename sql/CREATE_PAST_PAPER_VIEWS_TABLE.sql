-- =====================================================
-- Migration: Create past_paper_views table and RPC function
-- =====================================================

-- Step 1: Create past_paper_views table to track views
CREATE TABLE IF NOT EXISTS past_paper_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE(paper_id, user_id, viewed_at)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_past_paper_views_paper_id ON past_paper_views(paper_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_views_user_id ON past_paper_views(user_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_views_viewed_at ON past_paper_views(viewed_at DESC);

-- Step 2: Create RPC function to increment views
CREATE OR REPLACE FUNCTION increment_past_paper_views(paper_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE past_papers
  SET 
    views_count = COALESCE(views_count, 0) + 1,
    updated_at = NOW()
  WHERE id = paper_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_past_paper_views(UUID) TO authenticated, anon;

-- Verify the table and function were created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'past_paper_views'
ORDER BY ordinal_position;

SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'increment_past_paper_views';
