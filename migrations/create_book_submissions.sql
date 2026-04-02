-- Create book_submissions table
CREATE TABLE IF NOT EXISTS public.book_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  isbn TEXT,
  year INTEGER,
  language TEXT,
  pages INTEGER,
  publisher TEXT,
  cover_url TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_submissions_status ON public.book_submissions(status);
CREATE INDEX IF NOT EXISTS idx_book_submissions_uploaded_by ON public.book_submissions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_book_submissions_created_at ON public.book_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "Users can insert submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.book_submissions;

-- RLS Policies
CREATE POLICY "Admins can view all submissions"
  ON public.book_submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view own submissions"
  ON public.book_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert submissions"
  ON public.book_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own pending submissions"
  ON public.book_submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by AND status = 'pending')
  WITH CHECK (auth.uid() = uploaded_by AND status = 'pending');

CREATE POLICY "Admins can manage all submissions"
  ON public.book_submissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
