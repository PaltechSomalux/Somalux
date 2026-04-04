-- Clear Chat SQL Functions for Supabase
-- These functions handle clearing chat messages and related operations

-- ============================================================
-- 1. Clear all messages in a chat (soft delete)
-- ============================================================
CREATE OR REPLACE FUNCTION clear_chat(
  p_chat_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_count INT;
  v_result JSON;
BEGIN
  -- Verify the user has access to this chat
  -- (they're either user1 or user2 in the conversation)
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_chat_id
    AND (user1_id = p_user_id OR user2_id = p_user_id)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User does not have access to this chat',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Mark all messages as deleted (soft delete)
  UPDATE messages
  SET 
    status = 'deleted',
    is_edited = true,
    edited_at = NOW(),
    updated_at = NOW()
  WHERE chat_id = p_chat_id
  AND status != 'deleted';

  -- Get count of deleted messages
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Return success response
  v_result := json_build_object(
    'success', true,
    'message', 'Chat cleared successfully',
    'messagesDeleted', v_count,
    'timestamp', NOW()
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'DATABASE_ERROR',
    'hint', 'Failed to clear chat messages'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Clear chat messages by date range
-- ============================================================
CREATE OR REPLACE FUNCTION clear_chat_by_date_range(
  p_chat_id UUID,
  p_user_id UUID,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_count INT;
  v_result JSON;
BEGIN
  -- Verify user has access to this chat
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_chat_id
    AND (user1_id = p_user_id OR user2_id = p_user_id)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User does not have access to this chat',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Mark messages in date range as deleted
  UPDATE messages
  SET 
    status = 'deleted',
    is_edited = true,
    edited_at = NOW(),
    updated_at = NOW()
  WHERE chat_id = p_chat_id
  AND status != 'deleted'
  AND (
    p_start_date IS NULL 
    OR created_at >= COALESCE(p_start_date, created_at)
  )
  AND (
    p_end_date IS NULL 
    OR created_at <= COALESCE(p_end_date, created_at)
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  v_result := json_build_object(
    'success', true,
    'message', 'Messages cleared in date range',
    'messagesDeleted', v_count,
    'dateRange', json_build_object(
      'start', p_start_date,
      'end', p_end_date
    ),
    'timestamp', NOW()
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'DATABASE_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. Get count of clearable messages in a chat
-- ============================================================
CREATE OR REPLACE FUNCTION get_clearable_messages_count(p_chat_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_count INT;
  v_unread_count INT;
  v_result JSON;
BEGIN
  -- Get total undeleted messages
  SELECT COUNT(*) INTO v_total_count
  FROM messages
  WHERE chat_id = p_chat_id
  AND status != 'deleted';

  -- Get count of unread messages
  SELECT COUNT(*) INTO v_unread_count
  FROM messages
  WHERE chat_id = p_chat_id
  AND status != 'deleted'
  AND is_read = false;

  v_result := json_build_object(
    'chatId', p_chat_id,
    'totalMessages', v_total_count,
    'unreadMessages', v_unread_count,
    'canClear', v_total_count > 0
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'code', 'DATABASE_ERROR'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Clear chat and reset unread count
-- ============================================================
CREATE OR REPLACE FUNCTION clear_chat_with_unread_reset(
  p_chat_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_message_count INT;
  v_result JSON;
BEGIN
  -- Verify user access
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_chat_id
    AND (user1_id = p_user_id OR user2_id = p_user_id)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Mark all messages as deleted
  UPDATE messages
  SET 
    status = 'deleted',
    is_read = true,  -- Mark as read when clearing
    is_edited = true,
    edited_at = NOW(),
    updated_at = NOW()
  WHERE chat_id = p_chat_id
  AND status != 'deleted';

  GET DIAGNOSTICS v_message_count = ROW_COUNT;

  -- Reset unread count in user_chats
  UPDATE user_chats
  SET 
    unread_count = 0,
    updated_at = NOW()
  WHERE chat_id = p_chat_id
  AND user_id = p_user_id;

  v_result := json_build_object(
    'success', true,
    'message', 'Chat cleared and unread count reset',
    'messagesCleared', v_message_count,
    'timestamp', NOW()
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'DATABASE_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Soft delete a single message
-- ============================================================
CREATE OR REPLACE FUNCTION soft_delete_message(
  p_message_id UUID,
  p_chat_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_message_sender UUID;
  v_result JSON;
BEGIN
  -- Get the message sender
  SELECT sender_id INTO v_message_sender
  FROM messages
  WHERE id = p_message_id
  AND chat_id = p_chat_id;

  -- Verify user is the sender or has permission
  IF v_message_sender IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Message not found',
      'code', 'NOT_FOUND'
    );
  END IF;

  IF v_message_sender != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete message sent by another user',
      'code', 'FORBIDDEN'
    );
  END IF;

  -- Soft delete the message
  UPDATE messages
  SET 
    status = 'deleted',
    is_edited = true,
    edited_at = NOW(),
    updated_at = NOW()
  WHERE id = p_message_id
  AND chat_id = p_chat_id;

  v_result := json_build_object(
    'success', true,
    'message', 'Message deleted successfully',
    'messageId', p_message_id,
    'timestamp', NOW()
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'DATABASE_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. Restore cleared messages (undo clear)
-- ============================================================
CREATE OR REPLACE FUNCTION restore_cleared_messages(
  p_chat_id UUID,
  p_user_id UUID,
  p_minutes_back INT DEFAULT 5
)
RETURNS JSON AS $$
DECLARE
  v_count INT;
  v_result JSON;
BEGIN
  -- Verify user access
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_chat_id
    AND (user1_id = p_user_id OR user2_id = p_user_id)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized access',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Restore messages deleted within the specified time window
  UPDATE messages
  SET 
    status = 'sent',
    is_edited = false,
    edited_at = NULL,
    updated_at = NOW()
  WHERE chat_id = p_chat_id
  AND status = 'deleted'
  AND edited_at > NOW() - (p_minutes_back || ' minutes')::INTERVAL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  v_result := json_build_object(
    'success', true,
    'message', 'Messages restored successfully',
    'messagesRestored', v_count,
    'timeWindow', p_minutes_back || ' minutes',
    'timestamp', NOW()
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'code', 'DATABASE_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. Get chat statistics
-- ============================================================
CREATE OR REPLACE FUNCTION get_chat_statistics(p_chat_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_total_messages INT;
  v_active_messages INT;
  v_deleted_messages INT;
  v_unread_count INT;
  v_last_message_date TIMESTAMP;
  v_first_message_date TIMESTAMP;
BEGIN
  -- Total messages
  SELECT COUNT(*) INTO v_total_messages
  FROM messages
  WHERE chat_id = p_chat_id;

  -- Active (not deleted) messages
  SELECT COUNT(*) INTO v_active_messages
  FROM messages
  WHERE chat_id = p_chat_id
  AND status != 'deleted';

  -- Deleted messages
  SELECT COUNT(*) INTO v_deleted_messages
  FROM messages
  WHERE chat_id = p_chat_id
  AND status = 'deleted';

  -- Unread messages
  SELECT COUNT(*) INTO v_unread_count
  FROM messages
  WHERE chat_id = p_chat_id
  AND status != 'deleted'
  AND is_read = false;

  -- Last message date
  SELECT created_at INTO v_last_message_date
  FROM messages
  WHERE chat_id = p_chat_id
  AND status != 'deleted'
  ORDER BY created_at DESC
  LIMIT 1;

  -- First message date
  SELECT created_at INTO v_first_message_date
  FROM messages
  WHERE chat_id = p_chat_id
  ORDER BY created_at ASC
  LIMIT 1;

  v_result := json_build_object(
    'chatId', p_chat_id,
    'totalMessages', COALESCE(v_total_messages, 0),
    'activeMessages', COALESCE(v_active_messages, 0),
    'deletedMessages', COALESCE(v_deleted_messages, 0),
    'unreadMessages', COALESCE(v_unread_count, 0),
    'lastMessageDate', v_last_message_date,
    'firstMessageDate', v_first_message_date,
    'isEmpty', v_active_messages = 0
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'code', 'DATABASE_ERROR'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Grant permissions
-- ============================================================
-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION clear_chat(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_chat_by_date_range(UUID, UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_clearable_messages_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_chat_with_unread_reset(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_message(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_cleared_messages(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_statistics(UUID) TO authenticated;

-- ============================================================
-- USAGE EXAMPLES
-- ============================================================
/*

-- 1. Clear all messages in a chat
SELECT clear_chat('chat-uuid-here', 'user-uuid-here');

-- 2. Clear messages within a date range
SELECT clear_chat_by_date_range(
  'chat-uuid-here',
  'user-uuid-here',
  '2024-01-01'::TIMESTAMP,
  '2024-12-31'::TIMESTAMP
);

-- 3. Get count of messages that can be cleared
SELECT get_clearable_messages_count('chat-uuid-here');

-- 4. Clear chat and reset unread count
SELECT clear_chat_with_unread_reset('chat-uuid-here', 'user-uuid-here');

-- 5. Soft delete a single message
SELECT soft_delete_message(
  'message-uuid-here',
  'chat-uuid-here',
  'user-uuid-here'
);

-- 6. Restore messages cleared in the last 5 minutes
SELECT restore_cleared_messages('chat-uuid-here', 'user-uuid-here', 5);

-- 7. Get chat statistics
SELECT get_chat_statistics('chat-uuid-here');

*/

-- ============================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_messages_status_chat_id 
ON messages(chat_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_edited_at 
ON messages(edited_at);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at 
ON messages(chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_chats_user_chat 
ON user_chats(user_id, chat_id);
