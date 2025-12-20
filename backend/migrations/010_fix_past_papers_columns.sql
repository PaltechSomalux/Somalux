-- =====================================================
-- Migration 010: Add Missing Columns to past_papers
-- =====================================================
-- Issue: Column 'file_path' and others do not exist in past_papers table
-- Solution: Add missing columns used by the API

-- Add missing columns to past_papers table
ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS unit_code TEXT;
ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS unit_name TEXT;
ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS exam_type TEXT;
ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;
ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Ensure uploaded_by column exists
ALTER TABLE past_papers ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES profiles(id);
