-- ============================================================================
-- SOFT DELETE CHAT FUNCTIONALITY
-- ============================================================================
-- Purpose: Enable soft-delete (mark as deleted) for chats instead of hard delete
-- This allows for data recovery and maintains referential integrity
-- 
-- Schema assumption: user_chats table has 'is_deleted' boolean column
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Get active chats for a user (excluding deleted ones)
-- ============================================================================
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

-- ============================================================================
-- HELPER FUNCTION: Restore a deleted chat
-- ============================================================================
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
-- HELPER FUNCTION: Permanently delete all soft-deleted chats older than X days
-- ============================================================================
CREATE OR REPLACE FUNCTION public.purge_deleted_chats(days_old INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
  deleted_count INTEGER;
  result JSON;
BEGIN
  -- First, get count of chats to be deleted
  SELECT COUNT(*) INTO deleted_count
  FROM public.user_chats
  WHERE is_deleted = TRUE
    AND updated_at < NOW() - INTERVAL '1 day' * days_old;
  
  -- Delete the soft-deleted chats
  DELETE FROM public.user_chats
  WHERE is_deleted = TRUE
    AND updated_at < NOW() - INTERVAL '1 day' * days_old;
  
  SELECT json_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'message', 'Purged ' || deleted_count || ' chats deleted ' || days_old || '+ days ago'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEW: All deleted chats (for admin purposes)
-- ============================================================================
CREATE OR REPLACE VIEW public.deleted_chats_view AS
SELECT 
  uc.user_id,
  uc.chat_id,
  uc.updated_at as deleted_at,
  (NOW() - uc.updated_at) as days_since_deletion
FROM public.user_chats uc
WHERE uc.is_deleted = TRUE
ORDER BY uc.updated_at DESC;

-- ============================================================================
-- VERIFY: Ensure is_deleted column exists and is properly indexed
-- ============================================================================
-- Check if column exists
ALTER TABLE public.user_chats 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on active chats
CREATE INDEX IF NOT EXISTS idx_user_chats_active 
ON public.user_chats(user_id, is_deleted) 
WHERE is_deleted = FALSE;

-- ============================================================================
-- GRANTS: Ensure functions are accessible
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_user_active_chats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_deleted_chat(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_deleted_chats(INTEGER) TO service_role;
GRANT SELECT ON public.deleted_chats_view TO authenticated;

-- ============================================================================
-- VERIFICATION SCRIPT: Check setup status
-- ============================================================================
-- Run this to verify the soft delete functionality is properly set up:

/*
-- Check if is_deleted column exists:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_chats'
  AND column_name = 'is_deleted';

-- Check if index exists:
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname = 'idx_user_chats_active';

-- Check if functions are defined:
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_active_chats', 'restore_deleted_chat', 'purge_deleted_chats');

-- Check deleted chats view:
SELECT * FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'deleted_chats_view';
*/

-- ============================================================================
-- TEST QUERIES (Run these to verify setup):
-- ============================================================================
-- Get active chats for a user:
-- SELECT * FROM public.get_user_active_chats('your-user-id'::UUID);

-- View all deleted chats:
-- SELECT * FROM public.deleted_chats_view;

-- Restore a deleted chat:
-- SELECT public.restore_deleted_chat('your-user-id'::UUID, 'chat-id'::UUID);

-- Purge chats deleted 90+ days ago:
-- SELECT public.purge_deleted_chats(90);

-- Check table structure:
-- DESCRIBE public.user_chats;  -- or use PostgreSQL equivalent: SELECT * FROM information_schema.columns WHERE table_name = 'user_chats';

-- View all user_chats for a user (including deleted):
-- SELECT * FROM public.user_chats WHERE user_id = 'your-user-id'::UUID ORDER BY updated_at DESC;
