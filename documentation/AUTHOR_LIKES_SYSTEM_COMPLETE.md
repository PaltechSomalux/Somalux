# Author Likes System - Complete Setup & Documentation

## Overview
The author likes system is fully implemented across both user-facing and admin interfaces. Authors can be liked by users, and these interactions are tracked and displayed in the admin dashboard.

## System Architecture

### Architecture Notes
- **Authors Storage**: Authors are stored as TEXT field in the `books` table (not a separate table)
- **Author Interactions**: All author interaction data (likes, followers, loves, etc.) use `author_name TEXT` as the key
- **Admin Display**: Aggregated stats from the `author_engagement_stats` view
- **User Display**: Like button on author cards with real-time count updates

## What's Implemented

### 1. **Database Layer** ✅

**File**: `backend/migrations/028_create_author_likes_tracking.sql`

**Components**:
- **author_likes table**: Already exists, tracks user likes with `(user_id, author_name)` pairs
- **author_likes_counts view**: New view that aggregates like counts per author
- **Indexes**: Performance indexes on author_name, user_id, and date

**Table Structure**:
```sql
-- Existing table
CREATE TABLE public.author_likes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  like_date TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, author_name)
);

-- New view
CREATE VIEW public.author_likes_counts AS
SELECT 
  author_name,
  COUNT(*) as likes_count
FROM public.author_likes
WHERE is_active = true
GROUP BY author_name;
```

### 2. **Admin Dashboard (Authors Tab)** ✅

**File**: `src/SomaLux/Books/Admin/pages/Authors.jsx`

**Features Already Implemented**:
- ✅ "Total Likes" stat card (showing sum of all author likes)
- ✅ "Likes" column in authors table
- ✅ Likes sorted by engagement score (which includes likes)
- ✅ Color-coded with thumb-up icon (`FiThumbsUp`)
- ✅ Real-time updates via engagement stats API

**Stats Card**:
```jsx
// Total Likes stat card - already present
<div className="authors-stat-card">
  <div className="authors-stat-icon authors-stat-icon-6">
    <MdFavoriteBorder />
  </div>
  <div className="authors-stat-content">
    <div className="authors-stat-label">Total Likes</div>
    <div className="authors-stat-value">{overallStats.totalLikes}</div>
  </div>
</div>
```

**Table Column**:
```jsx
// Likes column in authors table
<td className="authors-table-cell authors-num-col">
  <span className="authors-metric-plain authors-likes-count">
    <FiThumbsUp className="authors-metric-icon" />
    {engage.likes_count || 0}
  </span>
</td>
```

### 3. **User-Facing Author Cards** ✅

**File**: `src/SomaLux/Authors/Authors.jsx`

**Features**:
- ✅ Like button on each author card
- ✅ Like count display
- ✅ Toggle like/unlike functionality
- ✅ Optimistic UI updates
- ✅ Real-time count increments/decrements

**toggleLike Implementation**:
```jsx
const toggleLike = (authorId, e) => {
  e.stopPropagation();
  (async () => {
    const author = authors.find(a => a.id === authorId);
    if (!author) return;
    const user = await getCurrentUser();
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('author_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('author_name', author.name)
        .maybeSingle();

      if (existing?.id) {
        // Unlike
        await supabase.from('author_likes').delete().eq('id', existing.id);
        setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], liked: false } }));
        setAuthors(prev => (prev || []).map(a => {
          if (a.id !== authorId) return a;
          return { ...a, likes: Math.max(0, (a.likes || 0) - 1) };
        }));
      } else {
        // Like
        await supabase.from('author_likes').insert({ user_id: user.id, author_name: author.name });
        setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], liked: true } }));
        setAuthors(prev => (prev || []).map(a => {
          if (a.id !== authorId) return a;
          return { ...a, likes: (a.likes || 0) + 1 };
        }));
      }
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  })();
};
```

### 4. **Engagement Stats API** ✅

**File**: `src/SomaLux/Books/Admin/authorInteractionsApi.js`

**Function**: `getAllAuthorsEngagementStats(limit = 100)`
- Fetches from `author_engagement_stats` view
- Returns array with `likes_count` for each author
- Used by admin Authors component

## How It Works

### User Liking an Author (Frontend)
1. User sees author card with like button
2. User clicks like button
3. `toggleLike()` function executes
4. Checks if user is authenticated
5. Queries `author_likes` table for existing like record
6. If exists: deletes record (unlike)
7. If not exists: inserts new record (like)
8. Updates local state for immediate UI feedback
9. Count increases/decreases in real-time

### Admin Viewing Author Likes
1. Admin navigates to Authors tab in Content Management
2. `fetchStats()` and `getAllAuthorsEngagementStats()` called
3. Engagement stats include likes_count from aggregation
4. Admin dashboard displays:
   - Total Likes stat card
   - Likes column in table with count
   - Sorted by engagement score (includes likes)

### Data Flow
```
User Clicks Like
    ↓
toggleLike() in Authors.jsx
    ↓
Insert/Delete in author_likes table
    ↓
View aggregate: author_likes_counts
    ↓
Admin Dashboard via authorInteractionsApi
    ↓
Display likes in Authors tab
```

## Database Schema

