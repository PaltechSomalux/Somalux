-- Migration 014: Create past_paper_comments table
CREATE TABLE IF NOT EXISTS public.past_paper_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.past_papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_past_paper_comments_paper_id ON public.past_paper_comments(paper_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_comments_user_id ON public.past_paper_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_past_paper_comments_created_at ON public.past_paper_comments(created_at);

-- Enable RLS
ALTER TABLE public.past_paper_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view comments" ON public.past_paper_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.past_paper_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.past_paper_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.past_paper_comments;

-- RLS Policies
CREATE POLICY "Anyone can view comments"
  ON public.past_paper_comments
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.past_paper_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.past_paper_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.past_paper_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
  ON public.past_paper_comments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
