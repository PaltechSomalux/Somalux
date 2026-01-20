# Extraction Features Fix - Changes Summary

**Completed**: January 19, 2026  
**Impact**: Auto Upload Past Papers - Extraction Validation

## Executive Summary

Fixed critical extraction validation issues in the past papers auto upload feature to ensure accurate metadata capture with three core rules:

1. ✅ **Unit Name NEVER uses filename** - Must come from PDF content only
2. ✅ **Unit Name NEVER contains digits** - Letters/spaces/hyphens only  
3. ✅ **Unit Code ONLY contains digits** - No letters or special characters

## Files Modified (2 total)

### 1. Frontend: `src/SomaLux/Books/Admin/utils/extractPastPaperMetadata.js`

#### Change 1.1: Function `parseMetadataFromFilename()` (Lines 73-120)
**Before**: Extracted unitCode, unitName, year, semester, examType from filename  
**After**: ONLY extracts unitCode (digits), year, semester, examType - NEVER unitName

```diff
- // Try standard delimited format first: CODE_NAME_YEAR_SEM_TYPE
- if (fileNameWithoutExt.includes('_')) {
-   const parts = fileNameWithoutExt.split('_');
-   if (parts.length >= 2) {
-     metadata.unitCode = parts[0] || null;
-     metadata.unitName = parts[1] || null; // ❌ REMOVED
+
+ // Try to extract CODE-like pattern at the start: LETTER+DIGITS
+ const codeMatch = fileNameWithoutExt.match(/^([A-Z]+)(\d{2,4})/);
+ if (codeMatch) {
+   metadata.unitCode = codeMatch[2]; // ONLY the digits
+   // NOTE: unitName is NEVER set from filename
```

#### Change 1.2: Unit Code Extraction (Lines 125-140)
**Before**: Extracted "CHEM201" or "CHEM 201" as unitCode  
**After**: Extracts ONLY the numeric part: "201"

```diff
- // More flexible pattern to catch variations like "CS 101", "CS-101", "CS101", etc.
- const codePatterns = [
-   /\b([A-Z]{2,6}\s*[-]?\s*\d{3,4})\b/,
-   /\b([A-Z]{2,6}\d{3,4})\b/,
-   /\b([A-Z]+\d{3,4})\b/
- ];
- for (const pattern of codePatterns) {
-   const match = text.match(pattern);
-   if (match) {
-     metadata.unitCode = match[1].replace(/\s+/g, '').replace('-', '');

+ // Extract ONLY the numeric part as unitCode
+ const codePatterns = [
+   /\b[A-Z]{2,6}\s*[-]?\s*(\d{2,4})\b/,  // ✅ Extract digits only
+   /\b[A-Z]{2,6}(\d{2,4})\b/,
+   /\b[A-Z]+(\d{3,4})\b/
+ ];
+ for (const pattern of codePatterns) {
+   const match = text.match(pattern);
+   if (match) {
+     const digits = match[1];
+     if (/^\d{2,4}$/.test(digits)) { // ✅ Validate digits only
+       metadata.unitCode = digits;
```

#### Change 1.3: Candidate Validation (Lines 240-280)
**Before**: No check for digits in unit name  
**After**: REJECT any candidate containing digits

```diff
       // Final validation: reject only if obviously invalid
       if (/^\d+$/.test(text)) {
         console.log(`    ❌ REJECT: Pure numbers`);
         continue;
       }
       // ... other checks ...
+      
+      // CRITICAL VALIDATION: Unit name MUST NOT contain ANY digits (0-9)
+      if (/\d/.test(text)) {
+        console.log(`    ❌ REJECT: Contains digits (unit names must not have numbers)`);
+        continue;
+      }
       
       // Accept this candidate!
       metadata.unitName = text;
```

#### Change 1.4: Strategy 1 - Code Context (Lines 385-420)
**Before**: No digit validation in aggressive fallback  
**After**: Skip lines with digits

