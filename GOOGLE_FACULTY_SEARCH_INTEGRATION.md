# Google Faculty Search Integration for Past Papers

## Overview
The past papers auto-upload system now uses Google Search to automatically find the correct faculty for each unit at a specific university, replacing generic code-based guessing with university-specific accuracy.

## Problem Solved
Previously, the system guessed faculty from unit code prefixes (e.g., SOCI → Sociology) which worked generically but was inaccurate for specific universities. For example, SOCI might not be offered in the "Sociology" faculty at Egerton University.

**New Solution:** Search Google to find which faculty actually offers a specific unit code at a particular university.

## How It Works

### 1. Frontend Integration (`AutoUpload.jsx`)

**Import:**
```javascript
import { searchUnitFaculty } from '../pastPapersApi';
```

**Faculty Detection Priority Chain:**
```
PDF Text Extraction
    ↓ (if not found)
Google Faculty Search
    ↓ (if not found)
Code-Based Guessing
    ↓ (if not found)
'Unknown'
```

**Implementation Location:** Lines 783-809 in AutoUpload.jsx

```javascript
// Faculty priority: extracted > Google Search > guessed from unit code > 'Unknown'
let selectedFaculty = faculty || extractedMetadata?.faculty;

// Try Google Search if faculty not found from PDF extraction
if (!selectedFaculty && selectedUniversity && unit_code) {
  try {
    const universityObj = universities.find(u => u.id === selectedUniversity);
    if (universityObj?.name) {
      console.log('🔍 Searching Google for faculty of', unit_code, 'at', universityObj.name);
      const searchResult = await searchUnitFaculty(universityObj.name, unit_code, unit_name);
      
      if (searchResult?.faculty) {
        selectedFaculty = searchResult.faculty;
        console.log('🌐 Found faculty via Google Search:', selectedFaculty);
      }
    }
  } catch (error) {
    console.warn('⚠️ Google Search failed, falling back to code guessing:', error);
  }
}

// Fallback: Try code-based guessing
if (!selectedFaculty && unit_name) {
  selectedFaculty = guessFacultyFromUnitCode(unit_code, unit_name);
  if (selectedFaculty) {
    console.log('🎯 Guessed faculty from unit code:', selectedFaculty);
  }
}

selectedFaculty = selectedFaculty || 'Unknown';
```

### 2. API Wrapper Function (`pastPapersApi.js`)

**New Export:**
```javascript
/**
 * Search for the actual faculty of a unit code at a specific university
 * Uses Google Search to find accurate, university-specific faculty information
 * 
 * @param {string} universityName - Name of the university (e.g., "Egerton University")
 * @param {string} unitCode - Unit code/number (e.g., "212")
 * @param {string} unitName - Unit name (e.g., "CHEM") - optional, helps with search
 * @returns {Promise<{faculty: string|null, source: string}>}
 */
export async function searchUnitFaculty(universityName, unitCode, unitName)
```

**Features:**
- Handles missing parameters gracefully
- 10-second timeout to prevent hanging
- Returns detailed response: `{ faculty, source, error }`
- Proper error handling with console logging

### 3. Backend Endpoint (`backend/index.js`)

**Endpoint:**
```
GET /api/elib/search-unit-faculty?universityName=Egerton&unitCode=212&unitName=CHEM
```

**Parameters:**
- `universityName` (required) - University name
- `unitCode` (required) - Unit code/number
- `unitName` (optional) - Unit name for better search accuracy

**Search Query Built:**
```
Egerton 212 CHEM faculty site:.ac.ke OR site:.edu
```

**Response:**
```json
{
  "faculty": "Chemistry",
  "source": "google_search",
  "results": 3
}
```

Or if not found:
```json
{
  "faculty": null,
  "source": "google_search",
  "results": 0
}
```

**Faculty Pattern Matching:**
The endpoint searches for patterns:
- `FACULTY OF [...]`
- `SCHOOL OF [...]`
- `DEPARTMENT OF [...]`
- Cleans results (removes numbers, normalizes whitespace)

## Configuration Required

### Environment Variables (Backend)
Add to `.env` file in backend directory:

