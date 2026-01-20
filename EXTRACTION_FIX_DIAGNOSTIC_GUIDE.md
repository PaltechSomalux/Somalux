# 🔍 EXTRACTION FIX - DIAGNOSTIC & TROUBLESHOOTING GUIDE

## Validation Rules Summary

Three strict rules now govern past paper metadata extraction:

```
1. UNIT_NAME RULE
   ❌ NEVER extract from filename
   ❌ NEVER contains digits (0-9)
   ✅ ONLY from PDF content
   ✅ Letters and spaces only

2. UNIT_CODE RULE
   ✅ ONLY digits (0-9)
   ❌ NEVER contains letters
   ❌ NEVER contains special chars
   ✅ 2-4 digits format (e.g., "1012", "301", "101")

3. EXTRACTION FALLBACK RULE
   ✅ Try PDF text extraction first (5 pages)
   ✅ Only if PDF fails, use filename for code+year
   ❌ NEVER use filename for unit_name
   ✅ Leave unit_name empty if not found in PDF
```

---

## Console Log Indicators

### ✅ Successful Extraction

```
✅ Extracted unitCode (digits only): "1012"
✅ PATTERN MATCH [explicit-label] (100): "Introduction to Software Engineering"
✅ [after-code at line 5] (92): "Development Studies"
✅ Extracted unit name (strategy 1 - code context): "Development Studies"
```

### ❌ Validation Rejections

```
❌ Rejected unitCode candidate - contains non-digits: "APH1012"
❌ REJECT: Pure numbers
❌ REJECT: Generic metadata term
❌ REJECT: Contains digits (unit names must not have numbers)
⏭️ Skipping candidate with digits: "Introduction to Software 2020"
⏭️ Skipping line with digits: "APH 1012 Semester 2"
```

### ⚠️ Warning Messages

```
⚠️ PDF content too small (45 chars). Extraction may be incomplete.
⚠️ UNIT NAME NOT FOUND - No valid candidates passed validation
⚠️ unitName is NEVER extracted from filename (must come from PDF content)
⚠️ IMPORTANT: Not using filename as fallback. Unit name must be from PDF only.
```

---

## Expected Database Records

### ✅ Valid Record (After Fix)

```json
{
  "unit_code": "1012",           // ✅ Digits only
  "unit_name": "Development Studies",  // ✅ No digits, from PDF
  "faculty": "Philosophy",        // ✅ From PDF if available
  "year": 2012,                   // ✅ Extracted correctly
  "semester": "1",                // ✅ If found
  "exam_type": "Main",            // ✅ Default or extracted
  "title": "1012 - Development Studies"
}
```

### ❌ Invalid Records (Should NOT Occur)

```json
// WRONG: Filename used as unit_name
{
  "unit_code": "APH1012",  // ❌ Contains letters
  "unit_name": "APH10120120330.PDF"  // ❌ Filename used
}

// WRONG: Unit code contains letters
{
  "unit_code": "APH1012",  // ❌ Should be "1012" only
  "unit_name": "APH"  // ❌ Should be course name
}

// WRONG: Unit name has digits
{
  "unit_code": "1012",
  "unit_name": "Introduction to Software 2020"  // ❌ Contains "2020"
}
```

---

## Troubleshooting Checklist

### 1. Unit Code Has Letters (e.g., "APH1012")

**Symptom**: `unit_code` field contains letters

**Cause**: Filename parsing extracted the wrong part

**Solution**: 
- Check console logs for: `Rejected unitCode candidate - contains non-digits`
- Verify file extracted digit-only part: `"1012"` not `"APH1012"`
- Check backend `parseFileNameForPastPaper()` validation

**Code to check**:
```javascript
// Should reject this:
const unitCode = "APH1012";
if (/^\d{2,4}$/.test(unitCode)) {  // FALSE - contains letters
  console.log("ACCEPT");
} else {
  console.log("REJECT");  // This should happen
}
```

---

### 2. Unit Name is Filename (e.g., "APH10120120330.PDF")

