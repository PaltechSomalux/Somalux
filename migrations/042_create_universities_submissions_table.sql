-- Create universities_submissions table - parallel structure to past_paper_submissions
-- This allows pending university submissions without violating unique constraints on the universities table

CREATE TABLE IF NOT EXISTS public.universities_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Submitted university data
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  website_url TEXT,
  established INTEGER,
  student_count INTEGER DEFAULT 0,
  cover_image_url TEXT,
  
  -- Submission metadata
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Approval metadata
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- For linking to final published university if approved
  published_university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_universities_submissions_status ON public.universities_submissions(status);
CREATE INDEX IF NOT EXISTS idx_universities_submissions_uploaded_by ON public.universities_submissions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_universities_submissions_created_at ON public.universities_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE public.universities_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to insert submissions
CREATE POLICY "Allow users to insert university submissions"
ON public.universities_submissions
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policy: Allow admins to select/update submissions
CREATE POLICY "Allow admins to view and update submissions"
ON public.universities_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Allow admins to update submissions"
ON public.universities_submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policy: Allow users to view their own submissions
CREATE POLICY "Allow users to view their own submissions"
ON public.universities_submissions
FOR SELECT
USING (auth.uid() = uploaded_by);
