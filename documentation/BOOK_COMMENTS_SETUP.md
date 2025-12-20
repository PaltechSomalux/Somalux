# Book Comments System - Database Setup

## Error You're Seeing
```
Failed to submit comment: Could not find the table 'public.book_comments' in the schema cache
```

## Solution
You need to create the database tables for the book comments system. Follow these steps:

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com/
2. Log in with your credentials
3. Select your **SomaLux** project

### Step 2: Open SQL Editor
1. Click on **SQL Editor** in the left sidebar
2. Click **New query** button

### Step 3: Copy and Paste the Migration SQL
Copy the entire SQL from [024_create_book_comments_system.sql](./migrations/024_create_book_comments_system.sql) into the SQL editor.

The SQL will create these tables:
- `book_comments` - Main comments on books
- `book_comment_likes` - Track likes on comments
- `book_replies` - Replies to comments

### Step 4: Execute the SQL
1. Click the **RUN** button (or press Ctrl+Enter)
2. Wait for the query to complete (should take ~5-10 seconds)
3. You should see a success message

### Step 5: Verify Tables Were Created
Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('book_comments', 'book_comment_likes', 'book_replies');
```

You should see all 3 tables listed.

### Step 6: Restart Your Application
Once tables are created:
1. Restart your Node.js backend server
2. Refresh your React application in the browser
3. Try submitting a comment again - it should work!

## After Setup
- Comments will be stored in the `book_comments` table
- Comment media (images, videos, audio) will be stored in the `comment_media` bucket
- Each user can only delete/edit their own comments (enforced via RLS policies)
- Admins can manage all comments

## Need Help?
If you encounter issues:
1. Check that all 3 tables exist in Supabase
2. Verify the `comment_media` bucket exists and is public
3. Check browser console for detailed error messages
4. Verify your RLS policies are correctly set