**Symptom**: `unit_name` = filename instead of course name

**Cause**: System fell back to filename parsing for unit_name

**Solution**:
- This SHOULD NOT HAPPEN anymore - unit_name never extracted from filename
- If it does occur, check frontend `extractPastPaperMetadata()` function
- Verify it's not falling back to `parseMetadataFromFilename()`

**Code to check**:
```javascript
// This line should be REMOVED or never reached for unit_name:
catch (error) {
  // ❌ BAD: Would extract from filename
  return parseMetadataFromFilename(pdfFile.name);  
  
  // ✅ GOOD: Returns empty metadata
  return {
    unitName: null,  // Always null from filename
    unitCode: null,
    // ...
  };
}
```

---

### 3. Unit Name Contains Digits (e.g., "Software 2020")

**Symptom**: `unit_name` = "Introduction to Software Engineering 2020"

**Cause**: PDF extraction found line with embedded year

**Solution**:
- Check console logs for: `Skipping candidate with digits`
- This candidate should be rejected during scanning phase
- If accepted, check validation phase rejects it

**Code to check**:
```javascript
// Should skip lines with digits:
if (/\d/.test(line)) {
  continue;  // Skip this candidate
}

// Should validate before acceptance:
if (/\d/.test(text)) {
  console.log("REJECT: Contains digits");
  continue;
}
```

---

### 4. Missing Unit Code

**Symptom**: `unit_code` is empty/null

**Cause**: Pattern not found in PDF or filename

**Solution**:
- Check if PDF contains "CODE NUMBER" pattern (e.g., "APH 1012", "BIO 301")
- Check filename has code pattern (e.g., "APH1012_2020.pdf")
- Review console logs for pattern matching attempts

**Expected patterns**:
```
✅ "APH 1012: Introduction to Software" - Space separator
✅ "APH1012 - Software Engineering" - No space
✅ "APH-1012 Introduction" - Dash separator
✅ "apH1012_2020.pdf" - In filename
```

---

### 5. Missing Unit Name

**Symptom**: `unit_name` is empty even when unit_code extracted

**Cause**: No valid course name found in PDF

**Solution**:
- This is ACCEPTABLE - better than using filename
- PDF may not contain clear course name
- Unit code alone may be sufficient for identification
- Consider adding metadata manually in admin panel

**Expected behavior**:
```json
{
  "unit_code": "1012",   // ✅ Extracted
  "unit_name": "",       // ✅ Empty (preferred over filename)
  "year": 2012,
  "title": "1012 - 2012"  // ✅ Default title uses code+year
}
```

---

## Console Output Examples

### ✅ Good Extraction

```
📄 RAW PDF TEXT (first 500 chars): "UNIVERSITY OF LONDON..."
📄 TOTAL PDF TEXT LENGTH: 2847 chars

🔍 UNIT NAME EXTRACTION - Scanning 45 lines
✅ PATTERN MATCH [code-after] (95): "Development Studies"
📊 Total candidates found: 8
🔝 Top 10 candidates:
  "Development Studies" (95)
  "Introduction to Software" (85)

✅ VALIDATION: Checking candidates in order...
  Checking: "Development Studies" (score: 95)...
    ✅ SELECTED UNIT NAME: "Development Studies"

✅✅✅ UNIT NAME EXTRACTION COMPLETE
  unitCode: "1012"
  unitName: "Development Studies"
  year: 2012
  semester: "1"
```

### ⚠️ Partial Extraction

```
📄 RAW PDF TEXT (first 500 chars): "EXAMINATION PAPER..."
📄 TOTAL PDF TEXT LENGTH: 890 chars
✅ PATTERN MATCH [explicit-label] (100): ""  // No match

✅ VALIDATION: Checking candidates in order...
⚠️⚠️⚠️ UNIT NAME NOT FOUND - No valid candidates passed validation
Available candidates were: "EXAMINATION", "QUESTION BANK"

✅ EXTRACTION COMPLETE (PARTIAL)
  unitCode: "1012"      // ✅ Found
  unitName: ""          // ⚠️ Not found (empty, not filename)
  year: 2012            // ✅ Found
```

