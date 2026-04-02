-- ============================================================
-- BOOK RATING TRIGGER
-- Automatically updates book average rating and count
-- when ratings are inserted or updated
-- ============================================================

-- Create function to update book rating statistics
CREATE OR REPLACE FUNCTION update_book_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the book's average rating and rating count
  UPDATE books
  SET 
    rating = (
      SELECT COALESCE(AVG(rating::numeric), 0)
      FROM book_ratings
      WHERE book_id = NEW.book_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM book_ratings
      WHERE book_id = NEW.book_id
    ),
    updated_at = NOW()
  WHERE id = NEW.book_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_book_rating_trigger ON book_ratings;

-- Create trigger for INSERT
CREATE TRIGGER update_book_rating_trigger
AFTER INSERT OR UPDATE ON book_ratings
FOR EACH ROW
EXECUTE FUNCTION update_book_rating_stats();

-- Handle DELETE case (when a rating is removed)
CREATE OR REPLACE FUNCTION update_book_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE books
  SET 
    rating = COALESCE((
      SELECT AVG(rating::numeric)
      FROM book_ratings
      WHERE book_id = OLD.book_id
    ), 0),
    rating_count = (
      SELECT COUNT(*)
      FROM book_ratings
      WHERE book_id = OLD.book_id
    ),
    updated_at = NOW()
  WHERE id = OLD.book_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for DELETE
DROP TRIGGER IF EXISTS update_book_rating_on_delete_trigger ON book_ratings;
CREATE TRIGGER update_book_rating_on_delete_trigger
AFTER DELETE ON book_ratings
FOR EACH ROW
EXECUTE FUNCTION update_book_rating_on_delete();

-- Recalculate all existing book ratings
UPDATE books b
SET 
  rating = COALESCE((
    SELECT AVG(rating::numeric)
    FROM book_ratings
    WHERE book_id = b.id
  ), 0),
  rating_count = (
    SELECT COUNT(*)
    FROM book_ratings
    WHERE book_id = b.id
  ),
  updated_at = NOW();

-- Show summary
SELECT 
  'Book Rating Trigger Created Successfully' as status,
  COUNT(*) as books_with_ratings
FROM books
WHERE rating > 0;
