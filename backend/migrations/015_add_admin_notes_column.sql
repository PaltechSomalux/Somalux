-- Migration 015: Add admin_notes column to past_paper_submissions
ALTER TABLE public.past_paper_submissions
ADD COLUMN IF NOT EXISTS admin_notes TEXT;
