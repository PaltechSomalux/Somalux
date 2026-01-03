# Fully Automatic Past Papers Upload - Complete Guide

## What Changed?

**The system is now COMPLETELY AUTOMATIC.** You only need to:
1. ✅ Select a folder with PDFs
2. ✅ Click Upload

**That's it! No manual dropdown selections needed anymore.**

## How It Works

### Complete Flow

```
1. Select Folder with PDFs
        ↓
2. System Extracts ALL Details:
   - University from PDF text
   - Faculty from PDF text
   - Unit Code from filename (part 1)
   - Unit Name from filename (part 2)
   - Year from filename (part 3)
   - Semester from filename (part 4)
   - Exam Type from filename (part 5)
        ↓
3. Click Upload Button (🚀 always enabled)
        ↓
4. Files Upload Automatically
        ↓
5. Success! All done ✓
```

## What Gets Extracted

### From PDF Text (if available):
- 📄 **University** - "UNIVERSITY OF NAIROBI"
- 📄 **Faculty** - "FACULTY OF SCIENCE" or "SCHOOL OF..." or "DEPARTMENT OF..."

### From Filename (ALWAYS required):
Format: `CODE_Name_2023_1_Main.pdf`
- 📄 **Unit Code** - First part (BIO101, CHM201, etc.)
- 📄 **Unit Name** - Second part (Biology, Chemistry, etc.)
- 📄 **Year** - Third part (2023)
- 📄 **Semester** - Fourth part (1 for first semester)
- 📄 **Exam Type** - Last part (Main, Supplementary, etc.)

## File Naming Format

**Most important: Filename must have proper structure**

### Correct Format:
```
BIO101_Biology_2023_1_Main.pdf
CHM201_Chemistry_2023_2_Supplementary.pdf
MENT130_MentalHealth_2023_1_CAT.pdf
```

### Parts Breakdown:
```
[CODE]_[NAME]_[YEAR]_[SEMESTER]_[TYPE].pdf
  ↓      ↓       ↓       ↓         ↓
  BIO101 Biology 2023    1       Main
```

### Parts Explained:
- **CODE** = Unit Code (e.g., BIO101, CHM201, MENT130)
- **NAME** = Unit Name (e.g., Biology, Chemistry, MentalHealth)
- **YEAR** = Year of exam (e.g., 2023, 2024)
- **SEMESTER** = Semester (1, 2, or 3)
- **TYPE** = Exam Type (Main, Supplementary, CAT, Mock, Midterm)

## PDF Content Format

**For best results, include on page 1:**

```
UNIVERSITY OF NAIROBI
FACULTY OF SCIENCE

BIOLOGY 101
EXAMINATION PAPER
[Rest of exam content]
```

### Options for University:
- ✅ UNIVERSITY OF NAIROBI
- ✅ KENYATTA UNIVERSITY
- ✅ EGERTON UNIVERSITY
- ✅ UNIVERSITY OF KENYA

### Options for Faculty:
- ✅ FACULTY OF SCIENCE
- ✅ SCHOOL OF ENGINEERING
- ✅ DEPARTMENT OF MEDICINE
- ✅ COLLEGE OF AGRICULTURE

**Exact format not critical** - Fuzzy matching handles variations (60%+ accuracy)

## Step-by-Step Usage

### Step 1: Prepare Your PDFs
Rename files to proper format:
```
BIO101_Biology_2023_1_Main.pdf
CHM201_Chemistry_2023_1_Main.pdf
PHY301_Physics_2023_2_Supplementary.pdf
```

### Step 2: Add University/Faculty to PDF (Optional)
Include on page 1:
```
UNIVERSITY OF NAIROBI
FACULTY OF SCIENCE
```

If not in PDF, system uses filename extraction (still works!)

### Step 3: Open Admin Panel
```
Admin → Books & Papers → Auto Upload → Past Papers Auto Upload
```

### Step 4: Select Folder
- Drag and drop folder with PDFs, OR
- Click to browse and select folder

### Step 5: Wait 2-3 Seconds
- System extracts metadata
- Shows: "✅ Metadata extracted - ready to upload"

### Step 6: Click Upload Button
- Button labeled "🚀 Upload X Files"
- Always green and enabled (no dropdowns!)
- Click to start batch upload

### Step 7: Watch Progress
- Progress bar shows upload status
- Toast shows success/failure count
- Files upload automatically

### Step 8: Done!
- Form resets after 2 seconds
- Ready for next batch

## Console Logs (For Debugging)

When you select a folder, open console (F12) and watch:

```
✅ Universities loaded: [Array with universities]
📥 Found 1 PDF files
🔄 Extracting metadata from PDF: filename.pdf
📄 Extracted from PDF: {
  university: "UNIVERSITY OF NAIROBI",
  faculty: "FACULTY OF SCIENCE",
  ...
}
✅ Metadata extracted - ready to upload
```

