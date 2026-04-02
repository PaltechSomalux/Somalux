-- =====================================================
-- Ensure past-papers bucket allows public read access
-- =====================================================

-- This policy allows anyone to read (GET) files from the past-papers bucket
-- while restricting uploads/deletes to authenticated users

CREATE POLICY "Public read past-papers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'past-papers');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload past-papers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'past-papers'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own files or admins can delete any
CREATE POLICY "Allow delete own past-papers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'past-papers'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Verify policies
SELECT policy_name, definition, check_expression
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policy_name;