```env
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id_here
```

### How to Get Google Search API Credentials

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable "Custom Search API"

2. **Generate API Key:**
   - Go to Credentials → Create Credentials → API Key
   - Copy the API key to `GOOGLE_API_KEY`

3. **Create Custom Search Engine:**
   - Go to [Google Custom Search](https://cse.google.com/cse/)
   - Create a new search engine with sites: `.ac.ke`, `.edu`
   - Copy the Search Engine ID to `GOOGLE_SEARCH_ENGINE_ID`

### Fallback Behavior
If Google credentials are not configured:
- Backend returns 503 status with `{ fallback: true }`
- Frontend catches error and falls back to code-based guessing
- System continues to work, just without Google accuracy

## Upload Flow with Google Search

```
1. User uploads PDF folder
   ↓
2. System reads first PDF
   ↓
3. Extracts metadata from PDF text:
   - University, Faculty, Unit Code, Unit Name, Year, Semester
   ↓
4. If Faculty NOT found in PDF:
   ↓
5. Call `/api/elib/search-unit-faculty` with:
   - University Name from UI or extracted from PDF
   - Unit Code (numeric portion)
   - Unit Name (alphabetic portion)
   ↓
6. Backend searches Google with educational domain filters
   ↓
7. If Faculty found → Use it ✅
   If Faculty not found → Try code-based guessing
   If Google API not configured → Skip to code-based guessing
   ↓
8. All files get uploaded with correct, university-specific faculty
```

## Console Logging

The implementation includes detailed logging for debugging:

**Frontend:**
```
🔍 Searching Google for faculty of 212 at Egerton University
🌐 Found faculty via Google Search: Chemistry
ℹ️ Google Search did not find faculty, trying code-based guessing
⚠️ Google Search failed, falling back to code guessing: [error]
🎯 Guessed faculty from unit code: Biology
```

**Backend:**
```
🔍 Searching for faculty: "Egerton 212 CHEM faculty site:.ac.ke OR site:.edu"
✅ Found faculty via Google Search: Chemistry
⚠️ No faculty found in search results
⚠️ Google Search API not configured
❌ Error searching for faculty: [error]
```

## Testing Checklist

- [ ] Configure Google API keys in backend `.env`
- [ ] Upload past papers with units not found by PDF extraction
- [ ] Verify faculty auto-fills correctly from Google
- [ ] Test with multiple universities
- [ ] Test fallback when Google API returns no results
- [ ] Disable Google API keys and verify fallback to code guessing works
- [ ] Check console logs for proper flow and error messages
- [ ] Verify files appear in grid with correct faculty

## Future Enhancements

1. **Caching:** Store successful searches in localStorage to avoid repeated Google queries
2. **Rate Limiting:** Implement request throttling if multiple uploads
3. **Database Caching:** Store found faculty mappings in Supabase for offline use
4. **Manual Override:** Allow users to correct faculty if Google gets it wrong
5. **Batch Processing:** Search for all units in folder before starting uploads
6. **Performance:** Implement search timeout and progress indicator

## Files Modified

1. **`src/SomaLux/Books/Admin/pastPapersApi.js`**
   - Added `searchUnitFaculty()` export function

2. **`src/SomaLux/Books/Admin/pages/AutoUpload.jsx`**
   - Imported `searchUnitFaculty`
   - Updated faculty detection logic to call Google Search

3. **`backend/index.js`**
   - Added `/api/elib/search-unit-faculty` endpoint (already added)
   - Uses Google Custom Search API for university-specific faculty lookup

## Status

✅ **Backend Endpoint:** Fully implemented
✅ **Frontend API Wrapper:** Created
✅ **Integration in AutoUpload:** Complete
✅ **Error Handling:** Graceful fallback
✅ **Console Logging:** Detailed debugging info
⏳ **Testing:** Awaiting Google API key configuration and user testing

## Next Steps

1. Configure Google API keys in backend `.env`
2. Test with actual past paper uploads
3. Adjust faculty pattern matching if needed for specific universities
4. Consider caching implementation for performance
5. Add optional manual faculty override UI if users need to correct results

