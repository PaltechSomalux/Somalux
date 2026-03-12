-- ============================================
-- DIAGNOSTIC CHECK - Run this to verify setup
-- Copy results and check against expected values
-- ============================================

-- 1. Check if all required tables exist
SELECT 
  'Tables Check' as check_type,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'books') as books_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') as categories_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'book_likes') as book_likes_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'book_comments') as book_comments_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as profiles_exists;

-- 2. Check books table has all required columns
SELECT 
  'Books Columns Check' as check_type,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'id') as has_id,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'title') as has_title,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'author') as has_author,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'description') as has_description,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'category_id') as has_category_id,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'year') as has_year,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'language') as has_language,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'isbn') as has_isbn,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'cover_url') as has_cover_url,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'file_path') as has_file_path,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'uploaded_by') as has_uploaded_by,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'created_at') as has_created_at,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'updated_at') as has_updated_at,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'views') as has_views,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'downloads') as has_downloads,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'pages') as has_pages,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'publisher') as has_publisher;

-- 3. Check storage buckets
SELECT 
  'Storage Buckets Check' as check_type,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('elib-books', 'elib-covers')
ORDER BY name;

-- 4. Count data
SELECT 
  'Data Count' as check_type,
  (SELECT COUNT(*) FROM books) as total_books,
  (SELECT COUNT(*) FROM categories) as total_categories,
  (SELECT COUNT(*) FROM book_likes) as total_likes,
  (SELECT COUNT(*) FROM book_comments) as total_comments;

-- 5. Check RLS is enabled
SELECT 
  'RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('books', 'categories', 'book_likes', 'book_comments')
  AND schemaname = 'public'
ORDER BY tablename;

-- 6. List first 3 books (if any)
SELECT 
  id,
  title,
  author,
  year,
  pages,
  publisher,
  views,
  downloads,
  created_at
FROM books
ORDER BY created_at DESC
LIMIT 3;

-- 7. Check for missing columns (should return 0 rows if all good)
SELECT 
  'Missing Columns' as issue,
  column_name
FROM (
  VALUES 
    ('id'), ('title'), ('author'), ('description'), ('category_id'),
    ('year'), ('language'), ('isbn'), ('cover_url'), ('file_path'),
    ('uploaded_by'), ('created_at'), ('updated_at'), ('views'), 
    ('downloads'), ('pages'), ('publisher')
) AS expected(column_name)
WHERE NOT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'books' 
    AND information_schema.columns.column_name = expected.column_name
);

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- 1. All *_exists should be TRUE
-- 2. All has_* should be TRUE (17 columns)
-- 3. Both buckets should exist and be public
-- 4. Data counts depend on your data
-- 5. rls_enabled should be TRUE for all tables
-- 6. Books should display if you have data
-- 7. Missing columns should return 0 rows
-- ============================================
