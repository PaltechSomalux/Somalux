-- ============================================================================
-- IMMEDIATE ACTION: Execute this SQL to fix the delete chat error
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor and run
-- This ensures the is_deleted column exists and functions are available
-- ============================================================================

-- Step 1: Ensure is_deleted column exists
ALTER TABLE public.user_chats 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_chats_active 
ON public.user_chats(user_id, is_deleted) 
WHERE is_deleted = FALSE;

-- Step 3: Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_chats'
  AND column_name = 'is_deleted';

-- Expected output:
-- column_name  | data_type | column_default | is_nullable
-- is_deleted   | boolean   | false          | true

-- ============================================================================
-- OPTIONAL: Helper functions for manual recovery (if needed)
-- ============================================================================

-- Function 1: Get active (non-deleted) chats for a user
CREATE OR REPLACE FUNCTION public.get_user_active_chats(user_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  chat_id UUID,
  is_pinned BOOLEAN,
  is_archived BOOLEAN,
  is_muted BOOLEAN,
  is_locked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.user_id,
    uc.chat_id,
    uc.is_pinned,
    uc.is_archived,
    uc.is_muted,
    uc.is_locked,
    uc.created_at,
    uc.updated_at
  FROM public.user_chats uc
  WHERE uc.user_id = user_uuid
    AND (uc.is_deleted = FALSE OR uc.is_deleted IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Restore a deleted chat
CREATE OR REPLACE FUNCTION public.restore_deleted_chat(
  user_uuid UUID,
  chat_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE public.user_chats
  SET 
    is_deleted = FALSE,
    updated_at = NOW()
  WHERE user_id = user_uuid
    AND chat_id = chat_uuid;
  
  IF FOUND THEN
    SELECT json_build_object(
      'success', true,
      'message', 'Chat restored successfully'
    ) INTO result;
  ELSE
    SELECT json_build_object(
      'success', false,
      'message', 'Chat not found or already active'
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TESTING: Run these queries to verify
-- ============================================================================

-- View all chats for a user (including deleted ones):
-- SELECT user_id, chat_id, is_deleted, updated_at 
-- FROM public.user_chats 
-- WHERE user_id = 'your-user-id'::UUID 
-- ORDER BY updated_at DESC;

-- Get only active chats for a user:
-- SELECT * FROM public.get_user_active_chats('your-user-id'::UUID);

-- Restore a deleted chat:
-- SELECT public.restore_deleted_chat('your-user-id'::UUID, 'chat-id'::UUID);

-- ============================================================================
-- AFTER RUNNING THIS SCRIPT:
-- ============================================================================
-- 1. Go back to the app
-- 2. Open browser DevTools (F12)
-- 3. Delete a chat
-- 4. Check Console for detailed logs starting with 🗑️
-- 5. Look for ✅ deleteChat: Chat deleted successfully
-- 6. Chat should disappear from list
-- 7. Refresh page - it should stay deleted
