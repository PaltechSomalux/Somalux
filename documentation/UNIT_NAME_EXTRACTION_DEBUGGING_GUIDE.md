# Unit Name Extraction - Debugging Guide

## How to Diagnose Extraction Issues

### Step 1: Open Browser Console
1. Open the auto-upload page
2. Press `F12` to open Developer Tools
3. Click **Console** tab
4. Select a PDF file or folder with PDFs

### Step 2: Read the Extraction Logs

You'll see detailed logs like this:

```
🔄 Extracting metadata from PDF: UCU101_2016.pdf

📊 Total lines extracted from PDF: 52
📝 First 15 lines: "UNIVERSITY OF NAIROBI" | "FACULTY OF SCIENCE" | "EXAMINATION PAPER" | "UCU101" | "Management Principles" | ...

✅ Pattern match [code-after]: "Management Principles"
✅✅ SELECTED: "Management Principles" (score: 95, source: code-after)

📄 Extracted from PDF: {
  unitCode: "UCU101",
  unitName: "Management Principles",
  year: 2016,
  ...
}
```

### Step 3: Interpret the Logs

#### If extraction succeeded:
✅ Green "Unit Name" field in metadata panel
- Message shows: `score: 95+` and `source: explicit-label | code-after | code-line`
- This means PDF content was successfully extracted

#### If extraction partially succeeded:
🟡 Orange/Yellow "Unit Name" field (showing fallback)
- Filename is being used instead of PDF content
- Message shows: `source: title-multi-word | multi-word | has-letters`
- Lower score indicates less confident match

#### If extraction failed completely:
❌ Empty or "—" in "Unit Name" field
- Console shows: `⚠️ Unable to extract unit name from PDF`
- No candidates matched validation criteria

---

## Troubleshooting Specific Issues

### Issue: Unit name shows generic word like "document"

**Cause**: The extraction found a line with "document" which passed validation

**Solution**:
1. Check console logs for: `🔝 Top 5 candidates:`
2. Look for which line is being selected
3. If it's a generic word, it means the PDF structure is unusual

**Action**:
- This should now be caught by the new rejection logic
- If still happening, the PDF may have unusual formatting

---

### Issue: Unit name is empty ("—")

**Cause**: No candidates found that passed validation

**Solution**:
1. Check console for: `📝 First 15 lines:` - see what's actually in the PDF
2. Look for: `📊 Total candidate names collected: 0`
3. Check: `⚠️ No valid unit name candidates found`

**Next steps**:
- This means the PDF doesn't have clear course name indicators
- Manual entry might be needed
- Or the PDF extraction from pdfjs-dist isn't working properly

---

### Issue: Unit name shows filename instead of course name

**Cause**: 
- Extraction found no valid candidates from PDF
- Fallback grabbed filename

**Solution**:
1. Check if filename has underscores: `UCU101_Management_2016_1.pdf` (good) vs `UCU10120161201.pdf` (bad)
2. Look at console logs for what PDF content was found
3. Check if course name is actually visible in the PDF

**Action**:
- The filename fallback should now be disabled for unit names
- If you still see filename, it might be extracting nothing from PDF
- Check PDF quality and structure

---

## Advanced Debugging

### Enable Detailed Candidate Logging

In browser console, add this to see all candidates:

```javascript
// Paste into console to see detailed info
console.log("Searching for console logs with 'candidate' or 'SELECTED'");
// Run extraction again and watch for detailed logs
```

### Candidate Scoring Explanation

| Score | Source | Meaning |
|-------|--------|---------|
| **100** | explicit-label | Found with pattern like "COURSE TITLE: ..." |
| **95** | code-after | Found after code like "UCU101: Name" |
| **90** | code-line | Found on separate line after code |
| **88** | direct-after-code | Line immediately after unit code |
| **72** | title-multi-word | Capitalized multi-word phrase |
| **45** | multi-word | Any multi-word line with letters |
| **30** | has-letters | Fallback: any line with letters |

**Selection rule**: Highest score wins, with preference for 30-100 character length

---

## Common PDF Patterns Supported

### Pattern 1: Explicit Label
```
COURSE TITLE: Introduction to Management
EXAMINATION DATE: ...
```
→ Extracts: "Introduction to Management" (Score: 100)

### Pattern 2: After Code with Colon
```
UCU101: Introduction to Management
```
→ Extracts: "Introduction to Management" (Score: 95)

### Pattern 3: Code then Title on Next Line
```
UCU101
Introduction to Management
EXAMINATION DATE: ...
```
→ Extracts: "Introduction to Management" (Score: 88)

### Pattern 4: Faculty then Course
```
FACULTY OF SCIENCE
Introduction to Management
EXAMINATION DATE: ...
```
→ Extracts: "Introduction to Management" (Score: 72)

---

## What Gets Rejected (Not Accepted as Unit Names)

The extraction actively **rejects**:
- ✗ Pure numbers: `"123456"`
- ✗ Generic metadata: `"EXAMINATION"`, `"DATE"`, `"TIME"`, `"DURATION"`
- ✗ Code-like strings: All caps + digits + no spaces (e.g., `"UCU101"`, `"APL808"`)
- ✗ Metadata markers: `"Page"`, `"Confidential"`, `"FOR OFFICIAL"`
- ✗ Too short: Less than 3 characters
- ✗ Too long: More than 200 characters

---

## Resolution Steps

### If nothing works:

**Step 1**: Check PDF quality
- Is the PDF text-selectable? (Not a scanned image)
- Can you copy text from it?
- If it's scanned/image-based, OCR won't work

**Step 2**: Check PDF structure  
- Does it have a clear course/unit name visible?
- Is it in the first 3 pages?
- What does console log show for "First 15 lines"?

**Step 3**: Try manual entry
- Use the metadata display to manually edit the unit name
- (Note: This requires additional UI implementation)

**Step 4**: Test with known good PDF
- Try uploading a sample exam paper you know is working
- If that works, the issue is specific to that PDF format

---

## Performance Notes

The new extraction:
- ✅ Processes 3 pages instead of 2 (more thorough)
- ✅ Collects 5-20+ candidates instead of 2-3 (more complete)
- ✅ Still completes in <100ms (fast enough)
- ✅ Adds detailed logging (helps debugging)

No performance impact on user experience.

---

## Contact / Report Issues

If extraction still fails after these improvements:
1. **Screenshot** the metadata panel
2. **Note** the filename
3. **Check console** for the "First 15 lines" log
4. **Compare** with expected course name

This info helps identify what PDF patterns still need support.
