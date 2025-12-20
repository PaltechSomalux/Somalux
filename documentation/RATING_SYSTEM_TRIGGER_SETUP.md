# Rating System - Database Trigger Setup Guide

## Problem
Ratings are not being displayed on book grid cards because the average rating is not being calculated and stored in the `books` table.

## Solution
A database trigger needs to be created that automatically calculates the average rating whenever a user submits a rating.

## Steps to Fix

### 1. Run the Migration SQL

Execute the SQL from this file in your Supabase SQL Editor:
📍 **File**: `c:\Magic\SomaLux\backend\migrations\020_create_book_rating_trigger.sql`

This will:
- Create the `update_book_rating_stats()` function
- Create the `update_book_rating_on_delete()` function
- Create triggers on the `book_ratings` table for INSERT, UPDATE, and DELETE operations
- Recalculate all existing book ratings

### 2. How It Works

**When a user rates a book:**
1. Rating is inserted/updated in `book_ratings` table
2. Trigger fires automatically
3. Calculates average: `AVG(rating)` from all ratings for that book
4. Counts ratings: `COUNT(*)` of all ratings for that book
5. Updates `books` table: sets `rating` and `rating_count` fields
6. App fetches fresh data and displays the updated rating

### 3. Verify It's Working

After running the migration:

1. Go to a book detail page
2. Click "Rate This Book"
3. Select a rating (e.g., 5 stars)
4. Submit the rating
5. Check the book grid card - rating should now display

**Expected display:**
- ⭐ 4.5 (5) - showing average rating and count
- ⭐ N/A - for unrated books

### 4. UI Changes Made

The book grid card display was updated to show:
```jsx
{book.rating > 0 ? book.rating.toFixed(1) : 'N/A'}
{book.ratingCount > 0 && <span className="rating-countBKP">({book.ratingCount})</span>}
```

This displays:
- **Rated books**: ⭐ 4.5 (5) 
- **Unrated books**: ⭐ N/A

### 5. CSS Styling

Added new CSS class for rating count:
```css
.rating-countBKP {
  font-size: 0.75rem;
  color: var(--text-light);
  margin-left: 0.3rem;
}
```

## Troubleshooting

**If ratings still show N/A after submitting:**
1. Check that the migration was executed successfully in Supabase
2. Verify triggers exist: Run in Supabase SQL Editor:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%rating%';
   ```
3. Check that `book_ratings` table has data:
   ```sql
   SELECT * FROM book_ratings LIMIT 10;
   ```
4. Manually recalculate ratings:
   ```sql
   UPDATE books b
   SET rating = COALESCE((SELECT AVG(rating::numeric) FROM book_ratings WHERE book_id = b.id), 0),
       rating_count = (SELECT COUNT(*) FROM book_ratings WHERE book_id = b.id),
       updated_at = NOW();
   ```

## Files Modified

1. **BookPanel.jsx** - Updated display to show rating count
2. **BookPanel.css** - Added `.rating-countBKP` styling
3. **migrations/020_create_book_rating_trigger.sql** - NEW trigger setup

## Rating Calculation Formula

```
Average Rating = SUM(all individual ratings) / COUNT(ratings)
```

Example:
- User 1 rates: 5 stars
- User 2 rates: 4 stars
- User 3 rates: 5 stars
- **Average**: (5 + 4 + 5) / 3 = **4.67**
- **Count**: **3**
- **Display**: ⭐ 4.67 (3)
