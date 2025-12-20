-- ============================================================
-- Create user_rankings table for leaderboard
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  score DECIMAL(10, 2) DEFAULT 0,
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum', 'legend'
  rank_position INTEGER,
  reading_score DECIMAL(10, 2) DEFAULT 0,
  engagement_score DECIMAL(10, 2) DEFAULT 0,
  contribution_score DECIMAL(10, 2) DEFAULT 0,
  goals_score DECIMAL(10, 2) DEFAULT 0,
  achievements_score DECIMAL(10, 2) DEFAULT 0,
  subscription_bonus_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_rankings_user_id ON public.user_rankings(user_id);
now add Upload Column Which should capture the Uploads which are currently under VIew Uploads anduse only the button named View for each row, and the ranking should start after super admins
-- Create index on rank_position for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_rankings_rank_position ON public.user_rankings(rank_position);

-- Create index on score for sorting
CREATE INDEX IF NOT EXISTS idx_user_rankings_score ON public.user_rankings(score DESC);

-- Enable RLS
ALTER TABLE public.user_rankings ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Anyone can view rankings (public leaderboard)
CREATE POLICY "Anyone can view user rankings"
  ON public.user_rankings
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy 2: Only admins can insert/update/delete (computed server-side)
CREATE POLICY "Only admins can manage user rankings"
  ON public.user_rankings
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only admins can update user rankings"
  ON public.user_rankings
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only admins can delete user rankings"
  ON public.user_rankings
  FOR DELETE
  TO authenticated
  USING (false);

-- Admin role can bypass RLS
DROP POLICY IF EXISTS "Admin full access to user rankings" ON public.user_rankings;
CREATE POLICY "Admin full access to user rankings"
  ON public.user_rankings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
