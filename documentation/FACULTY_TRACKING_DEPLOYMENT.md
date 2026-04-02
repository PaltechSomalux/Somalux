# Faculty Tracking Implementation Checklist

## ✅ Completed Tasks

### Frontend Implementation
- [x] Added `loadFacultyData()` useEffect to Pastpapers.jsx
  - Loads faculty views from database for authenticated users
  - Loads faculty likes from database for authenticated users  
  - Aggregates like counts via get_faculty_like_counts() RPC
  - Falls back to localStorage for anonymous users
  - Dependency: user?.id (reloads when user changes)

- [x] Updated `handleFacultySelect()` function
  - Increments view count in faculty_views table
  - Updates local state and localStorage
  - Async operation with error fallback
  - Works for both authenticated and anonymous users

- [x] Updated `handleToggleFacultyLike()` function
  - Deletes like from faculty_likes table if already liked
  - Inserts like into faculty_likes table if not liked
  - Updates local state and localStorage
  - Aggregated counts decrement/increment accordingly
  - Only works for authenticated users

### Database Setup
- [x] Created migration file: `sql/CREATE_FACULTY_TRACKING.sql`
  - Creates faculty_views table with proper schema
  - Creates faculty_likes table with proper schema
  - Indexes created for performance (user_id, faculty_name)
  - RLS policies enabled and configured
  - RPC function get_faculty_like_counts() created
  - All permissions granted to authenticated users

### Documentation
- [x] Created comprehensive setup guide: FACULTY_TRACKING_SETUP.md
  - Problem description and solution overview
  - Database schema documentation
  - Installation steps
  - Testing procedures
  - Troubleshooting guide
  - Monitoring queries
  - Rollback instructions

## 🚀 Deployment Steps

### Step 1: Run Migration (CRITICAL)
```
Location: sql/CREATE_FACULTY_TRACKING.sql
Action: Execute entire file in Supabase SQL Editor
Expected: 
  - ✓ faculty_views table created
  - ✓ faculty_likes table created
  - ✓ 4 indexes created
  - ✓ RLS policies enabled
  - ✓ get_faculty_like_counts() RPC function created
  - ✓ Permissions granted to authenticated users
```

### Step 2: Deploy Frontend Code
```
Files Modified:
  - src/SomaLux/PastPapers/Pastpapers.jsx
Status: Ready to deploy (no additional changes needed)
```

### Step 3: Test in Staging
```
Test Case 1: View Count Consistency
  1. Login as User A
  2. Open faculty grid
  3. Click Engineering faculty
  4. Note view count in footer
  5. Open in different browser
  6. Verify same view count shows
  ✓ EXPECTED: View count matches across browsers

Test Case 2: Like Count Consistency
  1. Login as User A
  2. Like "Engineering" faculty
  3. Note like count in footer (e.g., "♥ 5")
  4. Logout
  5. Login as User B
  6. Verify like count shows same value (e.g., "♥ 5")
  ✓ EXPECTED: Like count is aggregated across all users

Test Case 3: Fresh Page Load
  1. User A views "Science" faculty
  2. View count incremented (localStorage)
  3. Refresh page
  4. Verify view count still shows from database
  ✓ EXPECTED: Data persists from database

Test Case 4: Anonymous User Fallback
  1. Don't login
  2. View/like faculties
  3. Data saves to localStorage only
  4. Login
  5. Verify data loads from database (not localStorage)
  ✓ EXPECTED: Anonymous data overwrites with authenticated data
```

### Step 4: Monitor After Deployment
```
Check 1: Supabase Logs
  - No RLS permission errors
  - No function execution errors
  - Verify queries executing successfully

Check 2: Console Errors
  - No JavaScript errors in browser console
  - No 401/403 authentication errors
  - No "function not found" errors

Check 3: Data Integrity
  Query: SELECT COUNT(*) FROM faculty_views;
  Query: SELECT COUNT(*) FROM faculty_likes;
  Expected: Growing counts as users interact
```

## 📋 Current Implementation State