```diff
         for (let offset = 1; offset <= searchRange; offset++) {
           const line = lines[foundCodeIdx + offset];
           // ... existing checks ...
+          
+          // CRITICAL: Unit name MUST NOT contain digits
+          if (/\d/.test(line)) {
+            console.log(`⏭️ Skipping line with digits: "${line}"`);
+            continue;
+          }
           
           if (/[A-Za-z]/.test(line)) {
             metadata.unitName = line;
```

#### Change 1.5: Strategy 2 - Line Scanning (Lines 425-450)
**Before**: No digit check before accepting line  
**After**: Skip any line with digits

```diff
         // Skip metadata lines
         if (/^(EXAMINATION|EXAM|DATE|...)$/i.test(line)) continue;
         
+        // CRITICAL: Unit name MUST NOT contain digits
+        if (/\d/.test(line)) {
+          console.log(`⏭️ Skipping line with digits: "${line}"`);
+          continue;
+        }
         
         // Accept if it looks like a course name
```

#### Change 1.6: Strategy 3 - Capitalized Text (Lines 455-485)
**Before**: No digit check in final strategy  
**After**: Skip and validate against digits

```diff
         // Skip pure metadata indicators
         if (/(EXAMINATION|EXAM|...)/.test(trimmed)) continue;
         
+        // CRITICAL: Unit name MUST NOT contain digits
+        if (/\d/.test(trimmed)) {
+          console.log(`⏭️ Skipping line with digits: "${trimmed}"`);
+          continue;
+        }
         
         if (/^[A-Z]/.test(trimmed) && trimmed.includes(' ') && !(/^[A-Z0-9\-]+$/.test(trimmed))) {
           let cleaned = trimmed.replace(/[\d\(\)\[\]]+\s*$/, '').trim();
           
-          if (cleaned.length > 3 && /[A-Za-z]/.test(cleaned) && cleaned.length < 200) {
+          if (cleaned.length > 3 && /[A-Za-z]/.test(cleaned) && cleaned.length < 200 && !/\d/.test(cleaned)) {
             metadata.unitName = cleaned;
```

---

### 2. Backend: `backend/utils/ocrExtractPDF.js`

#### Change 2.1: Function `parsePastPaperDetails()` (Lines 188-198)
**Before**: Extracted PREFIX as unit_name  
**After**: ONLY extracts digits as unit_code, leaves unit_name empty

```diff
  for (const pattern of unitCodePatterns) {
    const match = text.match(pattern);
    if (match) {
-     // Extract PREFIX as unit_name (e.g., "UCU", "APL")
-     details.unit_name = match[1].toUpperCase(); // Just the prefix
-     details.confidence.unit_name = 0.95;
-     
-     // Extract NUMBER as unit_code (e.g., "101", "808")
-     details.unit_code = match[2]; // Just the number
+     // Extract NUMBER as unit_code (e.g., "101", "808")
+     const unitCode = match[2];
+     if (/^\d{2,4}$/.test(unitCode)) { // ✅ Validate digits only
+       details.unit_code = unitCode;
+       details.confidence.unit_code = 0.95;
+     }
+     
+     // NOTE: unit_name MUST come from PDF content interpretation
+     // The unit_name should be the actual course/subject name
      break;
    }
  }
```

#### Change 2.2: Function `parseFileNameForPastPaper()` (Lines 355-377)
**Before**: Extracted PREFIX as unit_name from filename  
**After**: ONLY extracts digits as unit_code, NEVER unit_name

```diff
- // Extract PREFIX and NUMBER (e.g., "UCU" and "101" from "UCU101")
- const codeMatch = baseName.match(/^([A-Z]{2,4})\s*[\-]?\s*(\d{2,4})/i);
- if (codeMatch) {
-   details.unit_name = codeMatch[1].toUpperCase(); // ❌ REMOVED
-   details.unit_code = codeMatch[2];
- }

+ // Extract NUMBER ONLY from CODE pattern
+ const codeMatch = baseName.match(/^[A-Z]{2,4}\s*[\-]?\s*(\d{2,4})/i);
+ if (codeMatch) {
+   const unitCode = codeMatch[1];
+   if (/^\d{2,4}$/.test(unitCode)) { // ✅ Validate digits only
+     details.unit_code = unitCode;
+   }
+   // NOTE: unit_name is NEVER set from filename
+ }
```

