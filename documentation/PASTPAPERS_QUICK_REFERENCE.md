# PastPapersDownloader - Quick Reference Card

Print this or bookmark it for quick access!

---

## 🚀 Installation (Copy & Paste)

### Step 1: Install Dependencies
```bash
cd backend
npm install axios cheerio uuid
```

### Step 2: Register Routes
Add to `backend/server.js`:
```javascript
const pastPapersRoutes = require('./routes/pastPapersDownloaderRoutes');
app.use('/api/elib/pastpapers', pastPapersRoutes);
```

### Step 3: Add Component
Add to React app:
```javascript
import PastPapersDownloader from './SomaLux/PastPapersDownloader/PastPapersDownloader';

// In routes:
<Route path="/pastpapers" element={<PastPapersDownloader userProfile={userProfile} />} />
```

---

## 📁 Files Created

```
backend/services/pastPapersDownloaderService.js      ✅
backend/routes/pastPapersDownloaderRoutes.js         ✅
src/SomaLux/PastPapersDownloader/PastPapersDownloader.jsx  ✅
src/SomaLux/PastPapersDownloader/PastPapersDownloader.css  ✅
storage/pastpapers/                                  ✅
```

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/elib/pastpapers/schools` | GET | Get all schools |
| `/api/elib/pastpapers/school/:id/papers` | GET | Get papers |
| `/api/elib/pastpapers/paper/:id` | GET | Get paper details |
| `/api/elib/pastpapers/bulk-download` | POST | Start download |
| `/api/elib/pastpapers/download/status/:id` | GET | Get status |
| `/api/elib/pastpapers/download/pause/:id` | POST | Pause |
| `/api/elib/pastpapers/download/resume/:id` | POST | Resume |
| `/api/elib/pastpapers/download/stop/:id` | POST | Stop |
| `/api/elib/pastpapers/downloads/processes` | GET | Get history |

---

## 📊 Schools Available

```
Common Units                          21 papers
School of Agriculture                327 papers
School of Education                1,254 papers ⭐ Largest
School of Humanities              1,027 papers
School of Pure & Applied Sci        790 papers
School of Engineering               443 papers
School of Applied Human Sci         417 papers
School of Business                  356 papers
... and 11 more schools

TOTAL: 6,168+ papers
```

---

## 🎯 Usage Flow

1. **User navigates to `/pastpapers`**
   - Schools grid loads
   - Shows paper count per school

2. **User selects school**
   - Click school card
   - Card highlights

3. **User starts download**
   - Click "Start Download"
   - Progress card appears
   - Real-time updates every 2 seconds

4. **Download progresses**
   - Progress bar fills
   - Stats update
   - Files download to disk

5. **Download completes**
   - Status changes to "completed"
   - Download moved to history
   - Files saved to `storage/pastpapers/{processId}/`

---

## ⏸️ Control Operations

| Action | Button | Result |
|--------|--------|--------|
| Pause | Pause button | Download pauses, progress stays |
| Resume | Resume button | Download continues |
| Stop | Stop button | Download stops, can resume later |
| View History | History section | See all past downloads |

---

## 💾 Storage Location

```
storage/pastpapers/
├── {processId-1}/
│   ├── paper1.pdf
│   ├── paper2.pdf
│   └── ...
├── {processId-2}/
│   ├── paper3.pdf
│   └── ...
```

Each download gets its own folder named with a unique ID.

---

## 📱 Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Installation | 5-10 min |
| First test (21 papers) | 2-3 min |
| Medium school (300 papers) | 5-10 min |
| Large school (1000+ papers) | 15-20 min |

---

## 🐛 Troubleshooting

### Problem: Schools not loading
**Solution:** 
- Check backend running
- Verify axios/cheerio installed
- Check internet connection

### Problem: API returns 404
**Solution:**
- Verify routes registered in server.js
- Restart server
- Check endpoint spelling

### Problem: Download not starting
**Solution:**
- Check storage/pastpapers directory exists
- Check backend console for errors
- Verify file permissions

### Problem: Progress not updating
**Solution:**
- Hard refresh (Ctrl+Shift+R)
- Check browser console
- Verify network tab

### Problem: Files not saving
**Solution:**
- Check disk space
- Verify directory permissions
- Check backend logs

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| PASTPAPERS_QUICKSTART.md | 5-minute setup |
| PASTPAPERS_SYSTEM_DELIVERY_SUMMARY.md | Overview |
| PASTPAPERS_DOWNLOADER_GUIDE.md | Technical details |
| PASTPAPERS_BACKEND_INTEGRATION.md | Integration examples |
| PASTPAPERS_ARCHITECTURE_VISUAL.md | Diagrams |
| PASTPAPERS_VERIFICATION_CHECKLIST.md | Testing |
| PASTPAPERS_DEPENDENCIES.json | NPM packages |
| PASTPAPERS_DOCUMENTATION_INDEX.md | Doc navigation |

---

## 🔧 Configuration

### Change download delay (ms):
In `pastPapersDownloaderService.js`:
```javascript
await this._delay(500);  // Change 500 to desired value
```

### Change polling interval:
In `PastPapersDownloader.jsx`:
```javascript
}, 2000);  // Change 2000 to desired value (milliseconds)
```

### Change download directory:
In `pastPapersDownloaderService.js`:
```javascript
const DOWNLOAD_DIR = path.join(__dirname, '../../your/path');
```

---

## 🚀 Key Features

✅ Download entire schools
✅ Real-time progress tracking
✅ Pause/Resume/Stop operations
✅ Download history with pagination
✅ Error handling & recovery
✅ Responsive mobile design
✅ User-based filtering
✅ Toast notifications

---

## 💻 API Examples

### Get Schools
```bash
curl http://localhost:5000/api/elib/pastpapers/schools
```

### Start Download
```bash
curl -X POST http://localhost:5000/api/elib/pastpapers/bulk-download \
  -H "Content-Type: application/json" \
  -d '{"schoolId":"4384","schoolName":"School of Agriculture","userId":"user-123"}'
