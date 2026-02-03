-- ============================================================================
-- CREATE CHAT SYSTEM TABLES
-- ============================================================================
-- This migration creates all tables needed for the chat system
-- Run this BEFORE FIX_AUTO_CREATE_USER_CHATS.sql
-- ============================================================================

-- ============================================================================
-- 1. CONVERSATIONS TABLE (1-on-1 chats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Allow self-chats and ensure uniqueness - only one conversation per pair
  UNIQUE(user1_id, user2_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);

-- ============================================================================
-- 2. MESSAGES TABLE (individual messages in conversations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'audio', 'file'
  attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
  is_read BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON public.messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at DESC);

-- ============================================================================
-- 3. USER_CHATS TABLE (per-user chat settings and metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  last_read_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  custom_name TEXT, -- User can rename conversation
  custom_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Unique constraint: only one record per user per chat
  UNIQUE(user_id, chat_id)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_chats_user_id ON public.user_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_chat_id ON public.user_chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_user_chat ON public.user_chats(user_id, chat_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_pinned ON public.user_chats(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_user_chats_archived ON public.user_chats(user_id, is_archived) WHERE is_archived = true;
CREATE INDEX IF NOT EXISTS idx_user_chats_deleted ON public.user_chats(user_id, is_deleted) WHERE is_deleted = false;

-- ============================================================================
-- 4. MESSAGE_REACTIONS TABLE (reactions/emojis on messages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, -- '👍', '❤️', '😂', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- One reaction per user per message per emoji
  UNIQUE(message_id, user_id, emoji)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- ============================================================================
-- 5. MESSAGE_READ_RECEIPTS TABLE (who read what)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- One receipt per user per message
  UNIQUE(message_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_read_receipts_message_id ON public.message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_user_id ON public.message_read_receipts(user_id);

-- ============================================================================
-- 6. USER_CHAT_FOLDERS TABLE (custom folders for organizing chats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_chat_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#999999',
  icon TEXT DEFAULT '📁',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- User can have multiple folders but not duplicate names
  UNIQUE(user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_chat_folders_user_id ON public.user_chat_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_folders_order ON public.user_chat_folders(user_id, order_index);

-- ============================================================================
-- 7. CHAT_FOLDER_ASSIGNMENTS TABLE (maps chats to folders)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_folder_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.user_chat_folders(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- One assignment per folder per chat
  UNIQUE(folder_id, chat_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_folder_assignments_folder_id ON public.chat_folder_assignments(folder_id);
CREATE INDEX IF NOT EXISTS idx_chat_folder_assignments_chat_id ON public.chat_folder_assignments(chat_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Conversations - users can only see conversations they're part of
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages - users can only see messages in conversations they're part of
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    chat_id IN (
      SELECT id FROM public.conversations 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
      SELECT id FROM public.conversations 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- User_chats - users can only manage their own chat settings
ALTER TABLE public.user_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their chat settings" ON public.user_chats;
CREATE POLICY "Users can view their chat settings"
  ON public.user_chats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their chat settings" ON public.user_chats;
CREATE POLICY "Users can update their chat settings"
  ON public.user_chats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Message reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view reactions" ON public.message_reactions;
CREATE POLICY "Users can view reactions"
  ON public.message_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User chat folders
ALTER TABLE public.user_chat_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their folders" ON public.user_chat_folders;
CREATE POLICY "Users can manage their folders"
  ON public.user_chat_folders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- CREATE TRIGGERS FOR TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_conversations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_conversations_updated_at ON public.conversations;
CREATE TRIGGER tr_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversations_timestamp();

CREATE OR REPLACE FUNCTION public.update_messages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_messages_updated_at ON public.messages;
CREATE TRIGGER tr_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_messages_timestamp();

CREATE OR REPLACE FUNCTION public.update_user_chats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_user_chats_updated_at ON public.user_chats;
CREATE TRIGGER tr_user_chats_updated_at
  BEFORE UPDATE ON public.user_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_chats_timestamp();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these to verify tables were created:
-- 
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'conversation%' OR table_name LIKE 'message%' OR table_name LIKE 'user_chat%';
-- 
-- SELECT COUNT(*) FROM public.conversations;
-- SELECT COUNT(*) FROM public.messages;
-- SELECT COUNT(*) FROM public.user_chats;
-- ============================================================================
