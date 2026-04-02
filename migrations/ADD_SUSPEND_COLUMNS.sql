-- Add user suspension functionality to profiles table
-- This migration adds columns to track user suspension status

-- Add columns if they don't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster filtering of suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);

-- Add comment to document the columns
COMMENT ON COLUMN public.profiles.is_suspended IS 'Whether the user account is suspended';
COMMENT ON COLUMN public.profiles.suspended_reason IS 'Reason for suspension, if suspended';
COMMENT ON COLUMN public.profiles.suspended_at IS 'Timestamp when user was suspended';

-- Grant appropriate permissions
GRANT UPDATE (is_suspended, suspended_reason, suspended_at) ON public.profiles TO authenticated;
