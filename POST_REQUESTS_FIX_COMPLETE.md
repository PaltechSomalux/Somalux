# POST /api/requests 500 Error - Fix Summary

## Problem
The request submission endpoint (`POST /api/requests`) was returning a **500 Internal Server Error** with message: "failed to submit request. Try again later."

## Root Cause
The **`requests` table doesn't exist** in the Supabase database. The migration SQL file exists but hasn't been applied.

Secondary issues fixed:
1. **Undefined `created_at` reference** in email template (line 164 of requests.js)
2. **Poor error messaging** on frontend (error details not shown to user)
3. **Incomplete error logging** in backend (missing error code and details)

## Changes Made

### 1. Backend: Fix created_at Bug ✅
**File:** [backend/routes/requests.js](backend/routes/requests.js#L160-L164)

**Issue:** Code referenced `payload.created_at` which was never set, causing `undefined` in email templates.

**Fix:** Changed to use `data.created_at` from the database response:
```javascript
// Before:
<p><strong>Submitted at:</strong> ${payload.created_at}</p>

// After:
const submittedAt = data?.created_at ? new Date(data.created_at).toLocaleString() : 'N/A';
<p><strong>Submitted at:</strong> ${submittedAt}</p>
```

### 2. Backend: Improve Error Logging ✅
**File:** [backend/routes/requests.js](backend/routes/requests.js#L100-L145)

Added comprehensive logging:
- Request body logging (for debugging payload issues)
- Insert payload logging (to verify field mapping)
- Detailed error logging (includes error code, message, and details)

```javascript
console.log('[Requests POST] Received request body:', JSON.stringify(body, null, 2));
console.log('[Requests POST] Insert payload:', JSON.stringify(payload, null, 2));
console.error('[Requests POST] DB insert error:', error.code, error.message, error.details);
```

### 3. Frontend: Improve Error Messaging ✅
**File:** [src/SomaLux/BookDashboard/Profile.js](src/SomaLux/BookDashboard/Profile.js#L534-L536)

Changed from generic error to actual backend error details:
```javascript
// Before:
if (!res.ok) throw new Error('Failed to send request');

// After:
if (!res.ok) {
  const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
  throw new Error(errorData.error || `Failed to send request (${res.status})`);
}
```

## Deployment Steps

### Step 1: Create Requests Table in Supabase
Run the migration SQL:
```sql
-- Execute in Supabase SQL Editor or via psql
psql "your-connection-string" -f sql/CREATE_REQUESTS_TABLE.sql
```

**Or manually:**
1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Create New Query
3. Copy contents of [sql/CREATE_REQUESTS_TABLE.sql](sql/CREATE_REQUESTS_TABLE.sql)
4. Execute

### Step 2: Verify Installation
Run the diagnostic script:
```bash
cd backend
node verify-requests-table.js
```

Expected output:
```
✅ All tests passed! Requests table is ready.
```

### Step 3: Test the Endpoint
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "userName": "Test User",
    "type": "feature",
    "title": "Test",
    "notes": "Test request"
  }'
```

Expected response (200 OK):
```json
{
  "ok": true,
  "request": {
    "id": "uuid-here",
    "user_email": "test@example.com",
    "user_name": "Test User",
    "type": "feature",
    "title": "Test",
    "status": "pending",
    "created_at": "2026-02-20T...",
    ...
  }
}
```

## Optional: Enable Row Level Security (RLS)

If you want to restrict access based on user roles:

```sql
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can submit requests
CREATE POLICY "users_can_insert" ON public.requests
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Users can view their own requests
CREATE POLICY "users_view_own" ON public.requests
  FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

-- Policy 3: Admins can manage all
CREATE POLICY "admins_manage" ON public.requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  );
```

## Troubleshooting

### Still Getting 500 Error?

**Check 1: Is requests table created?**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'requests'
);
```

**Check 2: Are there RLS policies blocking inserts?**
- Look in Supabase: Authentication → Policies
- If RLS is enabled but no INSERT policy exists, requests will fail
- Disable RLS or add proper policies

**Check 3: Check backend logs**
Look for `[Requests POST]` messages which show:
- What payload was received
- What was submitted to database
- The exact error from database

### Specific Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `relation "public.requests" does not exist` | Table not created | Run CREATE_REQUESTS_TABLE.sql |
| `permission denied for schema public` | RLS policy blocking | Add INSERT policy or disable RLS |
| `null value in column "type" violates not-null constraint` | type field not provided | Frontend must include type in payload |
| `new row violates foreign key constraint` | user_id references non-existent profile | Set user_id to null or use valid UUID |

## Files Modified

1. ✅ [backend/routes/requests.js](backend/routes/requests.js) - Fixed created_at bug and improved logging
2. ✅ [src/SomaLux/BookDashboard/Profile.js](src/SomaLux/BookDashboard/Profile.js) - Better error messaging
3. ✅ [backend/verify-requests-table.js](backend/verify-requests-table.js) - NEW: Diagnostic script
4. ✅ [REQUESTS_TABLE_DEPLOYMENT_GUIDE.md](REQUESTS_TABLE_DEPLOYMENT_GUIDE.md) - NEW: Deployment guide
5. ✅ [sql/CREATE_REQUESTS_TABLE.sql](sql/CREATE_REQUESTS_TABLE.sql) - Existing: Migration SQL

## Testing Checklist

- [ ] Run `node backend/verify-requests-table.js` successfully
- [ ] POST request returns 200 with request object
- [ ] Request appears in admin panel (`/api/requests`)
- [ ] Confirmation email received (if email configured)
- [ ] Admin notification email received
- [ ] Request persists in database (check Supabase)
