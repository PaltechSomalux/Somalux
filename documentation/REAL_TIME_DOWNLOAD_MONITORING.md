# Real-Time Download Monitoring Guide

## Overview
The improved auto-download system now provides detailed real-time logging so you can see exactly what's happening during PDF downloads.

## Where to Check Progress

### Method 1: Backend Console (Best Option)
Watch the terminal where your backend is running:

```
📥 [AUTO-DOWNLOAD-a1b2c3d4] Started bulk download from: https://pastpapers.ku.ac.ke/handle/123456789/4547

✓ [AUTO-DOWNLOAD-a1b2c3d4] Validating (1/21): UCU104-2023.pdf
  [HEAD] Status: 405, Size: 0
  [HEAD failed - trying GET]
  ✅ [GET] Confirmed PDF (1024 bytes received)
  ✅ Valid (200): received 1024 bytes
✅ [AUTO-DOWNLOAD-a1b2c3d4] Ready: UCU104-2023.pdf

✓ [AUTO-DOWNLOAD-a1b2c3d4] Validating (2/21): UCU106-2023.pdf
  [HEAD] Status: 200, Size: 987654
  ✅ Valid (200, 987654 bytes)
✅ [AUTO-DOWNLOAD-a1b2c3d4] Ready: UCU106-2023.pdf

... (19 more items)

✅ [AUTO-DOWNLOAD-a1b2c3d4] Bulk download completed: 21/21 successful
```

### Method 2: Browser Developer Tools (Secondary Option)
1. Open browser (Chrome, Firefox, Edge)
2. Press **F12** to open Developer Tools
3. Go to **Network** tab
4. Look for requests to `/api/elib/bulk-upload-pastpapers/status/[processId]`
5. You'll see real-time JSON responses with progress

## Understanding the Logs

### Validation Phase

#### What You'll See:
```
📥 [AUTO-DOWNLOAD-abc123] Fetching webpage...
⏳ [AUTO-DOWNLOAD-abc123] Navigating to https://pastpapers.ku.ac.ke/handle/123456789/4547...
⏳ [AUTO-DOWNLOAD-abc123] Waiting for dynamic content to load...
📊 [AUTO-DOWNLOAD-abc123] HTML size: 125432 characters
✓ [AUTO-DOWNLOAD-abc123] Found 'bitstream' in HTML
✅ [AUTO-DOWNLOAD-abc123] Successfully fetched with Puppeteer
📄 [AUTO-DOWNLOAD-abc123] Parsing HTML for PDF links...
📋 [AUTO-DOWNLOAD-abc123] No direct PDF links found, checking for DSpace items...
🔗 [AUTO-DOWNLOAD-abc123] Found 21 DSpace item(s)
📥 [AUTO-DOWNLOAD-abc123] Fetching PDF links from 21 items...
```

#### What It Means:
- `Fetching webpage` - Getting the collection page
- `Navigating to...` - Using Puppeteer browser automation
- `HTML size` - How much content was on the page
- `Found 'bitstream'` - PDF links are present in the HTML
- `Found 21 DSpace item(s)` - System detected 21 papers in the collection

### Item Processing Phase

#### What You'll See:
```
  📄 Fetching item: 123456789/10988
  [HEAD] Status: 405, Size: 0, Type: 
  [HEAD failed - trying GET]
  ✅ [GET] Confirmed PDF (1024 bytes received)
  ✅ Valid (200): received 1024 bytes
  ✅ Found 1 PDF(s) in item 123456789/10988
✅ [AUTO-DOWNLOAD-abc123] Ready: UCU104-2023.pdf
```

#### What It Means:
- `Fetching item` - Getting the item detail page
- `[HEAD] Status: 405` - Server doesn't allow HEAD requests (normal)
- `[HEAD failed - trying GET]` - System uses GET fallback (working correctly)
- `✅ [GET] Confirmed PDF` - Verified it's a real PDF file
- `✅ Found 1 PDF(s)` - Extracted the PDF link
- `✅ Ready: filename` - Ready to download

