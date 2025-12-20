-- =====================================================
-- CRITICAL FIX: Generate proper public URLs for past papers
-- =====================================================
-- This migration updates all past_papers with proper Supabase URLs

-- First, identify your Supabase project URL
-- Go to: Supabase Dashboard → Settings → API
-- Copy your project URL (looks like: https://YOUR_PROJECT_ID.supabase.co)

-- IMPORTANT: Replace 'wuwlnawtuhjoubfkdtgc' with YOUR actual Supabase project ID
-- You can find it in your URL or in Supabase Settings

UPDATE past_papers
SET file_url = CASE 
  WHEN file_url IS NOT NULL AND file_url NOT LIKE 'https://%' THEN
    -- If file_url is just a filename, convert to full URL
    'https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/past-papers/' || file_url
  WHEN file_url IS NULL AND file_path IS NOT NULL THEN
    -- If file_url is NULL but file_path exists, use file_path
    'https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/past-papers/' || file_path
  ELSE
    file_url
END
WHERE (
  (file_url IS NOT NULL AND file_url NOT LIKE 'https://%') OR
  (file_url IS NULL AND file_path IS NOT NULL)
);

-- Verify the fix
SELECT 
  id,
  title,
  file_url,
  CASE 
    WHEN file_url LIKE 'https://%' THEN '✅ Valid URL'
    WHEN file_url IS NULL THEN '❌ Missing URL'
    ELSE '⚠️ Malformed URL'
  END as status,
  created_at
FROM past_papers
ORDER BY created_at DESC
LIMIT 20;

-- Count results
SELECT 
  COUNT(CASE WHEN file_url LIKE 'https://%' THEN 1 END) as valid_urls,
  COUNT(CASE WHEN file_url IS NULL THEN 1 END) as missing_urls,
  COUNT(CASE WHEN file_url NOT LIKE 'https://%' AND file_url IS NOT NULL THEN 1 END) as malformed_urls
FROM past_papers;
