-- =====================================================
-- Migration 008: Fix Past Papers RLS Policy
-- =====================================================
-- Issue: "Failed to upload file to bucket 'past-papers': new row violates row-level security policy"
-- Solution: Add INSERT and SELECT RLS policies for the past_papers table

-- Enable RLS on past_papers table (if not already enabled)
ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to insert their own past papers
CREATE POLICY "Allow users to insert their own past papers"
ON past_papers
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 2: Allow everyone to view past papers (public reading)
CREATE POLICY "Allow users to view past papers"
ON past_papers
FOR SELECT
USING (true);

-- Policy 3: Allow users to update their own past papers (for admins and owners)
CREATE POLICY "Allow users to update their own past papers"
ON past_papers
FOR UPDATE
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 4: Allow users to delete their own past papers (for admins and owners)
CREATE POLICY "Allow users to delete their own past papers"
ON past_papers
FOR DELETE
USING (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- Storage Bucket Policies for past-papers
-- =====================================================

-- Policy 1: Allow authenticated users to upload to past-papers bucket
CREATE POLICY "Allow authenticated users to upload past papers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'past-papers' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Allow public read access to past papers
CREATE POLICY "Allow public read past papers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'past-papers');

-- Policy 3: Allow users to delete their own past paper files
CREATE POLICY "Allow users to delete their own past paper files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'past-papers' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);
