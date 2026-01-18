# PastPapersDownloader - Verification Checklist

Use this checklist to verify the system is properly installed and working.

## Pre-Installation Checklist

### Prerequisites
- [ ] Node.js 14+ installed
- [ ] npm or yarn available
- [ ] Backend server running (port 5000)
- [ ] React app running (port 3000)
- [ ] Internet connection working
- [ ] GitHub pastpapers.ku.ac.ke is accessible

## Installation Verification

### Step 1: Dependencies Installed
```bash
# In backend directory, run:
npm list axios cheerio uuid
```

Expected output: All three packages listed with version numbers
- [ ] axios ✅
- [ ] cheerio ✅
- [ ] uuid ✅

### Step 2: Files Created
Check these files exist:
- [ ] `backend/services/pastPapersDownloaderService.js`
- [ ] `backend/routes/pastPapersDownloaderRoutes.js`
- [ ] `src/SomaLux/PastPapersDownloader/PastPapersDownloader.jsx`
- [ ] `src/SomaLux/PastPapersDownloader/PastPapersDownloader.css`
- [ ] `storage/pastpapers/` directory created

### Step 3: Routes Registered
In your `backend/server.js` or `backend/app.js`:
- [ ] Import statement added: `const pastPapersRoutes = require('./routes/pastPapersDownloaderRoutes');`
- [ ] Routes registered: `app.use('/api/elib/pastpapers', pastPapersRoutes);`

### Step 4: Component Imported
In your main React app file:
- [ ] Component imported: `import PastPapersDownloader from './SomaLux/PastPapersDownloader/PastPapersDownloader';`
- [ ] Route added (or tab added to existing component)
- [ ] Navigation link added

## API Verification

### Test 1: Schools Endpoint
```bash
curl http://localhost:5000/api/elib/pastpapers/schools
```

**Expected Response:**
```json
{
  "ok": true,
  "schools": [
    {
      "id": "4384",
      "name": "School of Agriculture And Enterprise Development",
      "paperCount": 327,
      ...
    }
  ],
  "count": 18
}
```

- [ ] Response code: 200 OK
- [ ] Contains 18 schools
- [ ] Each school has: id, name, paperCount
- [ ] Parsing successful (HTML rendered to JSON)

### Test 2: Get Papers from School
```bash
curl "http://localhost:5000/api/elib/pastpapers/school/4547/papers?page=1"
```

**Expected Response:**
```json
{
  "ok": true,
  "papers": [
    {
      "id": "11161",
      "title": "Economics of Education...",
      "code": "EMP723(2023)",
      ...
    }
  ],
  "hasNextPage": false,
  "page": 1,
  "totalOnPage": 21
}
```

- [ ] Response code: 200 OK
- [ ] Contains array of papers
- [ ] Each paper has: id, title, url
- [ ] hasNextPage indicates if more pages exist

### Test 3: Get Paper Details
```bash
curl "http://localhost:5000/api/elib/pastpapers/paper/11161"
```

**Expected Response:**
```json
{
  "ok": true,
  "paperId": "11161",
  "title": "Curriculum Development",
  "date": "2023",
  "downloadLinks": [
    {
      "url": "https://pastpapers.ku.ac.ke/bitstream/...",
      "filename": "EMP721.pdf",
      "type": "PDF"
    }
  ],
  "available": true
}
```

- [ ] Response code: 200 OK
- [ ] Contains download links
- [ ] Has filename and URL
- [ ] `available` is true or false

## Frontend Verification

### Test 4: Component Loads
1. Navigate to `/pastpapers` in your app
2. [ ] Component renders without errors
3. [ ] Loading message appears briefly
4. [ ] Schools grid loads
5. [ ] Each school card shows name and paper count
6. [ ] No console errors (F12 → Console)

### Test 5: School Selection
1. Click on a school card
2. [ ] Card highlights (color/border change)
3. [ ] "Start Download" button becomes active
4. [ ] Selected school name shows in button

### Test 6: Start Download
1. Click "Start Download"
2. [ ] Progress card appears below
3. [ ] Status shows "running"
4. [ ] Progress bar visible
5. [ ] Statistics box shows: Processed, Successful, Failed, Skipped
6. [ ] Browser console shows no errors

### Test 7: Real-time Progress
1. Watch for 10-20 seconds
2. [ ] Numbers update (processed count increases)
3. [ ] Progress bar moves forward
4. [ ] Progress percentage increases
5. [ ] No frozen/stuck interface

### Test 8: Download Files
1. While download running, check file system:
   ```bash
   dir storage\pastpapers
   ```
   Or:
   ```bash
   ls -la storage/pastpapers/
   ```
2. [ ] Directory for processId exists
3. [ ] Files appear as papers download
4. [ ] Files have .pdf extension
5. [ ] File sizes are reasonable (not 0 bytes)

### Test 9: Pause Download
1. Click "Pause" button
2. [ ] Status changes to "paused"
3. [ ] Progress stops updating
4. [ ] Download counter freezes

### Test 10: Resume Download
1. Click "Resume" button
2. [ ] Status changes to "running"
3. [ ] Progress resumes updating
4. [ ] Numbers continue incrementing

### Test 11: Stop Download
1. Click "Stop" button
2. [ ] Confirmation modal appears
3. [ ] Shows downloaded count
4. [ ] Click "Stop" in modal
5. [ ] [ ] Progress card closes
6. [ ] Downloaded files remain in storage

