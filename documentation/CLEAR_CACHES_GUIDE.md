# Clear All Upload History & System Caches - Complete Guide

## Overview
This comprehensive guide clears all upload history and caches from your system across three layers:
1. **Backend** - Upload tracking files and logs
2. **Database** - Supabase PostgreSQL tables
3. **Frontend** - Browser caches (localStorage, sessionStorage, IndexedDB, Service Workers)

---

## Files Created

### 1. **CLEAR_ALL_UPLOADS_AND_CACHES.sql** (Main Database Cleanup)
- Contains SQL to clear database upload tracking
- Resets all analytics counters
- Includes JavaScript code for browser cleanup

### 2. **clear-caches.ps1** (Backend Cleanup - Already Executed ✅)
- PowerShell script to clear upload tracking files
- Removes all log files
- Status: **COMPLETED** ✅

### 3. **clearAllCaches.js** (Browser Cleanup Utility)
- JavaScript utility for clearing browser caches
- Can be run from browser console
- Clears localStorage, sessionStorage, IndexedDB, Service Workers, cookies

---

## Complete Cleanup Procedure

### Step 1: ✅ Backend Files (COMPLETED)
The PowerShell script has been executed and cleared:
- ✅ upload-progress.json
- ✅ upload-processes.json
- ✅ upload-errors.log
- ✅ bulk-upload-errors.log
- ✅ backend.log
- ✅ error.log
- ✅ live.log
- ✅ test-output.txt

**Status: DONE**

---

### Step 2: Clear Database (Supabase)

#### Option A: Using SQL Editor (Recommended)
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file: `CLEAR_ALL_UPLOADS_AND_CACHES.sql`
3. Copy **PART 1 & PART 2** sections (SQL code)
4. Paste into Supabase SQL Editor
5. Click **Run**

#### Option B: Using CLI
```bash
# Connect to Supabase via CLI and run the SQL file
supabase db push CLEAR_ALL_UPLOADS_AND_CACHES.sql
```

#### What Gets Cleared:
- ✅ file_uploads table
- ✅ file_downloads table
- ✅ audit logs (upload/download related)
- ✅ search_events table
- ✅ All download/view counts reset to 0

---

### Step 3: Clear Browser Caches

#### Method 1: Using Browser Console (Easiest)
1. **Open your browser** (Chrome, Firefox, Edge, Safari)
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Copy and paste this entire code block:

```javascript
// Clear All Caches - Copy and paste this entire block into browser console

function clearCaches() {
  console.clear();
  console.log('Clearing all caches...');
  
  // 1. Clear localStorage
  const localStoragePatterns = [
    'pastPapers:', 'universities:', 'dropdown', 'myPrivacyCache',
    'userProfile', 'books:', 'authors:', 'cacheControl', 'cache_'
  ];
  let clearedLS = 0;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (localStoragePatterns.some(p => key.startsWith(p))) {
      localStorage.removeItem(key);
      clearedLS++;
    }
  }
  console.log(`✓ Cleared ${clearedLS} localStorage items`);
  
  // 2. Clear sessionStorage
  sessionStorage.clear();
  console.log(`✓ Cleared sessionStorage`);
  
  // 3. Clear cookies
  document.cookie.split(";").forEach(c => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    if (name) {
      document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
    }
  });
  console.log(`✓ Cleared cookies`);
  
  // 4. Clear IndexedDB
  const dbs = ['books', 'categories', 'authors', 'past_papers', 'SomaLux'];
  dbs.forEach(db => {
    indexedDB.deleteDatabase(db);
  });
  console.log(`✓ Cleared IndexedDB`);
  
  // 5. Clear Service Worker caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
      console.log(`✓ Cleared ${names.length} service worker caches`);
    });
  }
  
  console.log('✅ ALL CACHES CLEARED!');
  console.log('Now do a hard refresh: Ctrl+Shift+Delete or Cmd+Shift+Delete');
}

clearCaches();
```

5. Press **Enter**
6. You should see messages confirming caches were cleared

#### Method 2: Using clearAllCaches.js File
1. Import the utility in your React component:
```javascript
import { clearAllCaches } from './utils/clearAllCaches.js';

// Call the function
clearAllCaches();
```

#### What Gets Cleared:
- ✅ localStorage (all past paper, university, dropdown caches)
- ✅ sessionStorage (all session data)
- ✅ IndexedDB databases (books, categories, authors)
- ✅ Service Worker caches
- ✅ Cookies

---

### Step 4: Hard Refresh Browser

