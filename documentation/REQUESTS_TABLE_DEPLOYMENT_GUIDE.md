# Requests Table Deployment Guide

## Problem
The `/api/requests` endpoint returns a **500 Internal Server Error** because the `requests` table doesn't exist in Supabase.

## Solution

### Step 1: Apply the Migration to Supabase

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **Create** → **New Query**
5. Copy the SQL from [sql/CREATE_REQUESTS_TABLE.sql](sql/CREATE_REQUESTS_TABLE.sql)
6. Paste it into the SQL editor
7. Click **Run** to execute

**OR** use psql from command line:
```powershell
psql "your-connection-string" -f "sql\CREATE_REQUESTS_TABLE.sql"
```

### Step 2: Verify Table Creation

In Supabase SQL Editor, run:
```sql
SELECT * FROM public.requests LIMIT 1;
```

You should see the table structure with columns: `id`, `user_id`, `user_email`, `user_name`, `type`, `title`, `notes`, `link`, `attachments`, `metadata`, `status`, `created_at`, `resolved_at`, `processed_by`.

### Step 3: (Optional) Enable Row Level Security (RLS)

IF you want to restrict table access based on user roles:

```sql
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT their own requests
CREATE POLICY "requests_insert_authenticated" ON public.requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Allow authenticated users to view their own requests
CREATE POLICY "requests_select_own" ON public.requests
  FOR SELECT
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- Allow admins to manage all requests
CREATE POLICY "requests_admin_manage" ON public.requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  );
```

### Step 4: Test the Endpoint

Send a test POST request:

```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "userName": "Test User",
    "type": "feature",
    "title": "Test Feature Request",
    "notes": "This is a test"
  }'
```

Expected response:
```json
{
  "ok": true,
  "request": {
    "id": "uuid-here",
    "user_id": null,
    "user_email": "test@example.com",
    "user_name": "Test User",
    "type": "feature",
    "title": "Test Feature Request",
    "notes": "This is a test",
    "status": "pending",
    "created_at": "2026-02-20T...",
    ...
  }
}
```

## Troubleshooting

### Still Getting 500 Error?

Check the backend logs:

```powershell
# Check recent error logs in Supabase Dashboard:
# 1. Go to Logs
# 2. Look for database errors or connection issues
```

Common issues:
- **"relation \"public.requests\" does not exist"** → Run the CREATE_REQUESTS_TABLE.sql migration
- **"permission denied"** → Check RLS policies or use service role key
- **"foreign key violation"** → user_id references non-existent profile

### Email Not Sending?

The requests are created successfully but emails fail silently. This won't cause the 500 error.

Check:
1. `SENDGRID_API_KEY` environment variable is set
2. Email templates are configured in [backend/utils/email.js](backend/utils/email.js)
3. Admin emails are set in profiles table

## Verification Checklist

- [ ] SQL migration executed successfully in Supabase
- [ ] `requests` table appears in Supabase Tables list
- [ ] Backend logs show `[Requests POST] Request created successfully`
- [ ] Test POST request returns 200 with request object
- [ ] Confirmation emails received (if SENDGRID_API_KEY set)
