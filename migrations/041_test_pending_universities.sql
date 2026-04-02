-- Temporarily set recently created universities to 'pending' for testing the approval workflow
-- This helps verify the admin approval system is working correctly
-- In production, only truly new submissions should have pending status

UPDATE public.universities
SET status = 'pending'
WHERE status = 'approved' AND created_at > NOW() - INTERVAL '7 days';

-- To revert this change, run:
-- UPDATE public.universities SET status = 'approved' WHERE status = 'pending' AND created_at > NOW() - INTERVAL '7 days';
