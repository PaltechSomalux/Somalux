-- Migration 016: Add timestamp columns to past_paper_submissions
ALTER TABLE public.past_paper_submissions
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
