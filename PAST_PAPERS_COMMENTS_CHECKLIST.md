# Past Papers Comments - Implementation Checklist

## Pre-Implementation Checklist
- [ ] Backup Supabase database (recommended)
- [ ] Have Supabase dashboard open
- [ ] Access SQL Editor in Supabase

## Implementation Steps

### Step 1: Access SQL Editor
- [ ] Log into Supabase dashboard
- [ ] Navigate to your project
- [ ] Click "SQL Editor" in left sidebar
- [ ] Click "New Query"

### Step 2: Run Migration Script
- [ ] Open file: `sql/fix_past_paper_comments_schema.sql`
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click "Run" button
- [ ] Wait for success message

### Step 3: Verify Changes
- [ ] Check console shows no errors
- [ ] Navigate to "Database" section
- [ ] Expand "public" schema
- [ ] Verify these tables exist:
  - [ ] past_paper_comments (with new columns)
  - [ ] past_paper_comment_likes
  - [ ] past_paper_replies

### Step 4: Verify Columns
- [ ] Click past_paper_comments table
- [ ] Verify these columns exist:
  - [ ] id
  - [ ] paper_id
  - [ ] user_id
  - [ ] user_email ✨ NEW
  - [ ] text (NOT "comment") ✨ RENAMED
  - [ ] media_url ✨ NEW
  - [ ] media_type ✨ NEW
  - [ ] created_at
  - [ ] updated_at ✨ NEW

### Step 5: Application Testing

#### Test 1: Comment Creation
- [ ] Open application
- [ ] Navigate to Past Papers
- [ ] Click on any past paper
- [ ] Type a test comment: "Testing comments"
- [ ] Click send button
- [ ] Comment appears immediately
- [ ] No errors in console
- [ ] ✅ PASS or ❌ FAIL

#### Test 2: Comment Like
- [ ] On the test comment, click heart icon
- [ ] Heart fills (becomes solid)
- [ ] Like count increases to 1
- [ ] Click heart again to unlike
- [ ] Heart unfills, count goes back to 0
- [ ] ✅ PASS or ❌ FAIL

#### Test 3: Comment Reply
- [ ] Click "Reply" button on test comment
- [ ] Type reply: "Test reply"
- [ ] Click send
- [ ] Reply appears under comment indented
- [ ] ✅ PASS or ❌ FAIL

#### Test 4: Media Upload
- [ ] Create new comment
- [ ] Click image icon
- [ ] Select an image from computer
- [ ] Image preview appears
- [ ] Click send
- [ ] Comment with image appears
- [ ] Image displays below text
- [ ] ✅ PASS or ❌ FAIL

#### Test 5: Comment Deletion
- [ ] Find your test comment
- [ ] Click three-dot menu (⋮)
- [ ] Click "Delete"
- [ ] Comment disappears
- [ ] Refresh page
- [ ] Comment still gone
- [ ] ✅ PASS or ❌ FAIL

#### Test 6: Data Persistence
- [ ] Create a comment
- [ ] Refresh browser (F5)
- [ ] Comment still appears
- [ ] Comment text unchanged
- [ ] Media still loads
- [ ] ✅ PASS or ❌ FAIL

#### Test 7: Multiple Papers
- [ ] Open Paper A
- [ ] Add comment: "Paper A comment"
- [ ] Open Paper B
- [ ] Add comment: "Paper B comment"
- [ ] Go back to Paper A
- [ ] Only "Paper A comment" appears
- [ ] Go back to Paper B
- [ ] Only "Paper B comment" appears
- [ ] ✅ PASS or ❌ FAIL

## Verification Checklist

### Database Level
- [ ] past_paper_comments table exists
- [ ] past_paper_comment_likes table exists
- [ ] past_paper_replies table exists
- [ ] All columns present with correct types
- [ ] Indexes created (8 total)
- [ ] RLS policies enabled
- [ ] User permissions granted

### Application Level
- [ ] Comments load without error
- [ ] Comments submit successfully
- [ ] Likes work bidirectionally
- [ ] Replies nest properly
- [ ] Media uploads and displays
- [ ] Delete removes from DB
- [ ] Data persists on refresh
- [ ] Per-paper isolation works

### User Experience
- [ ] No console errors
- [ ] No 400 errors from Supabase
- [ ] Instant comment feedback
- [ ] Like count updates immediately
- [ ] Replies appear inline
- [ ] Mobile responsive
- [ ] Accessibility maintained

## Troubleshooting

### Symptom: Still getting 400 error
**Solution:**
- [ ] Verify SQL ran without errors
- [ ] Check for typos in SQL script
- [ ] Refresh browser (Ctrl+Shift+R full refresh)
- [ ] Clear browser cache
- [ ] Check Supabase API logs
- [ ] Verify Supabase service status

### Symptom: Comments don't save
**Solution:**
- [ ] Check user is authenticated (logged in)
- [ ] Check network tab in DevTools
- [ ] Verify user_id matches in profiles
- [ ] Check RLS policies aren't blocking
- [ ] Check database quotas aren't exceeded

### Symptom: Likes not working
**Solution:**
- [ ] Verify past_paper_comment_likes table exists
- [ ] Check user is authenticated
- [ ] Check comment_id is valid
- [ ] Check unique constraint isn't causing issues
- [ ] Check RLS policies for comment_likes

### Symptom: Replies disappearing
**Solution:**
- [ ] Verify past_paper_replies table exists
- [ ] Check comment_id foreign key reference
- [ ] Verify comment wasn't deleted
- [ ] Check RLS policies for replies

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:
1. Open Supabase dashboard
2. Go to Settings → Backups
3. Select restore point before migration
4. Click restore
5. All changes will be undone

Note: Only 7-day retention unless backup storage enabled

## Support Resources

- 📚 Full guide: `PAST_PAPERS_COMMENTS_FIX.md`
- 🔧 Technical details: `PAST_PAPERS_COMMENTS_TECHNICAL_SUMMARY.md`
- 📝 SQL script: `sql/fix_past_paper_comments_schema.sql`
- 💬 Comments code: `src/SomaLux/PastPapers/CommentsSection.jsx`
- 🎯 Main file: `src/SomaLux/PastPapers/Pastpapers.jsx`

## Sign-Off

**When to consider complete:**
- All 7 tests PASS
- No console errors
- No Supabase API errors
- Users can comment, like, reply
- Data persists on refresh

**Status:** 
- [ ] Ready for production
- [ ] Needs more testing
- [ ] Ready to deploy

**Tested by:** _________________ **Date:** _________
