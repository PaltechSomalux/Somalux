# ⭐ Complete Rating & Tracking System Guide

## 🎯 Overview

A comprehensive rating and analytics system that tracks user engagement, collects book ratings, and provides personalized recommendations.

---

## ✅ What You Get

### 1. **Book Ratings** ⭐
- Users can rate books 1-5 stars
- One rating per user per book
- Can update rating anytime
- Automatic average calculation
- Real-time rating updates

### 2. **Detailed View Tracking** 👁️
- Tracks WHO viewed WHICH book
- Records WHEN they viewed it
- Saves CATEGORY of book viewed
- Counts total and unique views

### 3. **Smart Recommendations** 🎯
- Based on viewing history
- Considers category preferences
- Weighted by ratings and popularity
- Personalized for each user

### 4. **Rating Modal** 💬
- Appears randomly (30% chance)
- Only if user hasn't rated
- Shows after 3 seconds of viewing
- Beautiful animated interface

### 5. **Prominent Stats Display** 📊
- Average rating with star icon
- Number of ratings
- Download count
- View count
- User's personal rating

---

## 🚀 Setup Instructions

### Step 1: Run SQL Migration

Open Supabase SQL Editor and run **`ratings-and-tracking.sql`**

This creates:
```sql
✅ book_ratings table
✅ book_views table (detailed tracking)
✅ average_rating column in books
✅ rating_count column in books
✅ Automatic rating calculation trigger
✅ track_book_view() function
✅ get_user_recommendations() function
✅ RLS policies for security
✅ Realtime enablement
```

### Step 2: Verify Tables Created

```sql
-- Should return all new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('book_ratings', 'book_views');

-- Should show new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'books' 
AND column_name IN ('average_rating', 'rating_count');
```

### Step 3: Test the System

1. Sign in with Google
2. Click on a book to view
3. Wait 3-5 seconds
4. Rating modal may appear (30% chance)
5. Rate the book
6. See ratings update immediately

---

## 📊 How It Works

### Rating System Flow

```
User views book for first time
  ↓
View tracked in book_views table
  ↓
30% chance: Rating modal appears after 3s
  ↓
User rates 1-5 stars
  ↓
Rating saved to book_ratings table
  ↓
🔥 TRIGGER FIRES 🔥
  ↓
Average rating recalculated
  ↓
books.average_rating updated
  ↓
books.rating_count updated
  ↓
Real-time sync to all users
  ↓
✅ Rating displayed everywhere
```

### View Tracking Flow

```
User clicks book (must be authenticated)
  ↓
track_book_view() function called
  ↓
Inserts record into book_views:
  - book_id
  - user_id
  - category_id
  - timestamp
  ↓
Increments books.views count
  ↓
✅ View tracked with full context
```

### Recommendation Flow

```
User has view history
  ↓
get_user_recommendations() called
  ↓
Algorithm considers:
  - Categories viewed (40% weight)
  - Average ratings (30% weight)
  - Popularity (30% weight)
  ↓
Excludes already-viewed books
  ↓
Returns top 5-10 recommendations
  ↓
✅ Personalized book suggestions
```

---

## 💾 Database Schema

### book_ratings

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| book_id | UUID | Book being rated |
| user_id | UUID | User who rated |
| rating | INTEGER | 1-5 stars |
| created_at | TIMESTAMP | First rating time |
| updated_at | TIMESTAMP | Last update time |

**Constraints:**
- UNIQUE(book_id, user_id) - One rating per user per book
- CHECK(rating >= 1 AND rating <= 5) - Valid range

### book_views

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| book_id | UUID | Book viewed |
| user_id | UUID | User who viewed |
| category_id | UUID | Book's category |
| viewed_at | TIMESTAMP | When viewed |

**No unique constraint** - Multiple views allowed!

### books (new columns)

| Column | Type | Description |
|--------|------|-------------|
| average_rating | DECIMAL(3,2) | Average of all ratings |
| rating_count | INTEGER | Total number of ratings |

---

## 🎨 UI Components

### RatingModal.jsx

**Features:**
- Beautiful animated modal
- 5 clickable stars
- Hover effects
- Real-time preview
- Loading state
- Error handling

**When it shows:**
- 30% random chance
- Only if user hasn't rated
- 3 seconds after opening book
- Can be dismissed

**Props:**
```javascript
<RatingModal
  isOpen={boolean}        // Show/hide modal
  onClose={function}      // Close callback
  book={object}           // Book being rated
  onRate={function}       // Submit rating (1-5)
/>
```

### Stats Display (in Book Modal)

**Shows:**
1. **Average Rating** (yellow badge)
   - Star icon
   - Rating value (e.g., 4.5)
   - Number of ratings

2. **Downloads** (green badge)
   - Download icon
   - Download count

3. **Views** (blue badge)
   - Eye icon
   - View count

4. **Your Rating** (highlighted badge, if rated)
   - "Your rating: ⭐ 4"

---

## 🔧 Functions Reference

### track_book_view(p_book_id, p_user_id)

Tracks a detailed book view.

