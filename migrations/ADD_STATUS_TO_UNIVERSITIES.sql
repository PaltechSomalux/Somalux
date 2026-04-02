-- Add status column to universities table for approval workflow
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'; -- 'pending', 'approved', 'rejected'

-- Create index for filtering pending universities
CREATE INDEX IF NOT EXISTS idx_universities_status ON public.universities(status);

-- Add indexes for created_by tracking if needed
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_universities_created_by ON public.universities(created_by);

-- Ensure all existing universities are marked as approved
UPDATE public.universities SET status = 'approved' WHERE status IS NULL;
