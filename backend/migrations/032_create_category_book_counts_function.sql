-- ============================================================================
-- Migration 032: Create get_category_book_counts RPC Function
-- ============================================================================
-- Purpose: Optimize category book counting with a fast PostgreSQL function
-- This is called from BookCategories.jsx to get book counts per category
-- ============================================================================

CREATE OR REPLACE FUNCTION get_category_book_counts()
RETURNS TABLE (category_id UUID, count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    category_id,
    COUNT(*) as count
  FROM public.books
  WHERE category_id IS NOT NULL
  GROUP BY category_id
  ORDER BY count DESC;
$$;

-- Add documentation
COMMENT ON FUNCTION get_category_book_counts() IS 'Fast RPC function to get book counts grouped by category. Used in BookCategories.jsx for optimized category listing with counts.';

-- ============================================================================
-- Optional: Create index to optimize this query
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_books_category_id_not_null 
ON public.books(category_id) 
WHERE category_id IS NOT NULL;

-- ============================================================================
-- Summary of Changes
-- ============================================================================
-- 1. Created get_category_book_counts() RPC function
-- 2. Returns (category_id, count) pairs
-- 3. Added covering index for better performance
-- 4. Function is STABLE and can be safely cached