```sql
-- Usage in Supabase
SELECT track_book_view('book-uuid', 'user-uuid');
```

```javascript
// Usage in JavaScript
await supabase.rpc('track_book_view', {
  p_book_id: book.id,
  p_user_id: user.id
});
```

**What it does:**
1. Gets book's category
2. Inserts view record
3. Increments book.views

### get_user_recommendations(p_user_id, p_limit)

Gets personalized recommendations.

```sql
-- Get top 10 recommendations
SELECT * FROM get_user_recommendations('user-uuid', 10);
```

```javascript
// Usage in JavaScript
const { data } = await supabase.rpc('get_user_recommendations', {
  p_user_id: user.id,
  p_limit: 5
});
```

**Returns:**
```javascript
[
  {
    book_id: 'uuid',
    recommendation_score: 8.5,
    reason: 'Based on your interest in Fiction'
  },
  ...
]
```

### update_book_rating()

Automatic trigger function.

**Triggers on:**
- INSERT into book_ratings
- UPDATE of book_ratings
- DELETE from book_ratings

**What it does:**
- Recalculates average rating
- Updates rating_count
- Updates books table

---

## 📈 Analytics Queries

### Most Rated Books

```sql
SELECT 
  b.title,
  b.average_rating,
  b.rating_count
FROM books b
WHERE b.rating_count > 0
ORDER BY b.rating_count DESC
LIMIT 10;
```

### Top Rated Books (Min 5 ratings)

```sql
SELECT 
  b.title,
  b.average_rating,
  b.rating_count
FROM books b
WHERE b.rating_count >= 5
ORDER BY b.average_rating DESC, b.rating_count DESC
LIMIT 10;
```

### User Viewing Patterns

```sql
SELECT 
  u.email,
  c.name as favorite_category,
  COUNT(*) as views_in_category
FROM book_views bv
JOIN auth.users u ON u.id = bv.user_id
JOIN categories c ON c.id = bv.category_id
WHERE bv.user_id = 'user-uuid'
GROUP BY u.email, c.name
ORDER BY views_in_category DESC;
```

### Books a User Hasn't Rated

```sql
SELECT b.title
FROM books b
WHERE b.id IN (
  SELECT DISTINCT book_id 
  FROM book_views 
  WHERE user_id = 'user-uuid'
)
AND b.id NOT IN (
  SELECT book_id 
  FROM book_ratings 
  WHERE user_id = 'user-uuid'
)
ORDER BY b.views DESC
LIMIT 10;
```

### Recommendation Algorithm Details

```sql
WITH user_categories AS (
  SELECT category_id, COUNT(*) as view_count
  FROM book_views
  WHERE user_id = 'user-uuid'
  GROUP BY category_id
)
SELECT 
  b.title,
  b.average_rating,
  uc.view_count as category_interest,
  (
    COALESCE(uc.view_count, 0) * 0.4 +
    COALESCE(b.average_rating, 0) * 0.3 +
    (COALESCE(b.views, 0) + COALESCE(b.downloads, 0) * 2) * 0.0003
  ) as recommendation_score
FROM books b
LEFT JOIN user_categories uc ON b.category_id = uc.category_id
WHERE b.id NOT IN (SELECT book_id FROM book_views WHERE user_id = 'user-uuid')
ORDER BY recommendation_score DESC
LIMIT 10;
```

---

## 🧪 Testing Checklist

### Test Ratings

- [ ] Sign in with Google
- [ ] View a book
- [ ] Rating modal appears (may need multiple tries due to 30% chance)
- [ ] Click star to rate
- [ ] Rating saves successfully
- [ ] Average rating updates in UI
- [ ] Rating count increments
- [ ] View book again - rating modal doesn't show
- [ ] "Your rating" badge displays

### Test View Tracking

- [ ] Sign in
- [ ] View multiple books
- [ ] Check database:
  ```sql
  SELECT * FROM book_views WHERE user_id = 'your-user-id';
  ```
- [ ] Each view recorded with category
- [ ] views count increments

### Test Recommendations

- [ ] View books in same category multiple times
- [ ] Check recommendations:
  ```sql
  SELECT * FROM get_user_recommendations('your-user-id', 10);
  ```
- [ ] Recommendations favor that category
- [ ] Books you've viewed are excluded

### Test Stats Display

- [ ] View a book
- [ ] See rating badge (yellow)
- [ ] See downloads badge (green)
- [ ] See views badge (blue)
- [ ] After rating, see "Your rating" badge

### Test Realtime

- [ ] Open book in two browser windows
- [ ] Rate in one window
- [ ] Rating updates in other window
- [ ] No page refresh needed

---

## 🎯 Rating Algorithm

### How Average Rating is Calculated

```sql
average_rating = AVG(rating) FROM book_ratings WHERE book_id = X
```

Simple average of all ratings for that book.

Example:
- User A: 5 stars
- User B: 4 stars
- User C: 3 stars
- **Average: 4.0**

### Recommendation Score Formula

