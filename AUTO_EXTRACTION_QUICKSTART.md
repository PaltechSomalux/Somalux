# Past Papers Auto-Extraction - Quick Start

## What Changed?

The system **now automatically extracts University and Faculty** from your PDF documents. You no longer need to manually select them from dropdowns!

## How to Use

### 1️⃣ Go to Auto Upload
```
Admin Panel → Books & Papers → Auto Upload → Past Papers Auto Upload tab
```

### 2️⃣ Select Your Folder
- Drag and drop a folder with PDF files
- OR click to browse and select folder
- System auto-starts extraction

### 3️⃣ Wait for Auto-Detection (2-3 seconds)
The system:
- Reads your PDF files
- Extracts University name from the document
- Extracts Faculty name from the document
- Matches them to your system's database
- **Auto-fills the selection fields**

### 4️⃣ Upload!
- 📋 File list shows all files
- 🟢 Upload button is ready
- Click **Upload** to process all files at once
- See progress in real-time

## What Gets Auto-Extracted?

From your PDFs:
- ✅ **University** - "UNIVERSITY OF NAIROBI" → Auto-selected
- ✅ **Faculty** - "FACULTY OF SCIENCE" → Auto-selected

From your filenames:
- 📄 **Unit Code** - First part of filename (e.g., BIO101)
- 📄 **Unit Name** - Second part (e.g., Biology1)
- 📄 **Year** - Third part (e.g., 2023)
- 📄 **Semester** - Fourth part (e.g., 1)
- 📄 **Exam Type** - Last part (e.g., Main, Supplementary)

## Your PDF Format

**For best results, include on page 1:**
```
UNIVERSITY OF NAIROBI
FACULTY OF SCIENCE
[Rest of exam content]
```

**Filename format:**
```
BIO101_Biology1_2023_1_Main.pdf
CHEM201_Chemistry2_2023_2_Supplementary.pdf
```

## If Auto-Detection Fails

See a dropdown asking you to select manually?

**This means:**
- University/Faculty not found on page 1 of PDF
- OR PDF is a scanned image without selectable text
- OR Names don't match system database

**Solution:**
1. Move university/faculty names to page 1
2. Use the dropdown to manually select (override feature)
3. Click **Upload** - rest auto-extracts from filename

## Toast Messages

| Message | Meaning | Action |
|---------|---------|--------|
| "Found X PDF files" | Files detected | Extraction starting... |
| "Extracting metadata from PDF..." | In progress | Wait 2-3 seconds |
| "✓ Auto-filled: University & Faculty detected from PDF" | ✅ Success | Ready to upload! |
| "Could not auto-detect - please select manually" | ⚠️ Failed | Select from dropdown |
| "PDF read failed - please select manually" | ❌ Error | Select manually |

## What If...

### Q: Can I change the auto-detected values?
**A:** Yes! Click **"✏️ Override Auto-Detected Values"** to select different options.

### Q: What if my PDF doesn't have university name?
**A:** The system will show the dropdown. You can manually select, and the filename format will provide the rest.

### Q: How accurate is the auto-detection?
**A:** The system uses **fuzzy matching** (60%+ accuracy). It handles:
- Spelling variations
- Different formatting
- Word order changes
- Abbreviations

### Q: Does it work with scanned PDFs?
**A:** Only if the PDF has selectable text (not an image). Use filename format as fallback.

### Q: Can I upload multiple formats?
**A:** Yes! Mix of text-based and scanned PDFs work. The system tries PDF extraction, then falls back to filename parsing.

## File Upload Process

```
Select Folder
    ↓
Auto-detect University & Faculty (2-3 sec)
    ↓
Dropdowns hidden if successful
    ↓
Review file list
    ↓
Click Upload
    ↓
Files upload with auto-extracted metadata
    ↓
Progress tracking in real-time
    ↓
Success: X uploaded, Y failed
```

## Performance

- **Extraction per PDF:** 1-3 seconds
- **Faculty loading:** <1 second
- **Total setup:** 2-3 seconds before upload ready
- **Batch upload:** Unlimited files at once

## Need Help?

**Common Issues:**
1. Dropdowns still showing → University/Faculty not on page 1
2. Wrong university selected → Name mismatch, use dropdown
3. Faculty list empty → University not found in system
4. Upload fails → Check network, check backend

**Solutions:**
- Update PDF to include university/faculty on page 1
- Use manual dropdown selection (override)
- Check filename format: `CODE_Name_YEAR_SEMESTER_Type.pdf`
- Verify backend API is running

---

**Status:** ✅ Live and Ready to Use
**Last Updated:** January 3, 2026
