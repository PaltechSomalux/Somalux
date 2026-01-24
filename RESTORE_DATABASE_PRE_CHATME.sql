-- ============================================================
-- RESTORE DATABASE TO PRE-CHATME STATE
-- ============================================================
-- This migration removes ChatMe additions and restores tables
-- to their original schema from migration 001
-- ============================================================

-- Drop ChatMe-specific tables that weren't in original schema
DROP TABLE IF EXISTS chats CASCADE;

-- Drop new triggers and functions from ChatMe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS messages_updated_at_trigger ON messages;
DROP TRIGGER IF EXISTS group_messages_updated_at_trigger ON group_messages;
DROP TRIGGER IF EXISTS chats_updated_at_trigger ON chats;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_messages_updated_at();
DROP FUNCTION IF EXISTS update_group_messages_updated_at();
DROP FUNCTION IF EXISTS update_chats_updated_at();

-- ============================================================
-- RESTORE PROFILES TABLE TO ORIGINAL SCHEMA
-- ============================================================

-- Drop old profiles with CASCADE to remove dependents
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate profiles table with ORIGINAL schema (from migration 001)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'editor', 'admin', 'super_admin'
  tier TEXT DEFAULT 'free', -- 'free', 'premium', 'pro'
  tier_expiry TIMESTAMP,
  bio TEXT,
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create original RLS policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;
CREATE POLICY "Only admins can delete profiles"
  ON profiles FOR DELETE
  USING (false); -- No one can delete profiles via RLS

-- ============================================================
-- RESTORE MESSAGES TABLE TO ORIGINAL SCHEMA
-- ============================================================

-- Drop old messages table
DROP TABLE IF EXISTS messages CASCADE;

-- Recreate messages table with ORIGINAL schema (from migration 001)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Original messages RLS policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================
-- RESTORE GROUP_MESSAGES TABLE TO ORIGINAL SCHEMA
-- ============================================================

-- Drop old group_messages table
DROP TABLE IF EXISTS group_messages CASCADE;

-- Recreate group_messages table with ORIGINAL schema (from migration 001)
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for group_messages
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);

-- Enable RLS on group_messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Original group_messages RLS policies
DROP POLICY IF EXISTS "Users can view group messages from groups they're in" ON group_messages;
CREATE POLICY "Users can view group messages from groups they're in"
  ON group_messages FOR SELECT
  USING (true); -- Allow viewing for now

DROP POLICY IF EXISTS "Users can insert group messages" ON group_messages;
CREATE POLICY "Users can insert group messages"
  ON group_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================
-- GRANT PERMISSIONS (Original)
-- ============================================================

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON group_messages TO authenticated;

GRANT SELECT ON profiles TO anon;

-- ============================================================
-- SYNC EXISTING AUTH USERS TO PROFILES (if needed)
-- ============================================================

INSERT INTO profiles (id, email, full_name, created_at, updated_at)
SELECT id, email, raw_user_meta_data->>'full_name', NOW(), NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'Database restored to pre-ChatMe state' as status;
SELECT 'Profiles table restored to original schema' as result;
SELECT 'Messages table restored to original schema' as result;
SELECT 'Group messages table restored to original schema' as result;
SELECT 'ChatMe-specific tables and functions removed' as result;
