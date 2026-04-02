-- =====================================================
-- VERIFICATION & TESTING GUIDE
-- =====================================================

-- 1. TEST: Check all submissions with pending status
SELECT 
  id,
  title,
  status,
  file_path,
  uploaded_by,
  created_at
FROM past_paper_submissions
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 2. TEST: Check approved papers have proper URLs
SELECT 
  id,
  title,
  file_url,
  CASE 
    WHEN file_url LIKE 'https://%supabase.co%' THEN '✅ VALID'
    WHEN file_url IS NULL THEN '❌ NULL'
    ELSE '⚠️ MALFORMED'
  END as url_status,
  is_active,
  created_at
FROM past_papers
ORDER BY created_at DESC
LIMIT 10;

-- 3. TEST: Verify profiles table has all uploaders
SELECT 
  u.id,
  u.email,
  p.full_name,
  COUNT(ps.id) as submission_count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN past_paper_submissions ps ON u.id = ps.uploaded_by
GROUP BY u.id, u.email, p.full_name
ORDER BY submission_count DESC;

-- 4. TEST: Check for orphaned submissions (user deleted but submission exists)
SELECT 
  ps.id,
  ps.title,
  ps.uploaded_by,
  ps.status,
  p.full_name
FROM past_paper_submissions ps
LEFT JOIN profiles p ON ps.uploaded_by = p.id
WHERE ps.uploaded_by IS NOT NULL AND p.id IS NULL
ORDER BY ps.created_at DESC;

-- 5. TEST: Verify storage URLs are accessible by checking format
SELECT 
  COUNT(*) as total_papers,
  COUNT(CASE WHEN file_url LIKE '%supabase.co/storage/v1/object/public/past-papers/%' THEN 1 END) as with_proper_url,
  COUNT(CASE WHEN file_url NOT LIKE '%supabase.co%' AND file_url IS NOT NULL THEN 1 END) as with_invalid_url,
  COUNT(CASE WHEN file_url IS NULL THEN 1 END) as missing_url
FROM past_papers;

-- 6. MONITORING: Track approval workflow
SELECT 
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::INTEGER as avg_approval_time_hours
FROM past_paper_submissions;

-- 7. QUALITY CHECK: Ensure all approved submissions are in past_papers
SELECT 
  ps.id,
  ps.title,
  ps.status,
  CASE WHEN pp.id IS NOT NULL THEN '✅ Found in past_papers'
       ELSE '❌ Missing from past_papers' 
  END as in_past_papers
FROM past_paper_submissions ps
LEFT JOIN past_papers pp ON ps.id = pp.id
WHERE ps.status = 'approved'
ORDER BY ps.created_at DESC;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- All pending submissions should have valid file_path
-- All approved papers should have https://...supabase.co URLs
-- All uploaders should exist in profiles table
-- All orphaned submissions should be fixed or removed
-- Average approval time should be < 24 hours
-- All approved submissions should exist in past_papers table
