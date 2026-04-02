# 🚨 ERROR FIX SUMMARY: 400 Bad Request on Profiles Table

## The Problem

You're getting repeated 400 errors when the app tries to access the profiles table:
```
Failed to load resource: the server responded with a status of 400 ()
```

This happens because the database migration has NOT been executed yet.

## Root Cause

The `profiles` table in Supabase is missing required columns:
- ✗ `subscription_tier`
- ✗ `subscription_started_at`
- ✗ `subscription_expires_at`
- ✗ `role`
- ✗ `last_active_at`

AND/OR has RLS (Row Level Security) policies that are blocking access.

## The Solution (3 Steps)

### ✅ STEP 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/[your-project]/sql

### ✅ STEP 2: Run COMPREHENSIVE_MIGRATION.sql
1. Click **New Query**
2. Copy ENTIRE contents of `COMPREHENSIVE_MIGRATION.sql` from your project
3. Paste into the SQL editor
4. Click **Run** (Ctrl+Enter)

**Expected result**: Query successful with no errors

### ✅ STEP 3: Clear Browser Cache & Refresh
1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Or clear cache: **Ctrl+Shift+Delete** and clear all
3. Refresh page

## Expected Outcome

After running the migration:
- ✅ No more 400 errors
- ✅ Profiles load correctly
- ✅ User roles display properly
- ✅ Admin/Editor buttons appear when assigned
- ✅ Real-time role updates work

## If It Still Doesn't Work

### Option 1: RLS Policies Issue

Run this in Supabase SQL Editor:
```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Check policies
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- If you see policies, they might be blocking. Run RLS_POLICY_FIX.md
```

**See**: `RLS_POLICY_FIX.md` for detailed RLS troubleshooting

### Option 2: Verify Migration Success

Run these diagnostic queries:

```sql
-- Check all columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' ORDER BY column_name;

-- Check if profiles table has data
SELECT COUNT(*) as profile_count FROM public.profiles;

-- Check specific columns
SELECT id, email, subscription_tier, role FROM public.profiles LIMIT 1;
```

### Option 3: Clear Cache in Code

Also try clearing service worker cache:
```javascript
// In browser console:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

## Files Created

| File | Purpose |
|------|---------|
| `COMPREHENSIVE_MIGRATION.sql` | Complete migration with all fixes (USE THIS) |
| `ADD_MISSING_COLUMNS.sql` | Simple column additions only |
| `URGENT_MIGRATION_FIX.md` | Step-by-step execution guide |
| `RLS_POLICY_FIX.md` | Row Level Security troubleshooting |
| `MIGRATION_INSTRUCTIONS.md` | Original migration guide |

## Code Changes Already Made

✅ **BookPanel.jsx** - Defensive queries, no longer tries to fetch non-existent `role` column
✅ **Pastpapers.jsx** - Defensive queries, added realtime listeners
✅ **Service Workers** - Will stop caching failed requests after migration

## Timeline

1. **NOW**: Run COMPREHENSIVE_MIGRATION.sql in Supabase
2. **After migration**: Clear browser cache and refresh
3. **Result**: Errors should disappear, features should work

## Success Indicators

After running migration, you should see:
- ✅ Network requests to profiles return 200 (not 400)
- ✅ User info loads on page load
- ✅ Admin/Editor buttons appear when assigned
- ✅ No service worker cache errors
- ✅ Role assignments work in real-time

## Need Help?

If errors persist:
1. Check `RLS_POLICY_FIX.md` for RLS issues
2. Run all diagnostic queries from `COMPREHENSIVE_MIGRATION.sql`
3. Verify migration ran with no error messages
4. Clear ALL browser cache (not just site data)
5. Try in an incognito/private window

---

**TL;DR**: Go to Supabase → SQL Editor → Run COMPREHENSIVE_MIGRATION.sql → Clear cache → Refresh
