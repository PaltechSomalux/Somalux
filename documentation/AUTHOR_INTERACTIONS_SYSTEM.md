# Author Interactions & Engagement System

## Overview

A comprehensive author engagement system has been implemented to track and display user interactions with authors. This system enables:

- **Followers**: Users can follow/unfollow authors
- **Likes**: Users can like/unlike authors  
- **Loves**: Users can love/unlove authors (heart reactions)
- **Comments**: Users can comment on author profiles
- **Ratings**: Users can rate authors 1-5 stars with optional reviews
- **Shares**: Track when authors are shared across the platform
- **Analytics**: Comprehensive engagement scoring and statistics

## Database Schema

### Tables Created

#### 1. `author_followers`
Tracks which users follow which authors.
```sql
- id (UUID) PRIMARY KEY
- follower_id (UUID) FK → profiles
- author_id (TEXT)
- followed_at (TIMESTAMP)
- UNIQUE(follower_id, author_id)
```

#### 2. `author_likes`
Tracks which users like which authors.
```sql
- id (UUID) PRIMARY KEY
- user_id (UUID) FK → profiles
- author_id (TEXT)
- liked_at (TIMESTAMP)
- UNIQUE(user_id, author_id)
```

#### 3. `author_loves`
Tracks which users love which authors.
```sql
- id (UUID) PRIMARY KEY
- user_id (UUID) FK → profiles
- author_id (TEXT)
- loved_at (TIMESTAMP)
- UNIQUE(user_id, author_id)
```

#### 4. `author_comments`
Allows users to comment on author profiles.
```sql
- id (UUID) PRIMARY KEY
- user_id (UUID) FK → profiles
- author_id (TEXT)
- content (TEXT)
- parent_comment_id (UUID) - For nested comments
- likes_count (INT)
- is_verified (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### 5. `author_ratings`
Tracks user ratings for authors (1-5 stars).
```sql
- id (UUID) PRIMARY KEY
- user_id (UUID) FK → profiles
- author_id (TEXT)
- rating (INT 1-5)
- review (TEXT)
- helpful_count (INT)
- created_at, updated_at (TIMESTAMP)
- UNIQUE(user_id, author_id)
```

#### 6. `author_shares`
Tracks when authors are shared.
```sql
- id (UUID) PRIMARY KEY
- user_id (UUID) FK → profiles (nullable)
- author_id (TEXT)
- share_type (TEXT)
- platform (TEXT)
- shared_at (TIMESTAMP)
```

### Views & Analytics

#### `author_interactions_stats` (View)
Real-time aggregation of all author interactions.

```sql
SELECT
  author_id,
  books_count,
  total_downloads,
  total_views,
  average_rating,
  followers_count,
  likes_count,
  loves_count,
  comments_count,
  ratings_count,
  shares_count
FROM author_interactions_stats
WHERE author_id = 'author-name'
```

#### `author_engagement_stats` (Materialized View)
Pre-calculated engagement scores with performance optimization.

```sql
SELECT
  author_id,
  engagement_score,
  followers_count,
  likes_count,
  loves_count,
  comments_count,
  ratings_count
FROM author_engagement_stats
ORDER BY engagement_score DESC
```

**Engagement Score Formula:**
```
Score = (followers × 10) + 
        (likes × 5) + 
        (loves × 15) + 
        (downloads × 0.5) + 
        (avg_rating × 100) + 
        (comments × 3) + 
        (shares × 7)
```

## API Functions

### File: `src/SomaLux/Books/Admin/authorInteractionsApi.js`

#### Followers API

```javascript
// Toggle follow status
toggleAuthorFollow(authorId, userId) → { success: true, isFollowing: boolean }

// Get author's followers
getAuthorFollowers(authorId) → Array<follower>

// Get follower count
getFollowersCount(authorId) → number
```

#### Likes API

```javascript
// Toggle like status
toggleAuthorLike(authorId, userId) → { success: true, isLiked: boolean }

// Get author's likes
getAuthorLikes(authorId) → Array<like>

// Get like count
getLikesCount(authorId) → number
```

#### Loves API

```javascript
// Toggle love status
toggleAuthorLove(authorId, userId) → { success: true, isLoved: boolean }

// Get author's loves
getAuthorLoves(authorId) → Array<love>

