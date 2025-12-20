-- ============================================================================
-- Book Rating Trigger and Statistics Maintenance
-- ============================================================================
-- This migration automatically updates book rating statistics when ratings
-- are created, updated, or deleted. It maintains the rating average and count
-- on the books table for efficient querying and display.
--
-- Functions:
--   - update_book_rating_stats(): Calculates ratings on INSERT/UPDATE
--   - update_book_rating_on_delete(): Recalculates ratings on DELETE
--
-- Triggers:
--   - update_book_rating_trigger: Maintains stats after rating changes
--   - update_book_rating_on_delete_trigger: Handles deletion cleanup
-- ============================================================================

-- Create function to update book rating statistics
CREATE OR REPLACE FUNCTION update_book_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the book's average rating and rating count in the books table
  -- This ensures the books.rating field is always current without recalculation
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

-- Drop trigger if it exists (idempotent migration)
DROP TRIGGER IF EXISTS update_book_rating_trigger ON book_ratings;

-- Create trigger for INSERT and UPDATE operations on book_ratings
-- Executes after each rating is added or modified
CREATE TRIGGER update_book_rating_trigger
AFTER INSERT OR UPDATE ON book_ratings
FOR EACH ROW
EXECUTE FUNCTION update_book_rating_stats();

-- ============================================================================
-- Handle rating deletion to recalculate statistics
-- ============================================================================

-- Create function to handle book rating recalculation on deletion
CREATE OR REPLACE FUNCTION update_book_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate average rating and count after a rating is deleted
  -- Uses COALESCE to set rating to 0 if no ratings remain
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

-- Drop trigger if it exists (idempotent migration)
DROP TRIGGER IF EXISTS update_book_rating_on_delete_trigger ON book_ratings;

-- Create trigger for DELETE operations on book_ratings
-- Executes after a rating is removed to maintain stats
CREATE TRIGGER update_book_rating_on_delete_trigger
AFTER DELETE ON book_ratings
FOR EACH ROW
EXECUTE FUNCTION update_book_rating_on_delete();

-- ============================================================================
-- One-time recalculation of existing ratings
-- ============================================================================
-- This updates all existing book ratings in a single operation
-- to ensure consistency. Only affects books that have ratings.

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
  updated_at = NOW()
WHERE rating_count > 0 OR id IN (SELECT DISTINCT book_id FROM book_ratings);
