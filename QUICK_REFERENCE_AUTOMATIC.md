# Quick Reference - Fully Automatic Upload

## TL;DR - Just Do This

1. **Rename your PDFs:**
   ```
   BIO101_Biology_2023_1_Main.pdf
   CHM201_Chemistry_2023_1_Main.pdf
   ```

2. **Go to Admin:**
   ```
   Admin → Books & Papers → Auto Upload → Past Papers Auto Upload
   ```

3. **Select folder & upload:**
   ```
   Select folder → Click "🚀 Upload X Files" → Done!
   ```

That's it! Everything else is automatic.

---

## Filename Format (REQUIRED)

```
CODE_Name_2023_1_Main.pdf
```

**Pattern:** `[Unit_Code]_[Unit_Name]_[Year]_[Semester]_[Exam_Type].pdf`

**Examples:**
- ✅ `BIO101_Biology_2023_1_Main.pdf`
- ✅ `CHM201_Chemistry_2023_2_Supplementary.pdf`
- ✅ `PHY301_Physics_2023_1_CAT.pdf`

---

## Extraction Automatic

| Data | Source | Required? |
|------|--------|-----------|
| University | PDF text | ❌ No (tries PDF first) |
| Faculty | PDF text | ❌ No (tries PDF first) |
| Unit Code | Filename part 1 | ✅ Yes |
| Unit Name | Filename part 2 | ✅ Yes |
| Year | Filename part 3 | ✅ Yes |
| Semester | Filename part 4 | ✅ Yes |
| Exam Type | Filename part 5 | ✅ Yes |

---

## Process

```
1. Select folder
   ↓
2. System extracts all details (automatic)
   ↓
3. Click Upload button (always green)
   ↓
4. Files upload automatically
   ↓
5. Done! ✓
```

**Total time:** 30 seconds

---

## Filename Parts

| Part | What | Example |
|------|------|---------|
| 1 | Unit Code | BIO101, CHM201, MENT130 |
| 2 | Unit Name | Biology, Chemistry, MentalHealth |
| 3 | Year | 2023, 2024 |
| 4 | Semester | 1, 2, 3 |
| 5 | Exam Type | Main, Supplementary, CAT, Mock |

---

## PDF Content (Optional)

If filename extraction not enough, add to PDF page 1:
```
UNIVERSITY OF NAIROBI
FACULTY OF SCIENCE
```

System will extract these automatically too!

---

## Upload Button

**When enabled (green):**
- Files selected ✅
- Click to upload immediately

**Never disabled!**
- No validation
- No required fields
- Always clickable

---

## What Could Go Wrong

| Problem | Fix |
|---------|-----|
| Filename wrong | Rename to: `CODE_Name_2023_1_Main.pdf` |
| PDF is scanned image | Use text-based PDF |
| Backend down | Run: `npm start` in backend folder |
| No PDFs found | Check folder has .pdf files |

---

## Console Check

Press F12 and look for:
```
✅ Universities loaded
✅ Metadata extracted - ready to upload
✅ Uploaded: [filename]
```

Green checks = everything working!

---

## Batch Upload

**Upload multiple files at once:**
```
Select folder with:
  - BIO101_Biology_2023_1_Main.pdf
  - CHM201_Chemistry_2023_1_Main.pdf
  - PHY301_Physics_2023_2_Supplementary.pdf
  
Click Upload → All 3 upload automatically!
```

---

## Success Indicators

✅ Toast message: "Metadata extracted - ready to upload"
✅ Green "🚀 Upload X Files" button visible
✅ File list shown
✅ Progress bar appears during upload
✅ Toast: "Upload complete: X successful, 0 failed"

---

## No More Manual Selection!

❌ No University dropdown
❌ No Faculty dropdown
❌ No "Please select manually" messages
❌ No validation errors

Just:
✅ Select folder
✅ Click upload
✅ Done!

---

## File Format Summary

**Must have:**
- Filename with 5 parts separated by underscores
- Proper unit code (letters + numbers)
- Valid year (4 digits)
- Valid semester (1, 2, or 3)
- Valid exam type

**Example:** `BIO101_Biology_2023_1_Main.pdf` ✅

---

**Status:** ✅ Fully Automatic
**Manual Steps:** Just 2 (select folder, click upload)
**No Dropdowns:** None needed anymore!
