-- Fix RLS policies for universities_submissions table
-- The insert policy needs to be more permissive for authenticated users

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Allow users to insert university submissions" ON public.universities_submissions;

-- Create a simpler policy that allows any authenticated user to insert
CREATE POLICY "Allow authenticated users to insert university submissions"
ON public.universities_submissions
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Keep the other policies as they are
-- Users can only see their own submissions or admins can see all