```

### Check Status
```bash
curl http://localhost:5000/api/elib/pastpapers/download/status/{processId}
```

### Pause Download
```bash
curl -X POST http://localhost:5000/api/elib/pastpapers/download/pause/{processId}
```

### Resume Download
```bash
curl -X POST http://localhost:5000/api/elib/pastpapers/download/resume/{processId}
```

---

## 📊 Process Object

```json
{
  "id": "UUID-processId",
  "schoolId": "4384",
  "schoolName": "School of Agriculture",
  "status": "running",
  "stats": {
    "total": 100,
    "processed": 45,
    "successful": 42,
    "failed": 2,
    "skipped": 1
  },
  "papers": [...],
  "errors": [...],
  "userId": "user-123",
  "startTime": "2026-01-18T...",
  "endTime": null
}
```

---

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Routes registered
- [ ] Component imported
- [ ] Navigation added
- [ ] Backend running
- [ ] Component loads at /pastpapers
- [ ] Schools list shows
- [ ] Can select school
- [ ] Can start download
- [ ] Progress updates
- [ ] Files download
- [ ] Pause/resume works
- [ ] History shows

---

## 🆘 Emergency Help

**If nothing works:**
1. Check backend console for errors
2. Check browser console (F12)
3. Verify all files exist
4. Restart backend server
5. Hard refresh browser
6. Check PASTPAPERS_VERIFICATION_CHECKLIST.md

---

## 📞 Quick Links

- **Setup:** [PASTPAPERS_QUICKSTART.md](PASTPAPERS_QUICKSTART.md)
- **Overview:** [README_PASTPAPERS_DELIVERY.md](README_PASTPAPERS_DELIVERY.md)
- **Details:** [PASTPAPERS_DOWNLOADER_GUIDE.md](PASTPAPERS_DOWNLOADER_GUIDE.md)
- **Examples:** [PASTPAPERS_BACKEND_INTEGRATION.md](PASTPAPERS_BACKEND_INTEGRATION.md)
- **Testing:** [PASTPAPERS_VERIFICATION_CHECKLIST.md](PASTPAPERS_VERIFICATION_CHECKLIST.md)

---

## 🎉 Ready to Go!

You have everything needed. Start with the Quick Start guide and you'll be downloading papers in 10 minutes!

**Bookmark this page for quick reference** 📌

---

**Created:** January 18, 2026
**Status:** ✅ Production Ready
**Papers Available:** 6,168+
**Setup Time:** 5-10 minutes
