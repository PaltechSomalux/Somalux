-- ============================================================
-- DROP ALL MESSAGING TABLES COMPLETELY
-- ============================================================

DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;

-- Optional: Also drop profiles (needed for auth - only if you want complete wipe)
-- DROP TABLE IF EXISTS profiles CASCADE;

-- Verify tables are dropped
SELECT 'All messaging tables dropped successfully' as status;
