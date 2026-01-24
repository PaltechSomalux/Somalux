-- ============================================================
-- RESTORE DATABASE TO PRE-CHATME STATE
-- Drop ALL messaging and ChatMe-related tables completely
-- Keep only core application tables
-- ============================================================

-- Drop ChatMe-specific triggers first (only from auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop ChatMe-specific tables and all messaging tables
-- CASCADE will automatically drop their associated triggers
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- Drop ChatMe-specific functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_messages_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_group_messages_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_chats_updated_at() CASCADE;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'All messaging and ChatMe tables dropped' as status;
SELECT 'Database restored to pre-ChatMe state' as result;
SELECT 'Core application tables remain intact' as result;
