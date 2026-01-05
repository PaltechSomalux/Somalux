# localStorage Persistence Testing Guide

## Quick Test Steps

### Test 1: Books Auto Upload Resume
1. Navigate to `/books/admin/autoupload`
2. Click Books tab if not already selected
3. Select a folder with 10+ PDF files
4. Click "Upload 10 Files"
5. Wait for at least 3-4 files to upload (progress shows X/10)
6. **Refresh the page** (F5 or Cmd+R)
7. Expected: **"Resume Previous" button appears in blue**
8. Click "Resume Previous"
9. Expected: Upload continues from where it left off ✅

### Test 2: Past Papers Auto Upload Resume
1. Select folder with 10+ past paper PDFs
2. Click "Upload 10 Files"
3. Wait for 3-4 files to upload
4. **Close the browser tab completely**
5. Reopen the site and navigate back to `/books/admin/autoupload`
6. Click Past Papers tab
7. Expected: **"Resume Previous" button appears in blue**
8. Click "Resume Previous"
9. Expected: Upload continues where it left off ✅

### Test 3: Upload Completion Clears State
1. Select 3 small PDF files
2. Click "Upload 3 Files"
3. Wait for upload to complete (should be quick)
4. Expected: **"Resume Previous" button does NOT appear** ✅
5. Refresh page
6. Expected: Button still doesn't appear (state was cleared) ✅

### Test 4: Cancel Upload Clears State
1. Select folder with 20+ files
2. Click "Upload 20 Files"
3. After 2-3 files, click red "Cancel" button
4. Upload stops
5. Refresh page
6. Expected: **"Resume Previous" button does NOT appear** ✅

### Test 5: Pause/Resume Across Refresh
1. Select folder with 15+ files
2. Click "Upload"
3. When 3 files are done, click yellow "Pause" button
4. Button changes to green "Resume"
5. **Refresh the page**
6. Expected: "Resume Previous" button appears (upload was paused mid-way)
7. Click "Resume Previous" 
8. Expected: Upload continues from paused state ✅

### Test 6: Multiple Separate Uploads
1. Start Books upload, pause it after 2 files
2. Switch to Past Papers tab
3. Start Past Papers upload, pause it after 2 files
4. Refresh page
5. Expected: Both "Resume Previous" buttons could appear (if different)
6. Check browser DevTools localStorage:
   - `booksUploadState` should exist
   - `pastPapersUploadState` should exist
7. Click Resume on Books → books upload continues ✅
8. Click Resume on Past Papers → past papers upload continues ✅

## Debugging in Browser DevTools

### View Saved State
```javascript
// In browser console (F12)

// View Books upload state
console.log(JSON.parse(localStorage.getItem('booksUploadState')))

// View Past Papers upload state  
console.log(JSON.parse(localStorage.getItem('pastPapersUploadState')))

// Clear all states (if needed)
localStorage.removeItem('booksUploadState')
localStorage.removeItem('pastPapersUploadState')
```

### Monitor localStorage Changes
1. Open DevTools → Application tab
2. Click Storage → Local Storage
3. Select your domain
4. Watch keys `booksUploadState` and `pastPapersUploadState`
5. As you upload, values should update

## Expected localStorage Structure

### After uploading 5/20 files:
```json
{
  "booksUploadState": {
    "fileNames": ["file1.pdf", "file2.pdf", ...],
    "currentIndex": 4,
    "total": 20,
    "uploaded": 5,
    "failed": 0,
    "duplicates": 0,
    "paused": false,
    "uploading": true,
    "timestamp": 1699123456789
  }
}
```

### After pause:
```json
{
  "booksUploadState": {
    "currentIndex": 5,
    "total": 20,
    "uploaded": 6,
    "failed": 0,
    "duplicates": 0,
    "paused": true,  // ← Changed to true
    "uploading": true,
    "timestamp": 1699123456789
  }
}
```

### After completion:
- Key is **deleted** from localStorage
- "Resume Previous" button disappears

## Common Issues & Fixes

### "Resume Previous" button doesn't appear after pause
- Check DevTools → Application → Local Storage → look for `booksUploadState`
- If missing, the component didn't initialize properly
- Try: Refresh page, pause again, refresh

### Files are re-uploaded instead of resuming
- Different PDF files selected on resume
- Solution: Click "Clear" then "Resume Previous" to start fresh

### Progress numbers don't match after resume
- localStorage may have stale data
- Solution: Manually delete the key in DevTools and start fresh upload

### Upload doesn't continue after clicking Resume
- Check browser console for errors
- Verify same files are still selected (they should be from initial selection)
- Try: Cancel current, refresh, click Resume Previous

## Files Modified
- ✅ `src/SomaLux/Books/Admin/pages/AutoUpload.jsx` - Both BooksAutoUploadContent and PastPapersAutoUploadContent components
