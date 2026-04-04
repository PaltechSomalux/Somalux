-- Add folder_id column to user_chat_folders table
-- This column is required by SupabaseChatService.js for folder management

ALTER TABLE user_chat_folders
ADD COLUMN folder_id UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_user_chat_folders_folder_id ON user_chat_folders(folder_id);

-- Make sure the column has the correct constraints
ALTER TABLE user_chat_folders
ALTER COLUMN folder_id SET NOT NULL,
ALTER COLUMN folder_id SET DEFAULT gen_random_uuid();

-- If the table already has data, ensure each row has a unique folder_id
-- (This is handled by the DEFAULT clause above)

COMMENT ON COLUMN user_chat_folders.folder_id IS 'Unique identifier for each folder';
