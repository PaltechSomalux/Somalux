# File Display CORS Fix - Books & Past Papers

## Problem
Files (PDFs) can be **downloaded** but cannot be **displayed for reading** after deploying to custom domain, even though they work on localhost.

## Root Cause
Supabase storage serves files with `Content-Disposition: attachment` header by default, which forces downloads instead of inline viewing. Additionally, CORS headers may be missing for cross-origin requests from your custom domain.

## Solution

### Option 1: Add Query Parameter to Force Inline Display (Quickest)
Modify the `getPublicUrl()` calls to include `?download=false` parameter:

```javascript
// Before
const { data: publicData } = supabase
  .storage
  .from('elib-books')
  .getPublicUrl(book.file_path);
const url = publicData?.publicUrl;

// After
const { data: publicData } = supabase
  .storage
  .from('elib-books')
  .getPublicUrl(book.file_path);
const url = publicData?.publicUrl + '?download=false';
```

### Option 2: Use Backend Proxy (More Robust)
Create a backend endpoint that proxies files with proper CORS headers:

```javascript
// backend/index.js
app.get('/api/files/:bucket/:path', async (req, res) => {
  const { bucket, path } = req.params;
  const decodedPath = decodeURIComponent(path);
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(decodedPath);
    
    if (error) throw error;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(await data.arrayBuffer()));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});
```

Then use this endpoint in your React components:
```javascript
const url = `${API_URL}/api/files/${bucket}/${encodeURIComponent(filePath)}`;
```

### Option 3: Use Signed URLs (Best for Private Content)
Replace `getPublicUrl()` with `createSignedUrl()`:

```javascript
const { data, error } = await supabase.storage
  .from('elib-books')
  .createSignedUrl(book.file_path, 3600); // 1 hour expiry
const url = data?.signedUrl;
```

## Files to Modify

### For Books:
- `src/SomaLux/Books/ReadingDashboard/ReadingDashboard.jsx` (line 351)
- `src/SomaLux/Books/BookPanel.jsx` (lines 1865, 1993)

### For Past Papers:
- `src/SomaLux/PastPapers/Pastpapers.jsx` (lines 596, 734)

### For Admin:
- `src/SomaLux/Books/Admin/api.js` (line 244)
- `src/SomaLux/Books/Admin/pages/UserDetails.jsx` (line 215)
- `src/SomaLux/Books/Admin/pastPapersApi.js` (lines 114, 186)

## Recommended Implementation
**Use Option 1** (quickest) for immediate fix, then migrate to **Option 2** (backend proxy) for better security and control.

## Testing
After applying fix:
1. Build and deploy
2. Try opening a book/past paper on custom domain
3. Check browser console for CORS errors
4. Verify file displays inline instead of downloading
