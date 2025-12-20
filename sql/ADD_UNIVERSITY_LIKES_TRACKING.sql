-- Add university likes tracking to the database
-- This migration adds support for tracking and counting university likes

-- Step 1: Add likes_count column to universities table if not exists
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Step 2: Create table to track individual user likes (for deduplication)
CREATE TABLE IF NOT EXISTS public.university_likes (
  id BIGSERIAL PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one like per user per university
  UNIQUE(university_id, user_id),
  
  -- Index for efficient lookups
  CONSTRAINT fk_university_likes_university FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_university_likes_university_id ON public.university_likes(university_id);
CREATE INDEX IF NOT EXISTS idx_university_likes_user_id ON public.university_likes(user_id);

-- Step 3: Create RPC function to toggle university likes
-- Drop existing function if it exists (in case return type changed)
DROP FUNCTION IF EXISTS toggle_university_like(UUID, UUID);

CREATE FUNCTION toggle_university_like(
  p_university_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_liked BOOLEAN;
  v_count INTEGER;
BEGIN
  -- Check if user already liked this university
  v_liked := EXISTS(
    SELECT 1 FROM university_likes 
    WHERE university_id = p_university_id 
    AND user_id = p_user_id
  );
  
  IF v_liked THEN
    -- Remove the like
    DELETE FROM university_likes 
    WHERE university_id = p_university_id 
    AND user_id = p_user_id;
  ELSE
    -- Add the like
    INSERT INTO university_likes (university_id, user_id) 
    VALUES (p_university_id, p_user_id)
    ON CONFLICT (university_id, user_id) DO NOTHING;
  END IF;
  
  -- Get updated count
  SELECT COUNT(*) INTO v_count 
  FROM university_likes 
  WHERE university_id = p_university_id;
  
  -- Update the universities table
  UPDATE universities 
  SET likes_count = v_count 
  WHERE id = p_university_id;
  
  -- Return the new state
  v_result := json_build_object(
    'liked', NOT v_liked,
    'count', v_count
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Enable RLS on university_likes table
ALTER TABLE public.university_likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their own likes
CREATE POLICY "Allow users to insert their own likes"
  ON public.university_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Allow anyone to delete their own likes
CREATE POLICY "Allow users to delete their own likes"
  ON public.university_likes
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Allow anyone to view likes
CREATE POLICY "Allow anyone to view likes"
  ON public.university_likes
  FOR SELECT
  USING (true);
