# 🚀 Complete Database Setup Guide - NEW SUPABASE ACCOUNT

## Overview
This guide will help you set up your complete database on the new Supabase account (`https://brlsqmyyewxtmjkrfvlo.supabase.co`)

**What will be created:**
- ✅ 31 tables (users, books, reading, ads, analytics, payments, etc.)
- ✅ 50+ performance indexes
- ✅ Row-level security (RLS) policies
- ✅ 7 sample categories
- ✅ 8 sample universities
- ✅ All relationships and constraints

**Time required:** 5 minutes

---

## Step 1: Access Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Select your project: `brlsqmyyewxtmjkrfvlo`
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

---

## Step 2: Copy the Complete Migration SQL

1. Open this file: `backend/migrations/001_COMPLETE_DATABASE_SETUP.sql`
2. **Select All** (Ctrl+A)
3. **Copy** (Ctrl+C)

---

## Step 3: Paste into Supabase

1. Click in the SQL editor text area
2. **Paste** (Ctrl+V)
3. You should see the entire SQL script (~800 lines)

---

## Step 4: Execute the Migration

1. Click the blue **Run** button (bottom right)
2. **Wait for completion** (~10-30 seconds)
3. You should see: **✅ Query executed successfully**

---

## Step 5: Verify Database Creation

### Check Tables Exist
Copy this query and run it in Supabase SQL Editor:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected result:** ~31 tables including:
- profiles
- books
- categories
- past_papers
- universities
- ads
- ad_analytics
- reading_sessions
- author_followers
- etc.

### Check Initial Data
```sql
-- Check categories were inserted
SELECT COUNT(*) as category_count FROM categories;
-- Expected: 7

-- Check universities were inserted
SELECT COUNT(*) as university_count FROM universities;
-- Expected: 8
```

---

## Step 6: Restart Backend & Frontend

### Stop all services:
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3
```

### Start backend:
```powershell
cd c:\Magic\SomaLux\backend
node index.js
```

### Start frontend (in new terminal):
```powershell
cd c:\Magic\SomaLux
npm start
```

---

## Step 7: Test the Connection

1. Open `http://localhost:5001` in browser
2. Navigate to Admin Panel
3. Try:
   - ✅ Upload a book
   - ✅ View dashboard
   - ✅ Check categories
   - ✅ View universities

---

## Troubleshooting

### ❌ "Error: Syntax error"
- Make sure you copied the ENTIRE file
- Check for incomplete paste
- Try copying again

### ❌ "Error: Duplicate key"
- Normal on second run - the migration is safe to re-run
- Or delete the old project and create new one

### ❌ "Relations not found"
- Wait 10 seconds after running SQL
- Refresh the page
- Restart backend

### ❌ "Still getting errors when I login"
- Check backend logs for actual error message
- Verify all 31 tables exist using the check query above
- Make sure env variables are correct

---

## What Each Table Does

### Authentication & Users
- **profiles** - User accounts, roles, tiers
- **user_universities** - University enrollment

### Content
- **categories** - Book categories
- **books** - Book library
- **book_ratings** - User ratings
- **book_views** - View tracking
- **past_papers** - Exam papers

### Universities
- **universities** - University directory
- **user_universities** - User enrollments

### Reading Analytics
- **reading_sessions** - Session tracking
- **user_reading_stats** - Aggregated stats
- **reading_goals** - User goals
- **reading_streaks** - Streak tracking
- **user_achievements** - Badges

### Authors
- **author_followers** - Follow tracking
- **author_likes** - Likes
- **author_loves** - Loves
- **author_comments** - Comments
- **author_ratings** - Ratings
- **author_shares** - Shares

### Ads
- **ads** - Ad definitions
- **ad_analytics** - Event logs
- **ad_engagement_metrics** - Daily summaries
- **ad_performance_summary** - Overall stats
- **ad_dismissals** - Dismissal tracking

### Other
- **search_events** - Search tracking
- **search_analytics** - Search analytics
- **subscriptions** - User subscriptions
- **payments** - Payment records
- **notifications** - User notifications
- **messages** - Direct messages
- **group_messages** - Group chat
- **file_uploads** - File management
- **file_downloads** - Download tracking
- **audit_logs** - System logs
- **admin_settings** - Configuration

---

## Security Features Included

✅ **Row Level Security (RLS)**
- Users can only see their own data
- Admins have elevated access
- Policies prevent unauthorized access

✅ **Indexes**
- 50+ indexes for fast queries
- Optimized for common searches
- Auto-increment queries

✅ **Data Integrity**
- Foreign key relationships
- Check constraints
- Unique constraints
- CASCADE delete rules

---

## Next Steps

After database is set up:

1. **Test admin features** (dashboard, uploads, etc.)
2. **Create sample data** (books, papers)
3. **Test user features** (reading, analytics)
4. **Configure payment system** (if needed)
5. **Set up storage buckets** (for files)

---

## Support

If you encounter issues:

1. **Check error message** in backend logs
2. **Verify all tables exist** using the check query
3. **Check environment variables** are correct
4. **Try re-running the migration**
5. **Create new Supabase project** if needed

---

## Success Indicators

✅ You'll see these when database is working:

- Backend starts without "table not found" errors
- Admin dashboard loads
- Can upload books
- Can view analytics
- Can manage users
- Ads system works
- Reading tracking works

---

**Status:** Ready to run! 🚀

Execute the migration and your database will be fully operational!