### Summary

#### What You'll See:
```
📚 [AUTO-DOWNLOAD-abc123] Found 21 PDF(s)
📚 [AUTO-DOWNLOAD-abc123] After deduplication: 21 unique PDF(s)
✓ [AUTO-DOWNLOAD-abc123] Validating (1/21): UCU104-2023.pdf
  ✅ Valid (200, 1245678 bytes)
✅ [AUTO-DOWNLOAD-abc123] Ready: UCU104-2023.pdf
... (20 more)
✅ [AUTO-DOWNLOAD-abc123] Bulk download completed: 21/21 successful
```

## Download Phase Logs

### When You Click Download

#### What You'll See:
```
[PDF-DOWNLOAD-START] Downloading: UCU104-2023.pdf from https://pastpapers.ku.ac.ke/bitstream/handle/123456789/10988/...
[PDF-DOWNLOAD] Status: 200 | Type: application/pdf | Size: 1245678 bytes
[PDF-DOWNLOAD] 📥 Streaming UCU104-2023.pdf (1245678 bytes)...
[PDF-DOWNLOAD] ✅ Complete: UCU104-2023.pdf (1245678/1245678 bytes)
```

#### What It Means:
- `Status: 200` - Server successfully returned the file
- `Type: application/pdf` - Confirmed it's a PDF
- `Size: 1245678` - Expected file size
- `📥 Streaming` - File is being transferred
- `✅ Complete` - Download finished successfully
- `(1245678/1245678 bytes)` - Received all bytes as expected

### If a Download Fails

#### What You'll See:
```
[PDF-DOWNLOAD-START] Downloading: file.pdf...
[PDF-DOWNLOAD] Status: 200 | Type: application/pdf | Size: 1245678
[PDF-DOWNLOAD-START] Downloading: file.pdf (attempt 2)
[PDF-DOWNLOAD] Status: 200 | Type: application/pdf | Size: 1245678
[PDF-DOWNLOAD] ✅ Complete: file.pdf (1245678/1245678 bytes)
```

#### What It Means:
- **Automatic retry:** System detected failure and retried
- **Up to 3 attempts:** System will try up to 3 times automatically
- **If still fails:** Check the error in the server logs

## Checking Status Programmatically

If you want to check progress from your app:

```javascript
// Get the process ID from the start response
const startResponse = await fetch('http://localhost:5000/api/elib/bulk-upload-pastpapers/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceUrl: 'https://pastpapers.ku.ac.ke/handle/123456789/4547'
  })
});

const { process } = await startResponse.json();
const processId = process.id;

// Poll for status
const statusResponse = await fetch(
  `http://localhost:5000/api/elib/bulk-upload-pastpapers/status/${processId}`
);
const statusData = await statusResponse.json();

