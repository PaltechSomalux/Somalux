# PastPapersDownloader - Quick Integration Guide

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install axios cheerio uuid
```

### Step 2: Register API Routes

Open your main backend file (e.g., `backend/server.js` or `backend/app.js`):

```javascript
// Add these lines near your other route registrations:

const pastPapersRoutes = require('./routes/pastPapersDownloaderRoutes');

// Register the routes (preferably after other /api/elib routes)
app.use('/api/elib/pastpapers', pastPapersRoutes);
```

### Step 3: Create Storage Directory
```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Path "storage\pastpapers" -Force

# Or using bash:
mkdir -p storage/pastpapers
```

### Step 4: Import Component in Your App

Find your main app file (e.g., `Dashboard.jsx` or `App.jsx`):

```javascript
// Add import at the top
import PastPapersDownloader from './SomaLux/PastPapersDownloader/PastPapersDownloader';

// Add route (if using React Router):
<Route path="/pastpapers" element={<PastPapersDownloader userProfile={userProfile} />} />

// Or add as a tab/section in your UI
```

### Step 5: Add Navigation Link

Find your navigation component and add:

```javascript
<NavLink to="/pastpapers">
  <FiDownload /> Download Past Papers
</NavLink>
```

### Step 6: Test It

1. Start your backend server
2. Navigate to `/pastpapers` in your app
3. You should see a list of schools
4. Select a school and click "Start Download"
5. Watch the progress in real-time

## File Structure Created

```
SomaLux/
├── PastPapersDownloader/
│   ├── PastPapersDownloader.jsx
│   └── PastPapersDownloader.css

backend/
├── services/
│   └── pastPapersDownloaderService.js
├── routes/
│   └── pastPapersDownloaderRoutes.js

storage/
└── pastpapers/
    ├── {processId}/
    │   ├── paper1.pdf
    │   └── ...

PASTPAPERS_DOWNLOADER_GUIDE.md
PASTPAPERS_QUICKSTART.md (this file)
```

## API Endpoints Available

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/elib/pastpapers/schools` | Get all schools |
| GET | `/api/elib/pastpapers/school/:id/papers?page=1` | Get papers from school |
| GET | `/api/elib/pastpapers/paper/:id` | Get paper details & download links |
| POST | `/api/elib/pastpapers/bulk-download` | Start download process |
| GET | `/api/elib/pastpapers/download/status/:processId` | Get download status |
| POST | `/api/elib/pastpapers/download/pause/:processId` | Pause download |
| POST | `/api/elib/pastpapers/download/resume/:processId` | Resume download |
| POST | `/api/elib/pastpapers/download/stop/:processId` | Stop download |
| GET | `/api/elib/pastpapers/downloads/processes` | Get all processes |

## Customization

### Change Download Directory
In `backend/services/pastPapersDownloaderService.js`:

```javascript
const DOWNLOAD_DIR = path.join(__dirname, '../../your/custom/path');
```

### Change Download Delay (respect server)
In `_executeBulkDownload` method:

```javascript
// Default is 500ms. Change to:
await this._delay(1000);  // 1 second
```

### Change Polling Interval
In `PastPapersDownloader.jsx`:

```javascript
// Change from 2000ms to:
}, 5000);  // Poll every 5 seconds instead of 2
```

## Connecting to Database (Optional)

For persistent storage, modify the service:

```javascript
// In pastPapersDownloaderService.js

async getAllProcesses(userId = null) {
  // Fetch from database instead of memory
  const query = userId 
    ? { userId } 
    : {};
  
  return await db.collection('downloadProcesses').find(query).toArray();
}
```

## Common Issues & Solutions

### Issue: "Cannot find module 'axios'"
**Solution:**
```bash
npm install axios
```

### Issue: "Routes not found (404)"
**Solution:** Make sure you registered routes before starting server:
```javascript
app.use('/api/elib/pastpapers', pastPapersRoutes);
app.listen(5000);
```

### Issue: "Downloads folder not created"
**Solution:** Create manually:
```bash
mkdir -p storage/pastpapers
```

### Issue: "No schools showing"
**Solution:** 
- Check internet connection
- Check if pastpapers.ku.ac.ke is accessible
- Check backend console for errors

### Issue: "Download fails with 500 error"
**Solution:** 
- Check backend logs
- Verify axios is installed
- Check cheerio is installed

## Next Steps

1. **Test with a small school** first (e.g., "Common Units" with 21 papers)
2. **Monitor backend console** for any errors
3. **Check storage/pastpapers** for downloaded files
4. **Use browser DevTools** to see network requests
5. **Expand to larger schools** once working

## Key Features to Try

✅ Select a school and start downloading
✅ Watch real-time progress updates
✅ Pause a download mid-way
✅ Resume a paused download
✅ Stop a download
✅ View download history
✅ Resume incomplete downloads

## Performance Notes

- **First load:** Schools list fetches from DSpace (1-2 seconds)
- **Downloading:** ~500ms per paper (respects server)
- **Large schools:** "School of Education" has 1254 papers (~10 minutes)
- **Progress updates:** Every 2 seconds via polling

## Support

For detailed information, see: `PASTPAPERS_DOWNLOADER_GUIDE.md`

## Success Checklist

- [ ] Dependencies installed (`npm install axios cheerio uuid`)
- [ ] Routes registered in backend
- [ ] Storage directory created
- [ ] Component imported in main app
- [ ] Navigation link added
- [ ] Backend server running
- [ ] Can access `/pastpapers` route
- [ ] Schools list loads
- [ ] Can select a school
- [ ] Can start a download
- [ ] Progress updates in real-time
- [ ] Files appear in `storage/pastpapers`

Once all checkboxes are done, you're ready to use the system! 🎉
