-- Create university_ratings table
CREATE TABLE IF NOT EXISTS public.university_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(university_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_university_ratings_university_id ON public.university_ratings(university_id);
CREATE INDEX IF NOT EXISTS idx_university_ratings_user_id ON public.university_ratings(user_id);

-- Enable Row Level Security
ALTER TABLE public.university_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.university_ratings;
DROP POLICY IF EXISTS "Users can insert own ratings" ON public.university_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.university_ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.university_ratings;

-- RLS Policies
CREATE POLICY "Anyone can view ratings"
  ON public.university_ratings
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Users can insert own ratings"
  ON public.university_ratings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.university_ratings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.university_ratings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