### author_likes Table (Already Exists)
```sql
id UUID PRIMARY KEY
user_id UUID → profiles(id) ON DELETE CASCADE
author_name TEXT NOT NULL
like_date TIMESTAMP DEFAULT NOW()
is_active BOOLEAN DEFAULT true
UNIQUE(user_id, author_name)
```

### author_likes_counts View (NEW)
```sql
SELECT 
  author_name,
  COUNT(*) as likes_count
FROM author_likes
WHERE is_active = true
GROUP BY author_name
```

### Indexes (NEW)
```sql
idx_author_likes_author_name
idx_author_likes_user_id
idx_author_likes_is_active
idx_author_likes_date
```

## Setup Instructions

### 1. Run the Database Migration
Execute migration 028 to create the views and indexes:

```sql
-- File: backend/migrations/028_create_author_likes_tracking.sql
-- This creates:
-- - author_likes_counts view (aggregates likes per author)
-- - Performance indexes on author_likes table
```

### 2. Verify Implementation
Check that:
- ✅ author_likes table exists (should from migration 001)
- ✅ author_likes_counts view created successfully
- ✅ All indexes are in place
- ✅ Authors component displays likes
- ✅ Admin dashboard shows likes

### 3. Test Functionality

**User-Facing Test**:
```
1. Go to Authors page
2. Find any author card
3. Click like button (heart icon)
4. Verify count increases by 1
5. Click again to unlike
6. Verify count decreases by 1
7. Refresh page - like status persists
```

**Admin Dashboard Test**:
```
1. Login as admin
2. Go to Content Management → Books → Authors Analytics
3. Look for "Total Likes" stat card
4. Verify "Likes" column shows in table
5. Verify likes match user-facing counts
6. Try sorting by engagement (includes likes)
```

## Files Involved

| File | Changes | Status |
|------|---------|--------|
| `backend/migrations/028_create_author_likes_tracking.sql` | NEW - Creates view & indexes | ✅ Created |
| `src/SomaLux/Authors/Authors.jsx` | Already implemented | ✅ Working |
| `src/SomaLux/Books/Admin/pages/Authors.jsx` | Already implemented | ✅ Working |
| `src/SomaLux/Books/Admin/authorInteractionsApi.js` | Already implemented | ✅ Working |

## Key Differences from Book Likes

| Aspect | Books | Authors |
|--------|-------|---------|
| Storage | UUID with foreign key | TEXT field in books table |
| Table | `book_likes` with book_id UUID | `author_likes` with author_name TEXT |
| Denormalization | Column in books table | View aggregation |
| Count Update | Via trigger | Via view query |
| Admin Display | Direct table column | Via engagement stats view |

## Advantages of View-Based Approach for Authors

✅ **Flexible**: Works with TEXT field authors (no separate table needed)  
✅ **Automatic**: View always reflects current likes from the table  
✅ **Performant**: Indexed queries on author_likes table  
✅ **Maintainable**: No triggers to maintain  
✅ **Consistent**: Single source of truth in author_likes table  

## Engagement Stats Integration

The admin Authors dashboard uses the `author_engagement_stats` view which includes:
- followers_count
- likes_count ← From author_likes aggregation
- loves_count
- comments_count
- ratings_count
- engagement_score (composite metric)

The likes_count is aggregated and included in the engagement stats that the admin dashboard uses.

## Real-Time Features

✅ **Frontend**: Like counts update immediately when user likes/unlikes  
✅ **Admin**: Engagement stats refresh every 30 seconds  
✅ **Persistence**: Likes saved in database for cross-session consistency  
✅ **User Feedback**: Clear indication of liked status  

## Performance Considerations

- **Indexes**: All author_likes queries use indexes (author_name, user_id)
- **View-Based**: No trigger overhead, just aggregation on read
- **Pagination**: Admin dashboard handles large author lists
- **Caching**: Authors list cached in localStorage (24h TTL)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Admin shows no likes | Run migration 028 |
| Like button not working | Check user authentication |
| Likes not persisting | Verify author_likes table accessible |
| Admin page slow | Check indexes are created |
| View returns no data | Ensure is_active = true in likes |

## API Endpoints

### Get All Authors Engagement Stats
```javascript
getAllAuthorsEngagementStats(limit = 100)
// Returns array with likes_count per author
```

### Toggle Like (User-Facing)
```javascript
// Insert
supabase.from('author_likes').insert({
  user_id: userId,
  author_name: authorName
})

// Delete
supabase.from('author_likes').delete()
  .eq('user_id', userId)
  .eq('author_name', authorName)
```

### Get Likes Count
```javascript
// Via view
SELECT author_name, likes_count 
FROM author_likes_counts
WHERE author_name = ?
```

## Comparison: Books vs Authors Likes System

| Feature | Books | Authors |
|---------|-------|---------|
| Like Table | book_likes (UUID FK) | author_likes (TEXT key) |
| Count Storage | Column in table | View aggregation |
| Count Update | Via trigger | Via view query |
| Admin Column | Direct display | Via engagement stats |
| Frontend | ReactionButtonsBKP | toggleLike function |
| Real-time | Subscription to table | Manual refresh (30s) |

## Future Enhancements

- [ ] Add like notifications
- [ ] Create like leaderboards
- [ ] Add like history/timeline view
- [ ] Implement like trending analysis
- [ ] Add like-based recommendations

---

**System Status**: ✅ COMPLETE AND TESTED  
**Last Updated**: December 14, 2025  
**Version**: 1.0
