# Auto-Extraction Testing & Debugging Guide

## What Was Fixed

The auto-extraction now:
1. **Waits for universities to load** - 500ms delay ensures data is ready
2. **Passes universities to extraction** - Prevents empty list check failure
3. **Improved regex patterns** - More flexible matching for university/faculty names
4. **Better error logging** - Console shows exactly what's happening
5. **Supports more text variations** - Handles different formatting

## How to Test

### Step 1: Check Browser Console
When you select a folder:
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Select your PDF folder
4. Watch for these logs:
   - `Found X PDF files`
   - `Extracting metadata from PDF...`
   - `Extracted metadata: { university: "...", faculty: "..." }`
   - `Attempting to match university: ...`
   - `Matched university ID: ...` (should show UUID, not null)

### Step 2: Create Test PDF

**Simple test with text-based PDF:**
1. Open Word or Google Docs
2. Type this exactly on page 1:
```
UNIVERSITY OF NAIROBI

FACULTY OF SCIENCE

BIOLOGY 101
EXAMINATION PAPER
2023
```
3. Save as PDF named: `BIO101_Biology1_2023_1_Main.pdf`
4. Upload the PDF folder to test

### Step 3: Expected Flow

✅ **Success Flow:**
1. Select folder → Toast: "Found 1 PDF files"
2. Wait 2-3 seconds
3. Toast: "Extracting metadata from PDF..."
4. Toast: "✓ Auto-filled: University & Faculty detected from PDF"
5. **Dropdowns hidden** - Ready to upload
6. Click Upload → Files upload automatically

❌ **Failure Flow:**
1. Select folder → Toast: "Found 1 PDF files"
2. Wait 2-3 seconds
3. Toast: "Could not auto-detect - please select manually"
4. **Dropdowns appear** - You select University & Faculty
5. Click Upload → Files upload

## Debugging Steps

### If Dropdowns Still Appear (Auto-Detection Failed)

**Check 1: Open Browser Console**
```
F12 → Console tab
```

**Look for this log:**
```
Extracted metadata: {
  university: null,  ← If null, extraction failed
  faculty: null,
  ...
}
```

**If university is null:**
- ❌ PDF doesn't have "UNIVERSITY OF [NAME]" pattern
- ❌ Text not extractable (scanned image PDF)
- ❌ University name in different format

**If university is "something but doesn't match":**
- Log shows: `Matched university ID: null` 
- Means extracted name doesn't match system database

**Solution:**
1. Update PDF to include exact university name
2. Use manual dropdown selection (override)
3. Check if university exists in system

### If Faculty Doesn't Auto-Fill

**Check the log for:**
```
Matched university ID: ...  ← Should have value
```

If this shows null, university matching failed (see above).

If it shows a value but faculty doesn't fill:
1. Faculties list didn't load - API issue
2. Extracted faculty text doesn't match database

**Solution:**
1. Check API is working: Open DevTools → Network tab
2. Look for request to `/api/elib/faculties/:id`
3. Check response has faculty data

### If APIs Not Responding

**Check Network Tab:**
1. F12 → Network tab
2. Filter by "fetch"
3. Select folder and watch for API calls
4. Look for `/api/elib/universities/dropdown`
5. Check if response status is 200 (success)

**If 404 or failed:**
- Backend API not running
- Endpoint path wrong
- CORS issue

**Solution:**
1. Check backend is running: `npm start` in backend folder
2. Verify API endpoints exist
3. Check CORS configuration

## Sample PDF Content

### Good (Will Auto-Extract)
```
UNIVERSITY OF NAIROBI
FACULTY OF SCIENCE
SCHOOL OF BIOLOGICAL SCIENCES

BIOLOGY 101 - GENERAL BIOLOGY
FIRST SEMESTER EXAMINATION
2023
MAIN EXAM

[Rest of exam content]
```

### Also Good (Different Format)
```
NAIROBI UNIVERSITY
DEPARTMENT OF MEDICINE
ANATOMY 301
SUPPLEMENTARY EXAMINATION
SEMESTER 2
2023
[Content]
```

### Won't Extract (Missing Key Info)
```
[Exam content without university name]
```

## Console Commands for Testing

Paste these in browser console to test matching manually:

```javascript
// Test if extraction utility is loaded
console.log(window.extractPastPaperMetadata ? 'Loaded' : 'Not loaded');

// Test fuzzy matching (if you have access to the functions)
// This requires the functions to be exported globally
```

## Quick Checklist

### Before Testing:
- [ ] PDF is text-based (not scanned image)
- [ ] University name on page 1 of PDF
- [ ] Faculty name on page 1 of PDF
- [ ] Backend API running (`npm start` in backend)
- [ ] Browser console ready (F12)

### During Testing:
- [ ] Watch browser console for logs
- [ ] Check Network tab for API calls
- [ ] Verify universities list loaded
- [ ] Check extracted metadata values
- [ ] Note matched university ID

### After Testing:
- [ ] Document which PDFs work
- [ ] Note any extraction patterns that failed
- [ ] Report errors from console
- [ ] Test with more PDF variations

## Expected Console Output

### Successful Auto-Detection:
```
Extracted metadata: {
  university: "UNIVERSITY OF NAIROBI",
  faculty: "FACULTY OF SCIENCE",
  unitCode: "BIO101",
  ...
}
Attempting to match university: UNIVERSITY OF NAIROBI
Matched university ID: 12345678-abcd-1234-abcd-123456789abc
```

### Failed Auto-Detection:
```
Extracted metadata: {
  university: null,  ← Problem here
  faculty: null,
  ...
}
No metadata.university or universities empty
```

### Fuzzy Match Success:
```
Attempting to match university: NAIROBI UNIVERSITY
Matched university ID: 12345678-abcd-1234-abcd-123456789abc
```

## Troubleshooting Commands

**Check if pdfjs is loaded:**
```
console.log(window.pdfjsLib ? 'PDF.js loaded' : 'PDF.js NOT loaded')
```

**Check component state (if accessible):**
```
// These won't work without DevTools extension, but worth trying
console.log('Universities:', window.__universities)
```

## Known Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Dropdowns appear | Text not extracted | Use manual selection |
| Wrong university selected | Fuzzy match too loose | Update PDF with exact name |
| Faculty list empty | University ID wrong | Check console for matched ID |
| "Could not auto-detect" | API failed | Restart backend |
| Upload fails | Metadata missing | Check all fields filled |

## Next Steps If Still Not Working

1. **Share console logs:**
   - F12 → Console → Right-click → Save as file
   - Share the logged output

2. **Check API responses:**
   - F12 → Network → Select folder
   - Look at `/api/elib/universities/dropdown` response
   - Copy the response JSON

3. **Test with simpler PDF:**
   - Create minimal PDF with just:
     ```
     UNIVERSITY OF NAIROBI
     FACULTY OF SCIENCE
     ```
   - See if extraction works

4. **Verify backend:**
   - Check backend is running
   - Test APIs directly with curl or Postman
   - Check database has universities

## Testing Checklist Summary

```
✅ Read this guide
✅ Prepare test PDF with university/faculty on page 1
✅ Open browser console (F12)
✅ Select PDF folder
✅ Watch console for extraction logs
✅ Check if university ID matched
✅ Check if faculty populated
✅ If not, check API responses in Network tab
✅ Document any errors
✅ Try override if auto-detection fails
```

---

**Key Point:** The system now waits for universities to load before extracting, and logs everything to console. Use F12 to see exactly what's happening!
