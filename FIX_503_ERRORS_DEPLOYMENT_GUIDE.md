# Fix Supabase 503 Errors - Implementation Guide

## Problem Summary
Frontend is receiving "Failed to load resource: 503 Service Unavailable" errors when trying to fetch messages from Supabase REST API. This indicates:
- RLS (Row Level Security) policies are rejecting unauthenticated or improperly authenticated requests
- Direct REST API calls from frontend aren't including proper Authorization headers
- Messages table policies need to be updated to allow proper authentication flows

## Root Cause
1. **RLS Policies Too Restrictive**: Messages table policies were blocking even authenticated users
2. **Unauthenticated Frontend Calls**: Some components were making direct REST calls without JWT tokens
3. **Missing Anon Key Configuration**: Frontend wasn't properly passing the anon key for Supabase client requests

## Solution Overview
The fix involves three parts:

### Part 1: Apply RLS Policy Fixes (Database)
Execute the SQL migration: `FIX_SUPABASE_RLS_POLICIES.sql` in your Supabase SQL Editor

**Steps:**
1. Go to Supabase Dashboard → Your Project (wuwlnawtuhjoubfkdtgc)
2. Navigate to SQL Editor
3. Create a new query
4. Copy all contents from `FIX_SUPABASE_RLS_POLICIES.sql`
5. Click "Run" to execute

**What this does:**
- ✅ Drops overly restrictive RLS policies on messages table
- ✅ Creates new policies that allow authenticated users to read/write their own messages
- ✅ Ensures service_role (backend) has unrestricted access
- ✅ Updates group_messages table RLS
- ✅ Creates proper indexes for query performance

### Part 2: Verify Environment Configuration (Frontend)
Check that your `.env` file has these variables:

```env
# Frontend .env
REACT_APP_API_URL=https://somalux-q2bw.onrender.com
REACT_APP_SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2xuYXd0dWhqb3ViZmtkdGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTM5NzAsImV4cCI6MjA4MDk4OTk3MH0.fYzq5xT7ym02Ck1_WyoOHtt-QsRArj1CYqPBYLQula4
```

**What to check:**
- ✅ REACT_APP_SUPABASE_URL is set correctly
- ✅ REACT_APP_SUPABASE_ANON_KEY is set (should start with `eyJ...`)
- ✅ REACT_APP_API_URL points to your backend (somalux-q2bw.onrender.com)

### Part 3: Build and Deploy Frontend

```bash
# Build production bundle
npm run build

# Commit changes
git add -A
git commit -m "Fix: Update Supabase RLS policies to resolve 503 errors"

# Push to GitHub (Render will auto-deploy)
git push origin main
```

## Verification Steps

### Step 1: Check Supabase Policies
1. Go to Supabase Dashboard → Authentication → Policies
2. Click on "messages" table
3. Verify you see these policies:
   - ✅ "Service role has full access to messages"
   - ✅ "Authenticated users can read their messages"
   - ✅ "Authenticated users can insert their own messages"

### Step 2: Test Frontend
1. Hard refresh your browser (Ctrl+Shift+Delete)
2. Navigate to Chat or Admin panel
3. Open DevTools → Console
4. Verify NO 503 errors appear
5. Check that messages load successfully

### Step 3: Check Logs
Monitor Render logs:
```
https://dashboard.render.com → somalux-q2bw → Logs
```

Look for:
- ✅ "✅ Backend + WebSocket server running on port 10000"
- ✅ "🔐 Supabase service-role client initialized"
- ❌ No "Failed to fetch" or "503" errors

## Expected Behavior After Fix

### Before Fix
```
❌ GET https://wuwlnawtuhjoubfkdtgc.supabase.co/rest/v1/messages?select=*&chat_id=eq.xxx
❌ Status: 503 Service Unavailable
```

### After Fix
```
✅ GET https://somalux-q2bw.onrender.com/api/messages/xxx
✅ Status: 200 OK
✅ Messages load successfully in chat UI
```

## Troubleshooting

### Still getting 503 errors?
1. **Clear cache**: Ctrl+Shift+Delete in browser, refresh
2. **Check RLS policies**: Verify they were applied in Supabase
3. **Verify anon key**: Check that REACT_APP_SUPABASE_ANON_KEY is in your .env
4. **Check backend logs**: Look for "Supabase service-role client initialized"

### Messages still not loading?
1. Check browser DevTools Network tab
2. Verify the request goes to `/api/messages/...` (your backend), not Supabase REST
3. Check backend logs for any database connection errors
4. Verify Supabase environment variables are set in Render

### Admin panel showing "Failed to update role" errors?
1. This uses `/api/elib/users/` backend endpoint
2. Verify the backend can connect to Supabase (check logs)
3. Check Supabase database is accessible

## Important Notes

### ⚠️ Frontend Must Use Backend API
The frontend should NEVER make direct Supabase REST calls. All requests must go through:
- `/api/messages/*` - 1-on-1 messaging
- `/api/group-messages/*` - Group messaging
- WebSocket `/chat` - Real-time updates
- Backend API endpoints for all data operations

### ⚠️ Backend Requires Service Role Key
Your backend MUST have:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzk3MCwiZXhwIjoyMDgwOTg5OTcwfQ...
```

This is set in Render environment variables and allows backend to bypass RLS for legitimate operations.

## Timeline
1. **Apply SQL migration**: 2 minutes
2. **Verify .env configuration**: 2 minutes  
3. **Build and push**: 5 minutes
4. **Render redeploy**: 3-5 minutes
5. **Test and verify**: 5 minutes

**Total: ~20 minutes**

## Support
If issues persist after applying this fix:
1. Check that SQL migration executed without errors
2. Verify all environment variables are set correctly
3. Review Supabase and Render logs for specific error messages
4. Ensure backend has service role key configured
5. Clear all browser caches and restart
