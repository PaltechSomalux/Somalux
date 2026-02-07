-- ============================================================================
-- FIX: Auto-create user_chats entries when conversations are created
-- ============================================================================
-- Purpose: When a conversation is created, automatically create user_chats
-- entries for both participants. This prevents "relation does not exist" errors
-- when querying user_chats for a new conversation.
-- 
-- ⚠️ IMPORTANT: Run CREATE_CHAT_TABLES.sql FIRST if you haven't already!
-- This script assumes conversations and user_chats tables already exist.

-- ============================================================================
-- FUNCTION: Auto-create user_chats entries when conversation is created
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_create_user_chats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user_chats entry for user1
  INSERT INTO public.user_chats (user_id, chat_id, is_pinned, is_archived, is_muted, is_locked, is_deleted)
  VALUES (NEW.user1_id, NEW.id, FALSE, FALSE, FALSE, FALSE, FALSE)
  ON CONFLICT (user_id, chat_id) DO NOTHING;

  -- Insert user_chats entry for user2
  INSERT INTO public.user_chats (user_id, chat_id, is_pinned, is_archived, is_muted, is_locked, is_deleted)
  VALUES (NEW.user2_id, NEW.id, FALSE, FALSE, FALSE, FALSE, FALSE)
  ON CONFLICT (user_id, chat_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Execute auto_create_user_chats after conversation creation
-- ============================================================================
DROP TRIGGER IF EXISTS tr_auto_create_user_chats ON public.conversations;
CREATE TRIGGER tr_auto_create_user_chats
  AFTER INSERT ON public.conversations
  FOR EACH ROWCompiled with problems:
×
ERROR in ./src/components/ChatMe/Chat/MessageItem.css (./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[1]!./node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[1].oneOf[5].use[2]!./node_modules/source-map-loader/dist/cjs.js!./src/components/ChatMe/Chat/MessageItem.css)
Module build failed (from ./node_modules/postcss-loader/dist/cjs.js):
SyntaxError

(195:1) C:\Intel\Magic\SomaLux\src\components\ChatMe\Chat\MessageItem.css Unknown word

  193 | }
  194 | 
> 195 | .message-foflex;
      | ^
  196 |   align-items: center;
  197 |   justify-content: flex-end;
  EXECUTE FUNCTION public.auto_create_user_chats();

-- ============================================================================
-- Fix fetchUserChats to use maybeSingle() instead of single()
-- This prevents errors when user_chats doesn't exist (though it should now)
-- ============================================================================

-- ============================================================================
-- Create missing user_chats entries for existing conversations
-- ============================================================================
-- This backfill ensures any conversations created before the trigger
-- now have corresponding user_chats entries
-- NOTE: Only inserts for users that actually exist in the users table
-- to avoid foreign key constraint violations

INSERT INTO public.user_chats (user_id, chat_id, is_pinned, is_archived, is_muted, is_locked, is_deleted)
SELECT DISTINCT 
  c.user1_id, 
  c.id, 
  FALSE, 
  FALSE, 
  FALSE, 
  FALSE, 
  FALSE
FROM public.conversations c
INNER JOIN public.users u ON c.user1_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_chats uc 
  WHERE uc.user_id = c.user1_id AND uc.chat_id = c.id
)
ON CONFLICT (user_id, chat_id) DO NOTHING;

INSERT INTO public.user_chats (user_id, chat_id, is_pinned, is_archived, is_muted, is_locked, is_deleted)
SELECT DISTINCT 
  c.user2_id, 
  c.id, 
  FALSE, 
  FALSE, 
  FALSE, 
  FALSE, 
  FALSE
FROM public.conversations c
INNER JOIN public.users u ON c.user2_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_chats uc 
  WHERE uc.user_id = c.user2_id AND uc.chat_id = c.id
)
ON CONFLICT (user_id, chat_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the fix works:
-- SELECT COUNT(*) as conversation_count FROM public.conversations;
-- SELECT COUNT(*) as user_chats_count FROM public.user_chats;
-- SELECT * FROM public.conversations LIMIT 5;
-- SELECT * FROM public.user_chats LIMIT 5;