```
recommendation_score = 
  (category_interest × 0.4) +     // 40% weight
  (average_rating × 0.3) +         // 30% weight
  (popularity × 0.0003)            // 30% weight

where:
  category_interest = number of views in that category
  average_rating = book's average rating (1-5)
  popularity = views + (downloads × 2)
```

**Why this formula?**
- **40% Category**: If you view Fiction a lot, see more Fiction
- **30% Rating**: Prioritize highly-rated books
- **30% Popularity**: Include trending/popular books

---

## 🔒 Security (RLS Policies)

### book_ratings

- ✅ Anyone can view ratings
- ✅ Authenticated users can insert their own rating
- ✅ Users can update their own rating
- ✅ Users can delete their own rating
- ❌ Can't modify other users' ratings

### book_views

- ✅ Users can view their own view history
- ✅ Authenticated users can track their views
- ❌ Can't see other users' view history
- ✅ Service role (admin) can view all

---

## 📱 User Experience Flow

### First Time Viewing a Book

```
1. User clicks book
2. ✅ Book modal opens
3. ✅ View tracked in database
4. ✅ View count increases
5. ⏱️ Wait 3 seconds
6. 🎲 30% chance: Rating modal appears
7. ⭐ User rates 1-5 stars
8. ✅ Rating saved
9. ✅ Average updated
10. ✅ "Your rating" badge shows
```

### Returning to View Book Again

```
1. User clicks same book again
2. ✅ Book modal opens
3. ✅ New view tracked (allowed!)
4. ✅ View count increases again
5. ✅ "Your rating" badge shows
6. ❌ Rating modal does NOT appear (already rated)
```

### Changing Your Rating

```
1. User views book they've rated
2. ✅ See "Your rating: ⭐ 4"
3. 🔧 TODO: Add "Change rating" button
   OR
4. Rating modal shows if triggered again
5. ⭐ User selects new rating
6. ✅ Rating updated (UPSERT)
7. ✅ Average recalculated
8. ✅ New rating displays
```

---

## 🎨 Styling Reference

### Rating Stars Colors

```css
Active/Filled: #fbbf24 (amber-400)
Inactive: #9ca3af (gray-400)
```

### Stats Badges Colors

```css
Rating: #fff3cd (yellow-100 bg), #fbbf24 (star)
Downloads: #d1fae5 (green-100 bg), #059669 (icon)
Views: #dbeafe (blue-100 bg), #2563eb (icon)
Your Rating: #fef3c7 (yellow-50 bg), #fbbf24 (border)
```

---

## 🐛 Troubleshooting

### Rating modal never appears

**Check:**
- User is signed in?
- User hasn't rated this book yet?
- It's random (30% chance) - try multiple times
- Check browser console for errors

### Ratings not updating

**Check:**
```sql
-- Does trigger exist?
SELECT * FROM pg_trigger WHERE tgname = 'on_rating_change';

-- Manual test:
INSERT INTO book_ratings (book_id, user_id, rating)
VALUES ('test-book-id', 'test-user-id', 5);

-- Check if average updated:
SELECT average_rating, rating_count FROM books WHERE id = 'test-book-id';
```

### Views not tracking

**Check:**
```sql
-- Does function exist?
SELECT proname FROM pg_proc WHERE proname = 'track_book_view';

-- Test manually:
SELECT track_book_view('book-id', 'user-id');

-- Check if view recorded:
SELECT * FROM book_views ORDER BY viewed_at DESC LIMIT 5;
```

### Recommendations not working

**Check:**
```sql
-- Does function exist?
SELECT proname FROM pg_proc WHERE proname = 'get_user_recommendations';

-- Test manually:
SELECT * FROM get_user_recommendations('user-id', 10);

-- Check if user has view history:
SELECT COUNT(*) FROM book_views WHERE user_id = 'user-id';
```

---

## ✅ Success Checklist

- [ ] Ran `ratings-and-tracking.sql` in Supabase
- [ ] Verified tables created (book_ratings, book_views)
- [ ] Verified columns added (average_rating, rating_count)
- [ ] Trigger `on_rating_change` exists
- [ ] Functions `track_book_view` and `get_user_recommendations` exist
- [ ] Rating modal appears randomly when viewing books
- [ ] Can submit ratings 1-5 stars
- [ ] Average rating calculates correctly
- [ ] Stats display in book modal (rating, downloads, views)
- [ ] View tracking works (check book_views table)
- [ ] Realtime updates work (rate in one window, see in another)
- [ ] No console errors

---

## 🎉 Summary

You now have a complete rating and analytics system with:

✅ **User Ratings**: 1-5 stars, one per user, updateable
✅ **View Tracking**: Detailed logs of who viewed what and when
✅ **Recommendations**: Personalized based on viewing history
✅ **Rating Modal**: Beautiful UI that appears randomly
✅ **Stats Display**: Ratings, downloads, views prominently shown
✅ **Realtime Sync**: Updates across all users instantly
✅ **Security**: RLS policies protect user data
✅ **Analytics**: Rich queries for insights

**🚀 Run `ratings-and-tracking.sql` and you're all set!**