#### Change 2.3: Function `extractPastPaperDetailsFromScannedPDF()` - Fallback Logic (Lines 305-334)
**Before**: Could merge unit_name from filename  
**After**: ONLY merges unit_code, explicitly rejects unit_name

```diff
    if ((!details.unit_code) && fileName) {
      console.log(`📝 [PAST-PAPER-EXTRACT] Attempting filename parsing for missing unit_code...`);
      const fileNameDetails = parseFileNameForPastPaper(fileName);
      
      // ONLY merge unit_code from filename, NEVER unit_name
      if (fileNameDetails.unit_code && !details.unit_code) {
+       // Validate unit_code: must be ONLY digits
+       if (/^\d{2,4}$/.test(fileNameDetails.unit_code)) {
          details.unit_code = fileNameDetails.unit_code;
+       }
      }
      
      // Only extract year from filename if PDF extraction failed
      if (!details.year && fileNameDetails.year) {
        details.year = fileNameDetails.year;
      }
+     
+     // CRITICAL: NEVER use unit_name from filename
+     if (fileNameDetails.unit_name) {
+       console.warn(`⚠️ [PAST-PAPER-EXTRACT] Ignoring unit_name from filename (must come from PDF only)`);
+     }
    }
```

---

## Validation Rules Added

### Rule 1: Filename Behavior
```javascript
// Filename can provide:
✅ unitCode (numeric part only)
✅ year
✅ semester
✅ examType

// Filename CANNOT provide:
❌ unitName (even if present in filename)
```

### Rule 2: Unit Name Format
```javascript
// Valid patterns:
✅ "General Chemistry"
✅ "Advanced Biology"
✅ "Linear Algebra"
✅ "Molecular Biology & Genetics"

// Invalid patterns (with digits):
❌ "Chemistry 101"
❌ "Biology1"
❌ "CHEM 201"
❌ "CS101-Advanced"

// Validation regex:
if (/\d/.test(unitName)) reject(); // Any digit = reject
```

### Rule 3: Unit Code Format
```javascript
// Valid patterns:
✅ "101"
✅ "201"
✅ "1001"
✅ "4050"

// Invalid patterns (with letters):
❌ "CHEM101"
❌ "CS-201"
❌ "BIO101A"
❌ "PHYS-301"

// Validation regex:
if (!/^\d{2,4}$/.test(unitCode)) reject(); // Must be pure digits
```

---

## Testing Checklist

- [x] Unit names with digits are rejected at validation
- [x] Unit names are never extracted from filenames
- [x] Unit codes contain only digits
- [x] Fallback uses only unitCode from filename
- [x] All validation points have explicit rejection logging
- [x] Debug output shows decision at each step

---

## Documentation Created

1. **EXTRACTION_FEATURES_FIX_COMPLETE.md** - Comprehensive technical documentation
2. **EXTRACTION_FEATURES_QUICK_REFERENCE.md** - Quick reference guide

---

## Backward Compatibility

✅ **No API changes** - Same function signatures  
✅ **Stricter validation** - Rejects previously problematic data  
✅ **Better logging** - More detailed debugging output  
⚠️ **Data that fails validation** - Previously accepted but invalid data will be rejected

---

## Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Unit Name Source** | PDF + Filename | PDF only |
| **Unit Name Validation** | Loose | No digits allowed |
| **Unit Code Format** | Full code (letters+digits) | Digits only |
| **Fallback Behavior** | All fields from filename | Only numeric fields |
| **Validation Logging** | Minimal | Comprehensive |
| **Digit Check** | None | 6 validation points |

---

**All changes complete and tested. System ready for deployment.**
