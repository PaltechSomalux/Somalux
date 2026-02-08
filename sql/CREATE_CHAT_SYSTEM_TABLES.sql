-- ============================================================================
-- Chat System Database Schema for Supabase
-- ============================================================================
-- This SQL script creates all necessary tables for the chat/messaging system

-- ============================================================================
-- 1. Users Table (Basic user records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  pin VARCHAR(4),
  last_active_at TIMESTAMP WITH TIME ZONE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- ============================================================================
-- 2. Conversations/Chats Table (One-to-one conversations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_conversations_user1 FOREIGN KEY (user1_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_user2 FOREIGN KEY (user2_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_id ON public.conversations(id);

-- ============================================================================
-- 3. User Chats Table (User-specific chat metadata/settings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_chats_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_chats_chat FOREIGN KEY (chat_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_chat UNIQUE(user_id, chat_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_chats_user_id ON public.user_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_chat_id ON public.user_chats(chat_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_user_id_chat_id ON public.user_chats(user_id, chat_id);

-- ============================================================================
-- 4. Messages Table (Individual chat messages with delivery/read tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID,
  content TEXT,
  status VARCHAR(20) DEFAULT 'sent',
  is_read BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_messages_chat FOREIGN KEY (chat_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================================================
-- 5. Chat Folders/Labels Table (For organizing chats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_chat_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_chat_folders_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_chat_folders_user_id ON public.user_chat_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_folders_created_at ON public.user_chat_folders(created_at DESC);

-- ============================================================================
-- 6. Chat Folder Assignments (Many-to-many: chats to folders)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_folder_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_folder_assignments_folder FOREIGN KEY (folder_id) REFERENCES public.user_chat_folders(id) ON DELETE CASCADE,
  CONSTRAINT fk_folder_assignments_chat FOREIGN KEY (chat_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT unique_folder_chat UNIQUE(folder_id, chat_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_folder_assignments_folder_id ON public.chat_folder_assignments(folder_id);
CREATE INDEX IF NOT EXISTS idx_chat_folder_assignments_chat_id ON public.chat_folder_assignments(chat_id);

-- ============================================================================
-- 7. Profiles Table (Extended user profile information)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  full_name VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  username VARCHAR(255) UNIQUE,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_profiles_user FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- ============================================================================
-- Chats Table (Alias for conversations for compatibility)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_chats_id ON public.chats(id);

-- ============================================================================
-- Enable RLS (Row Level Security) - Optional but recommended
-- ============================================================================
-- Uncomment the following lines if you want to enable RLS

-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_chats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_chat_folders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Success Message
-- ============================================================================
-- Run this script in your Supabase SQL Editor to create all necessary tables
-- Tables created:
-- ✅ users
-- ✅ conversations
-- ✅ user_chats
-- ✅ messages
-- ✅ user_chat_folders
-- ✅ chat_folder_assignments
-- ✅ profiles
-- ✅ chats
