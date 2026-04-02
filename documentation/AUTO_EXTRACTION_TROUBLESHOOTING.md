# Auto-Extraction - Troubleshooting Guide

## Why You're Seeing "Could not auto-detect - please select manually"

The system couldn't find University or Faculty in your PDF. This happens when:

### Reason 1: PDF doesn't have extractable text
- **Symptom:** Scanned image PDF (not a real PDF document)
- **Solution:** Use text-based PDFs, not scanned images
- **Test:** Try to select text in the PDF. If you can't, it's a scanned image

### Reason 2: University/Faculty names not on page 1
- **Symptom:** Names are on page 2 or later
- **Solution:** Move university/faculty info to first page
- **Format needed:**
  ```
  UNIVERSITY OF NAIROBI
  FACULTY OF SCIENCE
  [Rest of exam content]
  ```

### Reason 3: University/Faculty not in database
- **Symptom:** Names don't match system database exactly
- **Solution:** Use manual dropdown selection (override feature)
- **Check:** Look at dropdown list to see available universities/faculties

### Reason 4: API not responding
- **Symptom:** Universities list failed to load from server
- **Solution:** Check if backend is running
- **Test:**
  1. F12 → Network tab
  2. Select folder
  3. Look for API requests
  4. Check if getting 200 response

## Step-by-Step Testing

### Step 1: Create a Test PDF
**Fastest way:**
1. Open a text editor (Notepad)
2. Type this exactly:
```
UNIVERSITY OF NAIROBI
FACULTY OF SCIENCE
BIOLOGY 101
EXAMINATION
2023
```
3. Save as `test.txt`
4. Convert to PDF using online tool or Word
5. Name it: `BIO101_Biology1_2023_1_Main.pdf`

**Or use Word/Google Docs:**
1. Create new document
2. Paste the text above
3. Print to PDF → `test.pdf`

### Step 2: Open Browser Console
```
F12 key → Console tab
```

Watch for these messages as you select the folder:

**If SUCCESS:**
```
✅ Universities loaded: [Array with universities]
📥 Found 1 PDF files
Extracting metadata from PDF...
Extracted metadata: {
  university: "UNIVERSITY OF NAIROBI",
  faculty: "FACULTY OF SCIENCE",
  ...
}
Attempting to match university: UNIVERSITY OF NAIROBI
✅ Matched university ID: [some-uuid]
```

**If FAILURE:**
```
✅ Universities loaded: [Array]
📥 Found 1 PDF files
Extracting metadata from PDF...
Extracted metadata: {
  university: null,    ← PROBLEM: Not found in PDF
  faculty: null,
  ...
}
No metadata.university or universities empty
```

### Step 3: Check Console Logs Carefully

**Message: "Universities loaded: []"**
- Problem: No universities in database
- Solution: Check database has university data

**Message: "Extracted metadata: { university: null }"**
- Problem: PDF doesn't have "UNIVERSITY OF..." pattern
- Solution: Update PDF content

**Message: "Matched university ID: null"**
- Problem: Extracted name doesn't match database
- Solution: Use manual dropdown selection

## Common PDF Issues

### ❌ Scanned Image PDF
```
[Image of exam paper scanned]
```
- Can't extract text
- Looks right to human, but computer can't read it
- **Solution:** Use text-based PDF or OCR tool

### ✅ Good Text-Based PDF
```
UNIVERSITY OF NAIROBI
FACULTY OF SCIENCE
[Actual text content, not image]
```
- Computer can extract this text
- Patterns match successfully
- **Result:** Auto-fills work

### ✅ Also Works (Different Format)
```
NAIROBI UNIVERSITY
DEPARTMENT OF MEDICINE
[Content]
```
- Fuzzy matching handles variations
- "NAIROBI UNIVERSITY" matches "UNIVERSITY OF NAIROBI"
- **Result:** Auto-fills work

## Quick Fixes

### Fix 1: Update PDF Content
**Your PDF needs to include on page 1:**
```
UNIVERSITY OF [SOMETHING]
FACULTY OF [SOMETHING]
```

**Examples that work:**
- ✅ UNIVERSITY OF NAIROBI
- ✅ KENYATTA UNIVERSITY
- ✅ EGERTON UNIVERSITY
- ✅ UNIVERSITY OF KENYA

**Examples that might not work:**
- ❌ UON (too short, not recognized)
- ❌ Nairobi Uni (not exact pattern)
- ❌ THE UNIVERSITY OF NAIROBI (extra words confuse regex)

### Fix 2: Check Backend is Running
```
Windows PowerShell:
cd backend
npm start
```

Check that you see:
```
✅ Server running on port 5000
✅ Connected to Supabase
```

### Fix 3: Force Reload Universities
If universities were empty:
1. Close browser tab
2. Open new tab
3. Go back to Past Papers Admin
4. Try again

### Fix 4: Use Manual Selection
If auto-extraction still fails:
1. Dropdowns will appear
2. Click University dropdown
3. Look for your university in list
4. If not in list → Problem is in database, not extraction
5. Select from available options
6. Click Faculty dropdown
7. Select faculty
8. Click Upload

## Database Check

If universities list is empty, the problem is in database, not the code.

**To check database:**
1. Go to Supabase dashboard
2. Find `universities` table
3. Check if data exists
4. If empty → Add universities to database

## Testing Checklist

- [ ] PDF is text-based (not scanned image)
- [ ] PDF has "UNIVERSITY OF [NAME]" on page 1
- [ ] PDF has "FACULTY OF [NAME]" on page 1
- [ ] Browser console open while selecting folder
- [ ] Backend running (npm start in backend folder)
- [ ] Database has universities
- [ ] No console errors about API calls

## If Still Not Working

1. **Check console errors:**
   - F12 → Console
   - Look for red error messages
   - Copy full error text

2. **Check Network tab:**
   - F12 → Network
   - Select folder
   - Look for failed requests (red)
   - Check response for API errors

3. **Test API directly:**
   - F12 → Console
   - Try to fetch universities manually:
   ```javascript
   fetch('http://localhost:5000/api/elib/universities/dropdown')
     .then(r => r.json())
     .then(d => console.log(d))
   ```
   - Check if data returns

4. **Create sample test PDF:**
   - Use simplest possible PDF
   - Only include: "UNIVERSITY OF NAIROBI"
   - Test extraction with this minimal PDF

## Expected Behavior

### When Auto-Detection Succeeds:
1. Select folder
2. Wait 2-3 seconds
3. Toast: "✓ Auto-filled: University & Faculty detected from PDF"
4. Dropdowns **hidden** (not visible)
5. File list **shown**
6. Upload button **enabled** (green, clickable)
7. Click Upload → Success

### When Auto-Detection Fails:
1. Select folder
2. Wait 2-3 seconds
3. Toast: "Could not auto-detect - please select manually"
4. Dropdowns **shown** (visible, red border)
5. File list **shown**
6. Upload button **disabled** (gray)
7. Select from dropdowns
8. Click Upload → Success

---

**TL;DR:** If you see "Could not auto-detect", your PDF likely doesn't have "UNIVERSITY OF [NAME]" and "FACULTY OF [NAME]" on the first page. Use manual dropdown selection or update your PDF.
