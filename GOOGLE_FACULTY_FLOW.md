# Past Papers Auto-Upload: Complete Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                    AutoUpload.jsx Component                     │
└─────────────────────────────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────────┐
    │ 1. User selects folder with PDF files      │
    │ 2. System reads first PDF                  │
    │ 3. Extracts text (first 2 pages)          │
    │ 4. Parses filename                         │
    └────────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────────┐
    │  METADATA EXTRACTION                       │
    │  (extractPastPaperMetadata.js)             │
    ├────────────────────────────────────────────┤
    │ University: Egerton University             │
    │ Unit Code: 212                             │
    │ Unit Name: CHEM                            │
    │ Year: 2019                                 │
    │ Semester: 2                                │
    │ Faculty: (empty - not found in PDF)        │
    └────────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────────┐
    │  FACULTY DETECTION (3-tier approach)       │
    ├────────────────────────────────────────────┤
    │ 1️⃣  PDF Text Extraction                     │
    │     Did PDF contain faculty name?          │
    │     ✅ Found → Use it                       │
    │     ❌ Not found → Continue                 │
    │                                            │
    │ 2️⃣  GOOGLE SEARCH (NEW!)                    │
    │     Search: "Egerton 212 CHEM faculty"    │
    │     ✅ Found → Use it                       │
    │     ❌ Not found → Continue                 │
    │                                            │
    │ 3️⃣  CODE-BASED GUESSING                     │
    │     CHEM → Chemistry                       │
    │     ✅ Found → Use it                       │
    │     ❌ Not found → 'Unknown'                │
    └────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express.js)                        │
│              pastPapersApi.js + backend/index.js               │
└─────────────────────────────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────────┐
    │  Google Custom Search API Call             │
    │  (if faculty not found in PDF)             │
    ├────────────────────────────────────────────┤
    │ Endpoint: /api/elib/search-unit-faculty    │
    │ Query: Egerton 212 CHEM faculty            │
    │ Filters: site:.ac.ke OR site:.edu          │
    │ Timeout: 5 seconds                         │
    └────────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────────┐
    │  Google API Response                       │
    ├────────────────────────────────────────────┤
    │ Result 1:                                  │
    │ Title: "CHEM 212 - Egerton University..."  │
    │ Snippet: "Faculty of Science, Department.."│
    │                                            │
    │ Result 2: [more results...]                │
    └────────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────────┐
    │  Pattern Matching                          │
    │  Extract: FACULTY OF [...]                 │
    │  Clean result                              │
    │  Result: "Science"                         │
    └────────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────────┐
    │  Return to Frontend                        │
    │  { faculty: "Science", source: "google" }  │
    └────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FINAL METADATA OBJECT                        │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   title: "212 - CHEM",                                          │
│   university_id: "uuid-of-egerton",                            │
│   faculty: "Science",  ← From Google Search                     │
│   unit_code: "212",                                            │
│   unit_name: "CHEM",                                           │
│   year: 2019,                                                  │
│   semester: "2",                                               │
│   exam_type: "Main",                                           │
│   uploaded_by: "user_id"                                       │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
              ↓
    ┌────────────────────────────────────────────┐
    │  FOR EACH FILE IN FOLDER:                  │
    │  1. Upload PDF to Supabase Storage         │
    │  2. Create database record with metadata   │
    │  3. Link file to database record           │
    │  4. Show upload progress                   │
    └────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE (Supabase)                      │
│                     past_papers table                           │
├─────────────────────────────────────────────────────────────────┤
│ id        | title      | university_id | faculty | unit_code   │
│ uuid-1234 | 212 - CHEM | uuid-egerton  | Science | 212         │
│ uuid-5678 | 306 - MATH | uuid-egerton  | Science | 306         │
│ uuid-9012 | 101 - SOCI | uuid-egerton  | Social  | 101         │
└─────────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PAST PAPERS GRID (UI)                        │
│  Shows all papers with correct, university-specific faculty    │
│  Users can filter by: University, Faculty, Unit Code           │
│  All metadata auto-extracted and auto-filled                   │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Step-by-Step Flow

### Phase 1: User Interaction

```
Timeline: User Actions
─────────────────────────────────────────────────────────

T0: User clicks "Upload Past Papers Folder"
    ↓
T1: Opens folder selector
    ↓ 
T2: User selects folder with PDFs (e.g., "EGERTON_2019_2nd_Sem")
    ↓
T3: Component reads folder:
    - CHEM_212.pdf
    - MATH_306.pdf
    - SOCI_101.pdf
    ↓
T4: System reads first PDF text (CHEM_212.pdf)
    ↓
T5: Extracts metadata from PDF + filename
    ✅ University: found or guessed
    ✅ Unit Code: 212
    ✅ Unit Name: CHEM
    ✅ Year: 2019
    ✅ Semester: 2
    ❌ Faculty: NOT FOUND
    ↓
T6: Trigger Google Faculty Search
```