// Get love count
getLovesCount(authorId) → number
```

#### Comments API

```javascript
// Add comment
addAuthorComment(authorId, userId, content, parentCommentId?) → comment

// Get comments
getAuthorComments(authorId, limit) → Array<comment>

// Delete comment
deleteAuthorComment(commentId, userId) → { success: true }

// Get comment count
getCommentsCount(authorId) → number
```

#### Ratings API

```javascript
// Rate author (insert/update)
rateAuthor(authorId, userId, rating, review?) → rating

// Get author ratings
getAuthorRatings(authorId, limit) → Array<rating>

// Get average rating
getAverageRating(authorId) → decimal

// Delete rating
deleteAuthorRating(authorId, userId) → { success: true }

// Get rating count
getRatingsCount(authorId) → number
```

#### Shares API

```javascript
// Record share
recordAuthorShare(authorId, userId, shareType, platform?) → share

// Get share count
getSharesCount(authorId) → number
```

#### User Status API

```javascript
// Get user's interaction status with an author
getUserAuthorInteractionStatus(authorId, userId) → {
  isFollower: boolean,
  hasLiked: boolean,
  hasLoved: boolean,
  userRating: number|null
}
```

#### Statistics API

```javascript
// Get engagement stats for single author
getAuthorEngagementStats(authorId) → {
  author_id: string,
  books_count: number,
  total_downloads: number,
  average_rating: decimal,
  followers_count: number,
  likes_count: number,
  loves_count: number,
  comments_count: number,
  ratings_count: number,
  shares_count: number,
  engagement_score: number,
  refreshed_at: timestamp
}

// Get all authors' engagement stats
getAllAuthorsEngagementStats(limit) → Array<stats>

// Get top authors
getTopAuthors(limit) → Array<stats>

// Enrich author with interactions
enrichAuthorWithInteractions(author, userId?) → author + stats + interactions

// Enrich multiple authors
enrichAuthorsWithInteractions(authors[], userId?) → Array<author + stats + interactions>
```

## Components

### 1. Admin Authors Page
**File**: `src/SomaLux/Books/Admin/pages/Authors.jsx`

Comprehensive admin dashboard showing:
- 8 stat cards (Authors, Books, Downloads, Rating, Followers, Likes, Loves, Comments)
- Sortable table with 10 columns
- Sort by: Engagement Score, Followers, Likes, Books, Downloads, Rating, Name
- Real-time engagement score calculation
- Search/filter functionality
- Responsive design

**Features**:
- Displays engagement score for each author
- Shows individual interaction counts (followers, likes, loves, comments)
- Color-coded metric badges
- Medal-style ranking badges (🥇🥈🥉)
- 30-second auto-refresh

### 2. Public Author Profile
**File**: `src/SomaLux/Books/AuthorProfile.jsx`

User-facing component showing:
- Author header with key metrics
- Interactive action buttons (Follow, Like, Love, Share)
- Tabbed interface:
  - **Overview**: Statistics and rating form
  - **Books**: Author's published books
  - **Ratings**: User reviews and ratings
  - **Comments**: User comments
- Real-time interaction status
- Submit rating with review
- Submit comments

**Features**:
- Authentication-aware (prompts login)
- Real-time interaction updates
- Review/comment management
- Share functionality
- Responsive design

## Implementation Guide

### Step 1: Run Database Migration

Execute the SQL migration to create all tables and views:

```bash
# In Supabase SQL Editor
# Copy and paste: backend/migrations/006_author_interactions.sql
```

Or via psql:
```bash
psql -h your-db-host -U postgres -d your-db -f backend/migrations/006_author_interactions.sql
```

### Step 2: Verify Installation

Check that all tables were created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'author_%';
```

Expected tables:
- author_followers
- author_likes
- author_loves
- author_comments
- author_ratings
- author_shares

### Step 3: Check RLS Policies

Verify Row Level Security policies are enabled:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'author_%';
```

### Step 4: Import Components

In your React app, import the components:

```javascript
// Admin dashboard
import Authors from './SomaLux/Books/Admin/pages/Authors';

// Public profile
import AuthorProfile from './SomaLux/Books/AuthorProfile';
```

### Step 5: Add Routes

```javascript
// In your router configuration
<Route path="/admin/authors" element={<Authors />} />
<Route path="/authors/:authorName" element={<AuthorProfile />} />
```

## Usage Examples

### Example 1: Toggle Author Follow

```javascript
import { toggleAuthorFollow } from './authorInteractionsApi';

