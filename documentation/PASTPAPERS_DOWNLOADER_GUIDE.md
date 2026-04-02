# PastPapersDownloader - Complete System Guide

## Overview
The **PastPapersDownloader** system is a reverse AutoUpload system that enables bulk downloading of past papers from Kenyatta University's DSpace repository (https://pastpapers.ku.ac.ke/).

## Features

### 1. **School/Community Selection**
   - Browse all available schools from DSpace
   - See paper count for each school
   - Select one school to download from
   - Visual feedback for selected school

### 2. **Bulk Download Management**
   - Start downloads from selected schools
   - Track download progress in real-time
   - Monitor statistics: processed, successful, failed, skipped
   - View progress percentage

### 3. **Download Control**
   - **Pause**: Temporarily stop the download process
   - **Resume**: Continue a paused or failed download
   - **Stop**: Halt the current download (can be resumed later)
   - Downloads can be resumed even after the app restarts

### 4. **Download History**
   - View all completed and failed downloads
   - Filter by process status
   - Resume incomplete downloads
   - Track download statistics per process

### 5. **Error Handling**
   - Detailed error logging
   - Display first 5 errors in progress view
   - Continue downloading even if some papers fail
   - Graceful handling of network issues

## Architecture

### Backend Components

#### 1. **pastPapersDownloaderService.js** (`backend/services/`)
Service class that handles all download logic:

```javascript
// Key Methods:
getSchools()                    // Fetch all communities
getSchoolPapers(handle, page)   // Get papers from a school
getPaperDetails(paperId)        // Get download links for a paper
startBulkDownload(config)       // Start bulk download process
pauseDownload(processId)        // Pause download
resumeDownload(processId)       // Resume download
stopDownload(processId)         // Stop download
getProcessStatus(processId)     // Get current status
getAllProcesses(userId)         // Get all processes
```

**Key Features:**
- Respects server with 500ms delays between downloads
- Parses DSpace HTML using Cheerio
- Stores downloads organized by processId
- Maintains in-memory process tracking

#### 2. **pastPapersDownloaderRoutes.js** (`backend/routes/`)
RESTful API endpoints:

```
GET    /api/elib/pastpapers/schools
GET    /api/elib/pastpapers/school/:schoolHandle/papers?page=1
GET    /api/elib/pastpapers/paper/:paperId
POST   /api/elib/pastpapers/bulk-download
GET    /api/elib/pastpapers/download/status/:processId
POST   /api/elib/pastpapers/download/pause/:processId
POST   /api/elib/pastpapers/download/resume/:processId
POST   /api/elib/pastpapers/download/stop/:processId
GET    /api/elib/pastpapers/downloads/processes?userId=123
```

### Frontend Components

#### **PastPapersDownloader.jsx** (React Component)
Features:
- School selection grid
- Real-time progress tracking (polls every 2 seconds)
- Modal confirmations for important actions
- Toast notifications for user feedback
- Pagination for download history
- Resume incomplete download dialog

#### **PastPapersDownloader.css**
- Gradient backgrounds matching app theme
- Responsive grid layouts
- Animation effects (slide up, fade in, pulse)
- Mobile-friendly design
- Status-based color coding

## Installation & Setup

### 1. Install Required Dependencies

```bash
cd backend
npm install axios cheerio
```

### 2. Register Routes in Backend

In your main Express app file (e.g., `backend/app.js` or `backend/server.js`):

```javascript
const pastPapersRoutes = require('./routes/pastPapersDownloaderRoutes');

// Add route before other routes
app.use('/api/elib/pastpapers', pastPapersRoutes);
```

### 3. Create Storage Directory

```bash
mkdir -p storage/pastpapers
```

### 4. Add Component to Navigation

In your main navigation component (e.g., `Dashboard.jsx`):

```javascript
import PastPapersDownloader from '../PastPapersDownloader/PastPapersDownloader';

// Inside your routes or tabs:
<Route path="/pastpapers" element={<PastPapersDownloader userProfile={userProfile} />} />

// Or in tabs:
<Tab title="Download Papers">
  <PastPapersDownloader userProfile={userProfile} />
</Tab>
```

### 5. Import CSS in Your App

```javascript
import './styles/PastPapersDownloader.css';
```

## API Response Examples

### Get Schools
```json
{
  "ok": true,
  "schools": [
    {
      "id": "4384",
      "name": "School of Agriculture And Enterprise Development",
      "url": "/handle/123456789/4384",
      "paperCount": 327,
      "type": "community"
    }
  ],
  "count": 18
}
```

### Get School Papers
```json
{
  "ok": true,
  "papers": [
    {
      "id": "11165",
      "title": "Economics of Education and Educational Planning",
      "code": "EMP723(2023-05)",
      "url": "/handle/123456789/11165",
      "school": "4392",
      "hasDownload": false
    }
  ],
  "hasNextPage": true,
  "page": 1,
  "totalOnPage": 20
}
```

### Start Bulk Download
```json
{
  "ok": true,
  "process": {
    "id": "a1b2c3d4-e5f6-g7h8-i9j0",
    "schoolId": "4384",
    "schoolName": "School of Agriculture And Enterprise Development",
    "status": "running",
    "startTime": "2026-01-18T10:30:00Z",
    "stats": {
      "total": 0,
      "processed": 0,
      "successful": 0,
      "failed": 0,
      "skipped": 0
    },
    "papers": [],
    "errors": [],
    "userId": "user123",
    "downloadDir": "/path/to/storage/pastpapers/a1b2c3d4-e5f6-g7h8-i9j0"
  }
}
```

