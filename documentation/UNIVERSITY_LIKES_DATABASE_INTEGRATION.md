# University Views and Likes - Persistent Database Integration

## Summary
Implemented persistent database tracking for university views and likes, ensuring metrics are accurately recorded and feed to the admin content management interface.

## Changes Made

### 1. Database Schema (ADD_UNIVERSITY_LIKES_TRACKING.sql)
Created comprehensive database infrastructure:
- **universities table**: Added `likes_count` column (INTEGER DEFAULT 0)
- **university_likes table**: New tracking table with:
  - university_id (UUID, FK to universities)
  - user_id (UUID)
  - created_at (timestamp)
  - UNIQUE constraint on (university_id, user_id) to prevent duplicate likes
  - RLS policies for secure access
- **toggle_university_like() RPC function**: 
  - Takes university_id and user_id
  - Toggles like status (add or remove)
  - Automatically updates likes_count in universities table
  - Returns: `{ liked: boolean, count: number }`

### 2. API Layer (campusApi.js)
Added new API functions:
- **toggleUniversityLike(universityId, userId)**
  - Calls the toggle_university_like RPC function
  - Returns updated like status and count
  - Error handling with console logging

Updated existing function:
- **fetchUniversities()**: Now includes `likes_count` in SELECT query

### 3. Frontend Component (Pastpapers.jsx)
Enhanced handleToggleUniversityLike function:
- Performs optimistic UI update immediately (fast response)
- Syncs changes to database in background
- Uses userId from userProfile or generates anonymous ID
- Maintains localStorage for offline support
- Added import for toggleUniversityLike from campusApi

### 4. Admin Dashboard (UniversitiesManagement.jsx)
Updated admin interface to display like metrics:
- **Stats Summary Section**:
  - Added "Total Likes" card (red/crimson color #E74C3C)
  - Shows sum of all likes_count values on current page
  - Positioned alongside "Total Views" and "Page Universities"
  
- **Table Header**:
  - Added "Likes" column with click-to-sort functionality
  - Color-coded header with red background (rgba(231, 76, 60, 0.1))
  
- **Table Data Rows**:
  - Added likes_count display for each university
  - Color: #E74C3C (red) with bold font
  - Updated colSpan from 8 to 9 for empty state rows

## Data Flow

```
User Action (Like University)
    ↓
Pastpapers.jsx handleToggleUniversityLike()
    ├→ Optimistic UI Update (localStorage + state)
    └→ toggleUniversityLike() API call (async)
        ↓
    campusApi.js toggleUniversityLike()
        ↓
    Supabase RPC: toggle_university_like()
        ├→ Check if user already liked
        ├→ Insert or delete from university_likes table
        └→ Update likes_count in universities table
            ↓
    Admin Dashboard Fetches Data
        ↓
    UniversitiesManagement.jsx displays metrics
```

## Key Features

### Persistent Storage
- ✅ Views tracked via RPC `increment_university_views()` 
- ✅ Likes tracked via RPC `toggle_university_like()`
- ✅ Counts maintained in universities table (views, likes_count)
- ✅ Individual likes recorded in university_likes table for analytics

### Admin Visibility
- ✅ Total Views displayed in stats card (blue color)
- ✅ Total Likes displayed in stats card (red color)
- ✅ Per-university likes shown in table
- ✅ Likes column sortable by count
- ✅ Likes count updates as users interact with system

### Accurate Recording
- ✅ User deduplication via UNIQUE constraint
- ✅ Automatic count updates via RPC function
- ✅ Optimistic UI updates for fast response
- ✅ Background database sync prevents data loss

### Data Consistency
- ✅ RLS policies control access
- ✅ SECURITY DEFINER RPC bypasses RLS for count updates
- ✅ Anonymous users supported with generated IDs
- ✅ Counts automatically incremented/decremented

## Implementation Details

### Database Policies
```
- Insert: auth.uid() = user_id OR auth.uid() IS NULL (allows anonymous)
- Delete: auth.uid() = user_id OR auth.uid() IS NULL (allows anonymous)
- Select: true (anyone can view likes)
```

### Admin Panel Styling
- Views: #34B7F1 (Blue) with 0.1 opacity background
- Likes: #E74C3C (Red) with 0.1 opacity background
- Bold font (fontWeight: 500) for prominent display

### User Identification
- Authenticated: Uses userProfile.id
- Anonymous: Generated ID format: `anonymous-{random}` for tracking persistence

## Testing Recommendations

1. **Like Functionality**
   - Click like button on university in Pastpapers
   - Verify count increments immediately (UI)
   - Refresh page - count should persist
   - Admin panel should show updated likes_count

2. **Multiple Users**
   - Like same university from different browsers
   - Verify counts are accurate and aggregated
   - Check that deduplication prevents duplicate counts

3. **Admin Panel**
   - Check "Total Likes" statistic updates
   - Sort by Likes column
   - Verify per-university like counts display correctly

4. **Data Persistence**
   - Clear localStorage, refresh page
   - Views and likes should still display (from database)
   - Admin metrics should remain accurate

## SQL Migration Required

Run `ADD_UNIVERSITY_LIKES_TRACKING.sql` on Supabase to:
1. Add likes_count column to universities table
2. Create university_likes tracking table
3. Create toggle_university_like() RPC function
4. Enable RLS and set policies

## Files Modified

- [src/SomaLux/PastPapers/Pastpapers.jsx](src/SomaLux/PastPapers/Pastpapers.jsx) - Added toggleUniversityLike import and sync
- [src/SomaLux/Books/Admin/campusApi.js](src/SomaLux/Books/Admin/campusApi.js) - Added toggleUniversityLike function, updated fetchUniversities select
- [src/SomaLux/Books/Admin/pages/UniversitiesManagement.jsx](src/SomaLux/Books/Admin/pages/UniversitiesManagement.jsx) - Added likes stats and table column

## Files Created

- [ADD_UNIVERSITY_LIKES_TRACKING.sql](ADD_UNIVERSITY_LIKES_TRACKING.sql) - Database migration for university likes
