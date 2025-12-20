-- M-Pesa Migration for Subscriptions Table
-- Copy and paste this entire script into Supabase SQL Editor
-- It will add the necessary columns for M-Pesa payments

-- Step 1: Add M-Pesa reference column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS mpesa_reference TEXT;

-- Step 2: Add M-Pesa receipt number column  
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;

-- Step 3: Add raw M-Pesa callback data column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS raw_mpesa JSONB;

-- Step 4: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_mpesa_reference
ON subscriptions(mpesa_reference)
WHERE mpesa_reference IS NOT NULL;

-- Success! You should see "success" messages for each statement
-- If you get errors about columns already existing, that's fine - they already exist