-- =====================================================
-- CLEANUP: Remove Past Papers Views & Loves Tracking
-- Removes all tracking and like functionality for past papers
-- =====================================================

-- Step 1: Drop past_paper_loves table (if exists)
DROP TABLE IF EXISTS past_paper_loves CASCADE;

-- Step 2: Drop past_paper_views table (if exists)  
DROP TABLE IF EXISTS past_paper_views CASCADE;

-- Step 3: Drop RPC functions for past paper views
DROP FUNCTION IF EXISTS increment_past_paper_views(UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_past_paper_views_v2(UUID) CASCADE;

-- Step 4: Verify cleanup by checking for remaining functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE 'increment_past_paper%' 
  OR routine_name LIKE '%paper_love%'
  OR routine_name LIKE '%paper_view%';

-- If query returns no rows, cleanup is complete

-- Step 5: Verify tables are dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'past_paper%' 
  AND table_schema = 'public';

-- Should only show 'past_papers' table (the main table), not views or loves tables
