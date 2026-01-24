-- ============================================================
-- FIX RLS POLICIES FOR ADMIN & SUPER_ADMIN ACCESS ON BOOK_DOWNLOADS
-- Ensures admins and super_admins can read all book_downloads
-- ============================================================

-- Drop and recreate the admin policy to include super_admin
DROP POLICY IF EXISTS "Admins can view all downloads" ON public.book_downloads;
CREATE POLICY "Admins can view all downloads"
  ON public.book_downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Verification
SELECT 'RLS policy updated to include super_admin' as status;
