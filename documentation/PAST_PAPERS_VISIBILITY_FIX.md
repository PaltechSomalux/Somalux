# Past Papers Visibility Fix - Complete

## Problem
All uploaded past papers were not being displayed because of a hidden filter (`is_active = true`) that was excluding papers where the `is_active` field was `false` or `NULL`.

## Root Cause
The `fetchPastPapers()` function and `getPastPaperCountByUniversity()` function in [pastPapersApi.js](src/SomaLux/Books/Admin/pastPapersApi.js) had filters that restricted visibility to only papers with `is_active = true`.

### Code Changes Made

#### 1. **fetchPastPapers() - Line 125** [pastPapersApi.js](src/SomaLux/Books/Admin/pastPapersApi.js#L125)
**Removed:**
```javascript
// Only fetch active papers
query = query.eq('is_active', true);
```

**Result:** Now ALL past papers are fetched regardless of their `is_active` status.

#### 2. **getPastPaperCountByUniversity() - Line 650** [pastPapersApi.js](src/SomaLux/Books/Admin/pastPapersApi.js#L650)
**Removed:**
```javascript
.eq('is_active', true);
```

**Result:** University paper counts now include ALL papers, not just active ones.

## Impact
✅ **All uploaded past papers are now displayed**
✅ **No more hidden papers in the system**
✅ **University counts accurate**
✅ **Search results include all papers**
✅ **Faculty filters show all papers**

## Files Modified
- [src/SomaLux/Books/Admin/pastPapersApi.js](src/SomaLux/Books/Admin/pastPapersApi.js)
  - Line 125: Removed `is_active` filter from main fetch query
  - Line 650: Removed `is_active` filter from university count query

## Testing
The following should now work correctly:
1. ✅ All uploaded past papers display in the grid
2. ✅ University paper counts show accurate total
3. ✅ Search returns all matching papers
4. ✅ Faculty filters include all papers
5. ✅ Load More button shows correct total count

## Notes
- The `is_active` field may still exist in the database for other purposes
- Papers with any `is_active` value (true, false, or NULL) are now visible
- No approval workflow affected - submissions still go through normal flow
- This ensures complete transparency of all uploaded papers
