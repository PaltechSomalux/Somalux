# Past Papers - Debugging & Verification Guide

## Quick Checklist

If papers aren't showing:

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Navigate to Past Papers section**
4. **Look for these logs**:

### Expected Log Sequence

You should see these messages in order:

```
📥 fetchPastPapers called with: {page: 1, pageSize: 100, ...}
Processing paper: {id: "...", title: "...", universities: {...}}
✓ Generated URL for {paperId}: https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/past-papers/...
✅ Successfully fetched and processed papers: {count: 5, papers: [...]}
Raw fetched papers: (5) [{…}, {…}, {…}, {…}, {…}]
Transformed papers: (5) [{…}, {…}, {…}, {…}, {…}]
✓ Paper URL generated: https://...
```

## Troubleshooting

### Problem 1: No Papers Loading (Blank Page)

**Symptoms:**
- Universities grid shows but no papers appear after selecting a university
- Console shows no errors

**Solutions:**

A) **Check if it's loading universities first:**
- You should see the universities grid first
- Click on a university to filter papers for that university
- Papers should appear for that university

B) **Check cache (force refresh):**
```javascript
// In browser console, paste this:
localStorage.clear();
location.reload();
```

C) **Check if universities are loading:**
- Open console
- Universities should load (check fetchUniversities in network tab)
- If failing, check `campusApi.js`

### Problem 2: Papers Fetch But Don't Display

**Symptoms:**
- Console shows "Raw fetched papers: (5)"
- But paper grid is empty

**Check:**
1. Make sure `universityFilter` is set (papers only show when a university is selected)
2. Verify filtered papers have correct university names:
```javascript
// Paste in console:
console.log(document.querySelector('[class*="filteredPapers"]'));
// Or check state in React DevTools
```

### Problem 3: PDF URLs Still Broken (400 Errors)

**If you still see 400 errors:**

Check the URL format:
```javascript
// In console, paste:
const urls = document.querySelectorAll('a[href*="supabase.co"]');
urls.forEach(a => console.log(a.href));
```

URLs should look like:
```
https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/past-papers/UUID.pdf
```

NOT like:
```
https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/past-papers/88cfdcf8-6e49-4f54-8e94-a69ac9bac87c.pdf?version=old
```

## Key Changes Made

### 1. Added University Join to Query
```javascript
// Before: no university data in response
// After: includes universities:university_id(id, name)
```

**Why:** Papers need to display which university they belong to

### 2. Enhanced URL Generation
```javascript
// Before: used database value directly (could be broken)
// After: regenerates from file_path using Supabase SDK
```

**Why:** Ensures all URLs are properly formatted

### 3. Better Logging
```javascript
// Before: minimal logs
// After: detailed logs at every step
```

**Why:** Makes debugging easier

## Network Tab Debugging

If papers aren't fetching at all:

1. **Open DevTools** → **Network tab**
2. **Navigate to Past Papers**
3. **Look for these requests:**
   - `fetchUniversities` → should return list of universities
   - `fetchPastPapers` → should return list of papers
   - Any request returning 400/500 is a problem

**Check request:**
- Right-click → Preview to see JSON response
- Should have `data` array with paper objects
- Each paper should have: `id`, `title`, `file_path`, `universities` object

## React DevTools Debugging

1. **Install React DevTools browser extension**
2. **Navigate to Past Papers**
3. **Open React tab in DevTools**
4. **Find `PaperPanel` component**
5. **Check state:**
   - `papers` - array of all papers
   - `universityFilter` - selected university name
   - `filteredPapers` - papers matching current filter
   - `displayedPapers` - papers actually shown (limited by visibleCount)

## Common Issues & Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| Papers array empty | No data from API | Check network tab, verify database has records |
| Papers loaded but not displayed | universityFilter null | Select a university first |
| Papers show but no URLs | file_path null in DB | Requires database migration |
| 400 errors on PDF load | Malformed URLs | Check URL format in console |
| Slow loading | Large pageSize | Current: 100, can reduce if needed |

## Direct Database Check

If nothing else works, check the database directly:

1. **Go to Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this query:**

```sql
SELECT id, title, file_path, file_url, university_id FROM past_papers LIMIT 5;
```

**Check:**
- Do records exist?
- Do `file_path` values exist?
- Are they UUID format (e.g., `550e8400-e29b-41d4-a716-446655440000.pdf`)?

If file_path is NULL, that's the problem - files weren't properly uploaded.

## Files to Check

Modified for this fix:
- `src/SomaLux/Books/Admin/pastPapersApi.js` - Main fetch function
- `src/SomaLux/Books/Admin/pages/shared/pastPapersApi.js` - Shared copy  
- `src/SomaLux/PastPapers/Pastpapers.jsx` - Enhanced logging

Related files:
- `src/SomaLux/Books/Admin/campusApi.js` - University fetching
- `src/SomaLux/PastPapers/PaperGrid.jsx` - Paper display
- `src/SomaLux/PastPapers/UniversityGrid.jsx` - University selection
