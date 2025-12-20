-- ============================================================
-- CLEAR ALL UPLOAD HISTORY AND SYSTEM CACHES
-- ============================================================
-- SQL ONLY - Run PART 1 and PART 2 below in Supabase SQL Editor
-- 
-- For JavaScript browser clearing, see: CLEAR_CACHES_QUICK_START.md
-- For PowerShell backend clearing, see: backend/clear-caches.ps1
-- ============================================================

-- ============================================================
-- PART 1: CLEAR DATABASE UPLOAD TRACKING TABLES
-- ============================================================

-- Clear file_uploads table (tracks all file uploads)
TRUNCATE TABLE public.file_uploads CASCADE;

-- Clear file_downloads table (tracks all downloads)
TRUNCATE TABLE public.file_downloads CASCADE;

-- Clear audit logs that track upload/download activities
DELETE FROM public.audit_logs 
WHERE action LIKE '%upload%' 
   OR action LIKE '%download%'
   OR entity_type IN ('file', 'book', 'past_paper');

-- Clear search_events if exists (tracks search history)
TRUNCATE TABLE public.search_events CASCADE;

-- ============================================================
-- PART 2: RESET ANALYTICS COUNTERS
-- ============================================================

-- Reset download counts on books
UPDATE public.books 
SET downloads_count = 0 
WHERE downloads_count > 0;

-- Reset view counts on books
UPDATE public.books 
SET views_count = 0 
WHERE views_count > 0;

-- Reset download counts on past papers
UPDATE public.past_papers 
SET downloads_count = 0, views_count = 0
WHERE downloads_count > 0 OR views_count > 0;

-- Reset download counts on past paper submissions
UPDATE public.past_paper_submissions 
SET downloads = 0, views = 0
WHERE downloads > 0 OR views > 0;

-- Reset download counts on book submissions if exists
UPDATE public.book_submissions 
SET downloads = 0
WHERE downloads > 0;

-- ============================================================
-- PART 3: VERIFY CLEANUP (Run these separately to check)
-- ============================================================

-- Check file_uploads is empty
SELECT COUNT(*) as file_uploads_count FROM public.file_uploads;

-- Check file_downloads is empty
SELECT COUNT(*) as file_downloads_count FROM public.file_downloads;

-- Check counts are reset
SELECT 'books' as table_name, COUNT(*) as items_with_nonzero_counts 
FROM public.books 
WHERE downloads_count > 0 OR views_count > 0;

SELECT 'past_papers' as table_name, COUNT(*) as items_with_nonzero_counts 
FROM public.past_papers 
WHERE downloads_count > 0 OR views_count > 0;