### Data Flow (Complete)
```
User Action: Select Faculty
  ↓
handleFacultySelect() called
  ↓
Async: Upsert to faculty_views table
  ↓
Update local state + localStorage
  ↓
User views papers in faculty
  ✓ View count reflects in FacultyGridDisplay

User Action: Like Faculty
  ↓
handleToggleFacultyLike() called
  ↓
Check if already liked
  ↓
If yes: Delete from faculty_likes table
If no: Insert into faculty_likes table
  ↓
Update local state + localStorage
  ↓
Update aggregated count via get_faculty_like_counts()
  ↓
User sees updated like count in FacultyGridDisplay
  ✓ Like count reflects changes
```

### State Management
```
State Variables (all synchronized with database):
  - facultyViews: { [facultyName]: viewCount }
    Source: faculty_views table (per user)
    Updated: On handleFacultySelect()
    Display: FacultyGridDisplay footer (eye icon)

  - facultyLikes: { [facultyName]: boolean }
    Source: faculty_likes table (per user)
    Updated: On handleToggleFacultyLike()
    Display: FacultyGridDisplay footer (like button)

  - facultyLikesCounts: { [facultyName]: count }
    Source: get_faculty_like_counts() RPC (all users)
    Updated: On handleToggleFacultyLike()
    Display: FacultyGridDisplay footer (count next to like)

Storage Fallback:
  - localStorage: Offline support + anonymous users
  - Supabase: Persistent source of truth (authenticated users)
```

### RLS Security Model
```
faculty_views:
  - SELECT: Users can only view their own records
  - INSERT: Users can only insert for themselves
  - UPDATE: Users can only update their own records
  - DELETE: Not allowed (records kept for history)

faculty_likes:
  - SELECT: All users can view all likes (for aggregation)
  - INSERT: Users can only insert for themselves
  - DELETE: Users can only delete their own likes
  - UPDATE: Not allowed

Protections:
  ✓ Prevent cross-user data leakage
  ✓ Prevent unauthorized like/view manipulation
  ✓ Allow public aggregation (everyone sees total counts)
```

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify setup:

### Check Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('faculty_views', 'faculty_likes');
```
Expected: 2 rows (both tables listed)

### Check Function Exists
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_faculty_like_counts';
```
Expected: 1 row

### Check Indexes
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('faculty_views', 'faculty_likes');
```
Expected: 4+ indexes listed

### Check RLS Enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('faculty_views', 'faculty_likes');
```
Expected: Both tables have rowsecurity = true

### Test Function
```sql
SELECT * FROM get_faculty_like_counts();
```
Expected: Returns table with faculty_name and count columns

## ⚠️ Known Limitations

1. **Anonymous Users**: Can't persist likes (handleToggleFacultyLike returns early)
   - Views are tracked in localStorage only
   - Likes are not allowed (requires user.id)
   - This is intentional for security

2. **View Count**: Increments every time user selects faculty
   - Not the same as paper view count (different metrics)
   - Useful for tracking faculty popularity

3. **Performance**: Runs synchronously with faculty selection
   - Database writes are fire-and-forget (no await in UI)
   - Maintains responsive UI even if database is slow

## ❌ Rollback Instructions

If critical issues occur, revert with:

```sql
-- Remove function
DROP FUNCTION IF EXISTS get_faculty_like_counts();

-- Remove tables
DROP TABLE IF EXISTS public.faculty_likes;
DROP TABLE IF EXISTS public.faculty_views;
```

Then remove database calls from Pastpapers.jsx handleFacultySelect() and handleToggleFacultyLike(), and remove the loadFacultyData useEffect.

## 📈 Success Metrics

Track these after deployment:

1. **Data Consistency**: View/like counts match across browsers ✓
2. **Database Growth**: faculty_views and faculty_likes tables accumulating records ✓
3. **No Errors**: Zero RLS/permission errors in Supabase logs ✓
4. **User Satisfaction**: Feedback indicates counts are now consistent ✓

---

**Status**: READY FOR DEPLOYMENT
**Last Updated**: $(date)
**Deployment Time Estimate**: 10-15 minutes
**Rollback Time Estimate**: 5 minutes
