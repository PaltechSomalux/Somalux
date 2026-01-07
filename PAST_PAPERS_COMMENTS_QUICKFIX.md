# Quick Fix: Run This SQL to Fix Past Papers Comments

## The Issue
Comments section in Past Papers returning 400 error from Supabase because the table schema doesn't match the books comments schema.

## The Fix (Copy & Paste)
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and run the entire contents of: `sql/fix_past_paper_comments_schema.sql`
4. Done! Comments will work just like books

## What Gets Fixed
✅ Adds missing columns to past_paper_comments table
✅ Renames `comment` column to `text`
✅ Creates past_paper_comment_likes table
✅ Creates past_paper_replies table
✅ Sets up proper permissions and RLS policies
✅ Creates all necessary indexes

## After Running
- Past papers comments will work identically to book comments
- Users can comment, like, reply, attach media
- No more 400 errors
- Full feature parity achieved

## File Location
`sql/fix_past_paper_comments_schema.sql` - Ready to execute
