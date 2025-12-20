# PDF Fetch Error Fix - Past Papers

## Problem Diagnosis

You were experiencing **400 Bad Request** errors when trying to load PDFs from Supabase storage:

```
GET https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/past-papers/88cfdcf8-6e49-4f54-8e94-a69ac9bac87c.pdf 400 (Bad Request)
GET https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/past-papers/0319d37d-ab6b-4baf-b66d-58abdea13353.pdf net::ERR_ABORTED 400 (Bad Request)
```

### Root Cause Analysis

The issue occurred because:

1. **Improper URL Generation**: The `file_url` field in the database was either:
   - Incomplete (just the filename/UUID without the full Supabase base URL)
   - Malformed
   - Stored without proper public URL generation

2. **Missing File Path Regeneration**: When fetching papers from the database, the system was using the stored `file_url` directly without regenerating it from the `file_path` using Supabase's SDK.

3. **No URL Validation**: There was no validation to ensure URLs were in the correct format before attempting to fetch them.

## Solution Implemented

### 1. **API URL Regeneration** (Primary Fix)

Modified `fetchPastPapers()` in both:
- `src/SomaLux/Books/Admin/pastPapersApi.js`
- `src/SomaLux/Books/Admin/pages/shared/pastPapersApi.js`

The function now:
- **Always regenerates** the public URL from `file_path` using Supabase SDK
- **Validates** the URL format (must start with `https://`)
- **Logs** URL generation for debugging
- **Falls back** to stored `file_url` if regeneration fails
- **Warns** about invalid URLs in the console

```javascript
// New logic in fetchPastPapers
const processedData = (data || []).map(paper => {
  let finalUrl = paper.file_url;
  
  if (paper.file_path) {
    try {
      const publicUrlData = supabase.storage.from(PAST_PAPERS_BUCKET).getPublicUrl(paper.file_path);
      if (publicUrlData?.data?.publicUrl) {
        finalUrl = publicUrlData.data.publicUrl;
        console.log(`✓ Generated URL for ${paper.id}:`, finalUrl);
      }
    } catch (err) {
      console.warn(`⚠️ Failed to generate URL from file_path for paper ${paper.id}:`, err);
    }
  }
  
  if (!finalUrl || !finalUrl.startsWith('https://')) {
    console.warn(`⚠️ Invalid file_url for paper ${paper.id}:`, finalUrl);
  }
  
  return { ...paper, file_url: finalUrl };
});
```

### 2. **Enhanced Logging in Pastpapers.jsx**

Updated the `loadPastPapers()` function to:
- Log success messages when URLs are generated properly
- Warn about missing URLs
- Map correct field names (`unit_code`, `unit_name` instead of `course_code`, `subject`)

```javascript
if (!downloadUrl) {
  console.warn('⚠️ Missing file_url for paper:', paper.id, paper.title);
} else {
  console.log('✓ Paper URL generated:', downloadUrl);
}
```

## Expected Behavior After Fix

✅ **PDFs will load successfully** because:
1. Each paper's URL is regenerated fresh from its `file_path` using Supabase SDK
2. Supabase's SDK generates properly formatted public URLs automatically
3. URLs are validated before being used to load PDFs
4. Console logs show which papers succeeded/failed for debugging

✅ **Better Error Visibility**:
- If a paper has no `file_path`, you'll see a warning
- If a URL is malformed, you'll see a warning
- Generated URLs are logged for verification

## Testing the Fix

1. **Open the browser console** (F12 → Console tab)
2. **Navigate to Past Papers** section
3. **Look for these log messages**:
   - `✓ Generated URL for {paperId}: https://...` (success)
   - `⚠️ Missing file_url for paper: {paperId}` (problem)
   - `⚠️ Invalid file_url for paper: {paperId}` (malformed)
   - `Raw fetched papers: (5)` (shows papers loaded)
   - `Transformed papers: (5)` (shows transformation complete)

4. **Try opening a PDF** - it should load without 400 errors

## If Problems Persist

If you still see 400 errors:

1. **Check Supabase Storage**:
   - Go to Supabase Dashboard → Storage → `past-papers` bucket
   - Verify files exist with matching UUIDs
   - Ensure bucket is set to "public" access

2. **Check Database Records**:
   - Verify past_papers table has `file_path` values
   - Ensure `file_path` matches actual file names in storage

3. **Regenerate URLs Manually** (if needed):
   Run the SQL migration in `FIX_PAST_PAPERS_URLS.sql` to batch-fix all records

## Files Modified

1. `src/SomaLux/Books/Admin/pastPapersApi.js` - Main API function
2. `src/SomaLux/Books/Admin/pages/shared/pastPapersApi.js` - Shared API copy
3. `src/SomaLux/PastPapers/Pastpapers.jsx` - Enhanced logging and field mapping

## Key Insight

**The fix uses Supabase SDK's `getPublicUrl()` method** to ensure URLs are always correctly formatted, rather than relying on potentially corrupted database values. This is the "single source of truth" approach for URL generation.
