# Bulk DSpace Collection Download Guide

## Quick Answer
**YES!** Your auto-download feature already supports downloading all PDFs from DSpace collection pages like:
```
https://pastpapers.ku.ac.ke/handle/123456789/4547
```

## How to Use It

### Method 1: Quick Collection Download (Recommended)
1. Go to **Past Papers Auto Download** tab in your app
2. Paste the collection URL directly:
   ```
   https://pastpapers.ku.ac.ke/handle/123456789/4547
   ```
3. The system will:
   - Recognize it's a DSpace collection page (21 items available)
   - Extract all item handles automatically
   - Fetch each item's detail page
   - Extract PDF download links from each item
   - Provide download links for all PDFs found

### Method 2: Using Bulk Upload UI
1. Navigate to the **Past Papers Auto Download** tab
2. Click on the collection or paste the collection URL
3. The system will display all available items
4. You can then:
   - Download all items at once
   - Select specific items to download
   - Filter by date, subject, or author

## What Happens Behind the Scenes

### For Collection URLs (like your example):
```
https://pastpapers.ku.ac.ke/handle/123456789/4547
       ↓
1. Fetch collection page HTML using Puppeteer (JavaScript rendering)
2. Parse HTML for item handles: /handle/123456789/10988, /handle/123456789/10987, etc.
3. For each handle found:
   - Construct item URL: https://pastpapers.ku.ac.ke/handle/123456789/10988
   - Fetch item page
   - Extract PDF bitstream links from item HTML
4. Collect all unique PDFs
5. Validate each PDF URL (HEAD request)
6. Return list of download links
```

### Your Specific URL Analysis
The URL you provided is a **DSpace Community** page containing:
- **Type:** Community (Common Units)
- **Total Items:** 21
- **Collections:** Multiple sub-collections
- **Available Subjects:** Bachelor of Arts, Bachelor of Commerce, Bachelor of Law, etc.

The system will extract all 21 items and their associated PDFs.

## PDF Link Detection Patterns

The system uses 7 regex patterns to detect PDF links:

| Pattern | Matches |
|---------|---------|
| Pattern 1 | Standard `href="..."` links |
| Pattern 2 | `/bitstream/handle/...pdf` (direct paths) |
| Pattern 3 | `data-href="..."` (JS frameworks) |
| Pattern 4 | Other data attributes (`data-url`, `data-pdf`) |
| Pattern 5 | Direct `https://...pdf` links |
| Pattern 6 | `bitstream/handle/...pdf` (without leading slash) |
| Pattern 7 | DSpace bitstreams with query parameters (`?sequence=1&isAllowed=y`) |

## Advanced Features

### 1. Parallel Processing
- Downloads validate up to 3 PDFs simultaneously
- Timeout: 60 seconds per file
- Continues even if some files fail
- Automatic retry on network errors

### 2. DSpace Support
- Automatically detects DSpace repositories
- Handles collection pages (multiple items)
- Handles search results pages
- Handles browse pages (by date, author, subject)

### 3. URL Normalization
- Handles relative URLs (`/bitstream/handle/...`)
- Handles absolute URLs (`https://...`)
- Handles URL-encoded characters (`%20` for spaces)
- Handles HTML entity encoding (`&amp;`, `&quot;`, etc.)

### 4. Error Handling
- Graceful fallback from Puppeteer to HTTP
- Continues processing even if some items fail
- Detailed logging for debugging
- Automatic cleanup after 24 hours

## Example: Downloading from Your Collection

### Step 1: Paste Collection URL
```
https://pastpapers.ku.ac.ke/handle/123456789/4547
```

### Step 2: System Extracts Items
The system finds these items (partial list):
- Ethics, Diversity, Life and Career Skills (UCU104)
- Ethics, Diversity and Citizenship (UCU106)
- Introduction to Entrepreneurship (UCU104)
- Communication Skills (UCU110)
- ... and 17 more

### Step 3: System Fetches PDFs
For each item, it extracts the PDF link. For example:
```
https://pastpapers.ku.ac.ke/bitstream/handle/123456789/10988/UCU104-2023.pdf?sequence=1&isAllowed=y
```

### Step 4: Validate & Download
Each PDF is validated and provided with a download link:
```
✅ UCU104-2023.pdf
✅ UCU106-2023.pdf
✅ Communication-Skills-UCU110-2023.pdf
... (all 21 PDFs listed)
```

## Troubleshooting

### Issue: "No PDF links found"
**Solution:** 
- The collection page HTML may not have been fully loaded
- Try using the direct collection browse URL instead:
  ```
  https://pastpapers.ku.ac.ke/handle/123456789/4547/browse?type=title
  ```

### Issue: "Some PDFs failed validation"
**Solution:**
- These PDFs may require authentication
- The repository may have rate-limited the requests
- Try downloading them individually from the DSpace web interface

### Issue: "Timeout errors"
**Solution:**
- The repository server may be slow
- The system automatically retries failed validations
- Wait a few minutes and try again

## API Endpoint Reference

### Start Bulk Download
```
POST /api/elib/bulk-upload-pastpapers/start
Body: {
  "sourceUrl": "https://pastpapers.ku.ac.ke/handle/123456789/4547",
  "userId": "user123",
  "asSubmission": false
}
Response: {
  "ok": true,
  "processId": "uuid"
}
```

### Check Download Status
```
GET /api/elib/bulk-upload-pastpapers/status?processId=uuid
Response: {
  "id": "uuid",
  "status": "completed|running|failed",
  "stats": {
    "total": 21,
    "processed": 21,
    "successful": 20,
    "failed": 1
  },
  "files": [
    {
      "filename": "Paper1.pdf",
      "url": "...",
      "status": "ready|failed",
      "downloadUrl": "..."
    }
  ]
}
```

### Download PDF
```
GET /api/elib/download-pdf?url=<pdf_url>&filename=<filename>
```

## Tips for Best Results

1. **Use Collection URLs** - More efficient than search results
2. **Paste Exact URL** - Don't modify the handle number
3. **Check Progress** - The UI shows real-time progress
4. **Download in Batches** - If many PDFs, download in groups of 5-10
5. **Keep Browser Open** - Downloads continue until completion
6. **Check File Names** - PDFs are named based on DSpace metadata

## Recent Changes & Improvements

### v1.3 - Enhanced DSpace Support
- ✅ Collection page support
- ✅ Multiple regex patterns for PDF detection
- ✅ Puppeteer for JavaScript-rendered content
- ✅ Fallback to HTTP for faster processing
- ✅ Individual item page fetching
- ✅ 7 different PDF link detection patterns
- ✅ Parallel validation (3 simultaneous)
- ✅ Automatic deduplication
- ✅ URL normalization
- ✅ HTML entity decoding

## Need More Features?

Possible enhancements (not yet implemented):

1. **Batch Download to Server** - Download all PDFs directly to server storage
2. **Filter by Date** - Only download papers from specific years
3. **Filter by Subject** - Download specific subject areas
4. **Automatic Metadata** - Extract author, subject, date from DSpace
5. **Archive Format** - Download as ZIP file
6. **Scheduled Downloads** - Queue downloads for off-peak hours
7. **Search Integration** - Search within collection before downloading

## Questions?

Check the implementation in:
- **Backend:** `backend/index.js` (lines 1536-2000)
- **Frontend:** `src/SomaLux/PastPapersDownloader/PastPapersAutoDownload.jsx`
- **Documentation:** `AUTODOWNLOAD_DSPACE_FIX.md`
