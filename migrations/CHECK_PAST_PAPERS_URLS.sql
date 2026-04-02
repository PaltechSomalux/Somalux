-- =====================================================
-- Check past_papers for corresponding URLs
-- =====================================================

-- Show all past papers and their file_urls
SELECT 
  id,
  title,
  file_url,
  file_path,
  created_at
FROM past_papers
ORDER BY created_at DESC
LIMIT 20;

-- Count papers with missing file_urls
SELECT COUNT(*) as past_papers_missing_file_url
FROM past_papers
WHERE file_url IS NULL OR file_url = '';

-- Check if file_urls are properly formatted (should start with https://)
SELECT 
  COUNT(*) as invalid_urls,
  COUNT(CASE WHEN file_url LIKE 'https://%' THEN 1 END) as valid_urls,
  COUNT(CASE WHEN file_url NOT LIKE 'https://%' AND file_url IS NOT NULL THEN 1 END) as malformed_urls
FROM past_papers;

-- Show any malformed URLs (don't start with https://)
SELECT 
  id,
  title,
  file_url,
  created_at
FROM past_papers
WHERE file_url IS NOT NULL AND file_url NOT LIKE 'https://%'
ORDER BY created_at DESC;
