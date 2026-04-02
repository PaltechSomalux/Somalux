# Approval Workflow - Testing Instructions

## Pre-Deployment Testing

### 1. Database Migration Test

**Before Running Migration:**
```sql
-- Check current state
SELECT COUNT(*) FROM universities WHERE status IS NULL;
SELECT COUNT(*) FROM universities WHERE status = 'approved';
SELECT COUNT(*) FROM book_submissions WHERE status = 'pending';
SELECT COUNT(*) FROM past_paper_submissions WHERE status = 'pending';
```

**Run Migration:**
```sql
-- Execute SQL/ADD_STATUS_TO_UNIVERSITIES.sql
-- Check for errors
```

**After Migration:**
```sql
-- Verify status column exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'universities' AND column_name = 'status';

-- Verify all universities are 'approved'
SELECT COUNT(*) FROM universities WHERE status = 'approved';
SELECT COUNT(*) FROM universities WHERE status IS NULL;

-- Check indexes created
SELECT indexname FROM pg_indexes WHERE tablename = 'universities' AND indexname LIKE '%status%';
```

### 2. Upload Test - Books

**Test Case 1: Submit a New Book**
1. Navigate to Upload page
2. Go to "Books" tab
3. Upload a test PDF file
4. Fill in book details (title, author, description)
5. Click "Upload Book"

**Expected Results:**
- ✅ Success message: "Book submitted for approval. Admin will review it shortly."
- ✅ Page redirects to /user/upload
- ✅ Form clears/resets
- ✅ Book appears in `book_submissions` table with `status='pending'`
- ✅ Book does NOT appear in `books` table
- ✅ Book NOT visible in public Books list

**Verification:**
```sql
SELECT id, title, author, status FROM book_submissions 
WHERE status = 'pending' 
ORDER BY created_at DESC LIMIT 1;
```

### 3. Upload Test - Universities

**Test Case 2: Submit a New University**
1. Navigate to Upload page
2. Go to "Campus" tab
3. Enter university name and details
4. Upload a cover image (optional)
5. Click "Add University"

**Expected Results:**
- ✅ Success message: "University submitted for approval with X image(s)!"
- ✅ Page redirects to /user/upload
- ✅ Form clears/resets
- ✅ University appears in `universities` table with `status='pending'`
- ✅ University does NOT appear in public Universities list

**Verification:**
```sql
SELECT id, name, status, created_at FROM universities 
WHERE status = 'pending' 
ORDER BY created_at DESC LIMIT 1;
```

### 4. Upload Test - Past Papers

**Test Case 3: Submit a New Past Paper**
1. Navigate to Upload page
2. Go to "Past Papers" tab
3. Upload a test PDF file
4. Fill in paper details (faculty, unit code, unit name, year)
5. Click "Upload Past Paper"

**Expected Results:**
- ✅ Success message: "Past paper submitted for approval. Admin will review it shortly."
- ✅ Page redirects to /user/upload
- ✅ Form clears/resets
- ✅ Past paper appears in `past_paper_submissions` table with `status='pending'`
- ✅ Past paper does NOT appear in `past_papers` table
- ✅ Past paper NOT visible in public Past Papers list

**Verification:**
```sql
SELECT id, title, status FROM past_paper_submissions 
WHERE status = 'pending' 
ORDER BY created_at DESC LIMIT 1;
```

### 5. Display Filter Test

**Test Case 4: Verify Pending Content Hidden**
1. User submits new content (book/university/past paper)
2. As logged-in user, navigate to Books/Universities/Past Papers list
3. Search for newly submitted content

**Expected Results:**
- ✅ Submitted content does NOT appear in list
- ✅ Only approved content is displayed
- ✅ Same behavior for all content types

### 6. Admin Approval Test

**Test Case 5: Admin Approves Submission**
1. Admin logs into system
2. Navigate to Books > Submissions (or appropriate section)
3. Click on pending submission
4. Click "Approve" button

