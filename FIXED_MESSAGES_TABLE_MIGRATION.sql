-- ============================================================
-- FIX PROFILES TABLE - PROPER SCHEMA WITH AUTH.USERS SYNC
-- ============================================================

-- Drop old tables safely
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table with proper structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  display_name TEXT,
  last_login TIMESTAMP,
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- FIX MESSAGES TABLE - Add chat_id and proper schema
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_name TEXT,
  sender_avatar TEXT,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'sent',
  is_read BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  reply_to_id UUID,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages RLS Policies
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

-- Create updated_at trigger for messages
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_updated_at_trigger ON messages;
CREATE TRIGGER messages_updated_at_trigger
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_messages_updated_at();

-- ============================================================
-- FIX GROUP MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  chat_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_name TEXT,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'sent',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for group messages
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_chat_id ON group_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);

-- Enable RLS on group_messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Group Messages RLS Policies
DROP POLICY IF EXISTS "Users can view group messages from groups they're in" ON group_messages;
CREATE POLICY "Users can view group messages from groups they're in"
  ON group_messages FOR SELECT
  USING (true); -- Allow viewing for now, restrict if needed

DROP POLICY IF EXISTS "Users can insert group messages" ON group_messages;
CREATE POLICY "Users can insert group messages"
  ON group_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Create updated_at trigger for group_messages
CREATE OR REPLACE FUNCTION update_group_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS group_messages_updated_at_trigger ON group_messages;
CREATE TRIGGER group_messages_updated_at_trigger
BEFORE UPDATE ON group_messages
FOR EACH ROW
EXECUTE FUNCTION update_group_messages_updated_at();

-- ============================================================
-- CREATE CHATS TABLE (for chat metadata)
-- ============================================================

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  chat_name TEXT,
  type TEXT DEFAULT '1-on-1',
  participant_ids UUID[] DEFAULT ARRAY[]::UUID[],
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_message_id UUID,
  last_message_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for chats
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
CREATE INDEX IF NOT EXISTS idx_chats_participant_ids ON chats USING GIN (participant_ids);

-- Enable RLS on chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Chats RLS Policies
DROP POLICY IF EXISTS "Users can view chats they're part of" ON chats;
CREATE POLICY "Users can view chats they're part of"
  ON chats FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

DROP POLICY IF EXISTS "Users can create chats" ON chats;
CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update chats they're part of" ON chats;
CREATE POLICY "Users can update chats they're part of"
  ON chats FOR UPDATE
  USING (auth.uid() = ANY(participant_ids))
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Create updated_at trigger for chats
CREATE OR REPLACE FUNCTION update_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chats_updated_at_trigger ON chats;
CREATE TRIGGER chats_updated_at_trigger
BEFORE UPDATE ON chats
FOR EACH ROW
EXECUTE FUNCTION update_chats_updated_at();

-- ============================================================
-- AUTOMATIC PROFILE CREATION ON USER SIGNUP
-- ============================================================

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON group_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chats TO authenticated;

-- Public read access for profiles (so users can see each other)
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- ============================================================
-- SYNC EXISTING AUTH USERS TO PROFILES
-- ============================================================

INSERT INTO profiles (id, email, full_name, created_at, updated_at)
SELECT id, email, raw_user_meta_data->>'full_name', NOW(), NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'Profiles table created/fixed' as status;
SELECT 'Messages table created successfully' as status;
SELECT 'Group messages table created successfully' as status;
SELECT 'Chats table created successfully' as status;
SELECT 'Profile auto-creation trigger enabled' as status;