### Phase 2: Google Search

```
Frontend Action:
─────────────────────────────────────────────────────────

await searchUnitFaculty(
  universityName: "Egerton University",
  unitCode: "212",
  unitName: "CHEM"
)

        ↓
        
Backend Received (/api/elib/search-unit-faculty):
─────────────────────────────────────────────────────────

GET /api/elib/search-unit-faculty
  ?universityName=Egerton University
  &unitCode=212
  &unitName=CHEM

        ↓
        
Build Search Query:
─────────────────────────────────────────────────────────

searchQuery = "Egerton University 212 CHEM faculty 
              site:.ac.ke OR site:.edu"

        ↓
        
Call Google Custom Search:
─────────────────────────────────────────────────────────

https://www.googleapis.com/customsearch/v1
  ?q=Egerton University 212 CHEM faculty site:.ac.ke OR site:.edu
  &key=GOOGLE_API_KEY
  &cx=GOOGLE_SEARCH_ENGINE_ID
  &num=3

        ↓
        
Google Returns (up to 3 results):
─────────────────────────────────────────────────────────

[
  {
    title: "CHEM 212 - Chemistry I - Egerton University",
    snippet: "Offered by Faculty of Science and Technology. 
             First offered in 1995. Credits: 3..."
  },
  {
    title: "Egerton Science Faculty - Courses",
    snippet: "The Faculty of Science offers courses in Chemistry, 
             Physics, Biology including CHEM 212..."
  },
  {
    title: "CHEM 212 Syllabus",
    snippet: "Department of Chemistry within the Faculty of Science..."
  }
]

        ↓
        
Pattern Matching:
─────────────────────────────────────────────────────────

Patterns: [
  /FACULTY\s+OF\s+([A-Z\s&,]+?)(?:\n|$|EXAM)/i
  /SCHOOL\s+OF\s+([A-Z\s&,]+?)(?:\n|$|EXAM)/i
  /DEPARTMENT\s+OF\s+([A-Z\s&,]+?)(?:\n|$|EXAM)/i
]

For each result:
  Result 1: "...Faculty of Science..." 
            → Match! → Faculty = "Science"
            ✅ STOP HERE

        ↓
        
Return Response:
─────────────────────────────────────────────────────────

{
  faculty: "Science",
  source: "google_search",
  results: 3
}

        ↓
        
Frontend Receives:
─────────────────────────────────────────────────────────

✅ Faculty found: "Science"
   Log: "🌐 Found faculty via Google Search: Science"
   Use: selectedFaculty = "Science"
```

### Phase 3: File Upload

```
For Each File in Folder (CHEM_212.pdf, MATH_306.pdf, etc.):
─────────────────────────────────────────────────────────

1. Parse Filename
   Input: CHEM_212.pdf
   Extract: unit_name = "CHEM", unit_code = "212"

2. Build Metadata Object
   {
     title: "212 - CHEM",
     university_id: "uuid-egerton",
     faculty: "Science",        ← From Google!
     unit_code: "212",
     unit_name: "CHEM",
     year: 2019,
     semester: "2",
     exam_type: "Main"
   }

3. Upload PDF to Supabase Storage
   Bucket: past-papers
   Path: /2019/egerton/chem_212.pdf
   Size: 2.3MB
   ✅ Upload: 100% →

4. Create Database Record
   Table: past_papers
   INSERT {
     id: uuid-auto,
     title: "212 - CHEM",
     university_id: uuid-egerton,
     faculty: "Science",
     unit_code: "212",
     unit_name: "CHEM",
     year: 2019,
     semester: "2",
     exam_type: "Main",
     file_path: "2019/egerton/chem_212.pdf",
     file_size: 2400000,
     created_at: now(),
     uploaded_by: current_user_id
   }
   ✅ Record created

5. Show Success
   "✅ Uploaded: CHEM_212.pdf"
   Progress: 1/3 files

6. Repeat for next file (MATH_306.pdf)
```

### Phase 4: Display in Grid

