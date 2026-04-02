-- Add default value for uploaded_by to automatically set it to current user
ALTER TABLE public.universities_submissions
ALTER COLUMN uploaded_by SET DEFAULT auth.uid();