After clearing caches, do a hard refresh to ensure fresh data is loaded:

**Windows/Linux:**
- Press **Ctrl + Shift + Delete**
- OR press **Ctrl + F5**

**Mac:**
- Press **Cmd + Shift + Delete**
- OR press **Cmd + Shift + R**

Alternatively, in Developer Tools:
- Right-click the reload button
- Select "Empty cache and hard reload"

---

### Step 5: Restart Services

1. **Stop Backend Server:**
   ```bash
   # In PowerShell from c:\Magic\SomaLux\backend
   # Press Ctrl+C to stop current server
   ```

2. **Restart Backend Server:**
   ```bash
   npm start
   # or
   node index.js
   ```

3. **Verify Services:**
   - Backend running: http://localhost:5000
   - Frontend running: Check your dev server

---

### Step 6: Verification

#### Check Backend Files
```bash
# Files should be empty now:
ls -la c:\Magic\SomaLux\backend\upload-progress.json
ls -la c:\Magic\SomaLux\backend\upload-processes.json
```

#### Check Database (In Supabase)
```sql
-- Should return 0
SELECT COUNT(*) FROM public.file_uploads;
SELECT COUNT(*) FROM public.file_downloads;
```

#### Check Browser
1. Open Admin Panel
2. Go to Auto Upload / Upload History
3. Should show **empty history**
4. All upload tracking should be cleared

#### Check Downloads/Views
1. View any book or past paper
2. View counts should be fresh (start from 0)
3. Download history should be empty

---

## Summary of Changes

| Component | Action | Status |
|-----------|--------|--------|
| Backend upload-progress.json | Cleared & reset to empty array | ✅ Done |
| Backend upload-processes.json | Cleared & reset to empty object | ✅ Done |
| Backend log files | All cleared (8 files) | ✅ Done |
| Database file_uploads | Truncated (will be cleared with SQL) | ⏳ Pending |
| Database file_downloads | Truncated (will be cleared with SQL) | ⏳ Pending |
| Database audit logs | Delete upload-related entries | ⏳ Pending |
| Browser localStorage | Clear cached queries & user data | ⏳ Pending |
| Browser IndexedDB | Delete all cached databases | ⏳ Pending |
| Browser Service Workers | Clear all cache storage | ⏳ Pending |

---

## Troubleshooting

### Issue: "Permission denied" on files
**Solution:** Run PowerShell as Administrator
```bash
# Run as admin
powershell -ExecutionPolicy Bypass -File "clear-caches.ps1"
```

### Issue: Supabase SQL errors
**Solution:** 
- Check that table names match your schema
- Verify you're using the correct Supabase project
- Run tables one at a time if bulk fails

### Issue: Browser cache still showing old data
**Solution:**
- Clear browser cache manually: Ctrl+Shift+Delete
- Check that Service Workers are unregistered
- Try in Incognito mode to verify

### Issue: Upload history still visible
**Solution:**
- Ensure SQL was actually executed (check Supabase logs)
- Verify upload-processes.json was cleared
- Restart backend server
- Check that you're logged in as admin

---

## Additional Notes

### What Was NOT Deleted
- ✅ Actual file uploads (PDFs, images in Supabase Storage) - These are preserved
- ✅ User profiles and accounts - Preserved
- ✅ Book/Paper metadata - Preserved
- ✅ Analytics tables - Preserved (but counts reset)

### What CAN Still Be Re-tracked
- New uploads will be tracked from this point forward
- New analytics will be collected
- Cache will rebuild as users interact with the system

### Recovery
If you need to restore upload history:
1. Check if you have backups (database dumps)
2. Review Supabase activity logs
3. Contact Supabase support for point-in-time recovery

---

## Next Steps

1. ✅ **Backend files cleared** - Done
2. ⏳ **Run SQL in Supabase** - Next
3. ⏳ **Clear browser caches** - After SQL
4. ⏳ **Hard refresh browser** - After caches
5. ⏳ **Restart services** - After browser
6. ✅ **Verify everything** - Final step

---

## Questions?

For issues or questions:
1. Check [TROUBLESHOOTING_RLS_ERROR.md](TROUBLESHOOTING_RLS_ERROR.md)
2. Review [DATABASE_SETUP_COMPLETE.md](DATABASE_SETUP_COMPLETE.md)
3. Check backend logs: `backend/backend.log`

---

**Last Updated:** 2025-12-14
**Status:** Backend cleanup complete - Awaiting database and browser cleanup
