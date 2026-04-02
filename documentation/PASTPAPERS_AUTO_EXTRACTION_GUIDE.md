# Past Papers Auto-Extraction Feature - Complete Guide

## Overview

The Past Papers Auto-Upload feature now includes **automatic University and Faculty detection** from your PDF documents. No more manual selection needed!

## How It Works

### Step 1: Select Your Folder
- Drag and drop or click to select a folder with past paper PDFs
- The system automatically starts extraction from the first file

### Step 2: Automatic Extraction (Background)
The system instantly:
1. **Reads the PDF** - Extracts text from the first 1-2 pages
2. **Detects University** - Uses intelligent pattern matching to find university name
3. **Detects Faculty** - Finds the faculty/school/department name
4. **Loads Faculty List** - Fetches available faculties for the detected university
5. **Auto-Fills Faculty** - Matches extracted faculty with available faculties using fuzzy matching

### Step 3: Auto-Filled Form
When auto-detection succeeds:
- ✅ **University** - Automatically selected (hidden from view)
- ✅ **Faculty** - Automatically selected (hidden from view)
- 📋 **File List** - Shows all selected files ready to upload
- 🟢 **Upload Button** - Enabled and ready to process

You can now **directly upload** without any manual selection!

### Step 4: Override (If Needed)
If you need to change the auto-detected values:
- Click **"✏️ Override Auto-Detected Values"** button
- Select different University and/or Faculty
- Click **"Use Auto-Detected Values"** to revert

## Extraction Patterns

The system looks for these patterns in your PDFs:

### University Names
- "UNIVERSITY OF [NAME]"
- "[NAME] UNIVERSITY"
- "University of [NAME]"

**Examples that work:**
- ✅ UNIVERSITY OF NAIROBI
- ✅ KENYATTA UNIVERSITY
- ✅ EGERTON UNIVERSITY
- ✅ University of Kenya

### Faculty Names
- "FACULTY OF [NAME]"
- "SCHOOL OF [NAME]"
- "DEPARTMENT OF [NAME]"

**Examples:**
- ✅ FACULTY OF SCIENCE
- ✅ SCHOOL OF ENGINEERING
- ✅ DEPARTMENT OF MEDICINE
- ✅ Faculty of Agriculture

### Fallback: Filename Parsing
If PDF text extraction fails, the system parses the filename for metadata:

**Expected format:** `UNITCODE_UnitName_2023_1_Main.pdf`

- `UNITCODE` → Unit Code (e.g., BIO101, MENT130)
- `UnitName` → Unit Name
- `2023` → Year
- `1` → Semester
- `Main` → Exam Type (Main, Supplementary, CAT, Mock)

## Fuzzy Matching

The system uses intelligent **fuzzy matching** to handle:
- Slight spelling variations
- Different formatting (uppercase/lowercase)
- Abbreviations
- Different word orders

**Matching Accuracy:** 60%+ similarity threshold

## Troubleshooting

### "Could not auto-detect - please select manually"

**Possible causes:**
1. **University name not on first page** - Include university name on page 1
2. **Text-based PDF** - Ensure PDF contains selectable text (not a scanned image)
3. **Unusual formatting** - Faculty name in different format

**Solutions:**
- Move university/faculty info to page 1 of PDF
- Use "Select Manually" to override
- Check filename format: `CODE_Name_2023_1_Main.pdf`

### Faculty list appears empty after university selection

**Possible causes:**
1. University not found in system
2. University has no faculties configured

**Solution:** Check with admin to verify university/faculty data setup

## Best Practices for PDFs

### ✅ Do This:
1. Include university name on **first page** of PDF
2. Include faculty/school name on **first page** of PDF
3. Use clear, standard formatting:
   ```
   UNIVERSITY OF NAIROBI
   FACULTY OF SCIENCE
   ```
4. Name files with proper format:
   ```
   BIO101_Biology1_2023_1_Main.pdf
   CHM201_Chemistry2_2023_2_Supplementary.pdf
   ```

### ❌ Don't Do This:
- Hide university name on pages 2+
- Use scanned images without OCR (text not selectable)
- Use ambiguous abbreviations: "UoN" instead of "UNIVERSITY OF NAIROBI"
- Name files without proper structure: `exam.pdf` or `past_paper.pdf`

## File Upload Process

1. **Select Folder** → Auto-extract starts
2. **Wait 2-3 seconds** → University & Faculty auto-fill
3. **No dropdown selection needed** → Direct upload button enabled
4. **Click Upload** → All files upload with auto-detected metadata
5. **Progress tracking** → See upload progress in real-time
6. **Success confirmation** → See upload counts and status

## API Integration

Auto-extracted metadata is sent to backend:

```json
{
  "university_id": "uuid-of-selected-university",
  "faculty": "Auto-Detected Faculty Name",
  "unit_code": "BIO101",
  "unit_name": "Biology 1",
  "year": 2023,
  "semester": "1",
  "exam_type": "Main",
  "uploaded_by": "user-id"
}
```

## Performance Notes

- **Extraction time:** 1-3 seconds per PDF
- **Fuzzy matching:** <100ms per university/faculty
- **Faculty loading:** 500ms-1s from API
- **Total setup time:** 2-3 seconds before upload ready

## Features Status

✅ Auto-extract University from PDF  
✅ Auto-extract Faculty from PDF  
✅ Fuzzy matching for close name matches  
✅ Fallback to filename parsing  
✅ Hidden dropdowns when auto-filled  
✅ Override option for manual corrections  
✅ Progress tracking during upload  
✅ Toast notifications for feedback  
✅ Batch file upload support  

## For Developers

### Extraction Utility
**File:** `src/SomaLux/Books/Admin/utils/extractPastPaperMetadata.js`

```javascript
import { extractPastPaperMetadata } from '../utils/extractPastPaperMetadata';

const metadata = await extractPastPaperMetadata(pdfFile);
// Returns: { university, faculty, unitCode, unitName, year, semester, examType, source }
```

### Fuzzy Matching
```javascript
import { findMatchingUniversity, findMatchingFaculty } from '../utils/extractPastPaperMetadata';

const universityId = findMatchingUniversity('NAIROBI UNIVERSITY', universities);
const faculty = findMatchingFaculty('FACULTY OF SCIENCE', faculties);
```

### Component
**File:** `src/SomaLux/Books/Admin/pages/AutoUpload.jsx`

`PastPapersAutoUploadContent` component handles full auto-upload flow.

