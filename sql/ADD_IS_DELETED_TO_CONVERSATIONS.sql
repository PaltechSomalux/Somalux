-- ============================================================
-- ADD is_deleted COLUMN TO conversations TABLE
-- ============================================================
-- This ensures deleted chats are deleted for all users at the
-- conversation level, not just individual user_chats entries

-- Step 1: Add the is_deleted column to conversations table
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Step 2: Add updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_updated_at_trigger ON public.conversations;
CREATE TRIGGER conversations_updated_at_trigger
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversations_updated_at();

-- Step 3: Create an index for faster filtering of active conversations
CREATE INDEX IF NOT EXISTS idx_conversations_is_deleted 
ON public.conversations(is_deleted);

CREATE INDEX IF NOT EXISTS idx_conversations_user_active 
ON public.conversations(user1_id, is_deleted)
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_conversations_user2_active 
ON public.conversations(user2_id, is_deleted)
WHERE is_deleted = FALSE;

-- Verification
SELECT 'is_deleted column added to conversations table' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'conversations' AND column_name = 'is_deleted';
