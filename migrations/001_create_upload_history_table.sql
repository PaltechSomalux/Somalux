-- Past Papers Upload History Table Migration
-- This table tracks all past paper upload attempts (success, failure, duplicate)

CREATE TABLE IF NOT EXISTS past_papers_upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'duplicate')),
  paper_title TEXT,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  faculty TEXT,
  unit_code TEXT,
  unit_name TEXT,
  year INTEGER,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  error_message TEXT,
  is_duplicate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON past_papers_upload_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_history_uploaded_by ON past_papers_upload_history(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_upload_history_status ON past_papers_upload_history(status);
CREATE INDEX IF NOT EXISTS idx_upload_history_university_id ON past_papers_upload_history(university_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_unit_code ON past_papers_upload_history(unit_code);

-- Enable Row Level Security (RLS)
ALTER TABLE past_papers_upload_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see history for uploads they made or as admin
CREATE POLICY "Users can view their own upload history"
  ON past_papers_upload_history
  FOR SELECT
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert upload history"
  ON past_papers_upload_history
  FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Admins can update history (e.g., mark as reviewed)
CREATE POLICY "Admins can update upload history"
  ON past_papers_upload_history
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_upload_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER update_past_papers_upload_history_updated_at
  BEFORE UPDATE ON past_papers_upload_history
  FOR EACH ROW
  EXECUTE FUNCTION update_upload_history_updated_at();
