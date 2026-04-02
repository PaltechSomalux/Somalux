# Quick Start: Google Faculty Search for Past Papers

## What Changed?

The past papers auto-upload system now **searches Google** to automatically find the correct faculty for each unit at a specific university instead of just guessing from the unit code.

**Example:**
- Before: SOCI → always "Sociology" (wrong for some universities)
- After: SOCI at Egerton → actually searches Google, finds "Social Sciences" or whatever faculty Egerton uses

## Setup (2 minutes)

### 1. Get Google API Keys (5 minutes)

**API Key:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the key

**Search Engine ID:**
1. Go to https://cse.google.com/cse/all
2. Click "Create" → "New search engine"
3. Name: "SomaLux"
4. Sites: Add `.ac.ke`, `.edu`, `.ac.uk`
5. Copy the Search Engine ID

### 2. Add to Backend Environment (1 minute)

Edit `backend/.env`:
```env
GOOGLE_API_KEY=AIzaSyDk...
GOOGLE_SEARCH_ENGINE_ID=1234567890:abcd...
```

### 3. Restart Backend (1 minute)

```bash
npm start
```

## Test It

1. Upload a past paper folder
2. Watch the console - you should see:
   ```
   🔍 Searching Google for faculty of 212 at Egerton University
   🌐 Found faculty via Google Search: Science
   ```
3. Check the database - faculty should be auto-filled
4. Files should appear in the grid with correct faculty

## What Happens Behind the Scenes?

```
Upload folder
    ↓
Extract metadata (unit code, name, year, etc.)
    ↓
Faculty found in PDF? 
    → YES: Use it (fast)
    → NO: Search Google (2-3 seconds)
        → Found? Use it
        → Not found? Guess from code (CHEM → Chemistry)
        → Still not found? Mark as "Unknown"
    ↓
Upload file with faculty
```

## Fallback: What If Google API Keys Missing?

The system still works! It just falls back to guessing:
- CHEM → Chemistry
- BIO → Biology
- etc.

Not perfect, but better than nothing.

## Cost

✅ **FREE** for first 100 searches/day
💰 **$5 per 1,000** searches after that

For a school, 100/day is usually plenty.

## Troubleshooting

**"Google Search API not configured"**
- Did you add GOOGLE_API_KEY to `backend/.env`?
- Did you add GOOGLE_SEARCH_ENGINE_ID to `backend/.env`?
- Did you restart the backend? (`npm start`)

**"Faculty still shows as Unknown"**
- Google didn't find results for that unit
- System fell back to code guessing
- If wrong, you can manually fix in the database

**"Google Search returns 403 error"**
- API key not restricted to Custom Search API
- Go to Google Cloud Console → Credentials
- Click your API key → Restrict to "Custom Search API"

## Files Changed

1. **backend/index.js** - Added `/api/elib/search-unit-faculty` endpoint
2. **src/SomaLux/Books/Admin/pastPapersApi.js** - Added `searchUnitFaculty()` function
3. **src/SomaLux/Books/Admin/pages/AutoUpload.jsx** - Integrated Google search into upload flow

All changes are backward compatible - if Google API not configured, system falls back to code guessing.

## Next Steps

1. ✅ Configure Google API keys (you are here)
2. ⏳ Test with real past papers
3. ⏳ Upload to production
4. ⏳ (Optional) Add caching to speed up repeated searches

## Documentation

For more details, see:
- `GOOGLE_FACULTY_SEARCH_INTEGRATION.md` - Complete technical reference
- `GOOGLE_API_SETUP.md` - Detailed setup instructions
- `GOOGLE_FACULTY_FLOW.md` - System architecture and data flow
- `GOOGLE_SEARCH_IMPLEMENTATION_SUMMARY.md` - Implementation overview

## Questions?

Check the console logs - they tell you what's happening:
- 🔍 = Searching Google
- 🌐 = Found from Google
- 🎯 = Guessed from code
- ⚠️ = Something went wrong
- ✅ = Success

