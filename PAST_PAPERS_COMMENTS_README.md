# 🚀 Past Papers Comments Fix - Quick Start

## The Problem
Past papers comments section shows a **400 error** when trying to submit comments.

## The Solution
Run ONE SQL script to fix the database schema.

## How to Fix (3 steps, 2 minutes)

### 1️⃣ Open Supabase SQL Editor
- Go to your Supabase dashboard
- Click **SQL Editor**
- Click **New Query**

### 2️⃣ Copy & Paste Script
- Open file: **`sql/fix_past_paper_comments_schema.sql`**
- Copy the ENTIRE file contents
- Paste into Supabase SQL Editor

### 3️⃣ Run It
- Click **Run** button
- Wait for ✅ success message
- Done!

## What Gets Fixed
✅ Adds missing columns to database  
✅ Creates missing tables  
✅ Sets up proper security (RLS)  
✅ Creates performance indexes  
✅ Comments now work like books  

## After the Fix
Users can:
- ✅ Write comments on past papers
- ✅ Like/unlike comments
- ✅ Reply to comments
- ✅ Attach images to comments
- ✅ Delete their own comments

## No Code Changes Needed
The app code is already correct! Only the database was incomplete.

## Files to Know About

| File | Purpose |
|------|---------|
| `sql/fix_past_paper_comments_schema.sql` | The migration script (run this!) |
| `PAST_PAPERS_COMMENTS_FIX.md` | Detailed technical guide |
| `PAST_PAPERS_COMMENTS_CHECKLIST.md` | Testing & verification steps |
| `PAST_PAPERS_COMMENTS_TECHNICAL_SUMMARY.md` | Complete technical reference |

## Testing
After running the SQL:
1. Open a past paper
2. Type a comment → should submit ✅
3. Click heart icon → should like ✅
4. Click Reply → should work ✅
5. Attach image → should upload ✅

## Need Help?
- 📖 Read: `PAST_PAPERS_COMMENTS_FIX.md`
- ✅ Use: `PAST_PAPERS_COMMENTS_CHECKLIST.md`
- 🔧 Reference: `PAST_PAPERS_COMMENTS_TECHNICAL_SUMMARY.md`

---

**TL;DR:** Run `sql/fix_past_paper_comments_schema.sql` in Supabase SQL Editor. Done! 🎉
