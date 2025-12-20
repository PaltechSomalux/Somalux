-- ============================================================================
-- Supabase Storage Bucket Setup for Book Comments
-- ============================================================================
-- This migration creates and configures the comment_media bucket
-- for storing images, videos, and audio files attached to comments.
-- ============================================================================

-- Note: Bucket creation and policies should be done via Supabase dashboard or
-- the Supabase management API. This is a reference for the configuration.

-- Storage bucket configuration:
-- Bucket name: comment_media
-- Public access: true
-- File size limit: 10MB per file
-- Allowed MIME types: image/*, video/*, audio/*, application/pdf

-- Example RLS policy for public storage access:
-- CREATE POLICY "Allow public access"
--   ON storage.objects
--   FOR SELECT USING (bucket_id = 'comment_media');

-- CREATE POLICY "Allow authenticated upload"
--   ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (
--     bucket_id = 'comment_media' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
