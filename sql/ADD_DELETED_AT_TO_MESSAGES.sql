-- ============================================================================
-- ADD deleted_at COLUMN TO messages TABLE
-- ============================================================================
-- This migration adds the deleted_at timestamp column to the messages table
-- Used for soft deletes to track when messages were deleted
-- Run this migration after the main CREATE_CHAT_TABLES.sql

-- Add the deleted_at column if it doesn't exist
ALTER TABLE IF EXISTS public.messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index on deleted_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at 
ON public.messages(deleted_at DESC);

-- Create index for filtering non-deleted messages efficiently
CREATE INDEX IF NOT EXISTS idx_messages_active 
ON public.messages(chat_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Update the table comment to explain the soft delete behavior
COMMENT ON COLUMN public.messages.deleted_at IS 'Timestamp when message was soft-deleted. NULL if not deleted.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration was successful:

-- Check if the column exists
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'messages' AND column_name = 'deleted_at';

-- Check indexes exist
-- SELECT schemaname, tablename, indexname FROM pg_indexes 
-- WHERE tablename = 'messages' AND indexname LIKE '%deleted%';

-- Sample soft delete query
-- UPDATE public.messages 
-- SET deleted_at = NOW() 
-- WHERE id = 'message-id-here';

-- Query only non-deleted messages
-- SELECT * FROM public.messages 
-- WHERE chat_id = 'chat-id-here' AND deleted_at IS NULL
-- ORDER BY created_at DESC;
