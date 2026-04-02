-- =====================================================
-- Complete Book Views Tracking System
-- =====================================================
-- Creates all necessary functions, triggers, and permissions
-- to track and record book views persistently in the database.
--
-- Functions Created:
--   1. track_book_view(p_book_id UUID, p_user_id UUID)
--      - Records a view in book_views table
--      - Increments books.views_count
--      - Called when users open books
--
--   2. increment_book_views(p_book_id UUID)
--      - Increments views_count (fallback function)
--      - Used by other modules if needed
--
-- Triggers Created:
--   1. trigger_book_views_increment
--      - Fires after INSERT on book_views
--      - Auto-increments views_count
--      - Keeps timestamp current
--
-- Data Operations:
--   - Recalculates all existing view counts from book_views table
--   - Ensures historical accuracy from day 1
--   - Validates setup with verification queries
-- =====================================================

-- =====================================================
-- Step 1: Create Main View Tracking Function
-- =====================================================
-- track_book_view(p_book_id UUID, p_user_id UUID DEFAULT NULL)
-- 
-- This is the primary function called by the frontend when a user
-- opens a book. It:
--   1. Validates the book exists in the database
--   2. Inserts a view record into book_views table
--   3. Increments the books.views_count atomically
--   4. Handles duplicate insertions gracefully
--
-- Result: Views are recorded and counted in real-time
-- =====================================================
CREATE OR REPLACE FUNCTION track_book_view(p_book_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_book_id UUID;
BEGIN
  -- Validate book exists
  SELECT id INTO v_book_id FROM books WHERE id = p_book_id LIMIT 1;
  
  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'Book not found';
  END IF;

  -- Insert view record
  INSERT INTO book_views (book_id, user_id, view_date)
  VALUES (p_book_id, p_user_id, NOW())
  ON CONFLICT DO NOTHING;

  -- Increment views_count
  UPDATE books
  SET 
    views_count = COALESCE(views_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_book_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Step 2: Create Fallback Increment Function
-- =====================================================
-- increment_book_views(p_book_id UUID)
--
-- Standalone function that just increments the view count.
-- Used as a fallback if the main track_book_view function
-- encounters issues or by other modules that need it.
-- =====================================================
CREATE OR REPLACE FUNCTION increment_book_views(p_book_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE books
  SET 
    views_count = COALESCE(views_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_book_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Step 3: Grant Permissions
-- =====================================================
-- Allow authenticated and anonymous users to call these functions.
-- This enables the frontend to track views for all users.
-- =====================================================
GRANT EXECUTE ON FUNCTION track_book_view(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_book_views(UUID) TO authenticated, anon;

-- =====================================================
-- Step 4: Create Automatic Trigger Function
-- =====================================================
-- trigger_increment_book_views()
--
-- This function fires automatically after a new view is inserted
-- into the book_views table. It ensures the views_count is always
-- in sync with the actual number of view records, even if the
-- track_book_view function is bypassed.
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_increment_book_views()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the views_count on the books table
  UPDATE books
  SET 
    views_count = COALESCE(views_count, 0) + 1,
    updated_at = NOW()
  WHERE id = NEW.book_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Drop and Recreate Trigger on book_views
-- =====================================================
-- trigger_book_views_increment
--
-- This trigger fires automatically AFTER any new row is inserted
-- into the book_views table. It calls trigger_increment_book_views()
-- to update the books.views_count counter in real-time. This provides
-- automatic, atomic count updates without any frontend coordination.
--
-- Result: Every new view record automatically increments the aggregate count
-- =====================================================
DROP TRIGGER IF EXISTS trigger_book_views_increment ON book_views;

-- Create trigger that fires after a new view is inserted
CREATE TRIGGER trigger_book_views_increment
AFTER INSERT ON book_views
FOR EACH ROW
EXECUTE FUNCTION trigger_increment_book_views();

-- =====================================================
-- Step 6: Recalculate all existing book view counts
-- =====================================================
-- This recalculation query ensures all books have the correct views_count
-- based on what's currently in the book_views table. Run this after adding
-- the migration to fix any historical data that was not tracked before.
--
-- Result: All books.views_count values are now accurate and in sync
-- =====================================================

UPDATE books b
SET 
  views_count = COALESCE((
    SELECT COUNT(*)
    FROM book_views
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
  (SELECT SUM(views_count) FROM books) as total_views_count,
  (SELECT COUNT(*) FROM book_views) as total_view_records,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'track_book_view') as track_book_view_exists,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'increment_book_views') as increment_book_views_exists;

-- Sample query to see books with view counts
SELECT id, title, views_count
FROM books
WHERE views_count > 0
ORDER BY views_count DESC
LIMIT 10;