### Test 12: Download History
1. Scroll down to "Download History" section
2. [ ] Completed downloads show as cards
3. [ ] Each card shows: school name, status, statistics
4. [ ] Pagination works (if >12 downloads)
5. [ ] Can click "Resume" on incomplete downloads

### Test 13: Resume from History
1. Find a paused/failed download
2. Click "Resume" button
3. [ ] Modal appears asking to resume
4. [ ] Click "Resume" in modal
5. [ ] Progress card reappears
6. [ ] Download continues

## Functional Testing

### Test 14: Small Download (Common Units - 21 papers)
1. Select "Common Units"
2. Start download
3. Wait for completion
4. [ ] Should complete in 2-3 minutes
5. [ ] All 21 papers in statistics
6. [ ] 20 or 21 PDFs in storage directory

### Test 15: Medium Download (Pick a school with 100-300 papers)
1. Select medium-size school
2. Start download
3. Let run for 5 minutes
4. [ ] Papers downloading
5. [ ] Progress advancing
6. [ ] Can pause and resume
7. [ ] No memory leaks (browser still responsive)

### Test 16: Error Handling
1. Intentionally trigger error (if possible):
   - Stop internet connection briefly
   - Or modify API to fail
2. [ ] Process continues with other papers
3. [ ] Errors logged in UI
4. [ ] Failed count increases
5. [ ] Can still complete download

## Browser Testing

Test in multiple browsers:

### Chrome/Edge
- [ ] Loads without issues
- [ ] Progress updates smooth
- [ ] No console errors
- [ ] Responsive design works

### Firefox
- [ ] Loads without issues
- [ ] Progress updates smooth
- [ ] No console errors
- [ ] Responsive design works

### Safari (if available)
- [ ] Loads without issues
- [ ] Progress updates smooth
- [ ] No console errors
- [ ] Responsive design works

## Mobile Testing

Resize browser or test on phone:
- [ ] Layout adapts to narrow screens
- [ ] Touch interactions work
- [ ] School grid responsive
- [ ] Progress card readable
- [ ] Buttons tappable

## Performance Testing

### Test 17: Memory Usage
1. Start download
2. Open DevTools → Performance/Memory
3. [ ] Memory stays stable
4. [ ] No continuous growth
5. [ ] No memory leaks detected

### Test 18: Network Usage
1. Open DevTools → Network tab
2. Start download
3. [ ] No excessive requests
4. [ ] Requests are sequential (not all at once)
5. [ ] ~500ms delay between requests visible

### Test 19: CPU Usage
1. Start download
2. [ ] CPU not maxing out
3. [ ] Fan not running excessively
4. [ ] Browser responsive

## Database Integration (if implemented)

If you added database persistence:

- [ ] Processes saved to database
- [ ] Can retrieve after app restart
- [ ] Download history persists
- [ ] User filtering works
- [ ] Completed processes archived

## Final Checklist

### Setup Complete
- [ ] All files created
- [ ] Dependencies installed
- [ ] Routes registered
- [ ] Component imported
- [ ] Navigation added
- [ ] No console errors
- [ ] Backend running
- [ ] Frontend accessible

### API Working
- [ ] Schools endpoint responds
- [ ] Papers endpoint responds
- [ ] Paper details endpoint responds
- [ ] Bulk download starts
- [ ] Status polling works

### Frontend Working
- [ ] Component renders
- [ ] Schools grid loads
- [ ] Download starts
- [ ] Progress updates
- [ ] Controls work (pause/resume/stop)
- [ ] History shows
- [ ] Responsive design works

### Data Working
- [ ] Files download to correct directory
- [ ] File sizes are not 0
- [ ] File count matches statistics
- [ ] Files are valid PDFs (can open)

### Integration Complete
- [ ] Works alongside existing features
- [ ] Navigation integrated
- [ ] User profile linked
- [ ] No conflicts with other features

## Success!

✅ **If all tests pass**, your PastPapersDownloader system is fully functional!

## Troubleshooting Results

### If Tests Fail, Check:

#### "Schools not loading"
- [ ] Backend server running
- [ ] axios installed
- [ ] cheerio installed
- [ ] Internet connection good
- [ ] pastpapers.ku.ac.ke accessible
- [ ] Check backend console for errors

#### "API returns 404"
- [ ] Routes registered in server file
- [ ] Server restarted after changes
- [ ] Correct path in curl/browser
- [ ] No typos in route names

#### "Download not starting"
- [ ] Check backend console for errors
- [ ] Verify file permissions for storage dir
- [ ] Check disk space available
- [ ] Verify network connectivity

#### "Progress not updating"
- [ ] Check browser console for JS errors
- [ ] Verify processId is valid
- [ ] Check network tab (status polling)
- [ ] Try hard refresh (Ctrl+Shift+R)

#### "Files not downloading"
- [ ] Check storage/pastpapers directory exists
- [ ] Check file permissions (read/write)
- [ ] Check disk space available
- [ ] Check backend console for errors

## Getting Help

1. Check console for error messages
2. Review backend/server.js logs
3. Check network tab in DevTools
4. Re-read installation guide
5. Verify file permissions

## Next Steps After Verification

1. Test with different schools
2. Configure any custom settings
3. Add to production environment
4. Set up monitoring/logging
5. Consider database persistence

---

**Verification Version:** 1.0
**Last Updated:** January 18, 2026
**Status:** Ready for testing
