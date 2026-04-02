# Faculty Tracking Database Setup Guide

## Problem Solved
Faculty grid cards were showing inconsistent view and like counts across browsers and users because data was stored only in localStorage (device/browser specific). This has been fixed by implementing Supabase-backed persistent tracking.

## Solution Overview
- **Frontend**: Modified `Pastpapers.jsx` to sync faculty views and likes to Supabase database
- **Backend**: Created two new tables (`faculty_views` and `faculty_likes`) with RLS policies
- **Data Flow**:
  1. User selects a faculty → increments view count in `faculty_views` table
  2. User likes a faculty → creates/deletes record in `faculty_likes` table
  3. Like counts are aggregated across all users via `get_faculty_like_counts()` RPC
  4. Fresh page loads pull data from database for consistency across browsers

## Database Schema

### Table: `faculty_views`
Tracks how many times each user has viewed each faculty.

```sql
Column         | Type                  | Description
user_id        | UUID (FK)            | References auth.users(id)
faculty_name   | TEXT                 | Faculty name (e.g., "Engineering")
views          | INTEGER              | View count for this user on this faculty
updated_at     | TIMESTAMP            | Last view timestamp
UNIQUE         | (user_id, faculty_name) | One record per user per faculty
```

### Table: `faculty_likes`
Tracks which users have liked which faculties.

```sql
Column         | Type                  | Description
id             | UUID                 | Primary key
user_id        | UUID (FK)            | References auth.users(id)
faculty_name   | TEXT                 | Faculty name
created_at     | TIMESTAMP            | When the like was created
UNIQUE         | (user_id, faculty_name) | One like per user per faculty
```

### RPC Function: `get_faculty_like_counts()`
Returns aggregated like counts across all users.

```sql
RETURNS TABLE (
  faculty_name TEXT,
  count BIGINT
)
```

## Installation Steps

