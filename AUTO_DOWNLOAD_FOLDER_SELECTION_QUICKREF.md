# Auto Download Folder Selection - Quick Reference

## 🎯 What Was Added

Users can now **select which folder to download files into** instead of always using the default Downloads folder.

## ✨ Key Features

| Feature | Details |
|---------|---------|
| **Folder Selection Modal** | Click "Folder" button to open modal |
| **Create Folders** | Create new folders on-the-fly |
| **Persistent Selection** | Selected folder remembered across sessions |
| **Default Folders** | Downloads, Documents, Books, Past Papers, Research |
| **Validation** | Safe folder path handling, no special characters |
| **Integration** | Works with Books downloads and Past Papers auto-download |

## 📂 Components

| File | Purpose | Type |
|------|---------|------|
| `FolderSelectModal.jsx` | Folder selection dialog | ✨ NEW |
| `FolderSelectModal.css` | Modal styling | ✨ NEW |
| `downloadFolderManager.js` | Folder utility functions | ✨ NEW |
| `PastPapersAutoDownload.jsx` | Auto-download component | 🔧 UPDATED |
| `Download.jsx` | Book download component | 🔧 UPDATED |
| `backend/index.js` | API endpoints | 🔧 UPDATED |

## 🚀 How Users Use It

### Books Download
```
Open Book → Click Download → Select Folder → Confirm → Download saved to folder
```

### Past Papers Auto-Download
```
Open Admin Dashboard → Paste DSpace URL → Click Folder → Create/Select folder → 
Start Download → All PDFs save to selected folder
```

## 🔌 API Endpoints (New)

```
GET    /api/elib/download-folders              - List folders
POST   /api/elib/download-folders              - Create folder
POST   /api/elib/download-folders/validate     - Validate path
GET    /api/elib/download-folders/preferences  - Get prefs
POST   /api/elib/download-folders/preferences  - Save prefs
```

## 💾 Data Storage

**Client-side (localStorage):**
- `selectedDownloadFolder` - Current folder
- `downloadFoldersHistory` - Last 10 folders

**Server-side (Optional Supabase):**
- `user_preferences` table with download folder settings

## 📊 Files Modified Summary

| Component | Changes |
|-----------|---------|
| PastPapersAutoDownload.jsx | +40 lines |
| Download.jsx | +50 lines |
| backend/index.js | +220 lines (5 endpoints) |

**Files Created: 3**
- FolderSelectModal.jsx (~280 lines)
- FolderSelectModal.css (~400 lines)
- downloadFolderManager.js (~300 lines)

## 🧪 Test These Scenarios

- [ ] Select folder before downloading a book
- [ ] Create new folder in modal
- [ ] Download from Past Papers with selected folder
- [ ] Close and reopen - folder still selected
- [ ] Download multiple files to same folder
- [ ] Switch folders between downloads
- [ ] Create folder with special characters (should fail)
- [ ] Works on mobile devices

## ⚙️ Configuration

**Default Folders:**
```javascript
const defaultFolders = [
  'Downloads',
  'Documents', 
  'Books',
  'Past Papers',
  'Research'
];
```

**Customize in FolderSelectModal.jsx** - modify `loadFolders()` function

## 🎨 UI Elements

### Folder Button
Location: Next to "Paste" button in Auto Download  
Icon: Folder icon  
Color: Green on hover  
Action: Opens FolderSelectModal

### Folder Display
Location: Below URL input in Auto Download  
Shows: Current selected folder  
Format: `📁 Download Folder: [folder-name]`

## 🔐 Security

- All paths sanitized (no special characters)
- No directory traversal possible
- Server-side validation on all APIs
- Per-user preference storage

## 🎓 For Developers

### Import utilities:
```javascript
import { getSelectedFolder, setSelectedFolder } from '../utils/downloadFolderManager';
```

### Use in components:
```javascript
const [selectedFolder, setSelectedFolder] = useState(() => getSelectedFolder());
```

### Call API directly:
```javascript
// Create folder
fetch('/api/elib/download-folders', {
  method: 'POST',
  body: JSON.stringify({ folderName: 'My Folder' })
})
```

## 📖 Full Documentation

See **[AUTO_DOWNLOAD_FOLDER_SELECTION.md](AUTO_DOWNLOAD_FOLDER_SELECTION.md)** for:
- Complete API documentation
- Code examples
- Testing scenarios
- Troubleshooting
- Architecture details

## ✅ Deployment Steps

1. **Verify files exist:**
   - ✅ FolderSelectModal.jsx
   - ✅ FolderSelectModal.css
   - ✅ downloadFolderManager.js
   - ✅ Updated PastPapersAutoDownload.jsx
   - ✅ Updated Download.jsx
   - ✅ Updated backend/index.js

2. **Test locally:**
   - Run frontend dev server
   - Test folder selection with books
   - Test folder creation
   - Verify persistence

3. **Deploy:**
   - Push to production
   - No database migration needed (optional)
   - Monitor for errors

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Folder modal not showing | Check React imports, verify `isOpen` state |
| Selection not persisting | Check localStorage in DevTools |
| Downloads to wrong folder | Verify folder path in filename |
| Modal has errors | Check console for JavaScript errors |

## 🔗 Related Documentation

- [AUTODOWNLOAD_DSPACE_FIX.md](AUTODOWNLOAD_DSPACE_FIX.md) - Auto-download system
- [PASTPAPERS_AUTOUPLOAD_QUICKSTART.md](PASTPAPERS_AUTOUPLOAD_QUICKSTART.md) - Past Papers upload
- [BOOK_DOWNLOADS_INDEX.md](BOOK_DOWNLOADS_INDEX.md) - Book downloads

---

**Status:** ✅ Ready for Testing  
**Date:** January 18, 2026
