# Auto-Download Pagination - Diagnostic Guide

## What Changed
Added **detailed console logging** to track exactly what's happening during pagination.

## How to Test

### Step 1: Restart Backend
```bash
# In terminal
cd backend
node index.js
```

### Step 2: Trigger Auto-Download
1. Go to: Admin → Books & Papers → Auto Download
2. Paste this URL: `https://pastpapers.ku.ac.ke/handle/123456789/4389`
3. Click download

### Step 3: Check Server Console
Watch for these log messages:

#### Expected Output (ALL ITEMS FETCHED)
```
📄 [DSPACE] Fetching page 1 (offset=0, limit=100, total items: 0)...
🔗 [DSPACE] URL: https://pastpapers.ku.ac.ke/handle/123456789/4389?offset=0&limit=100
📥 [DSPACE] Response size: 125000 bytes
🔍 [DSPACE] Searching for items with regex pattern
✅ [DSPACE] Regex matched 20 items (20 new):
   - 123456789/11001: Economics of Global Business
   - 123456789/11002: Economics of Money
   ...
✅ [DSPACE] Page 1: Found 20 new items (Total: 20)
📊 [DSPACE] Detected page size: 20 items per page

📄 [DSPACE] Fetching page 2 (offset=20, limit=100, total items: 20)...
🔗 [DSPACE] URL: https://pastpapers.ku.ac.ke/handle/123456789/4389?offset=20&limit=100
📥 [DSPACE] Response size: 125000 bytes
✅ [DSPACE] Regex matched 20 items (20 new):
   ...
✅ [DSPACE] Page 2: Found 20 new items (Total: 40)

... continues through all pages ...

✅ [DSPACE] Page 10: Found 5 new items (Total: 185)
📄 [DSPACE] Fetching page 11 (offset=185, limit=100, total items: 185)...
📥 [DSPACE] Response size: 50000 bytes
🔍 [DSPACE] Searching for items with regex pattern
⚠️  [DSPACE] Regex found 0 matches
✅ [DSPACE] Page 11: Found 0 new items (Total: 185)
✅ [DSPACE] Pagination complete: Reached end of results
📄 [DSPACE] Found 185 total items in community 123456789/4389
```

#### Problem: Only 20 Items (First Page)
If you see:
```
✅ [DSPACE] Page 1: Found 20 new items (Total: 20)
📊 [DSPACE] Detected page size: 20 items per page
✅ [DSPACE] Pagination complete: Reached end of results
📄 [DSPACE] Found 20 total items
```

**Possible causes:**
- **Regex not matching** - HTML structure is different
- **Offset parameter not working** - DSpace might use different pagination
- **Redirect issue** - Server redirecting away from paginated URL

## Debugging

### If Getting 0 Matches on Page 1
Look for this message:
```
⚠️  [DSPACE] Regex found 0 matches in 125000 byte response
📝 [DSPACE] HTML contains /handle/ strings, but regex didn't match
   Sample: /handle/123456789/11001" class="item-title">Economics
```

This tells us the HTML structure is different. We need to update the regex pattern.

### If Only 1 Page Fetches
The pagination might be stopping after page 1. Check:
- Is offset being incremented? (`offset=0`, `offset=20`, `offset=40`...)
- Are URLs being constructed correctly?
- Is DSpace responding to offset parameter?

## Next Steps
Once you see the console output, we'll know exactly what's wrong and can fix it!