### Step 1: Run the Migration SQL
Execute the contents of `sql/CREATE_FACULTY_TRACKING.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy entire contents from `sql/CREATE_FACULTY_TRACKING.sql`
5. Click "Run" button
6. Verify that tables and function are created successfully

### Step 2: Verify Frontend Code
The following files have been updated and are ready:

- `src/SomaLux/PastPapers/Pastpapers.jsx`: 
  - Added `loadFacultyData()` useEffect to load data on user login
  - Updated `handleFacultySelect()` to upsert views to database
  - Updated `handleToggleFacultyLike()` to insert/delete likes to database

### Step 3: Test the Implementation

#### Test 1: Consistent View Counts
1. Open faculty grid in Browser A
2. Click on "Engineering" faculty
3. Refresh page in Browser B (same user logged in)
4. Verify view count shows increment in both browsers

#### Test 2: Cross-User Like Counts
1. User A logs in, likes a faculty
2. User B logs in, sees incremented like count
3. User A logs in again, sees same like count
4. Counts match across all users ✓

#### Test 3: Anonymous User Fallback
1. Log out completely
2. Like/view faculties
3. Data saves to localStorage only (expected behavior)
4. Login → data loads from database

## Code Changes Summary

### `Pastpapers.jsx` - New useEffect for Data Loading

```jsx
useEffect(() => {
  const loadFacultyData = async () => {
    if (!user) {
      // Anonymous users use localStorage
      const savedViews = JSON.parse(localStorage.getItem('facultyViews') || '{}');
      const savedLikes = JSON.parse(localStorage.getItem('facultyLikes') || '{}');
      const savedCounts = JSON.parse(localStorage.getItem('facultyLikesCounts') || '{}');
      setFacultyViews(savedViews);
      setFacultyLikes(savedLikes);
      setFacultyLikesCounts(savedCounts);
      return;
    }

    try {
      // Load faculty views for current user
      const { data: viewsData } = await supabase
        .from('faculty_views')
        .select('faculty_name, views')
        .eq('user_id', user.id);

      // Load faculty likes for current user
      const { data: likesData } = await supabase
        .from('faculty_likes')
        .select('faculty_name')
        .eq('user_id', user.id);

      // Load aggregated like counts via RPC
      const { data: countsData } = await supabase.rpc('get_faculty_like_counts');

      // Update state with database data
      // ... (full code in Pastpapers.jsx)
    } catch (error) {
      console.error('Error loading faculty data:', error);
      // Fallback to localStorage on error
    }
  };

  loadFacultyData();
}, [user?.id]);
```

### `Pastpapers.jsx` - Updated `handleFacultySelect()`

```jsx
const handleFacultySelect = (faculty) => {
  const trackFacultyView = async () => {
    try {
      if (user?.id) {
        // Upsert view count to database
        await supabase.from('faculty_views').upsert({
          user_id: user.id,
          faculty_name: faculty,
          views: (facultyViews[faculty] || 0) + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,faculty_name' });

        // Update local state AND localStorage
        setFacultyViews(prev => {
          const updated = { ...prev, [faculty]: (prev[faculty] || 0) + 1 };
          localStorage.setItem('facultyViews', JSON.stringify(updated));
          return updated;
        });
      } else {
        // Anonymous users: localStorage only
        setFacultyViews(prev => {
          const updated = { ...prev, [faculty]: (prev[faculty] || 0) + 1 };
          localStorage.setItem('facultyViews', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error('Error tracking faculty view:', err);
      // Fallback to localStorage
    }
  };

  trackFacultyView();
  setFacultyFilter(faculty);
  setShowFacultyGrid(false);
};
```

### `Pastpapers.jsx` - Updated `handleToggleFacultyLike()`

```jsx
const handleToggleFacultyLike = async (faculty) => {
  if (!user?.id) return; // Only authenticated users can like

  const isCurrentlyLiked = facultyLikes[faculty];
  
  try {
    if (isCurrentlyLiked) {
      // Delete like from database
      await supabase
        .from('faculty_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('faculty_name', faculty);
    } else {
      // Insert like into database
      await supabase.from('faculty_likes').insert({
        user_id: user.id,
        faculty_name: faculty,
        created_at: new Date().toISOString()
      });
    }

    // Update local state
    setFacultyLikes(prev => {
      const updated = { ...prev, [faculty]: !isCurrentlyLiked };
      localStorage.setItem('facultyLikes', JSON.stringify(updated));
      return updated;
    });

    // Update like counts
    setFacultyLikesCounts(prev => {
      const newCount = (prev[faculty] || 0) + (isCurrentlyLiked ? -1 : 1);
      const updated = { ...prev, [faculty]: newCount };
      localStorage.setItem('facultyLikesCounts', JSON.stringify(updated));
      return updated;
    });
  } catch (err) {
    console.error('Error toggling faculty like:', err);
  }
};
```

## Troubleshooting

### Issue: "get_faculty_like_counts" function doesn't exist
**Solution**: Make sure to run the entire `CREATE_FACULTY_TRACKING.sql` file. The RPC function is created at the end of the script.

### Issue: Faculty data not loading on fresh page load
**Solution**: 
1. Check that `user?.id` is being set correctly after login
2. Verify RLS policies are enabled (should be in the SQL script)
3. Check browser console for errors in the loadFacultyData function

### Issue: Likes aren't persisting to database
**Solution**:
1. Verify user is authenticated (handleToggleFacultyLike returns early if no user.id)
2. Check Supabase RLS policies on faculty_likes table
3. Verify user.id matches the authenticated user in Supabase

## Monitoring & Maintenance

### Check Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename IN ('faculty_views', 'faculty_likes')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### View Like Count Distribution
```sql
SELECT 
  faculty_name,
  COUNT(*) as total_likes
FROM public.faculty_likes
GROUP BY faculty_name
ORDER BY total_likes DESC;
```

### Cleanup Old Data (if needed)
```sql
-- Delete views older than 6 months
DELETE FROM public.faculty_views
WHERE updated_at < NOW() - INTERVAL '6 months';

-- Delete likes older than 6 months
DELETE FROM public.faculty_likes
WHERE created_at < NOW() - INTERVAL '6 months';
```

## Performance Considerations

- **Indexes**: Created on user_id and faculty_name for fast lookups
- **UNIQUE Constraints**: Prevent duplicate records (one view/like per user per faculty)
- **RLS Policies**: Users can only see/modify their own records
- **Aggregation**: get_faculty_like_counts() is fast due to GROUP BY indexing

## Rollback (if needed)

To revert to localStorage-only tracking:

```sql
-- Drop the new tables and function
DROP FUNCTION IF EXISTS get_faculty_like_counts();
DROP TABLE IF EXISTS public.faculty_likes;
DROP TABLE IF EXISTS public.faculty_views;
```

Then comment out the database calls in `handleFacultySelect` and `handleToggleFacultyLike`, and remove the loadFacultyData useEffect.

## Next Steps

1. ✅ Run the SQL migration from `sql/CREATE_FACULTY_TRACKING.sql`
2. ✅ Test in development
3. ✅ Deploy to production
4. ✅ Monitor for errors in Supabase logs

---

**Status**: Ready for deployment
**Last Updated**: $(date)
**Migration File**: `sql/CREATE_FACULTY_TRACKING.sql`