**Expected Results:**
- ✅ Submission status changes to 'approved'
- ✅ Content is moved/copied to main table (books/past_papers)
- ✅ Timestamp recorded (approved_at)
- ✅ Admin ID recorded (approved_by)
- ✅ Content now appears in public list

**Verification:**
```sql
-- For books
SELECT id, title, status, approved_by, approved_at FROM book_submissions 
WHERE id = 'test-id' AND status = 'approved';

SELECT id, title FROM books WHERE title = 'Test Book Title';

-- For universities
SELECT id, name, status, approved_by, approved_at FROM universities 
WHERE id = 'test-id' AND status = 'approved';
```

### 7. Admin Rejection Test

**Test Case 6: Admin Rejects Submission**
1. Admin logs into system
2. Navigate to submissions
3. Click on pending submission
4. Click "Reject" button
5. Enter rejection reason

**Expected Results:**
- ✅ Status changes to 'rejected'
- ✅ Rejection reason recorded
- ✅ Timestamp recorded
- ✅ Admin ID recorded
- ✅ Content remains in submission table (not in main table)
- ✅ Content NOT visible in public list

**Verification:**
```sql
SELECT id, title, status, rejection_reason FROM book_submissions 
WHERE status = 'rejected' ORDER BY created_at DESC LIMIT 1;
```

### 8. Email Notification Test

**Test Case 7: Verify Admin Email Notifications**
1. Configure test email address in ADMIN_EMAILS
2. Submit new content from test user
3. Check email inbox

**Expected Results:**
- ✅ Email received from notification system
- ✅ Email contains submission summary
- ✅ Email includes link to admin panel
- ✅ Email shows submitter email address
- ✅ Email shows number of successful submissions

**Verification:**
- Check email inbox for new submission notification
- Check backend logs for email sending confirmation

### 9. Content Visibility Test

**Test Case 8: Content Visibility Before/After Approval**
1. Note timestamp of submission
2. Check content is not visible to public
3. Admin approves content
4. Refresh public list
5. Verify content now appears

**Expected Results:**
- ✅ Content hidden while pending
- ✅ Content visible immediately after approval
- ✅ Search and filters work on approved content
- ✅ Views, likes, comments work on approved content

## Integration Testing

### Test Case 9: Full Workflow - Book
```
1. User uploads book (via Upload page) ✅
2. Success message shows ✅
3. Book in book_submissions (pending) ✅
4. Admin sees in submissions panel ✅
5. Admin clicks approve ✅
6. Book now in books table ✅
7. Book visible in public Books list ✅
8. User can like/comment on book ✅
```

### Test Case 10: Full Workflow - University
```
1. User submits university (via Upload page) ✅
2. Success message shows ✅
3. University in universities table (pending) ✅
4. Admin sees in submissions panel ✅
5. Admin clicks approve ✅
6. University status = 'approved' ✅
7. University visible in public list ✅
8. User can view university details ✅
```

### Test Case 11: Full Workflow - Past Paper
```
1. User uploads past paper (via Upload page) ✅
2. Success message shows ✅
3. Paper in past_paper_submissions (pending) ✅
4. Admin sees in submissions panel ✅
5. Admin clicks approve ✅
6. Paper now in past_papers table ✅
7. Paper visible in public list ✅
8. User can download paper ✅
```

## Regression Testing

### Test Case 12: Existing Features Still Work
- ✅ Admin can upload content directly to main tables
- ✅ Admin-uploaded content immediately visible
- ✅ Search functionality works on approved content
- ✅ Filtering by category works
- ✅ Sorting by date/views/downloads works
- ✅ Like/comment functionality works
- ✅ Download tracking works
- ✅ User profile shows their uploads

### Test Case 13: Backward Compatibility
- ✅ All existing books visible (not affected)
- ✅ All existing past papers visible (not affected)
- ✅ All existing universities visible (not affected)
- ✅ User upload history visible only to user
- ✅ Admin metrics still accurate

