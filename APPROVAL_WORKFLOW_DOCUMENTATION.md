# Content Approval Workflow Documentation

## Overview

All user-submitted content (books, universities, and past papers) now requires admin approval before being displayed to other users. This ensures content quality and prevents spam/inappropriate content from appearing in the public catalog.

## Content Types and Tables

### 1. **Books**
- **Submission Table**: `book_submissions`
- **Approved Table**: `books`
- **Flow**: User uploads → stored in `book_submissions` with `status='pending'` → Admin reviews → Approved items moved/copied to `books` table

### 2. **Past Papers**
- **Submission Table**: `past_paper_submissions`
- **Approved Table**: `past_papers`
- **Flow**: User uploads → stored in `past_paper_submissions` with `status='pending'` → Admin reviews → Approved items moved/copied to `past_papers` table

### 3. **Universities/Campuses**
- **Single Table**: `universities` (with `status` column)
- **Status Values**: `'pending'`, `'approved'`, `'rejected'`
- **Flow**: User submits → stored with `status='pending'` → Admin reviews → Status updated to `'approved'` or `'rejected'`

## Database Schema Changes

### New Columns Added

#### Universities Table
```sql
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
```

### Submission Tables (Already Existed)

#### book_submissions
- `status` (TEXT): 'pending', 'approved', 'rejected'
- `approved_by` (UUID): Admin who approved
- `approved_at` (TIMESTAMP): When approved
- `rejected_reason` (TEXT): Reason for rejection (if rejected)

#### past_paper_submissions
- `status` (TEXT): 'pending', 'approved', 'rejected'
- `approved_by` (UUID): Admin who approved
- `approved_at` (TIMESTAMP): When approved
- `rejected_reason` (TEXT): Reason for rejection (if rejected)

## Implementation Details

### Frontend Changes

#### Upload Component (`src/SomaLux/Books/Admin/pages/Upload.jsx`)
- Changed imports from `createBook`, `createUniversity`, `createPastPaper` to submission variants
- Updated submit handlers to call:
  - `createBookSubmission()` instead of `createBook()`
  - `createUniversitySubmission()` instead of `createUniversity()`
  - `createPastPaperSubmission()` instead of `createPastPaper()`
- Updated success messages to indicate content is pending approval
- Reset forms after submission and navigate back to upload page

#### API Functions

**books/api.js** - New function:
```javascript
export async function createBookSubmission({ metadata, pdfFile, coverFile })
// Inserts into book_submissions table with status='pending'
```

**campusApi.js** - New function:
```javascript
export async function createUniversitySubmission({ metadata, coverFile })
// Inserts into universities table with status='pending'
```

**pastPapersApi.js** - Already existed:
```javascript
export async function createPastPaperSubmission({ metadata, pdfFile })
// Inserts into past_paper_submissions table with status='pending'
```

#### Display Filtering
Updated `fetchUniversities()` in `campusApi.js` to only return approved universities:
```javascript
.eq('status', 'approved')
```

Books and Past Papers already use separate tables, so filtering happens at table level.

### Backend Routes (Already Existed)

The backend already has comprehensive approval workflow endpoints:

**Endpoints**:
- `GET /api/elib/submissions` - Fetch pending submissions
- `GET /api/elib/submissions/summary` - Get count of pending items
- `POST /api/elib/submissions/:id/approve` - Approve a submission
- `POST /api/elib/submissions/:id/reject` - Reject a submission
- `POST /api/elib/submissions/notify-admins` - Notify admins of new submissions

**Features**:
- Email notifications to admins when new submissions arrive
- Tracks who approved/rejected and when
- Records rejection reason for user feedback
- Automatic content promotion from submissions table to main table on approval

## User Experience

### For Content Creators
1. User uploads content (book, university, or past paper)
2. Upload is immediately saved to submission table with `status='pending'`
3. User sees success message: "Content submitted for approval. Admin will review it shortly."
4. User is redirected to upload page
5. Content is not visible to other users until approved
6. When approved, content becomes visible in public catalog

### For Admins
1. Admin navigates to Books > Submissions or Past Papers section
2. Pending items are displayed with:
   - Creator information
   - Submission date
   - Item details (title, author, etc.)
   - Action buttons: Approve / Reject
3. Clicking Approve:
   - Content is transferred to main table
   - Status updated to 'approved'
   - Submission record updated with approval details
4. Clicking Reject:
   - Status updated to 'rejected'
   - Rejection reason can be added
   - Content remains in submission table for reference
   - Optional email notification to submitter

## Notification System

When new submissions are received, admins are notified via email with:
- Submitter email address
- Number of successful submissions
- Link to admin panel: "Admin > Books > Submissions"
- Email sent to addresses in `ADMIN_EMAILS` environment variable

## Migration Steps for Production

### 1. Run SQL Migration
Execute `sql/ADD_STATUS_TO_UNIVERSITIES.sql` in Supabase SQL editor:
- Adds `status` column to universities table (defaults to 'approved')
- Adds `created_by` column to track submitter
- Creates indexes for performance
- Updates all existing universities to 'approved' status

### 2. Verify Tables Exist
Confirm these tables exist in Supabase:
- `book_submissions`
- `past_paper_submissions`

### 3. Deploy Code Changes
- Update `src/SomaLux/Books/Admin/pages/Upload.jsx`
- Update `src/SomaLux/Books/Admin/api.js`
- Update `src/SomaLux/Books/Admin/campusApi.js`
- Ensure `src/SomaLux/Books/Admin/pastPapersApi.js` is using submission functions

### 4. Configure Admin Emails
Set `ADMIN_EMAILS` environment variable in:
- `.env` file (local development)
- Backend service (production)
- Example: `admin@example.com,moderator@example.com`

## Testing Checklist

- [ ] User can upload a book and it appears in submissions table
- [ ] User can upload a university and it appears with status='pending'
- [ ] User can upload a past paper and it appears in submissions table
- [ ] Uploaded content is NOT visible in public catalog until approved
- [ ] Admin can view pending submissions
- [ ] Admin can approve submission and content becomes visible
- [ ] Admin can reject submission with optional reason
- [ ] Admin emails are received when new submissions arrive
- [ ] Success/error messages display correctly to users
- [ ] Form resets after successful submission
- [ ] User is redirected appropriately after upload

## Troubleshooting

### Issue: Migration fails - column already exists
**Solution**: The migration uses `IF NOT EXISTS` clause, so it's safe to re-run

### Issue: Universities not showing in list
**Solution**: Check if status column exists and all universities have status='approved'
```sql
SELECT COUNT(*) FROM universities WHERE status = 'approved';
```

### Issue: Admin doesn't receive email notifications
**Solution**: 
1. Verify `ADMIN_EMAILS` is set in environment
2. Check backend logs for email sending errors
3. Verify email service credentials are configured

### Issue: Rejected submissions still visible
**Solution**: This is by design - rejected items stay in submissions table for audit trail
Consider hiding them in UI or creating archive table

## Future Enhancements

1. **User Notifications**: Notify users when their submissions are approved/rejected
2. **Bulk Operations**: Allow admins to approve/reject multiple items at once
3. **Detailed Analytics**: Track submission rates, approval rates, common rejections
4. **Appeal Process**: Allow users to appeal rejected submissions
5. **Auto-Approval**: Option for trusted contributors to skip approval
6. **Content Moderation**: Flag potentially problematic content for review
