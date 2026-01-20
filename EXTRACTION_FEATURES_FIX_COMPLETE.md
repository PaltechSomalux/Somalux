# Auto Upload Extraction Features Fix - Complete Documentation

**Date**: January 19, 2026  
**Status**: ✅ COMPLETE  
**Scope**: Past Papers Auto Upload Extraction Features

## Overview

Fixed critical issues in the past papers auto upload extraction system to ensure accurate metadata capture with strict validation rules.

## Three Core Rules Implemented

### ✅ Rule 1: Unit Name NEVER Uses Filename
- **Requirement**: Unit name must ONLY be extracted from PDF content
- **Files Modified**:
  - `src/SomaLux/Books/Admin/utils/extractPastPaperMetadata.js` - `parseMetadataFromFilename()`
  - `backend/utils/ocrExtractPDF.js` - `parseFileNameForPastPaper()` and `extractPastPaperDetailsFromScannedPDF()`

- **Changes**:
  - Removed all code that extracted `unitName` from filename
  - Changed `parseMetadataFromFilename()` to ONLY extract `unitCode` (numeric part)
  - Added explicit warning when filename contains `unit_name` to ignore it
  - Added validation: `if (fileNameDetails.unit_name) { console.warn(...); }` - never use it

### ✅ Rule 2: Unit Name NEVER Contains Numbers
- **Requirement**: Unit name must be 100% text, zero digits (0-9)
- **Files Modified**:
  - `src/SomaLux/Books/Admin/utils/extractPastPaperMetadata.js` - Multiple validation points

- **Changes Across All Strategies**:

#### Strategy 1: Candidate Validation (Lines ~240-280)
```javascript
// CRITICAL VALIDATION: Unit name MUST NOT contain ANY digits (0-9)
if (/\d/.test(text)) {
  console.log(`    ❌ REJECT: Contains digits (unit names must not have numbers)`);
  continue;
}
```

#### Strategy 2: Code Context Search (Lines ~385-420)
```javascript
// CRITICAL: Unit name MUST NOT contain digits
if (/\d/.test(line)) {
  console.log(`⏭️ Skipping line with digits: "${line}"`);
  continue;
}
```

#### Strategy 3: Line Scanning (Lines ~425-450)
```javascript
// CRITICAL: Unit name MUST NOT contain digits
if (/\d/.test(line)) {
  console.log(`⏭️ Skipping line with digits: "${line}"`);
  continue;
}
```

#### Strategy 4: Capitalized Text (Lines ~455-485)
```javascript
// CRITICAL: Unit name MUST NOT contain digits
if (/\d/.test(trimmed)) {
  console.log(`⏭️ Skipping line with digits: "${trimmed}"`);
  continue;
}

// Additional validation in final check
if (cleaned.length > 3 && /[A-Za-z]/.test(cleaned) && cleaned.length < 200 && !/\d/.test(cleaned)) {
  metadata.unitName = cleaned;
```

### ✅ Rule 3: Unit Code ONLY Contains Digits
- **Requirement**: Unit code must be ONLY numeric (0-9), NO letters
- **Files Modified**:
  - `src/SomaLux/Books/Admin/utils/extractPastPaperMetadata.js` - `parseMetadataFromText()`
  - `backend/utils/ocrExtractPDF.js` - `parsePastPaperDetails()` and `parseFileNameForPastPaper()`

- **Changes**:

#### Frontend: Extract Only Digits (Lines ~125-140)
```javascript
const codePatterns = [
  /\b[A-Z]{2,6}\s*[-]?\s*(\d{2,4})\b/,  // Extract digits from "CODE 101"
  /\b[A-Z]{2,6}(\d{2,4})\b/,              // Extract digits from "CODE101"
  /\b[A-Z]+(\d{3,4})\b/                   // Extract digits from prefix+number
];

for (const pattern of codePatterns) {
  const match = text.match(pattern);
  if (match) {
    const digits = match[1]; // This is the numeric part only
    // Validate: must be ONLY digits, no letters
    if (/^\d{2,4}$/.test(digits)) {
      metadata.unitCode = digits;
      break;
    }
  }
}
```

#### Backend: Extract Only Digits from PDF (Lines ~188-198)
```javascript
const unitCode = match[2]; // Just the number
if (/^\d{2,4}$/.test(unitCode)) { // Validate it's only digits
  details.unit_code = unitCode;
  details.confidence.unit_code = 0.95; // Very high confidence
}
```

#### Backend: Validate Filename Extraction (Lines ~367-377)
```javascript
const unitCode = codeMatch[1];
// Validate: unit_code must be ONLY digits
if (/^\d{2,4}$/.test(unitCode)) {
  details.unit_code = unitCode; // NUMBER (e.g., "101")
}
```

#### Backend: Validate Fallback Merge (Lines ~305-313)
```javascript
// Validate unit_code: must be ONLY digits
if (/^\d{2,4}$/.test(fileNameDetails.unit_code)) {
  details.unit_code = fileNameDetails.unit_code;
  if (!details.confidence.unit_code) {
    details.confidence.unit_code = 0.6; // Lower confidence for filename parsing
  }
  console.log(`📝 [PAST-PAPER-EXTRACT] Extracted unit_code from filename: ${details.unit_code}`);
}
```

## Extraction Flow After Fix

