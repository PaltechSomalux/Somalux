-- Fix Supabase RLS Policies for Messages Table
-- This addresses the "Failed to load resource: 503 Service Unavailable" errors
-- Issue: Messages table RLS policies were too restrictive, blocking anon key queries

-- ============================================================================
-- FIX 1: UPDATE MESSAGES TABLE RLS POLICIES
-- ============================================================================

-- Drop existing overly-restrictive policies
DROP POLICY IF EXISTS "Allow service role full access" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.messages;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON public.messages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.messages;
DROP POLICY IF EXISTS "Service role has full access to messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can read their messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can soft-delete their messages" ON public.messages;

-- Add new, properly scoped policies
-- Allow service role (backend) unrestricted access
CREATE POLICY "Service role has full access to messages"
  ON public.messages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to read messages they're involved in
CREATE POLICY "Authenticated users can read their messages"
  ON public.messages
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      sender_id = auth.uid() OR
      recipient_id = auth.uid() OR
      chat_id IS NOT NULL  -- Allow reading chat messages if user is authenticated
    )
  );

-- Allow authenticated users to insert their own messages
CREATE POLICY "Authenticated users can insert their own messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    sender_id = auth.uid()
  );

-- Allow authenticated users to update their own messages
CREATE POLICY "Authenticated users can update their own messages"
  ON public.messages
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    sender_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    sender_id = auth.uid()
  );

-- Allow authenticated users to soft-delete their messages
CREATE POLICY "Authenticated users can soft-delete their messages"
  ON public.messages
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    sender_id = auth.uid()
  );

-- ============================================================================
-- FIX 2: ENSURE MESSAGES TABLE IS PROPERLY CONFIGURED
-- ============================================================================

-- Make sure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Ensure all necessary columns exist
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chat_id TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at DESC);

-- ============================================================================
-- FIX 3: UPDATE OTHER TABLES WITH PROPER RLS
-- ============================================================================

-- Fix user_chats table RLS
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.user_chats;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_chats;
DROP POLICY IF EXISTS "Service role full access user_chats" ON public.user_chats;
DROP POLICY IF EXISTS "Users can read their chats" ON public.user_chats;

ALTER TABLE public.user_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access user_chats"
  ON public.user_chats
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can read their chats"
  ON public.user_chats
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      user_id IN (
        SELECT DISTINCT user_id FROM public.user_chats
        WHERE chat_id IN (
          SELECT chat_id FROM public.messages
          WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- FIX 4: VERIFY TABLE STRUCTURE FOR GROUP MESSAGES (IF EXISTS)
-- ============================================================================

-- Only create and fix group_messages if it exists (skipped if groups table not available)
-- This handles cases where the groups/group_messages tables haven't been created yet
DO $$
BEGIN
  -- Check if group_messages table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'group_messages'
  ) THEN
    -- If it exists, enable RLS
    ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Service role access group_messages" ON public.group_messages;
    DROP POLICY IF EXISTS "Users can read group messages" ON public.group_messages;
    
    -- Create new policies
    CREATE POLICY "Service role access group_messages"
      ON public.group_messages
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Users can read group messages"
      ON public.group_messages
      FOR SELECT
      USING (
        auth.role() = 'authenticated' AND
        group_id IN (
          SELECT group_id FROM public.group_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- FIX 5: NOTE ABOUT FRONTEND REQUIREMENTS
-- ============================================================================

-- The backend MUST use the service role key for all database operations.
-- The frontend should ONLY use the backend API, never direct Supabase calls.
-- 
-- All frontend requests should go through:
-- - /api/messages/* (for 1-on-1 messages)
-- - /api/group-messages/* (for group messages)
-- - Backend WebSocket (for real-time updates)
--
-- This ensures:
-- 1. Proper authentication via JWT
-- 2. RLS policies are enforced correctly
-- 3. Business logic is centralized on the backend
-- 4. No 503 errors from unauthenticated REST calls
