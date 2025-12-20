-- Fix: Allow users to increment views on universities without owning them
-- This creates a specific policy for updating the views column

-- First, drop the old update policy
DROP POLICY IF EXISTS "Allow users to update their own universities" ON universities;

-- Policy 3a: Allow users to update their own universities (for admins and owners)
CREATE POLICY "Allow users to update their own universities"
ON universities
FOR UPDATE
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 3b: Allow authenticated users to increment views on any university
CREATE POLICY "Allow users to increment views"
ON universities
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Now do the same for past_papers table
-- Allow authenticated users to increment views on any paper
DROP POLICY IF EXISTS "Allow users to update their own papers" ON past_papers;

CREATE POLICY "Allow users to update their own papers"
ON past_papers
FOR UPDATE
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Allow users to increment paper views"
ON past_papers
FOR UPDATE
USING (true)
WITH CHECK (true);
