# Author Interactions System - Quick Setup Guide

## 5-Minute Setup

### Step 1: Run Database Migration (1 min)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy entire contents of: `backend/migrations/006_author_interactions.sql`
5. Paste into SQL editor
6. Click **Run** button
7. Wait for confirmation message

✅ All 6 tables, 1 view, and 1 materialized view created

### Step 2: Verify Installation (1 min)

Run this query in SQL Editor to verify:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'author_%'
ORDER BY table_name;
```

Expected result (6 rows):
```
author_comments
author_followers
author_likes
author_loves
author_ratings
author_shares
```

### Step 3: Add Components (2 min)

Files are already created in your project:

✅ API: `src/SomaLux/Books/Admin/authorInteractionsApi.js`
✅ Admin Page: `src/SomaLux/Books/Admin/pages/Authors.jsx`
✅ Public Component: `src/SomaLux/Books/AuthorProfile.jsx`

### Step 4: Add Routes (1 min)

Update your router (likely in `App.jsx` or routing config):

```javascript
import Authors from './SomaLux/Books/Admin/pages/Authors';
import AuthorProfile from './SomaLux/Books/AuthorProfile';

// Add to your routes:
<Route path="/admin/authors" element={<Authors />} />
<Route path="/authors/:authorName" element={<AuthorProfile />} />
```

### Step 5: Test It!

**For Admins:**
- Navigate to `/admin/authors`
- Should see authors table with engagement metrics
- Try sorting by "Engagement Score"

**For Users:**
- Navigate to `/authors/[Author Name]` (e.g., `/authors/Todd Abel`)
- Click Follow, Like, Love buttons
- Submit a rating or comment
- Should see real-time updates

---

## What You Get

### Database (6 Tables)
- `author_followers` - Track followers
- `author_likes` - Track likes
- `author_loves` - Track loves  
- `author_comments` - User comments
- `author_ratings` - 1-5 star ratings
- `author_shares` - Share tracking

### Analytics Views
- `author_interactions_stats` - Real-time aggregation
- `author_engagement_stats` - Materialized view with scores

### Helper Functions
- `toggle_author_follow()` - Toggle follow status
- `toggle_author_like()` - Toggle like status
- `toggle_author_love()` - Toggle love status
- `get_author_interaction_status()` - Check user's interactions

### API Functions (24 methods)
- Followers: follow/unfollow, get list, get count
- Likes: like/unlike, get list, get count
- Loves: love/unlove, get list, get count
- Comments: add, get, delete, count
- Ratings: rate, get list, get average, delete, count
- Shares: record, count
- Stats: single author, all authors, top authors
- Helpers: enrich single/multiple authors with data

### Components
1. **Authors Admin Page** - Dashboard with:
   - 8 stat cards (Authors, Books, Downloads, Rating, Followers, Likes, Loves, Comments)
   - Sortable table (10 columns)
   - Search/filter
   - Real-time engagement scores

2. **Author Profile** - Public page with:
   - Author header & key metrics
   - Follow/Like/Love/Share buttons
   - 4 tabs: Overview, Books, Ratings, Comments
   - Rating form with reviews
   - Comment system
   - Interactive features

---

## Key Features

### Engagement Score Algorithm
```
Score = (followers × 10) + 
        (likes × 5) + 
        (loves × 15) + 
        (downloads × 0.5) + 
        (avg_rating × 100) + 
        (comments × 3) + 
        (shares × 7)
```

### Real-Time Updates
- Database triggers auto-refresh stats
- Component polling every 30 seconds
- Immediate UI updates on interactions

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only modify their own data
- Authentication required for interactions
- "Unknown" authors supported

### Responsive Design
- Works on desktop, tablet, mobile
- Adaptive layout
- Touch-friendly buttons
- Mobile-optimized tables

---

## Common Tasks

### Display Top Authors
```javascript
import { getTopAuthors } from './authorInteractionsApi';

const topAuthors = await getTopAuthors(10);
topAuthors.forEach(author => {
  console.log(`${author.author_id}: ${author.engagement_score} points`);
});
```

### Check If User Follows Author
```javascript
import { getUserAuthorInteractionStatus } from './authorInteractionsApi';

const status = await getUserAuthorInteractionStatus('J.K. Rowling', userId);
if (status.isFollower) {
  console.log('User follows this author');
}
```

### Add Author Rating with Review
```javascript
import { rateAuthor } from './authorInteractionsApi';

await rateAuthor(
  'J.K. Rowling',
  userId,
  5,
  'Absolutely fantastic books!'
);
```

### Get All Metrics for Author
```javascript
import { getAuthorEngagementStats } from './authorInteractionsApi';

const stats = await getAuthorEngagementStats('J.K. Rowling');
console.log(stats);
// {
//   books_count: 8,
//   total_downloads: 4521,
//   followers_count: 342,
//   likes_count: 156,
//   loves_count: 89,
//   comments_count: 234,
//   ratings_count: 167,
//   average_rating: 4.8,
//   engagement_score: 78542
// }
```

---

## Troubleshooting

**Problem**: Tables not created
- **Solution**: Run migration again, check for SQL errors in Supabase console

**Problem**: "Cannot find module" error
- **Solution**: Verify file paths match your project structure

**Problem**: RLS permission denied
- **Solution**: Check user is authenticated, verify RLS policies exist

**Problem**: Stats not updating
- **Solution**: Manually refresh view: `REFRESH MATERIALIZED VIEW CONCURRENTLY author_engagement_stats;`

---

## Files Reference

```
backend/migrations/
└── 006_author_interactions.sql          ← Database setup

src/SomaLux/Books/
├── Admin/
│   ├── authorInteractionsApi.js         ← API functions (24 methods)
│   ├── pages/
│   │   └── Authors.jsx                  ← Admin dashboard
│   └── pages/Authors.css                ← Dashboard styles (updated)
├── AuthorProfile.jsx                    ← Public profile component
├── AuthorProfile.css                    ← Profile styles
└── supabaseClient.js                    ← (existing)

documentation/
└── AUTHOR_INTERACTIONS_SYSTEM.md         ← Full documentation
```

---

## Performance Tips

1. **Limit query results**: Use `limit` parameter in API calls
2. **Cache stats**: Store engagement stats in React state with 30s TTL
3. **Index queries**: Leverage created database indexes
4. **Batch operations**: Load multiple authors' stats together
5. **Pagination**: Implement pagination for large result sets

---

## Next Steps

1. ✅ Run migration
2. ✅ Test database tables exist
3. ✅ Add routes to your app
4. ✅ Navigate to `/admin/authors` to see dashboard
5. ✅ Try `/authors/[Author Name]` for profile
6. ✅ Test interactions (follow, like, rate, comment)

**That's it! Your author interaction system is live!** 🎉

---

## Questions?

Refer to: `AUTHOR_INTERACTIONS_SYSTEM.md` for comprehensive documentation
