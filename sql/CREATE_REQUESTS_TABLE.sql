-- CREATE_REQUESTS_TABLE.sql
-- Detailed migration for adding a `requests` table to Supabase (Postgres)
-- Usage: Run this in the Supabase SQL editor or via psql against your project database.

/*
  Purpose
  -------
  Store user-submitted requests (book requests, past-papers, feature ideas,
  complaints, feedback, and other user messages meant for admins).

  Notes
  -----
  - This script enables the `pgcrypto` extension (for gen_random_uuid()).
  - It creates a flexible JSONB `attachments` field for storing file metadata,
    and a `metadata` JSONB column for future extensibility.
  - It includes helpful indexes and example Row Level Security (RLS) policies.
  - Adjust roles and policy conditions to match your project's auth model.
*/

-- Enable pgcrypto for UUID generation (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the requests table
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  type text NOT NULL CHECK (type IN ('book','pastpaper','feature','complaint','feedback','other')),
  title text,
  notes text,
  link text,
  attachments jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','deleted')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  resolved_at timestamptz,
  processed_by uuid REFERENCES public.profiles(id) -- admin who resolved/handled
);

-- Helpful indexes for common queries
CREATE INDEX IF NOT EXISTS idx_requests_status_created_at ON public.requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_user_id_created_at ON public.requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests (created_at DESC);

-- OPTIONAL: sample admin-only view to simplify reads in the Admin UI
CREATE OR REPLACE VIEW public.admin_requests AS
SELECT
  id,
  user_id,
  user_email,
  user_name,
  type,
  coalesce(title, '') AS title,
  coalesce(notes, '') AS notes,
  attachments,
  metadata,
  status,
  created_at,
  resolved_at,
  processed_by
FROM public.requests
ORDER BY created_at DESC;

-- Row Level Security guidance (NOT enabled by default)
-- If you want to enable RLS on this table, review and adapt the example policies below.
-- WARNING: enabling RLS without appropriate policies may block all access. Test carefully.

-- Example (recommended) policy setup:
-- 1) Allow authenticated users to INSERT their own requests
--    (assumes Supabase's auth.uid() returns the user's UUID and profiles table links to auth UID)
--
-- ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "requests_insert_authenticated" ON public.requests
--   FOR INSERT
--   WITH CHECK (
--     -- allow if the user is authenticated and user_id matches auth uid OR user_id is null
--     auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())
--   );
--
-- 2) Allow authenticated users to view their own requests
--
-- CREATE POLICY "requests_select_own" ON public.requests
--   FOR SELECT
--   USING (user_id IS NOT NULL AND user_id = auth.uid());
--
-- 3) Allow admins (users with role = 'admin' in profiles table) to SELECT/UPDATE/DELETE
--
-- CREATE POLICY "requests_admin_manage" ON public.requests
--   FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
--     )
--   );

-- Example seed row (for testing in development only)
INSERT INTO public.requests (user_email, user_name, type, title, notes, metadata)
SELECT 'dev@example.com', 'Dev User', 'feature', 'Test Request', 'This is a seeded test request', jsonb_build_object('env', 'dev')
WHERE NOT EXISTS (SELECT 1 FROM public.requests WHERE user_email = 'dev@example.com' AND title = 'Test Request');

-- End of migration

/*
  Deployment notes:
  - Apply this migration via the Supabase SQL editor: https://app.supabase.com/project/<your-project>/sql
  - Or via psql: `psql <connection-string> -f CREATE_REQUESTS_TABLE.sql`
  - If your Supabase project uses a different schema than `public`, adjust the schema qualifiers.
  - After creating the table, create the RLS policies that match your auth model (examples provided).
*/
