-- =====================================================
-- Migration 012: Create past_paper_submissions Table
-- =====================================================
-- Issue: Table 'past_paper_submissions' does not exist
-- Solution: Create the table for user submissions awaiting admin approval

CREATE TABLE IF NOT EXISTS past_paper_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  faculty TEXT,
  unit_code TEXT,
  unit_name TEXT,
  file_path TEXT NOT NULL,
  year INTEGER,
  semester TEXT,
  exam_type TEXT DEFAULT 'Main',
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_past_paper_submissions_status ON past_paper_submissions(status);
CREATE INDEX IF NOT EXISTS idx_past_paper_submissions_uploaded_by ON past_paper_submissions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_past_paper_submissions_created_at ON past_paper_submissions(created_at DESC);