console.log(`Progress: ${statusData.process.stats.processed}/${statusData.process.stats.total}`);
console.log(`Successful: ${statusData.process.stats.successful}`);
console.log(`Failed: ${statusData.process.stats.failed}`);
console.log(`Files: ${statusData.process.files.map(f => f.filename).join(', ')}`);
```

### Response Structure

```json
{
  "ok": true,
  "process": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "status": "running|completed|failed",
    "sourceUrl": "https://pastpapers.ku.ac.ke/handle/123456789/4547",
    "stats": {
      "total": 21,
      "processed": 15,
      "successful": 15,
      "failed": 0,
      "skipped": 0
    },
    "files": [
      {
        "filename": "UCU104-2023.pdf",
        "url": "https://pastpapers.ku.ac.ke/bitstream/...",
        "status": "ready",
        "downloadUrl": "/api/elib/download-pdf?url=..."
      },
      {
        "filename": "UCU106-2023.pdf",
        "url": "https://...",
        "status": "ready",
        "downloadUrl": "/api/elib/download-pdf?url=..."
      }
    ]
  }
}
```

## Interpreting Status Codes

### During Validation

| Log | Meaning |
|-----|---------|
| `[HEAD] Status: 200` | ✅ File accessible via HEAD request |
| `[HEAD] Status: 405` | ℹ️ HEAD not allowed, will try GET |
| `[GET] Confirmed PDF` | ✅ Verified actual PDF content |
| `[GET] Status: 200` | ✅ File accessible via GET |
| `[GET] Status: 403` | ❌ Access denied (may need auth) |
| `[GET] Status: 404` | ❌ File not found |

### During Download

| Log | Meaning |
|-----|---------|
| `Status: 200` | ✅ File downloading normally |
| `Status: 206` | ✅ Partial download (range request) |
| `Status: 301/302` | ℹ️ Redirect to actual file |
| `Status: 403` | ❌ Access denied |
| `Status: 404` | ❌ File deleted or moved |
| `Status: 504` | ⏱️ Server timeout (will retry) |

## Performance Monitoring

### Validation Speed

```
Time per item: 0.5-2 seconds
- Fetch item page: 0.3-1s
- Extract PDF: 0.1s
- Validate PDF: 0.1-0.5s

Total for 21 items: 10-42 seconds
Typical: 15-20 seconds
```

### Download Speed

```
Small PDF (500KB): 2-5 seconds
Medium PDF (2MB): 5-15 seconds
Large PDF (5MB): 15-30 seconds

Typical file: 1-3MB, takes 5-10 seconds
```

## Troubleshooting Using Logs

### Problem: "All PDFs failing validation"

**Look for:**
```
❌ [AUTO-DOWNLOAD-abc123] Failed to validate...: HTTP 403
❌ [AUTO-DOWNLOAD-abc123] Failed to validate...: HTTP 404
❌ [AUTO-DOWNLOAD-abc123] Failed to validate...: Timeout
```

**Possible causes:**
- Server requires authentication
- Server is rate-limiting requests
- Network connection is slow
- DSpace server is down

**What to do:**
- Check if you can access DSpace manually in browser
- Wait a few minutes and retry
- Try with a different collection URL

### Problem: "Some PDFs work, some don't"

**Look for:**
```
✅ [AUTO-DOWNLOAD-abc123] Ready: file1.pdf
✅ [AUTO-DOWNLOAD-abc123] Ready: file2.pdf
❌ [AUTO-DOWNLOAD-abc123] Failed to validate file3.pdf: HTTP 403
✅ [AUTO-DOWNLOAD-abc123] Ready: file4.pdf
```

**What to do:**
- Download the ones that succeeded
- The ones that failed may have access restrictions
- Try downloading the failed ones manually from DSpace

### Problem: "Download status stuck at 15/21"

**Look for:**
```
✓ [AUTO-DOWNLOAD-abc123] Validating (15/21): file15.pdf
[PDF-DOWNLOAD-START] Downloading: file15.pdf from...
[Waiting...]
```

**What to do:**
- Check if server is slow (backend logs will show)
- Wait longer (up to 3 minutes timeout per file)
- If it times out, system will retry automatically

## Real-Time Monitoring Checklist

- ✅ Watch backend logs for `[AUTO-DOWNLOAD-...]` messages
- ✅ Check for PDF signature confirmation: `✅ [GET] Confirmed PDF`
- ✅ Verify files are marked `✅ Ready`
- ✅ When downloading, watch for `[PDF-DOWNLOAD]` logs
- ✅ Confirm completion: `✅ Complete: filename (bytes/bytes)`

## Summary

The new logging system makes it easy to:
1. **See progress** - Real-time status updates
2. **Diagnose issues** - Detailed error messages
3. **Verify success** - Confirmation when downloads complete
4. **Monitor retries** - Automatic retry tracking

Just watch the backend console and you'll see everything happening! 📊
