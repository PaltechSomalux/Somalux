-- ============================================================================
-- Migration: Add Message Status Tracking Columns
-- ============================================================================
-- This migration adds status tracking columns to the messages table
-- to support WhatsApp-style message delivery and read status indicators

-- Add missing columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS recipient_id UUID,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Clean up invalid recipient_id values first (set to NULL if they don't exist in users table)
UPDATE public.messages m
SET recipient_id = NULL
WHERE recipient_id IS NOT NULL 
AND recipient_id NOT IN (SELECT id FROM public.users);

-- Add foreign key constraint for recipient_id (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_messages_recipient'
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT fk_messages_recipient 
    FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_delivered_at ON public.messages(delivered_at);

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these queries to verify the columns were added correctly:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'messages' AND column_name IN ('status', 'is_read', 'recipient_id', 'delivered_at', 'read_at');

-- Expected output should show:
-- ✅ status (character varying)
-- ✅ is_read (boolean)
-- ✅ recipient_id (uuid)
-- ✅ delivered_at (timestamp with time zone)
-- ✅ read_at (timestamp with time zone)