## Performance Testing

### Test Case 14: Query Performance
```sql
-- Test filtering performance
EXPLAIN ANALYZE
SELECT * FROM universities 
WHERE status = 'approved' 
ORDER BY created_at DESC LIMIT 20;

-- Should use index on status column
-- Expected: < 100ms for 10K records

-- Test with search
EXPLAIN ANALYZE
SELECT * FROM universities 
WHERE status = 'approved'
AND name ILIKE '%test%'
ORDER BY created_at DESC LIMIT 20;
```

## Edge Cases

### Test Case 15: Edge Cases
1. **Duplicate Submission**: User submits same content twice
   - ✅ Both appear as separate submissions
   
2. **Empty Form Submission**: Submit without required fields
   - ✅ Error message shown, content not created
   
3. **Large File Upload**: Upload large PDF/image
   - ✅ Upload completes, stored in submissions
   
4. **Special Characters**: Submit with special characters in title
   - ✅ Special characters properly escaped/stored
   
5. **Concurrent Approvals**: Admin approves same submission twice
   - ✅ Second approval fails gracefully
   
6. **Multiple Admins**: Two admins approve at same time
   - ✅ Last approval wins, audit trail shows both

## Rollback Test

### Test Case 16: Rollback Procedure
If issues found after deployment:
1. Identify problematic changes
2. Revert Upload.jsx to use old functions
3. Deploy revert
4. Verify old behavior restored
5. Investigate root cause
6. Re-test before re-deployment

## Testing Checklist

### Frontend Tests
- [ ] Book upload shows correct success message
- [ ] University submit shows correct success message
- [ ] Past paper upload shows correct success message
- [ ] Forms reset after submission
- [ ] User redirected to upload page after submission
- [ ] Pending content NOT visible in public lists
- [ ] Approved content IS visible in public lists
- [ ] Search filters work correctly
- [ ] Category filters work correctly
- [ ] Sort by date/views/downloads works

### Backend Tests
- [ ] book_submissions table receives submissions
- [ ] past_paper_submissions table receives submissions
- [ ] universities table receives submissions with status='pending'
- [ ] Approve endpoint works correctly
- [ ] Reject endpoint works correctly
- [ ] Email notifications sent on new submissions
- [ ] Email contains correct information
- [ ] Timestamps recorded correctly
- [ ] Admin IDs recorded correctly

### Database Tests
- [ ] Indexes created on status column
- [ ] Indexes created on created_by column
- [ ] Migration runs without errors
- [ ] Existing data not corrupted
- [ ] Queries use indexes (EXPLAIN ANALYZE)
- [ ] No null status values

### Security Tests
- [ ] Unauthenticated users cannot approve content
- [ ] Users cannot approve others' content
- [ ] RLS policies prevent unauthorized access
- [ ] File upload security maintained
- [ ] No exposure of private submission data

## Test Report Template

```markdown
# Approval Workflow Test Report
Date: [DATE]
Tester: [NAME]
Environment: [DEV/STAGING/PROD]

## Summary
- Total Tests: XX
- Passed: XX
- Failed: XX
- Issues: XX

## Test Results
[Document pass/fail for each test case]

## Issues Found
[List any bugs or issues]

## Performance
[Document query times, load times]

## Recommendation
[ ] Ready for Production
[ ] Ready with Fixes
[ ] Not Ready

## Sign-off
Tester: ________ Date: ________
Reviewer: ________ Date: ________
```

## Next Steps After Testing

1. ✅ All tests passing?
2. ✅ No critical issues?
3. ✅ Performance acceptable?
4. ✅ Email notifications working?
5. ➡️ Deploy to production
6. ➡️ Monitor logs for errors
7. ➡️ Track admin submissions over next week
8. ➡️ Gather user feedback
