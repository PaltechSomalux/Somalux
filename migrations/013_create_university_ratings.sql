-- Migration 013: Create university_ratings table
-- This table tracks user ratings for universities

CREATE TABLE IF NOT EXISTS public.university_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(university_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_university_ratings_university_id ON public.university_ratings(university_id);
CREATE INDEX IF NOT EXISTS idx_university_ratings_user_id ON public.university_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_university_ratings_university_user ON public.university_ratings(university_id, user_id);

-- Enable RLS
ALTER TABLE public.university_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Authenticated users can insert their own ratings
CREATE POLICY "Allow authenticated users to insert their own ratings" ON public.university_ratings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy 2: Anyone can view ratings (helpful for displaying stats)
CREATE POLICY "Allow anyone to view university ratings" ON public.university_ratings
FOR SELECT
TO public
USING (true);

-- RLS Policy 3: Users can update their own ratings
CREATE POLICY "Allow users to update their own ratings" ON public.university_ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy 4: Users can delete their own ratings
CREATE POLICY "Allow users to delete their own ratings" ON public.university_ratings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy 5: Admins can manage all ratings
CREATE POLICY "Allow admins to manage all ratings" ON public.university_ratings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

GRANT SELECT ON public.university_ratings TO authenticated;
GRANT INSERT ON public.university_ratings TO authenticated;
GRANT UPDATE ON public.university_ratings TO authenticated;
GRANT DELETE ON public.university_ratings TO authenticated;
