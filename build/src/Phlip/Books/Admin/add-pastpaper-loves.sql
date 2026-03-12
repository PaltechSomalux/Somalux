-- Past Paper Loves (Likes) real-time support
-- Run this in Supabase SQL editor

-- 1) Table
CREATE TABLE IF NOT EXISTS past_paper_loves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES past_papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(paper_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_past_paper_loves_paper ON past_paper_loves(paper_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_loves_user ON past_paper_loves(user_id);

-- 2) RLS
ALTER TABLE past_paper_loves ENABLE ROW LEVEL SECURITY;

-- Anyone can read aggregate counts
CREATE POLICY "Anyone can read loves" ON past_paper_loves
  FOR SELECT USING (true);

-- Only authenticated users can like
CREATE POLICY "Auth users can like" ON past_paper_loves
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Only owner can unlike
CREATE POLICY "Owner can unlike" ON past_paper_loves
  FOR DELETE USING (auth.uid() = user_id);

-- 3) Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE past_paper_loves;

-- 4) Helper views (optional)
CREATE OR REPLACE VIEW past_paper_love_counts AS
SELECT paper_id, COUNT(*)::INT AS love_count
FROM past_paper_loves
GROUP BY paper_id;
