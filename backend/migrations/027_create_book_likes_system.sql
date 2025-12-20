-- ============================================================================
-- Book Likes System
-- ============================================================================
-- Creates book_likes table, likes_count column in books table, and tracking triggers

-- Step 1: Add likes_count column to books table if it doesn't exist
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Step 2: Create book_likes table
CREATE TABLE IF NOT EXISTS public.book_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_likes_user_id ON public.book_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_book_likes_book_id ON public.book_likes(book_id);
CREATE INDEX IF NOT EXISTS idx_book_likes_created_at ON public.book_likes(created_at DESC);

-- Step 4: Enable RLS on book_likes table
ALTER TABLE public.book_likes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies for book_likes
DROP POLICY IF EXISTS "Anyone can view book likes" ON public.book_likes;
CREATE POLICY "Anyone can view book likes"
  ON public.book_likes
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can like books" ON public.book_likes;
CREATE POLICY "Authenticated users can like books"
  ON public.book_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.book_likes;
CREATE POLICY "Users can unlike their own likes"
  ON public.book_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Step 6: Create function to update book likes_count
CREATE OR REPLACE FUNCTION public.update_book_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.books 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.book_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.books 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.book_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger on book_likes
DROP TRIGGER IF EXISTS update_book_likes_count_trigger ON public.book_likes;
CREATE TRIGGER update_book_likes_count_trigger
AFTER INSERT OR DELETE ON public.book_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_book_likes_count();

-- Step 8: Rebuild likes_count from existing data
UPDATE public.books 
SET likes_count = (
  SELECT COUNT(*) FROM public.book_likes 
  WHERE book_likes.book_id = books.id
);

-- Step 9: Add comment to explain the system
COMMENT ON TABLE public.book_likes IS 'Tracks which users have liked which books';
COMMENT ON COLUMN public.book_likes.user_id IS 'User who liked the book';
COMMENT ON COLUMN public.book_likes.book_id IS 'Book that was liked';
COMMENT ON COLUMN public.book_likes.created_at IS 'When the like was created';
COMMENT ON COLUMN public.books.likes_count IS 'Denormalized count of likes for this book';
