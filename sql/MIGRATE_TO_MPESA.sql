-- Migration to support M-Pesa payment system
-- Add M-Pesa specific columns to subscriptions table

-- Add M-Pesa reference column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS mpesa_reference TEXT;

-- Add M-Pesa receipt number column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;

-- Add raw M-Pesa callback data column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS raw_mpesa JSONB;

-- Create index on M-Pesa reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_mpesa_reference
ON subscriptions(mpesa_reference)
WHERE mpesa_reference IS NOT NULL;

-- Update provider enum to include 'mpesa'
-- Note: This assumes the provider column exists and may need adjustment based on your schema