## What If PDF Doesn't Have University/Faculty?

**No problem!** The system still uploads using:
- ✅ Filename extraction for everything
- ✅ No manual selection needed
- ✅ Upload works anyway

Example:
```
File: BIO101_Biology_2023_1_Main.pdf
Extracted:
- Unit Code: BIO101 (from filename)
- Unit Name: Biology (from filename)
- Year: 2023 (from filename)
- Semester: 1 (from filename)
- Exam Type: Main (from filename)
- University: [from PDF or null]
- Faculty: [from PDF or null]
```

**System uploads successfully even with null university/faculty!**

## Upload Button

### When Enabled (Green):
- ✅ Files selected
- Button text: "🚀 Upload X Files"
- Click to upload immediately
- No validation errors

### When Disabled (Gray):
- ❌ No files selected
- Button grayed out
- Can't click

**That's it!** No university/faculty validation anymore.

## Error Handling

### If Upload Fails:
- Toast shows: "Upload complete: X successful, Y failed"
- Console logs exact error for each file
- Failure reasons:
  - Backend not running
  - API endpoint missing
  - Database error
  - File too large

### If PDF Can't Be Read:
- System falls back to filename extraction
- Still uploads successfully
- Toast: "Metadata extracted - ready to upload"

## Metadata That Gets Sent

For each file uploaded:
```json
{
  "university_id": "uuid or null",
  "faculty": "Faculty Name or null",
  "unit_code": "BIO101",
  "unit_name": "Biology",
  "year": 2023,
  "semester": "1",
  "exam_type": "Main",
  "uploaded_by": "user-id"
}
```

**Note:** University and faculty can be null - system still accepts upload!

## Filename Format Examples

### ✅ Correct:
- `BIO101_BiologyI_2023_1_Main.pdf`
- `CHM201_ChemistryII_2023_2_Supplementary.pdf`
- `MENT130_MentalHealth_2023_1_CAT.pdf`
- `ENG102_EnglishLiterature_2024_1_Mock.pdf`

### ⚠️ Might Not Extract Code:
- `exam.pdf` (no code)
- `2023_exam.pdf` (code missing)
- `Biology_2023.pdf` (code missing)

**But system still uploads!** It just won't extract code from filename.

### ❌ Won't Work At All:
- File is not a PDF
- No university/faculty AND no filename structure

## Batch Upload Example

**Uploading 5 files at once:**

```
Files Selected:
✓ BIO101_Biology_2023_1_Main.pdf
✓ CHM201_Chemistry_2023_1_Main.pdf
✓ PHY301_Physics_2023_2_Supplementary.pdf
✓ MENT130_MentalHealth_2023_1_CAT.pdf
✓ ENG102_English_2023_1_Main.pdf

Click Upload → All 5 files upload automatically
Each extracts from own filename
Each sends to backend with own metadata
All complete in seconds
```

## Console Messages Guide

| Message | Meaning |
|---------|---------|
| "✅ Universities loaded: [...]" | Database loaded successfully |
| "📥 Found X PDF files" | Files detected |
| "🔄 Extracting metadata..." | Reading PDF text |
| "✅ Metadata extracted - ready to upload" | Ready to proceed |
| "📤 Uploading with metadata:" | Sending to backend |
| "✅ Uploaded: filename.pdf" | File uploaded successfully |
| "❌ Failed to upload..." | Upload error (check backend) |

## FAQ

**Q: My PDF doesn't have university/faculty text?**
A: No problem! System extracts from filename. Just name file correctly: `CODE_Name_2023_1_Main.pdf`

**Q: Can I upload without filename structure?**
A: System still uploads, but code/year/semester won't auto-extract. Better to use proper format.

**Q: Do I need to select university/faculty?**
A: No! Never. System is fully automatic now.

**Q: What if extraction fails completely?**
A: System still uploads with available data. Anything extracted is used; missing fields are null.

**Q: Can I upload 100 files at once?**
A: Yes! System handles batch uploads. Progress bar shows real-time status.

**Q: What if backend is down?**
A: Upload fails with error message. Check that backend is running: `npm start` in backend folder.

## Quick Checklist

Before uploading:
- [ ] PDFs are text-based (not scanned images)
- [ ] Filenames follow format: `CODE_Name_2023_1_Main.pdf`
- [ ] At least one file selected
- [ ] Backend running (npm start)
- [ ] Internet connected

That's it! No other checks needed.

## Support

**If something goes wrong:**
1. Check browser console (F12)
2. Look for red error messages
3. Check if backend is running
4. Try with single test PDF first
5. Check filename format is correct

---

**Status:** ✅ Fully Automatic - No Manual Selection Required
**Upload Flow:** Select Folder → Click Upload → Done!
