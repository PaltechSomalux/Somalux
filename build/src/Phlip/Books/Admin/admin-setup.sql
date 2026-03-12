-- =============================================
-- Admin Dashboard Setup Migration
-- Adds uploaded_by tracking and ensures proper role setup
-- =============================================

-- 1. Add uploaded_by column to books table (if not exists)
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON public.books(uploaded_by);

-- 3. Ensure profiles table has role column with proper default
-- (This should already exist from auto-create-profiles.sql, but ensuring)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role TEXT DEFAULT 'viewer';
    END IF;
END $$;

-- 4. Add check constraint to ensure valid roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('admin', 'editor', 'viewer'));
    END IF;
END $$;

-- 5. Set default role for existing profiles without role
UPDATE public.profiles 
SET role = 'viewer' 
WHERE role IS NULL OR role = '';

-- 6. (OPTIONAL) Set specific user as admin
-- REPLACE 'your-admin-email@example.com' with actual admin email
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-admin-email@example.com';

-- 7. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.books TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- 8. Create helper function to get user's uploaded books count
CREATE OR REPLACE FUNCTION get_user_books_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM public.books WHERE uploaded_by = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create helper view for admin statistics
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM public.books) as total_books,
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COALESCE(SUM(downloads), 0) FROM public.books) as total_downloads,
    (SELECT COUNT(*) FROM public.book_views) as total_views,
    (SELECT COUNT(*) FROM public.books WHERE created_at > NOW() - INTERVAL '30 days') as books_last_30_days,
    (SELECT COUNT(DISTINCT user_id) FROM public.book_views WHERE viewed_at > NOW() - INTERVAL '7 days') as active_users_week;

GRANT SELECT ON admin_stats TO authenticated;

-- 10. Create view for editor's own books
CREATE OR REPLACE VIEW editor_books AS
SELECT 
    b.*,
    p.email as uploader_email,
    p.display_name as uploader_name
FROM public.books b
LEFT JOIN public.profiles p ON p.id = b.uploaded_by;

GRANT SELECT ON editor_books TO authenticated;

-- 11. Comments for documentation
COMMENT ON COLUMN books.uploaded_by IS 'User ID of the person who uploaded this book (for editor role filtering)';
COMMENT ON COLUMN profiles.role IS 'User role: admin (full access), editor (upload & manage own books), viewer (read-only)';
COMMENT ON FUNCTION get_user_books_count IS 'Returns the number of books uploaded by a specific user';
COMMENT ON VIEW admin_stats IS 'Aggregated statistics for admin dashboard';
COMMENT ON VIEW editor_books IS 'Books with uploader information, useful for editors to see their own uploads';

-- =============================================
-- VERIFICATION QUERIES
-- Run these to verify setup:
-- =============================================

-- Check if uploaded_by column exists
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'books' AND column_name = 'uploaded_by';

-- Check role distribution
-- SELECT role, COUNT(*) as count 
-- FROM profiles 
-- GROUP BY role;

-- Check books with uploaders
-- SELECT COUNT(*) as books_with_uploader 
-- FROM books 
-- WHERE uploaded_by IS NOT NULL;

-- View admin statistics
-- SELECT * FROM admin_stats;

-- =============================================
-- SETUP COMPLETE!
-- Next steps:
-- 1. Assign admin role to at least one user in profiles table
-- 2. Test role-based access in admin dashboard
-- 3. Upload a test book and verify uploaded_by is set
-- =============================================
