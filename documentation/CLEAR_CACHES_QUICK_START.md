# Quick Reference: Clear All Caches & Upload History

## TL;DR - Three Steps

### 1️⃣ Database Cleanup (Supabase)
```sql
-- Copy from CLEAR_ALL_UPLOADS_AND_CACHES.sql PART 1 & 2
-- Go to Supabase → SQL Editor → Paste & Run
```

### 2️⃣ Browser Console (5 seconds)
```javascript
// Paste this in browser console (F12 → Console)
function c(){let a=0;for(let i=localStorage.length-1;i>=0;i--){let k=localStorage.key(i);if(k.startsWith('pastPapers:')||k.startsWith('universities:')||k.includes('cache')){localStorage.removeItem(k);a++}}sessionStorage.clear();indexedDB.deleteDatabase('books');indexedDB.deleteDatabase('categories');caches.keys().then(n=>n.forEach(x=>caches.delete(x)));console.log(`✅ ${a} items cleared. Hard refresh: Ctrl+Shift+Delete`)}c();
```

### 3️⃣ Hard Refresh Browser
- **Windows:** `Ctrl + Shift + Delete` or `Ctrl + F5`
- **Mac:** `Cmd + Shift + Delete` or `Cmd + Shift + R`

---

## Detailed Cleanup Checklist

```
✅ Backend Files                (Already Done - Dec 14, 7:14 PM)
  ✓ upload-progress.json        → Cleared
  ✓ upload-processes.json       → Cleared
  ✓ All log files (6 files)     → Cleared

⏳ Database (Supabase)
  □ Run SQL Part 1              → Clear file_uploads table
  □ Run SQL Part 2              → Reset all count columns
  □ Verify: SELECT COUNT(*) FROM file_uploads; -- should be 0

⏳ Browser Cache
  □ Open console (F12)
  □ Paste JavaScript
  □ Hard refresh (Ctrl+Shift+Del)

⏳ Services
  □ Restart backend (npm start)
  □ Verify admin page shows empty history
  □ Check upload history is gone
```

---

## Files Created

| File | Purpose | Status |
|------|---------|--------|
| `CLEAR_ALL_UPLOADS_AND_CACHES.sql` | Database cleanup SQL | Created |
| `clear-caches.ps1` | Backend file cleanup | ✅ Executed |
| `clearAllCaches.js` | Browser cache utility | Created |
| `CLEAR_CACHES_GUIDE.md` | Full detailed guide | Created |

---

## What Gets Deleted

### Database (file_uploads, file_downloads tables)
- All upload tracking records
- All download tracking records
- Search event logs
- **NOT DELETED:** Actual PDF files, user accounts, book metadata

### Browser Cache
- localStorage (past paper caches, queries)
- sessionStorage (temporary data)
- IndexedDB (offline data)
- Service Worker caches (PWA data)
- Cookies

### Backend Logs & Tracking
- upload-progress.json (which files uploaded)
- upload-processes.json (upload batch history)
- All error logs from backend
- **NOT DELETED:** Node modules, .env file, database credentials

---

## Verification Commands

```bash
# After cleanup, these should be empty/0:

# PowerShell - Check file sizes
(Get-Item "c:\Magic\SomaLux\backend\upload-progress.json").Length
# Should be small (~26 bytes for empty JSON)

# In Supabase SQL Editor:
SELECT COUNT(*) FROM public.file_uploads;      -- Should be 0
SELECT COUNT(*) FROM public.file_downloads;    -- Should be 0
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Cannot find upload-progress.json" | File exists but was empty already |
| Browser console errors running JS | Copy-paste entire block at once |
| SQL error "table not found" | Check table names in your schema |
| Upload history still shows | Need to restart backend & hard refresh |
| PDFs are gone | This script does NOT delete PDFs - check Storage |

---

## Timeline

- **Dec 14, 19:14** - Backend files cleared ✅
- **Now** - Database and browser pending
- **Est completion** - 5 minutes after running all steps

---

## Support Files

Read these for more context:
- Full guide: `CLEAR_CACHES_GUIDE.md`
- Database setup: `DATABASE_SETUP_COMPLETE.md`
- RLS issues: `TROUBLESHOOTING_RLS_ERROR.md`

---

**Backend Status:** ✅ COMPLETE
**Database Status:** ⏳ PENDING
**Browser Status:** ⏳ PENDING
