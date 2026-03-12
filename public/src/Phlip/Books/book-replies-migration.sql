-- =============================================
-- Book Replies Migration
-- Creates table and policies for persistent replies
-- =============================================

-- Create book_replies table
CREATE TABLE IF NOT EXISTS public.book_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.book_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_book_replies_comment_id ON public.book_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_book_replies_user_id ON public.book_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_book_replies_created_at ON public.book_replies(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.book_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view replies
CREATE POLICY "Anyone can view replies"
  ON public.book_replies
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own replies
CREATE POLICY "Authenticated users can insert replies"
  ON public.book_replies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own replies
CREATE POLICY "Users can update their own replies"
  ON public.book_replies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies"
  ON public.book_replies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for book_replies
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_replies;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_book_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_book_replies_updated_at
  BEFORE UPDATE ON public.book_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_book_replies_updated_at();

-- Grant permissions
GRANT ALL ON public.book_replies TO authenticated;
GRANT SELECT ON public.book_replies TO anon;

COMMENT ON TABLE public.book_replies IS 'Stores replies to book comments';
