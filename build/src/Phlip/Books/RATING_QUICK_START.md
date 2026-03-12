# ⚡ Rating System - Quick Start

## 🚀 1-Minute Setup

### Run This SQL

Open [Supabase SQL Editor](https://app.supabase.com) and run:

**`ratings-and-tracking.sql`** (entire file)

Done! ✅

---

## 🎯 What You Just Got

### ⭐ Star Ratings (1-5)
- Users rate books after viewing
- Rating modal appears randomly (30% chance)
- One rating per user per book
- Automatic average calculation

### 👁️ Detailed View Tracking
- WHO viewed WHICH book
- WHEN they viewed it
- WHICH category
- Multiple views allowed

### 📊 Prominent Stats Display
- ⭐ Average rating (e.g., 4.5 with 23 ratings)
- 📥 Download count
- 👁️ View count
- ⭐ Your personal rating

### 🎯 Smart Recommendations
- Based on your viewing history
- Considers categories you like
- Weighted by ratings & popularity
- Personalized for each user

---

## 🧪 Quick Test

### Test Rating System:

1. Sign in with Google
2. Click any book to view
3. Wait 3-5 seconds
4. **Rating modal may appear** (30% random chance)
5. Click stars to rate (1-5)
6. Rating saves instantly
7. See average rating update
8. View book again - modal won't show (already rated)

### Test Stats Display:

1. Open any book
2. ✅ See yellow badge: **⭐ 4.2 (15 ratings)**
3. ✅ See green badge: **📥 42 downloads**
4. ✅ See blue badge: **👁️ 128 views**
5. ✅ See your rating (if you rated): **Your rating: ⭐ 4**

### Test View Tracking:

```sql
-- Check your views
SELECT 
  b.title,
  c.name as category,
  bv.viewed_at
FROM book_views bv
JOIN books b ON b.id = bv.book_id
LEFT JOIN categories c ON c.id = bv.category_id
WHERE bv.user_id = 'your-user-id'
ORDER BY bv.viewed_at DESC;
```

### Test Recommendations:

```sql
-- Get your recommendations
SELECT * FROM get_user_recommendations('your-user-id', 10);
```

---

## 📊 How Rating Modal Works

### When It Shows:
- ✅ User is authenticated
- ✅ User hasn't rated this book
- ✅ 30% random chance
- ✅ After 3 seconds of viewing

### What Happens:
```
User opens book
  ↓
Wait 3 seconds
  ↓
30% chance → Modal appears
  ↓
User clicks star (1-5)
  ↓
Rating saved to database
  ↓
Average recalculated automatically
  ↓
UI updates everywhere (realtime)
```

---

## 🎨 Visual Examples

### Rating Badge (Yellow)
```
⭐ 4.3 (47 ratings)
```

### Downloads Badge (Green)
```
📥 123 downloads
```

### Views Badge (Blue)
```
👁️ 1,234 views
```

### Your Rating Badge (Highlighted Yellow)
```
Your rating: ⭐ 5
```

---

## 💾 What Got Created

### Database Tables:

1. **`book_ratings`**
   - Stores all user ratings
   - UNIQUE per user per book
   - Triggers average calculation

2. **`book_views`**
   - Detailed view logs
   - Tracks user, book, category, time
   - Allows multiple views

### Database Columns (books table):

3. **`average_rating`** (DECIMAL)
   - Calculated average of all ratings

4. **`rating_count`** (INTEGER)
   - Total number of ratings

### Functions:

5. **`track_book_view(book_id, user_id)`**
   - Tracks detailed view with category

6. **`get_user_recommendations(user_id, limit)`**
   - Returns personalized book suggestions

7. **`update_book_rating()`**
   - Trigger that auto-calculates averages

---

## 🔍 Key Features

### ✅ Authentication Required
- Must sign in to view books
- Views tracked per user
- Ratings tied to user account

### ✅ One Rating Per User
- Can rate once per book
- Can update rating later
- Old rating replaced, average recalculated

### ✅ Real-time Updates
- Rate in one window
- See update in another
- No refresh needed

### ✅ Smart Algorithm
- **40%** based on categories you view
- **30%** based on average ratings
- **30%** based on popularity

---

## 📈 Recommendation Algorithm

```javascript
Score = 
  (views_in_this_category × 0.4) +
  (book_average_rating × 0.3) +
  ((views + downloads×2) × 0.0003)
```

**Example:**
You viewed 20 Fiction books
Book has 4.5 rating, 100 views, 50 downloads

```
Score = (20 × 0.4) + (4.5 × 0.3) + ((100 + 50×2) × 0.0003)
      = 8.0 + 1.35 + 0.06
      = 9.41
```

Higher score = Better recommendation!

---

## 🎯 User Flow Example

### First Visit:
```
1. Sign in with Google ✅
2. Browse books 📚
3. Click "The Great Gatsby" 👆
4. Book modal opens 📖
5. View tracked (user + book + category + time) ✅
6. Wait 3 seconds ⏱️
7. 🎲 Random: Rating modal appears! ⭐
8. Click 5 stars ⭐⭐⭐⭐⭐
9. Rating saved ✅
10. See: "Your rating: ⭐ 5" ✅
```

### Return Visit:
```
1. Click "The Great Gatsby" again 👆
2. Book modal opens 📖
3. New view tracked (yes, again!) ✅
4. See: "Your rating: ⭐ 5" ✅
5. Rating modal doesn't appear ❌ (already rated)
```

### Browse Pattern:
```
You view:
- The Hobbit (Fantasy) ✅
- Harry Potter (Fantasy) ✅
- Lord of the Rings (Fantasy) ✅
- 1984 (Fiction) ✅

Next time:
Recommendations prioritize Fantasy books! 🎯
```

---

## 🔒 Privacy & Security

### What's Tracked:
- ✅ Book views (anonymous analytics)
- ✅ Your ratings (only you see "Your rating")
- ✅ View history (for your recommendations)

### What's NOT Shared:
- ❌ Other users can't see your view history
- ❌ Other users can't see your individual ratings
- ❌ Only aggregate data (average) is public

### RLS Policies:
- ✅ Anyone can see average ratings
- ✅ Only you can see your personal ratings
- ✅ Only you can see your view history
- ✅ Only you can update your ratings

---

## 💡 Pro Tips

### Get Better Recommendations:
- View more books (builds preference profile)
- Rate books you've read (improves quality)
- Explore different categories (diversity)

### For Admins:
- Check `book_views` table for analytics
- See which categories are popular
- Identify trending books
- Track user engagement

### For Users:
- Rating helps others discover books
- Your views improve recommendations
- Update ratings if opinion changes

---

## 🐛 Quick Fixes

### Modal never appears?
- It's random (30% chance) - try multiple books
- Must be signed in
- Only shows if you haven't rated

### Rating not saving?
```sql
-- Check table exists
SELECT * FROM book_ratings LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'book_ratings';
```

### Views not tracking?
```sql
-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'track_book_view';

-- Test manually
SELECT track_book_view('book-id', 'user-id');
```

---

## ✅ Success Checklist

After running the SQL:

- [ ] Can view books (authenticated)
- [ ] Rating modal appears (may need multiple tries)
- [ ] Can submit ratings
- [ ] See average rating in modal
- [ ] See downloads count
- [ ] See views count
- [ ] "Your rating" shows after rating
- [ ] No console errors
- [ ] Real-time updates work

---

## 📚 Full Documentation

For detailed info:
- **`RATING_SYSTEM_GUIDE.md`** - Complete technical guide
- **`ratings-and-tracking.sql`** - SQL migration file

---

**🎉 You're all set! Run the SQL and enjoy the rating system!**
