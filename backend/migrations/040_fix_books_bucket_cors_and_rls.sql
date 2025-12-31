-- Migration 040: Fix elib-books Bucket CORS and RLS Policies
-- Issue: Books return 400 error when accessed from frontend
-- Cause: Missing CORS configuration and RLS policies on elib-books bucket
-- Solution: Configure bucket for public access with proper CORS headers

-- ============================================================
-- UPDATE BUCKET CORS SETTINGS
-- ============================================================
-- This endpoint requires authenticated access to Supabase management API
-- Run this via the Supabase Dashboard: Storage > elib-books > Settings
-- Or use the management API:

-- CORS Configuration needed:
-- Allowed Origins: https://wuwlnawtuhjoubfkdtgc.supabase.co, http://localhost:3000
-- Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
-- Allowed Headers: *
-- Expose Headers: content-length, x-amz-version-id
-- Max Age: 86400

-- ============================================================
-- DROP EXISTING POLICIES (if they exist)
-- ============================================================
DROP POLICY IF EXISTS "Allow public read elib-books" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload books" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own books" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to manage all books" ON storage.objects;

-- ============================================================
-- CREATE RLS POLICIES FOR elib-books BUCKET
-- ============================================================

-- Allow public read from elib-books bucket
CREATE POLICY "Allow public read elib-books"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'elib-books');

-- Allow authenticated users to upload books
CREATE POLICY "Allow authenticated users to upload books"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'elib-books'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (
           SELECT 1 FROM profiles 
           WHERE profiles.id = auth.uid() 
           AND (profiles.role = 'admin' OR profiles.role = 'editor')
         ))
  );

-- Allow users to delete their own books
CREATE POLICY "Allow users to delete their own books"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'elib-books'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (
           SELECT 1 FROM profiles 
           WHERE profiles.id = auth.uid() 
           AND profiles.role = 'admin'
         ))
  );

-- ============================================================
-- VERIFY BUCKET EXISTS AND IS PUBLIC
-- ============================================================
-- Note: To make bucket public, use Supabase Dashboard:
-- Storage > elib-books > Settings > Toggle "Make Public"
-- OR uncomment and run the SQL management API endpoint

-- The bucket should have these properties set:
-- - Public: true
-- - CORS: Properly configured (see above)
-- - Max file size: 52428800 (50MB) or higher

-- ============================================================
-- CLEANUP NOTE
-- ============================================================
-- After updating CORS settings in the Supabase dashboard,
-- users should be able to load PDFs without 400 errors.
--
-- If issues persist:
-- 1. Clear browser cache
-- 2. Check that file_url in books table is correct format
-- 3. Verify bucket name is exactly 'elib-books'
-- 4. Check Supabase project status (may be paused)

