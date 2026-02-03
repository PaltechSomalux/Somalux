-- ============================================================================
-- Chat System Database Diagnostic & Verification
-- ============================================================================
-- Run this script AFTER creating the tables to verify everything is set up correctly

-- Check if all required tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
    'users',
    'profiles', 
    'conversations',
    'user_chats',
    'messages',
    'user_chat_folders',
    'chat_folder_assignments',
    'chats'
)
ORDER BY table_name;

-- ============================================================================
-- Individual Table Verification
-- ============================================================================

-- 1. Check users table
SELECT 'users' as table_name, COUNT(*) as row_count FROM public.users;

-- 2. Check profiles table  
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles;

-- 3. Check conversations table
SELECT 'conversations' as table_name, COUNT(*) as row_count FROM public.conversations;

-- 4. Check user_chats table
SELECT 'user_chats' as table_name, COUNT(*) as row_count FROM public.user_chats;

-- 5. Check messages table
SELECT 'messages' as table_name, COUNT(*) as row_count FROM public.messages;

-- 6. Check user_chat_folders table
SELECT 'user_chat_folders' as table_name, COUNT(*) as row_count FROM public.user_chat_folders;

-- 7. Check chat_folder_assignments table
SELECT 'chat_folder_assignments' as table_name, COUNT(*) as row_count FROM public.chat_folder_assignments;

-- 8. Check chats table
SELECT 'chats' as table_name, COUNT(*) as row_count FROM public.chats;

-- ============================================================================
-- Check Indexes
-- ============================================================================
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'users',
    'profiles',
    'conversations',
    'user_chats',
    'messages',
    'user_chat_folders'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- Check Foreign Keys
-- ============================================================================
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- ============================================================================
-- Summary Report
-- ============================================================================
-- If all tables appear above with row_count = 0 or higher, setup is complete!
-- If any table is missing, run CREATE_CHAT_SYSTEM_TABLES.sql again
