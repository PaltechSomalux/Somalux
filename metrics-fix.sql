-- Add deactivated_at column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create an index for better query performance on deactivated_at
CREATE INDEX IF NOT EXISTS idx_profiles_deactivated_at ON profiles(deactivated_at);

-- Create an index for better query performance on last_active_at
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON profiles(last_active_at);

-- Create an index for time range queries
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

-- Add comments to clarify the fields
COMMENT ON COLUMN profiles.last_active_at IS 'Timestamp of last activity by this user';
COMMENT ON COLUMN profiles.deactivated_at IS 'Timestamp when user account was deactivated';
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp when profile was last updated';
