# Google Custom Search API Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click "Create Project" (top left)
3. Name it: "SomaLux Faculty Search"
4. Click "Create"
5. Wait for project to load
6. Click "Create Credentials" → "API Key"
7. Copy the key (looks like: `AIzaSyDkxxxxxxxxxxxxxxxxxx`)
8. Click "Restrict Key" and select "Custom Search API"

### Step 2: Get Custom Search Engine ID

1. Go to [Google Custom Search Console](https://cse.google.com/cse/all)
2. Click "Create" → "New search engine"
3. **Name:** "SomaLux Faculties"
4. **Search sites to include:** Add these:
   ```
   *.ac.ke
   *.edu
   *.ac.uk
   ```
5. Click "Create"
6. Go to "Setup" tab
7. Under "Search engine ID" copy the ID (looks like: `1234567890:abcdefghijk`)

### Step 3: Add to Backend Environment

Edit `backend/.env`:

```env
# Google Custom Search API
GOOGLE_API_KEY=AIzaSyDkxxxxxxxxxxxxxxxxxx
GOOGLE_SEARCH_ENGINE_ID=1234567890:abcdefghijk
```

### Step 4: Test It

1. Start the backend: `npm start` or `npm run dev`
2. Upload a past paper
3. Check console for: `🌐 Found faculty via Google Search: [Faculty Name]`
4. Verify the faculty field is auto-filled correctly

## Troubleshooting

### "Google Search API not configured"
- ✅ Check `.env` file has both `GOOGLE_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID`
- ✅ Backend is restarted after adding keys
- ✅ No typos in environment variable names

### "Faculty search failed: 403"
- This means API key is invalid or not restricted to Custom Search API
- Go back to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Click on your API key
- Check: "Custom Search API" is in the list of allowed APIs
- If not, add it: Click "Restrict Key" → Select "Custom Search API"

### "Faculty search failed: 404"
- Custom Search Engine ID is wrong or doesn't exist
- Double-check the ID matches exactly in `.env`
- Go to [Custom Search Console](https://cse.google.com/cse/all) to verify it exists

### "No faculty found in search results"
- This is normal - it means Google found pages but the faculty pattern didn't match
- System will fall back to code-based guessing (CHEM → Chemistry, etc.)
- This is expected for some universities

### Google API keeps returning no results
- **Try different search terms:** Check what terms your university uses
- **Adjust search query:** Edit the search query in `backend/index.js` line ~3551
- **Expand site list:** Add more educational domains in Custom Search Engine

## Cost Information

**Good News:** This is FREE for up to 100 queries per day!

- Free tier: 100 searches/day
- Paid tier: $5 per 1,000 searches/day

For a small institution, 100/day is plenty. If you need more:
1. Enable billing in Google Cloud Console
2. API will automatically use paid tier
3. You'll only be charged for usage over 100/day

## Example Search Results

When system searches for `Egerton 212 CHEM faculty`:

```
🔍 Searching for faculty: "Egerton 212 CHEM faculty site:.ac.ke OR site:.edu"

Result 1:
Title: "CHEM 212 - Egerton University"
Snippet: "...offered by the FACULTY OF SCIENCE..."

✅ Pattern Matched: FACULTY OF SCIENCE
Extracted: Chemistry (or Science depending on extraction)
```

## Verify It's Working

After uploading your first past paper with Google Search enabled:

1. **Check Backend Logs:**
   ```
   🔍 Searching for faculty: "[University] [code] [name] faculty..."
   ✅ Found faculty via Google Search: Chemistry
   ```

2. **Check Database:**
   - Go to Supabase
   - View `past_papers` table
   - Faculty column should show the found value (not "Unknown")

3. **Check UI:**
   - Past papers grid should display correct faculty
   - Files should be filterable by correct faculty

## Advanced: Custom Search Domains

If your universities use different domains, customize the search engine:

1. Go to [Custom Search Console](https://cse.google.com/cse/all)
2. Click your search engine
3. Click "Sites" in left menu
4. Add more sites:
   - `.edu` - US universities
   - `.ac.uk` - UK universities
   - `.ac.ke` - Kenya universities  
   - `.ac.ug` - Uganda universities
   - `.ac.tz` - Tanzania universities
   - Country-specific domains for your target universities

## Notes

- First query takes ~2 seconds (API latency)
- Subsequent queries are faster (Google caches results)
- System will NOT wait forever - 5 second timeout
- If Google times out, it falls back to code guessing
- No rate limiting on frontend yet (could add if needed)

