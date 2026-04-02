-- =====================================================
-- CRITICAL: Verify PDF URLs are valid and accessible
-- =====================================================

-- This query shows all past papers and their file URLs
-- Copy the file_url values and test them in your browser
-- If you see HTML instead of PDF, the URL is broken

SELECT 
  id,
  title,
  file_url,
  LENGTH(file_url) as url_length,
  created_at
FROM past_papers
WHERE file_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- Check for NULL or empty file_urls (another common issue)
-- =====================================================
SELECT COUNT(*) as papers_with_missing_urls
FROM past_papers
WHERE file_url IS NULL OR file_url = '';

-- =====================================================
-- Check the file_path in past_paper_submissions
-- =====================================================
SELECT 
  id,
  title,
  file_path,
  status,
  created_at
FROM past_paper_submissions
WHERE file_path IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- TROUBLESHOOTING STEPS:
-- =====================================================
-- 
-- 1. Copy one of the file_url values from the query above
-- 2. Paste it into your browser address bar
-- 3. If you see HTML error page:
--    - The PDF file doesn't exist in storage
--    - The bucket name is wrong
--    - The path is wrong
--    - Access/permissions issue
--
-- 4. If the browser downloads a file but it says "invalid PDF":
--    - The file was corrupted during upload
--    - The file was never a valid PDF to begin with
--
-- 5. Solution options:
--    A) Re-upload the PDFs correctly
--    B) Delete invalid URLs and set to NULL
--    C) Update URLs to point to the correct bucket
--
-- =====================================================
