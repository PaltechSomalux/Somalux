-- Create user_points_stats table
CREATE TABLE IF NOT EXISTS public.user_points_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INT NOT NULL DEFAULT 0,
  daily_logins INT NOT NULL DEFAULT 0,
  achievements_unlocked INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create daily_rewards table
CREATE TABLE IF NOT EXISTS public.daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 10,
  date_claimed DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create unique index for one reward per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_rewards_user_day 
ON public.daily_rewards(user_id, date_claimed);

-- Create RPC function for daily login reward
CREATE OR REPLACE FUNCTION public.daily_login_reward()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_today DATE;
  v_existing_reward UUID;
  v_reward_points INT := 10;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN JSON_BUILD_OBJECT(
      'success', FALSE,
      'message', 'Not authenticated'
    );
  END IF;

  v_today := CURRENT_DATE;

  -- Check if user already claimed reward today
  SELECT id INTO v_existing_reward
  FROM public.daily_rewards
  WHERE user_id = v_user_id
  AND date_claimed = v_today
  LIMIT 1;

  IF v_existing_reward IS NOT NULL THEN
    RETURN JSON_BUILD_OBJECT(
      'success', TRUE,
      'message', 'Already claimed today',
      'points', 0
    );
  END IF;

  -- Insert new daily reward
  INSERT INTO public.daily_rewards (user_id, points, date_claimed, created_at)
  VALUES (v_user_id, v_reward_points, v_today, NOW());

  -- Update user points/credits in profiles table if it exists
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + v_reward_points
  WHERE id = v_user_id;

  RETURN JSON_BUILD_OBJECT(
    'success', TRUE,
    'message', 'Daily reward claimed',
    'points', v_reward_points
  );
END;
$$;

-- Enable RLS on user_points_stats table
ALTER TABLE public.user_points_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own stats
DROP POLICY IF EXISTS "Users can view own points stats" ON public.user_points_stats;
CREATE POLICY "Users can view own points stats"
  ON public.user_points_stats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Enable RLS on daily_rewards table
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own rewards
DROP POLICY IF EXISTS "Users can view own daily rewards" ON public.daily_rewards;
CREATE POLICY "Users can view own daily rewards"
  ON public.daily_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own rewards (via RPC)
DROP POLICY IF EXISTS "Users can insert own daily rewards" ON public.daily_rewards;
CREATE POLICY "Users can insert own daily rewards"
  ON public.daily_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
