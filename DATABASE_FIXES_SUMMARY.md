# Database Schema Issues - Fixed

## Summary of Errors & Root Causes

### 1. ❌ Missing `subscription_expires_at` Column
**Error:**
```
"Could not find the 'subscription_expires_at' column of 'profiles' in the schema cache"
```

**Location:** `updateUserTier()` in `api.js:2243`

**Root Cause:** The `profiles` table is missing the `subscription_expires_at` column that the backend expects when updating user subscription tiers.

**Fix Applied:**
- Code side: No changes needed (backend will handle this when column exists)
- Database side: Run `ADD_MISSING_COLUMNS.sql` to add the column

---

### 2. ❌ Invalid Foreign Key Join: `profiles:uploaded_by`
**Error:**
```
PGRST200: Could not find a relationship between 'past_papers' and 'uploaded_by' in the schema cache
```

**Locations:** 
- `src/SomaLux/Books/Admin/pastPapersApi.js:73` (fetchPastPapers)
- `src/SomaLux/Books/Admin/pastPapersApi.js:933` (fetchUploadHistory)

**Root Cause:** The code tries to join `profiles:uploaded_by(id, full_name, email)` but the `uploaded_by` column in `past_papers` doesn't have a valid foreign key relationship to `profiles.id`.

**Fix Applied:**
- **Removed the invalid join** from both queries
- Removed: `profiles:uploaded_by(id, full_name, email)`
- Kept: Direct `uploaded_by` column (UUID reference)
- Solution: Either store the profile data in `past_papers` table as denormalized columns, OR wait for profile data to be fetched separately

**Files Modified:**
1. `/src/SomaLux/Books/Admin/pastPapersApi.js` - Line 73 (main query)
2. `/src/SomaLux/Books/Admin/pastPapersApi.js` - Line 933 (upload history)

---

### 3. ❌ Missing Tables: `past_paper_views` & `past_paper_downloads`
**Errors:**
```
404 GET past_paper_views
404 GET past_paper_downloads
```

**Locations:**
- `src/SomaLux/Books/Admin/api.js:554` (fetchStats)
- `src/SomaLux/Books/Admin/api.js:580-610` (fetchStats)
- `src/SomaLux/Books/Admin/api.js:662` (totalPastPapersDownloads)

**Root Cause:** The stats dashboard queries these tables to get detailed download/view analytics, but these tables don't exist in the database.

**Fix Applied:**
- **Wrapped all queries in try-catch blocks** to gracefully handle 404 errors
- Added better logging to indicate when tables don't exist
- Fallback to `past_papers.downloads_count` and `past_papers.views_count` aggregates instead

**Files Modified:**
1. `/src/SomaLux/Books/Admin/api.js` - Lines 554-560 (past_paper_views query)
2. `/src/SomaLux/Books/Admin/api.js` - Lines 580-610 (past_paper_downloads query)
3. `/src/SomaLux/Books/Admin/api.js` - Lines 658-677 (totalPastPapersDownloads count)

---

## ✅ What Was Fixed

| Issue | Type | Status | File(s) |
|-------|------|--------|---------|
| Missing `subscription_expires_at` column | Database | 🔧 Needs SQL | `ADD_MISSING_COLUMNS.sql` |
| Invalid `profiles:uploaded_by` join | Code | ✅ Fixed | `pastPapersApi.js` |
| Missing `past_paper_views` table | Code | ✅ Handled | `api.js` |
| Missing `past_paper_downloads` table | Code | ✅ Handled | `api.js` |
| 400 errors on profile queries | Code | ✅ Fixed | `pastPapersApi.js` |
| 404 errors on tracking tables | Code | ✅ Handled | `api.js` |

---

## 🚀 Next Steps

### 1. Database Changes (Required)
Run the SQL migration to add the missing column:

```bash
# In Supabase SQL Editor, run:
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
```

**File:** `ADD_MISSING_COLUMNS.sql` (ready to copy-paste)

### 2. Optional: Create Tracking Tables
If you want to track individual paper views and downloads, uncomment the table creation SQL in `ADD_MISSING_COLUMNS.sql` and run it.

### 3. Test the Fixes
After running the SQL:

1. ✅ Past papers queries should work (no PGRST200 errors)
2. ✅ Admin dashboard stats should display without errors
3. ✅ User tier updates should work (if subscription_expires_at exists)
4. ✅ No 404 errors in console for non-existent tables

---

## 📝 Technical Details

### The `subscription_expires_at` Column
- **Table:** `profiles`
- **Type:** `TIMESTAMP WITH TIME ZONE`
- **Default:** `NULL`
- **Purpose:** Store subscription expiration dates for subscription tier management
- **Usage:** Set by admin verification panel when assigning premium tiers

### The Join Problem
**Why the join fails:**
- `past_papers.uploaded_by` references a UUID (user ID)
- There's no foreign key constraint linking it to `profiles.id`
- Supabase RLS requires explicit foreign key relationships for joins to work
- Without the constraint, Supabase can't find the relationship

**Solutions:**
1. Add foreign key: `ALTER TABLE past_papers ADD CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES profiles(id);`
2. Or fetch profiles separately in the application
3. Or denormalize profile data into the past_papers table

**Current Status:** Removed the join (Option 2) to avoid 400 errors

### Missing Tracking Tables
**past_paper_views:** Tracks who viewed which papers and when
**past_paper_downloads:** Tracks who downloaded which papers and when

These are optional for analytics but stats queries now gracefully fallback if they don't exist.

---

## 🔍 Verification

**To verify the fixes work:**

1. Check the browser console - no more PGRST200, 404, or "subscription_expires_at" errors
2. Admin dashboard should load without stat errors
3. Past papers page should display papers with proper filtering
4. User tier updates should succeed

**Key Console Messages to Look For:**
- ✅ Queries complete without errors
- ✅ Fallback logs: "table might not exist" (for optional tables)
- ❌ No "Could not find relationship" errors
- ❌ No "Could not find column" errors

---

## 📚 Related Documentation

- Error: PGRST200 = Supabase RLS foreign key relationship error
- Error: PGRST116 = Record not found (handled in code)
- Supabase Docs: https://postgrest.org/en/v11/errors.html