const handleFollow = async () => {
  const result = await toggleAuthorFollow('J.K. Rowling', userId);
  console.log('Following:', result.isFollowing);
};
```

### Example 2: Rate an Author

```javascript
import { rateAuthor } from './authorInteractionsApi';

const handleRate = async () => {
  const rating = await rateAuthor(
    'J.K. Rowling',
    userId,
    5,
    'Amazing author! Love all the books.'
  );
};
```

### Example 3: Get Author Engagement Stats

```javascript
import { getAuthorEngagementStats, getUserAuthorInteractionStatus } from './authorInteractionsApi';

const loadAuthorData = async () => {
  // Engagement metrics
  const stats = await getAuthorEngagementStats('J.K. Rowling');
  console.log('Followers:', stats.followers_count);
  console.log('Engagement Score:', stats.engagement_score);
  
  // User's interaction status
  const interactions = await getUserAuthorInteractionStatus('J.K. Rowling', userId);
  console.log('Is following:', interactions.isFollower);
  console.log('User rating:', interactions.userRating);
};
```

### Example 4: Submit Comment

```javascript
import { addAuthorComment, getAuthorComments } from './authorInteractionsApi';

const handleComment = async () => {
  const comment = await addAuthorComment(
    'J.K. Rowling',
    userId,
    'This author changed my life!'
  );
  
  // Fetch updated comments
  const comments = await getAuthorComments('J.K. Rowling', 50);
  console.log('Total comments:', comments.length);
};
```

## Security

### Row Level Security (RLS)

All interaction tables have RLS enabled with policies:

- **SELECT**: Everyone can view all records
- **INSERT**: Users can only insert their own interactions
- **UPDATE**: Users can only update their own content
- **DELETE**: Users can only delete their own content

### API Verification

All API functions verify user authentication before allowing modifications:

```javascript
if (!userId) {
  throw new Error('User ID required');
}
```

## Performance Optimization

### Materialized View Caching

The `author_engagement_stats` materialized view is automatically refreshed whenever interactions change:

- Refresh triggered by INSERT/DELETE on all interaction tables
- Concurrent refresh prevents blocking
- Indexed on `engagement_score` for fast sorting

### Database Indexes

Strategic indexes created for performance:

```sql
idx_author_followers_author_id
idx_author_likes_author_id
idx_author_loves_author_id
idx_author_comments_author_id
idx_author_ratings_author_id
idx_author_shares_author_id
idx_author_engagement_stats_score
```

## Real-Time Updates

The system automatically refreshes engagement stats through:

1. **Database Triggers**: Auto-refresh materialized view on changes
2. **Component Polling**: 30-second auto-refresh in admin dashboard
3. **React Hooks**: Immediate UI updates after interactions

## Troubleshooting

### Issue: "No such function" error

**Solution**: Ensure migration 006_author_interactions.sql was fully executed in Supabase SQL Editor.

### Issue: RLS policy violation

**Solution**: Check that user is authenticated and using correct auth.uid(). Verify RLS policies were created.

### Issue: Engagement score not updating

**Solution**: Manually refresh materialized view:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY author_engagement_stats;
```

### Issue: Comments not showing

**Solution**: Verify comments were created with `parent_comment_id IS NULL` for top-level comments. Check RLS policies.

## Future Enhancements

Potential features to add:

1. **Follower Notifications**: Notify authors when they gain followers
2. **Author Replies**: Allow authors to reply to comments
3. **Helpful Votes**: Vote on comments as helpful/unhelpful
4. **Author Verification Badges**: Mark verified authors
5. **Trending Authors**: Algorithm-based trending section
6. **Author-to-Author Follows**: Authors following other authors
7. **Book-Specific Ratings**: Ratings for individual books vs author
8. **Comment Threading**: Full nested comment system
9. **Author Activity Feed**: Timeline of author interactions
10. **Engagement Notifications**: Alert authors of interactions

## Support

For issues or questions:
1. Check database connection
2. Verify migration was executed completely
3. Check browser console for errors
4. Verify RLS policies in Supabase dashboard
5. Test API functions directly in console