```
PDF File Upload
    ↓
Extract Text from PDF (direct text extraction or OCR)
    ↓
Parse PDF Content
    ├─ Unit Code: Extract PREFIX+NUMBER pattern, validate NUMBER only
    ├─ Unit Name: Extract descriptive text, validate NO digits
    ├─ Faculty: Extract faculty/department info
    ├─ Year: Extract 4-digit year
    ├─ Semester: Extract semester number
    └─ Exam Type: Extract exam type (Main, Supplementary, etc.)
    ↓
Fallback to Filename (ONLY if PDF extraction insufficient)
    ├─ Unit Code: Extract digits only (if missing from PDF)
    ├─ Year: Extract year only (if missing from PDF)
    ├─ Semester: Extract semester only (if missing from PDF)
    └─ ❌ NEVER extract Unit Name from filename
    ↓
Final Validation
    ├─ Reject if Unit Name contains ANY digits
    ├─ Reject if Unit Code contains ANY letters
    ├─ Ensure Unit Name comes from PDF only
    └─ Log all decisions for debugging
    ↓
Upload to Supabase
```

## Validation Rules Summary

### Unit Code Validation
✅ Must be 2-4 digits only  
✅ Pattern: `^\d{2,4}$`  
✅ Examples: `101`, `201`, `3050`  
❌ NOT valid: `UCU101`, `CS-201`, `BIO101A`  

### Unit Name Validation
✅ Must contain ONLY letters, spaces, hyphens, ampersands  
✅ Pattern: No digits allowed (`/\d/` must not match)  
✅ Must be 3-200 characters  
✅ Must come from PDF content exclusively  
✅ Examples: `General Chemistry`, `Advanced Biology`, `Linear Algebra`  
❌ NOT valid: `Chemistry 101`, `Biology1`, `PHYS 201`, `CS101`  

## Files Modified

### 1. **Frontend**: `src/SomaLux/Books/Admin/utils/extractPastPaperMetadata.js`
   - **Lines 73-120**: Updated `parseMetadataFromFilename()` - NEVER extract unitName
   - **Lines 125-140**: Updated unit code extraction - digits only
   - **Lines 240-280**: Added digit validation in candidate selection
   - **Lines 385-420**: Added digit validation in strategy 1
   - **Lines 425-450**: Added digit validation in strategy 2
   - **Lines 455-485**: Added digit validation in strategy 3

### 2. **Backend**: `backend/utils/ocrExtractPDF.js`
   - **Lines 188-198**: Updated `parsePastPaperDetails()` - extract digits only, no unitName
   - **Lines 305-334**: Enhanced fallback logic - NEVER use filename for unitName
   - **Lines 355-377**: Updated `parseFileNameForPastPaper()` - digits only, no unitName

## Comprehensive Debug Output

All extraction strategies now log detailed information:

```
🔍 UNIT NAME EXTRACTION - Scanning X lines
🔝 First 20 lines of PDF:
✅ PATTERN MATCH [explicit-label] (100): "Full course name"
✅ [after-code at line X] (92): "Course Name Here"
⏭️ Skipping line with digits: "Chemistry 101"
❌ REJECT: Contains digits (unit names must not have numbers)
✅✅✅ SELECTED UNIT NAME: "Chemistry" (score: 95, source: code-after)
```

## Testing Scenarios

### Test Case 1: PDF with Code + Name
**Input**: PDF contains "CHEM 201: General Chemistry"  
**Output**:
- `unitCode`: "201"
- `unitName`: "General Chemistry"

### Test Case 2: PDF with Numbers in Name
**Input**: PDF contains "CHEM 201: Chemistry 201 Advanced"  
**Output**:
- `unitCode`: "201"
- `unitName`: (REJECTED - contains digit, will try other strategies)

### Test Case 3: Filename Only
**Input**: Filename "CHEM201_Chemistry_2023_1.pdf", PDF content minimal  
**Output**:
- `unitCode`: "201" (from filename digits)
- `unitName`: (NOT from filename - left empty or from PDF content)

### Test Case 4: Complex PDF
**Input**: Scanned PDF with variable formatting  
**Output**:
- Uses aggressive multi-strategy extraction
- Each candidate validated against digit rule
- Only first passing candidate selected

## Backward Compatibility

✅ No breaking changes to API  
✅ Extraction logic is more restrictive (better validation)  
✅ Previously valid data (unit names without digits) still works  
❌ Previously invalid data (unit names with digits) now REJECTED  

## Migration Notes

If existing past papers have unit names containing digits:
1. Those will fail new validation
2. Manual correction required or re-upload with PDF content correction
3. No automatic migration to maintain data integrity

## Benefits

✅ **Accuracy**: Prevents invalid data from being stored  
✅ **Consistency**: Enforces uniform formatting  
✅ **Debugging**: Comprehensive logging for troubleshooting  
✅ **Reliability**: Multi-strategy fallback with validation  
✅ **Maintainability**: Clear validation rules in code  

## Related Files

- `PASTPAPERS_AUTO_EXTRACTION_GUIDE.md` - User guide
- `UNIT_NAME_EXTRACTION_DEBUGGING_GUIDE.md` - Debugging help
- `PDF_METADATA_EXTRACTION_DETAILED.md` - Technical details
- `backend/scripts/bulkUploadPastPapers.js` - Bulk upload handler

## Summary

All three core requirements have been successfully implemented with:
- ✅ Unit name NEVER comes from filename
- ✅ Unit name NEVER contains digits
- ✅ Unit code ONLY contains digits

The extraction system now enforces these rules at every validation point across both frontend and backend systems.
