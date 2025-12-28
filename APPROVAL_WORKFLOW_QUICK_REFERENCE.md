# Approval Workflow - Quick Implementation Guide

## What Changed

All user-submitted content now requires admin approval before being displayed publicly.

## Files Modified

1. **src/SomaLux/Books/Admin/api.js**
   - Added `createBookSubmission()` function
   - Books submitted to `book_submissions` table instead of `books`

2. **src/SomaLux/Books/Admin/campusApi.js**
   - Added `createUniversitySubmission()` function
   - Universities submitted to `universities` table with `status='pending'`
   - Updated `fetchUniversities()` to filter `status='approved'` only

3. **src/SomaLux/Books/Admin/pastPapersApi.js**
   - Already had `createPastPaperSubmission()` function
   - No changes needed

4. **src/SomaLux/Books/Admin/pages/Upload.jsx**
   - Updated imports to use submission functions
   - Updated `submitBook()`, `submitCampus()`, `submitPastPaper()`
   - Changed success messages to indicate pending approval
   - Reset forms after submission

5. **sql/ADD_STATUS_TO_UNIVERSITIES.sql** (NEW)
   - Migration to add `status` and `created_by` columns to universities table

## Files Created

- **APPROVAL_WORKFLOW_DOCUMENTATION.md** - Complete documentation
- **sql/ADD_STATUS_TO_UNIVERSITIES.sql** - Database migration

## Database Changes Required

Run this SQL in Supabase:
```sql
-- Add status column to universities table for approval workflow
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_universities_status ON public.universities(status);

ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_universities_created_by ON public.universities(created_by);

UPDATE public.universities SET status = 'approved' WHERE status IS NULL;
```

## Deployment Steps

1. **Backup Database** - Always backup before applying migrations
2. **Run Migration** - Execute SQL migration in Supabase SQL editor
3. **Deploy Code** - Push updated files to production
4. **Configure Emails** - Set `ADMIN_EMAILS` environment variable
5. **Test Workflow** - Submit test content and verify approval process

## How It Works

### For Users
1. Upload content (book/university/past paper)
2. See message: "Submitted for approval"
3. Content stored in submission table with `status='pending'`
4. Content NOT visible to other users
5. When admin approves, content becomes visible

### For Admins
1. Navigate to Books > Submissions or Past Papers
2. See pending items awaiting approval
3. Click "Approve" to move to public catalog
4. Click "Reject" to deny publication
5. Auto-notified when new submissions arrive

## Submission Tables

| Content Type | Submission Table | Approved Table |
|---|---|---|
| Books | `book_submissions` | `books` |
| Past Papers | `past_paper_submissions` | `past_papers` |
| Universities | `universities` (status='pending') | `universities` (status='approved') |

## Success Messages Changed

**Before**: "Book uploaded successfully" → redirects to books list  
**After**: "Book submitted for approval. Admin will review it shortly." → redirects to upload page

## Admin Endpoints (Already Available)

```
GET /api/elib/submissions?type=books&status=pending
GET /api/elib/submissions/summary
POST /api/elib/submissions/{id}/approve
POST /api/elib/submissions/{id}/reject
```

## Environment Variables

Add to `.env`:
```
ADMIN_EMAILS=admin@example.com,moderator@example.com
```

## Rollback Plan

If issues arise, you can temporarily revert by:
1. Creating new functions that use `books` table directly (not submissions)
2. Reverting Upload.jsx to use old functions
3. Running queries to move approved submissions to main tables

## Next Steps

1. ✅ Code changes implemented
2. ⏳ Run database migration
3. ⏳ Deploy to production
4. ⏳ Test approval workflow
5. ⏳ Verify admin emails are being sent
6. ⏳ Monitor for issues

## Support

For questions or issues:
- Check APPROVAL_WORKFLOW_DOCUMENTATION.md for detailed info
- Review backend/index.js for approval endpoints
- Check logs for email sending errors
