-- =====================================================
-- Migration 011: Add RLS Policies for past-papers Bucket
-- =====================================================
-- Issue: "Failed to upload file to bucket 'past-papers': new row violates row-level security policy"
-- Solution: Add storage bucket policies for past-papers bucket

-- Drop existing storage policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload past papers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read past papers" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own past paper files" ON storage.objects;

-- Policy 1: Upload
CREATE POLICY "Allow authenticated users to upload past papers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'past-papers' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Download
CREATE POLICY "Allow public read past papers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'past-papers');

-- Policy 3: Delete
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
