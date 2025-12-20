-- =====================================================
-- Migration 009: Fix Universities RLS Policy
-- =====================================================
-- Issue: "Failed to upload cover to bucket 'university-covers': new row violates row-level security policy"
-- Solution: Add INSERT and SELECT RLS policies for the universities table

-- First, add missing columns if they don't exist
ALTER TABLE universities ADD COLUMN IF NOT EXISTS uploaded_by UUID DEFAULT auth.uid();
ALTER TABLE universities ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS established INTEGER;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS student_count INTEGER;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Enable RLS on universities table (if not already enabled)
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow users to insert their own universities" ON universities;
DROP POLICY IF EXISTS "Allow users to view universities" ON universities;
DROP POLICY IF EXISTS "Allow users to update their own universities" ON universities;
DROP POLICY IF EXISTS "Allow users to delete their own universities" ON universities;

-- Policy 1: Allow authenticated users to insert their own universities
CREATE POLICY "Allow users to insert their own universities"
ON universities
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 2: Allow everyone to view universities (public reading)
CREATE POLICY "Allow users to view universities"
ON universities
FOR SELECT
USING (true);

-- Policy 3: Allow users to update their own universities (for admins and owners)
CREATE POLICY "Allow users to update their own universities"
ON universities
FOR UPDATE
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 4: Allow users to delete their own universities (for admins and owners)
CREATE POLICY "Allow users to delete their own universities"
ON universities
FOR DELETE
USING (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- UNIVERSITY-COVERS BUCKET - RLS POLICIES
-- =====================================================

-- Drop existing storage policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload university covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read university covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own university cover files" ON storage.objects;

-- Policy 1: Upload
CREATE POLICY "Allow authenticated users to upload university covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'university-covers' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Download
CREATE POLICY "Allow public read university covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'university-covers');

-- Policy 3: Delete
CREATE POLICY "Allow users to delete their own university cover files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'university-covers' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);