### Process Status Update
```json
{
  "ok": true,
  "process": {
    "id": "a1b2c3d4-e5f6-g7h8-i9j0",
    "status": "running",
    "stats": {
      "total": 100,
      "processed": 45,
      "successful": 42,
      "failed": 2,
      "skipped": 1
    },
    "papers": [
      {
        "id": "11165",
        "title": "Economics of Education and Educational Planning",
        "code": "EMP723(2023-05)",
        "downloaded": true,
        "filename": "EMP723.pdf"
      }
    ]
  }
}
```

## Usage Flow

### 1. **Start a Download**
   1. Component loads and fetches all schools
   2. User sees grid of schools with paper counts
   3. User clicks a school card to select it
   4. User clicks "Start Download" button
   5. System creates a process and begins downloading

### 2. **Monitor Progress**
   1. Progress card appears showing real-time stats
   2. Progress bar fills up as papers are downloaded
   3. Statistics update every 2 seconds
   4. User can see processed, successful, failed, skipped counts

### 3. **Pause/Resume**
   1. User clicks "Pause" button during download
   2. Download pauses and maintains state
   3. User can close browser or navigate away
   4. User returns and clicks "Resume" to continue
   5. Download picks up where it left off

### 4. **Stop a Download**
   1. User clicks "Stop" button
   2. Confirmation modal appears
   3. Shows papers downloaded so far
   4. User can resume later from download history

### 5. **View History**
   1. All past downloads shown in history grid
   2. Each card shows school, status, statistics
   3. Completed downloads marked with green status
   4. Failed/paused downloads show resume button

## Data Storage

### Directory Structure
```
storage/
└── pastpapers/
    ├── process-id-1/
    │   ├── paper1.pdf
    │   ├── paper2.pdf
    │   └── ...
    ├── process-id-2/
    │   ├── paper3.pdf
    │   └── ...
    └── ...
```

### In-Memory Process Tracking
Processes are stored in a Map in the service:
```javascript
activeDownloads = new Map([
  [processId, processObject],
  ...
])
```

## Database Integration (Optional)

To persist processes to database, modify the service:

```javascript
// In pastPapersDownloaderService.js

async startBulkDownload(config) {
  const process = { /* ... */ };
  
  // Save to database
  await db.downloadProcesses.create({
    id: process.id,
    schoolId: config.schoolId,
    userId: config.userId,
    status: 'running',
    stats: process.stats,
    startTime: process.startTime
  });
  
  this.activeDownloads.set(processId, process);
  return process;
}

// Update status periodically
async _executeBulkDownload(process, config) {
  try {
    // ... download logic
    
    // Update database
    await db.downloadProcesses.update(process.id, {
      stats: process.stats,
      papers: process.papers,
      errors: process.errors
    });
  } catch (error) {
    // error handling
  }
}
```

## Configuration Options

### Timeout Settings (in service)
```javascript
const DOWNLOAD_TIMEOUT = 30000;  // 30 seconds
const STATUS_POLL_INTERVAL = 2000;  // 2 seconds (UI)
const SERVER_DELAY = 500;  // 500ms between downloads
```

### To Modify:
Edit `backend/services/pastPapersDownloaderService.js`:
- Change `DSPACE_BASE_URL` for different repositories
- Adjust delays for faster/slower downloads
- Modify selectors if DSpace HTML structure changes

## Error Handling

### Types of Errors Handled
1. **Network Errors**: Timeout, connection refused
2. **Parse Errors**: Invalid HTML structure
3. **Download Errors**: File not found, permission denied
4. **Server Errors**: 500, 503 responses

### Error Recovery
- Failed downloads don't stop the process
- Failed papers added to errors array
- Process continues with next paper
- User can resume and retry failed papers

## Browser Compatibility
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

### Optimization Strategies
1. **Delay Between Downloads**: 500ms default prevents server overload
2. **Pagination**: Papers fetched 20 at a time
3. **Streaming Download**: Files streamed to disk (not buffered)
4. **Efficient Polling**: UI polls every 2 seconds (not 1s)

### Scale Considerations
- Supports unlimited downloads via separate processes
- Each process independent
- Pagination handles large school collections
- Memory footprint: ~1KB per process stored

## Troubleshooting

### Downloads Not Starting
- Check backend server is running
- Verify API routes registered
- Check browser console for errors
- Ensure axios is installed

### Papers Not Found
- DSpace HTML structure may have changed
- Check selectors in `pastPapersDownloaderService.js`
- Use browser dev tools to inspect actual HTML

### Slow Downloads
- Default 500ms delay respects server
- Reduce `_delay(500)` if needed
- Check network speed
- Large PDFs take longer

### Resume Not Working
- Process status must be 'paused' or 'failed'
- Check processId matches in database
- Verify process directory exists

## Future Enhancements

1. **Database Persistence**
   - Store processes in PostgreSQL/MongoDB
   - Retrieve processes after restart

2. **Advanced Filtering**
   - Filter papers by date range
   - Filter by subject/author
   - Selective download (not all papers)

3. **Compression**
   - Zip downloaded papers
   - Create category-wise archives

4. **Cloud Storage**
   - Upload to Google Drive/Dropbox
   - S3 integration

5. **Email Notifications**
   - Notify when download completes
   - Send download summary

6. **Download Analytics**
   - Most downloaded papers
   - Popular schools
   - Download trends

## Support & Troubleshooting

For issues:
1. Check browser console for errors
2. Check backend server logs
3. Verify all dependencies installed
4. Check network requests in DevTools

## License
Same as SomaLux application
