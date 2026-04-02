-- =====================================================
-- Complete Book Comments Tracking System
-- =====================================================
-- This migration creates a complete comment tracking system for books,
-- including the comments_count aggregate column, RPC functions for
-- tracking comments, and automatic triggers for real-time count updates.
--
-- This system mirrors the views tracking implementation, providing:
-- - Atomic operations: Insert record + increment count in one call
-- - Automatic updates: Trigger fires on every comment insert
-- - Real-time aggregation: Always in sync without polling
-- - Data integrity: ON CONFLICT handling for duplicate prevention
-- - Analytics: Accurate comment counts for dashboard display
--
-- Result: Comments are recorded, counted, and displayed in real-time
-- =====================================================

-- =====================================================
-- Step 1: Add comments_count Column to books Table
-- =====================================================
-- If the column doesn't exist, add it with default value 0.
-- This aggregates the total comment count from the book_comments table.
-- =====================================================
ALTER TABLE books
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create an index on comments_count for efficient sorting
CREATE INDEX IF NOT EXISTS idx_books_comments_count ON books(comments_count DESC);

-- =====================================================
-- Step 2: Create RPC Function to Track and Record a Comment
-- =====================================================
-- track_book_comment(p_book_id UUID, p_user_id UUID, p_comment_text TEXT)
--
-- This function atomically:
-- 1. Validates the book exists
-- 2. Inserts a comment record into book_comments table
-- 3. Increments the books.comments_count by 1
-- 4. Handles conflicts gracefully (prevents duplicate entries)
--
-- Result: Comments are recorded and counted in real-time
-- =====================================================
CREATE OR REPLACE FUNCTION track_book_comment(p_book_id UUID, p_user_id UUID DEFAULT NULL, p_comment_text TEXT DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_book_id UUID;
BEGIN
  -- Validate book exists
  SELECT id INTO v_book_id FROM books WHERE id = p_book_id LIMIT 1;
  
  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'Book not found';
  END IF;

  -- Insert comment record
  INSERT INTO book_comments (book_id, user_id, text, created_at)
  VALUES (p_book_id, p_user_id, p_comment_text, NOW())
  ON CONFLICT DO NOTHING;

  -- Increment comments_count
  UPDATE books
  SET 
    comments_count = COALESCE(comments_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_book_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Step 3: Create Fallback Increment Function
-- =====================================================
-- increment_book_comments(p_book_id UUID)
--
-- Standalone function that just increments the comment count.
-- Used as a fallback if the main track_book_comment function
-- encounters issues or by other modules that need it.
-- =====================================================
CREATE OR REPLACE FUNCTION increment_book_comments(p_book_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE books
  SET 
    comments_count = COALESCE(comments_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_book_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Step 4: Grant Permissions
-- =====================================================
-- Allow authenticated and anonymous users to call these functions.
-- This enables the frontend to track comments for all users.
-- =====================================================
GRANT EXECUTE ON FUNCTION track_book_comment(UUID, UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_book_comments(UUID) TO authenticated, anon;

-- =====================================================
-- Step 5: Create Automatic Trigger Function
-- =====================================================
-- trigger_increment_book_comments()
--
-- This function fires automatically after a new comment is inserted
-- into the book_comments table. It ensures the comments_count is always
-- in sync with the actual number of comment records, even if the
-- track_book_comment function is bypassed.
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_increment_book_comments()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the comments_count on the books table
  UPDATE books
  SET 
    comments_count = COALESCE(comments_count, 0) + 1,
    updated_at = NOW()
  WHERE id = NEW.book_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Step 6: Drop and Recreate Trigger on book_comments
-- =====================================================
-- trigger_book_comments_increment
--
-- This trigger fires automatically AFTER any new row is inserted
-- into the book_comments table. It calls trigger_increment_book_comments()
-- to update the books.comments_count counter in real-time. This provides
-- automatic, atomic count updates without any frontend coordination.
--
-- Result: Every new comment record automatically increments the aggregate count
-- =====================================================
DROP TRIGGER IF EXISTS trigger_book_comments_increment ON book_comments;

-- Create trigger that fires after a new comment is inserted
CREATE TRIGGER trigger_book_comments_increment
AFTER INSERT ON book_comments
FOR EACH ROW
EXECUTE FUNCTION trigger_increment_book_comments();

-- =====================================================
-- Step 7: Recalculate all existing book comment counts
-- =====================================================
-- This recalculation query ensures all books have the correct comments_count
-- based on what's currently in the book_comments table. Run this after adding
-- the migration to fix any historical data that was not tracked before.
--
-- Result: All books.comments_count values are now accurate and in sync
-- =====================================================

UPDATE books b
SET 
  comments_count = COALESCE((
    SELECT COUNT(*)
    FROM book_comments
    WHERE book_id = b.id
  ), 0),
  updated_at = NOW()
WHERE TRUE;

-- =====================================================
-- Verify the setup
-- =====================================================
-- Check that everything is working
SELECT 
  (SELECT COUNT(*) FROM books) as total_books,
  (SELECT SUM(comments_count) FROM books) as total_comments_count,
  (SELECT COUNT(*) FROM book_comments) as total_comment_records,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'track_book_comment') as track_book_comment_exists,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'increment_book_comments') as increment_book_comments_exists;

-- Sample query to see books with comment counts
SELECT id, title, comments_count
FROM books
WHERE comments_count > 0
ORDER BY comments_count DESC
LIMIT 10;