```
After All Uploads Complete:
─────────────────────────────────────────────────────────

Fetch from Database:
SELECT * FROM past_papers 
WHERE university_id = 'uuid-egerton'
ORDER BY created_at DESC

Display in Grid:
┌─────────────────────────────────────────┐
│ EGERTON UNIVERSITY - PAST PAPERS        │
├─────────────────────────────────────────┤
│                                         │
│ Title           Unit  Year  Semester    │
│ ─────────────────────────────────────── │
│ 212 - CHEM      212   2019  2           │
│ 306 - MATH      306   2019  2           │
│ 101 - SOCI      101   2019  2           │
│                                         │
└─────────────────────────────────────────┘

Filter by Faculty:
  ✓ Science (2 items)
    - 212 - CHEM
    - 306 - MATH
  □ Social Sciences (1 item)
    - 101 - SOCI
  □ Other (0 items)

User can click on any paper to download or view
```

## Fallback Scenarios

### Scenario 1: PDF Contains Faculty Name
```
PDF Text includes: "Faculty of Science"
↓
extractPastPaperMetadata() finds it
↓
selectedFaculty = "Science"
↓
Skip Google Search (already found!)
✅ Fastest (no API call)
```

### Scenario 2: Google Search Returns No Results
```
searchUnitFaculty() called
↓
Google API returns: { items: [] }
↓
No pattern matches
↓
Return: { faculty: null, source: "google_search" }
↓
Frontend falls back to code guessing
↓
guessFacultyFromUnitCode("212", "CHEM") → "Chemistry"
✅ Degrades gracefully
```

### Scenario 3: Google API Not Configured
```
env vars GOOGLE_API_KEY or GOOGLE_SEARCH_ENGINE_ID missing
↓
Backend checks at request time
↓
Returns: { error: "...", fallback: true } with 503 status
↓
Frontend catches error
↓
Falls back to code guessing
✅ System still works
```

### Scenario 4: Google API Timeout
```
searchUnitFaculty() with 5-second timeout
↓
Google takes too long (network issue, etc.)
↓
Timeout triggers
↓
Catch block catches error
↓
Falls back to code guessing
✅ Prevents hanging uploads
```

### Scenario 5: Unit Code Not Recognized
```
Unit Code: UNKNOWN_123
↓
Google: No results for "Egerton UNKNOWN_123 faculty"
↓
Code Guessing: No pattern match for "UNKNOWN"
↓
Default: faculty = "Unknown"
↓
File uploads with faculty: "Unknown"
⚠️ User can manually correct in database if needed
```

## Performance Characteristics

```
Time Breakdown for One Upload:
─────────────────────────────────────────────────────────

1. PDF Read & Text Extract:      ~500ms
2. Filename Parsing:             ~10ms
3. University/Faculty Matching:  ~50ms
4. Google Search API Call:       ~2000ms (1.5-3s range)
5. Pattern Matching:             ~20ms
6. PDF Upload to Storage:        ~5000ms (varies with file size)
7. Database Record Creation:     ~100ms
─────────────────────────────────────────────────────────
   TOTAL PER FILE:              ~7680ms (varies)

For 5 files:
  - First file: ~7.7 seconds (includes Google Search)
  - Remaining files: Read metadata from first file
                     Skip Google Search (cached)
                     ~6 seconds each
  Total: ~37 seconds for folder upload

Optimization: Could cache faculty results to avoid
redundant Google searches for same unit+university
```

## Console Output Example

```
🔤 Extracted - Name: CHEM Code: 212 from: CHEM 212
📅 Filename contains between code and year: 
📊 Final parsed metadata: { unit_code: '212', unit_name: 'CHEM', year: 2019, semester: '2', exam_type: 'Main' }

🔍 Searching Google for faculty of 212 at Egerton University
🔍 Searching for faculty: "Egerton University 212 CHEM faculty site:.ac.ke OR site:.edu"

✅ Found faculty via Google Search: Science

📤 Uploading with metadata: {
  fileName: 'CHEM_212.pdf',
  universityId: 'uuid-egerton',
  faculty: 'Science',
  unitCode: '212',
  unitName: 'CHEM',
  year: 2019,
  semester: '2',
  examType: 'Main'
}

📤 Using createPastPaper API to upload: {...}

✅ Uploaded successfully: { fileName: 'CHEM_212.pdf', pastPaperId: 'uuid-1234' }
✅ Uploaded: CHEM_212.pdf
```

## Summary

The system uses a **3-tier faculty detection strategy**:

1. **PDF Text Extraction** (Fastest, Most Accurate)
   - Works if PDF header contains faculty name
   - No external API calls needed
   - High reliability

2. **Google Search** (Medium Speed, University-Specific)
   - Works for public universities with web presence
   - Finds actual faculty for that specific university
   - ~2 seconds per search (cached after first call)

3. **Code-Based Guessing** (Fast, Generic)
   - Works universally for common unit codes
   - May not be accurate for specific universities
   - Fallback for when Google returns no results

This approach ensures that **almost all files get correct, university-specific faculty information** while gracefully degrading if any component fails.