### ❌ Failed Extraction

```
PDF extraction failed: Error: Unsupported PDF format
⚠️ IMPORTANT: Not using filename as fallback. Unit name must be from PDF only.

✅ EXTRACTION COMPLETE (FALLBACK)
  unitCode: null        // Will try filename parsing
  unitName: null        // ❌ NEVER from filename
  year: null
```

---

## Validation Decision Tree

```
FILENAME: APH10120120330.PDF
│
├─ Extract PDF Text
│  ├─ YES: Found >= 50 chars
│  │  └─ Parse with parseMetadataFromText()
│  │     ├─ Look for "CODE NUMBER" patterns
│  │     │  └─ Extract unit_code: "1012" ✅ (validate digits only)
│  │     ├─ Scan all lines for course name
│  │     │  ├─ Skip: Contains digits ❌
│  │     │  ├─ Skip: Generic metadata ❌
│  │     │  ├─ Accept: "Development Studies" ✅ (no digits, course-like)
│  │     │  └─ unit_name: "Development Studies" ✅
│  │     └─ Extract year: 2012 ✅
│  │
│  └─ NO: < 50 chars
│     └─ Return empty metadata (do NOT fallback to filename)
│
└─ IF PDF extraction failed:
   └─ Try parseFileNameForPastPaper()
      ├─ Extract code "1012" from "APH1012" ✅
      ├─ Extract year 2012 from date ✅
      └─ unit_name: NEVER SET ❌ (always null)

FINAL RESULT:
{
  "unit_code": "1012",
  "unit_name": "Development Studies",  // OR empty if not found
  "year": 2012
}
```

---

## Quick Test Commands

### Check if Rules Are Enforced

```javascript
// Test 1: Unit code digits-only validation
const testCode = "APH1012";
console.log(/^\d{2,4}$/.test(testCode));  // FALSE ✅ (correct rejection)

// Test 2: Unit name digit rejection
const testName = "Software Engineering 2020";
console.log(/\d/.test(testName));  // TRUE ✅ (correct rejection)

// Test 3: Valid unit code
const validCode = "1012";
console.log(/^\d{2,4}$/.test(validCode));  // TRUE ✅ (correct acceptance)

// Test 4: Valid unit name
const validName = "Development Studies";
console.log(/\d/.test(validName));  // FALSE ✅ (correct acceptance)
```

---

## Files with Fixes

| File | Changes | Lines |
|------|---------|-------|
| `src/SomaLux/Books/Admin/utils/extractPastPaperMetadata.js` | Enhanced extraction, no filename fallback, digit validation | 7-595 |
| `backend/utils/ocrExtractPDF.js` | Unit code digit validation, no filename unit_name extraction | 103-433 |
| `test-extraction-rules-verification.js` | New test file for verification | 1-136 |

---

## Support & Debugging

### Enable Debug Mode
```javascript
// Add to browser console:
localStorage.setItem('DEBUG_EXTRACTION', 'true');

// Then upload file - will show all debug logs
```

### Check Upload Progress
```bash
# Monitor logs in real-time:
tail -f backend/logs/upload.log

# Search for specific file:
grep "APH10120120330" backend/logs/upload.log
```

### Database Query Check
```sql
-- Check uploaded record:
SELECT unit_code, unit_name, year, created_at 
FROM past_papers 
WHERE unit_code LIKE '%APH%' OR unit_name LIKE '%APH%'
ORDER BY created_at DESC;

-- Check for invalid records (should be empty):
SELECT unit_code, unit_name 
FROM past_papers 
WHERE unit_code LIKE '%[A-Z]%'  -- Contains letters
OR unit_name LIKE '%.PDF%';      -- Contains filename
```

---

**Last Updated**: January 19, 2026  
**Status**: ✅ Fixes Implemented and Verified
