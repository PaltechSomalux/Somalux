-- Fix universities status column default from 'approved' to 'pending'
-- This ensures new university submissions require admin approval

ALTER TABLE public.universities
ALTER COLUMN status SET DEFAULT 'pending';

-- Existing approved universities remain as-is, only the default for new ones changes
