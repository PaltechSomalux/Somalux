# Past Papers Auto Upload - Extraction Fix Quick Reference

## Three Core Rules (CRITICAL)

### 🚫 Rule 1: Unit Name NEVER from Filename
```javascript
// WRONG ❌
metadata.unitName = filename.split('_')[1]; // "Chemistry"

// RIGHT ✅
// Extract ONLY from PDF content
metadata.unitName = extractFromPDFContent(); // "Chemistry"
```

### 🚫 Rule 2: Unit Name NEVER Contains Digits
```javascript
// WRONG ❌
metadata.unitName = "Chemistry 101";    // Contains digit
metadata.unitName = "CHEM 201";         // Contains digit
metadata.unitName = "Bio1";             // Contains digit

// RIGHT ✅
metadata.unitName = "Chemistry";        // Letters only
metadata.unitName = "General Chemistry"; // Letters only
if (/\d/.test(unitName)) {
  reject(unitName); // Always reject if contains digit
}
```

### 🚫 Rule 3: Unit Code ONLY Contains Digits
```javascript
// WRONG ❌
metadata.unitCode = "CHEM201";  // Contains letters
metadata.unitCode = "BIO101A";  // Contains letter
metadata.unitCode = "CS-301";   // Contains dash

// RIGHT ✅
metadata.unitCode = "201";      // Digits only
metadata.unitCode = "101";      // Digits only
if (!/^\d{2,4}$/.test(unitCode)) {
  reject(unitCode); // Only accept pure digits
}
```

## Validation Checklist

### Before Upload
- [ ] Unit Code is 2-4 digits only (e.g., "201", "1001")
- [ ] Unit Name has NO digits (e.g., "Chemistry", NOT "Chemistry 101")
- [ ] Unit Name comes from PDF, NOT filename
- [ ] Both fields extracted successfully (not empty)

### During Extraction
- [ ] Log all candidates found
- [ ] Log rejection reasons
- [ ] Show selected field with confidence score
- [ ] Never silently fallback to filename for unitName

### After Upload
- [ ] Verify unitCode format: `^\d{2,4}$`
- [ ] Verify unitName has no digits
- [ ] Verify source is PDF (not filename)

## Common Issues & Fixes

### Issue: "Unit Name Contains Digits"
```
Input: PDF shows "CHEM 201: Chemistry 1"
Problem: Extraction includes "Chemistry 1" - has digit
Solution: Skip this line and try next strategy
```

### Issue: "Unit Code Contains Letters"
```
Input: PDF shows "CHEM 201"
Wrong: Extract "CHEM201" as unitCode
Right: Extract "201" as unitCode
```

### Issue: "Using Filename Instead of PDF"
```
Filename: CHEM_Chemistry_2023.pdf
Wrong: Use "Chemistry" from filename as unitName
Right: Extract "Chemistry" from PDF only
```

## File Locations

### Frontend Extraction
- **File**: `src/SomaLux/Books/Admin/utils/extractPastPaperMetadata.js`
- **Key Functions**:
  - `parseMetadataFromText()` - Extract from PDF
  - `parseMetadataFromFilename()` - Fallback ONLY for unitCode
  - **Validation**: Lines 240-280, 385-420, 425-450, 455-485

### Backend Extraction
- **File**: `backend/utils/ocrExtractPDF.js`
- **Key Functions**:
  - `parsePastPaperDetails()` - Extract from text
  - `parseFileNameForPastPaper()` - Fallback for unitCode
  - `extractPastPaperDetailsFromScannedPDF()` - Main orchestrator

### Bulk Upload
- **File**: `backend/scripts/bulkUploadPastPapers.js`
- **Validation**: Line ~131-140

## Example Extraction Results

### ✅ Good Example
```
PDF Content: "CHEM 201: GENERAL CHEMISTRY EXAMINATION 2023"
Result:
  unitCode: "201" ✓ (digits only)
  unitName: "General Chemistry" ✓ (no digits, from PDF)
  year: 2023 ✓
  examType: "Main" ✓
```

### ❌ Bad Example (Old Behavior)
```
PDF Content: minimal or poor
Filename: "CHEM201_Chemistry_2023.pdf"
Wrong Result:
  unitCode: "CHEM201" ✗ (has letters)
  unitName: "Chemistry" ✗ (from filename, not PDF)
```

### ✅ Fixed Example
```
PDF Content: minimal
Filename: "CHEM201_Chemistry_2023.pdf"
Right Result:
  unitCode: "201" ✓ (fallback digits only from filename)
  unitName: null or "" (NOT from filename, waits for PDF content)
  year: 2023 ✓ (fallback from filename)
```

## Debugging Commands

### View Extraction Logs
```bash
# Watch for these patterns in logs:
"🔍 UNIT NAME EXTRACTION - Scanning X lines"
"✅ PATTERN MATCH"
"❌ REJECT"
"✅✅✅ SELECTED UNIT NAME"
```

### Verify Extraction
```javascript
// Check if validation passes
const isValidUnitCode = /^\d{2,4}$/.test(unitCode);
const isValidUnitName = !/\d/.test(unitName) && unitName.length > 0;
const isValidSource = extractionSource !== 'filename' || field !== 'unitName';

if (!isValidUnitCode) console.error('Invalid unit code format');
if (!isValidUnitName) console.error('Invalid unit name format');
if (!isValidSource) console.error('Unit name must come from PDF');
```

## Key Success Metrics

✅ Zero unit names with digits  
✅ Zero unit codes with letters  
✅ 100% unit names from PDF (or empty)  
✅ All extractions logged with reasoning  
✅ Fallback used only for unitCode/year/semester  

## Quick Fix Commands

If you see validation errors in logs:

```javascript
// If unitName has digits:
if (/\d/.test(unitName)) {
  console.warn(`Invalid unit name: ${unitName}`);
  // Don't use it - skip to next candidate
  continue; // Skip this candidate
}

// If unitCode has letters:
if (!/^\d{2,4}$/.test(unitCode)) {
  console.warn(`Invalid unit code: ${unitCode}`);
  // Don't use it - try next pattern
  continue; // Skip this pattern
}

// If unitName came from filename:
if (source === 'filename' && field === 'unitName') {
  console.warn(`NEVER use filename for unitName`);
  // Reject it
  return null;
}
```

---

**Last Updated**: January 19, 2026  
**Status**: ✅ All fixes implemented and validated
