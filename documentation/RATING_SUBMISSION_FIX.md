# RATING SUBMISSION FIX - COMPLETE GUIDE

## Problem
Rating submissions failing with: "Failed to submit rating. Please try again."

## Root Causes Fixed
1. ✅ **Incorrect upsert constraint order** in `book_ratings`, `university_ratings`, and `author_ratings` tables
2. ✅ **Missing RLS (Row Level Security) policies** on `book_ratings` and `author_ratings` tables

## Fixes Applied

### 1. Frontend Code Fixes (✅ Already Applied)
Three files were updated to use correct constraint order:
- [BookPanel.jsx](../src/SomaLux/Books/BookPanel.jsx) - Changed `onConflict: 'book_id,user_id'` to `'user_id,book_id'`
- [campusApi.js](../src/SomaLux/Books/Admin/campusApi.js) - Changed `onConflict: 'university_id,user_id'` to `'user_id,university_id'`
- [authorInteractionsApi.js](../src/SomaLux/Books/Admin/authorInteractionsApi.js) - Changed `onConflict: 'user_id, author_id'` to `'user_id,author_id'`

### 2. Database RLS Policies (⚠️ MUST APPLY MANUALLY)

**To apply the RLS policies:**

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to https://supabase.com → Dashboard → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire SQL from [019_fix_rating_rls_complete.sql](migrations/019_fix_rating_rls_complete.sql)
5. Paste it into the editor
6. Click **Run** (or Cmd+Enter)
7. Wait for success message

#### Option B: Using Command Line (PostgreSQL)
```bash
# First, get your database connection string from Supabase
# Dashboard → Settings → Database → Connection string

psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f backend/migrations/019_fix_rating_rls_complete.sql
```

#### Option C: Using Supabase Seed/Migration System
```bash
# Copy 019_fix_rating_rls_complete.sql to your migrations folder
# Run through your migration tool
```

## What the RLS Policies Do

### book_ratings table
- **SELECT**: Everyone can view ratings (for displaying stats)
- **INSERT**: Only authenticated users can add their own ratings
- **UPDATE**: Users can only update their own ratings
- **DELETE**: Users can only delete their own ratings

### author_ratings table
- Same permissions as book_ratings

### university_ratings table
- Already has correct RLS policies (created in migration 013)

## Testing After Fix

1. Log in to your app
2. Try to rate a book:
   - Open a book
   - Click the rating stars
   - Submit the rating
   - Should show success message

3. Try to rate an author:
   - Go to Author Profile
   - Click rating stars
   - Submit the rating
   - Should show success message

4. Try to rate a university:
   - Go to University
   - Click rating stars
   - Submit the rating
   - Should show success message

## Expected Results After Applying Both Fixes

| Rating Type | Before Fix | After Fix |
|-------------|-----------|----------|
| Book Rating | ❌ Error | ✅ Works |
| Author Rating | ❌ Error | ✅ Works |
| University Rating | ⚠️ Inconsistent | ✅ Works |

## If Still Not Working

1. **Verify RLS policies were applied**:
   - Dashboard → SQL Editor → Run this:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'book_ratings';
   SELECT * FROM pg_policies WHERE tablename = 'author_ratings';
   ```
   - Should show 4 policies for each table

2. **Check user authentication**:
   - Console should show user ID in auth context
   - User must be logged in to submit ratings

3. **Check table constraints**:
   ```sql
   \d public.book_ratings
   \d public.author_ratings
   ```
   - Should show `UNIQUE(book_id, user_id)` and `UNIQUE(user_id, author_name)`

## Files Modified

### Frontend Files (✅ Fixed)
- [BookPanel.jsx](../src/SomaLux/Books/BookPanel.jsx#L1598)
- [campusApi.js](../src/SomaLux/Books/Admin/campusApi.js#L186)
- [authorInteractionsApi.js](../src/SomaLux/Books/Admin/authorInteractionsApi.js#L265)

### Database Migration (⚠️ Apply Manually)
- [019_fix_rating_rls_complete.sql](migrations/019_fix_rating_rls_complete.sql)

## Summary
✅ Code fixes applied  
⚠️ SQL policies need manual application in Supabase Dashboard
