# 🚀 Quick Fix: POST /api/requests 500 Error

## TL;DR - Do This Now

### Step 1: Create the requests table (2 minutes)

**Option A: Via Supabase Dashboard (Easiest)**
1. Go to https://app.supabase.com → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **Create** → **New Query**
4. Copy & paste this entire SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  processed_by uuid REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_requests_status_created_at ON public.requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_user_id_created_at ON public.requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests (created_at DESC);
```

5. Click **Run** ✅

**Option B: Via Command Line**
```powershell
psql "your-supabase-connection-string" -f sql/CREATE_REQUESTS_TABLE.sql
```

### Step 2: Verify it works

Test in browser console or curl:
```javascript
fetch('http://localhost:5000/api/requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userEmail: 'test@example.com',
    userName: 'Test',
    type: 'feature',
    title: 'Test',
    notes: 'Test'
  })
}).then(r => r.json()).then(d => console.log(d))
```

Should see:
```json
{
  "ok": true,
  "request": { "id": "...", "status": "pending", ... }
}
```

## What Was Fixed

✅ Backend: Fixed undefined `created_at` in email template  
✅ Backend: Added detailed error logging  
✅ Frontend: Shows actual error messages instead of generic text  

## Still Getting 500?

1. **Check:** Is the requests table really created?
   ```sql
   SELECT * FROM public.requests LIMIT 1;
   ```

2. **Check:** Are you using correct environment variables?
   - `SUPABASE_URL` 
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Check:** Backend logs
   - Look for `[Requests POST]` messages
   - Should show error code and details

4. **Run diagnostic:**
   ```bash
   cd backend
   node verify-requests-table.js
   ```

## Need Full Details?

Read the complete guide: [POST_REQUESTS_FIX_COMPLETE.md](POST_REQUESTS_FIX_COMPLETE.md)

Or deployment guide: [REQUESTS_TABLE_DEPLOYMENT_GUIDE.md](REQUESTS_TABLE_DEPLOYMENT_GUIDE.md)
