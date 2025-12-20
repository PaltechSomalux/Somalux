# Past Papers Display Fix - Quick Start

## ❌ Problem
Unit Code, Unit Name, and Faculty not displaying in Admin > Content Management > Past Papers

## 🔍 Root Cause
Database columns exist but are **empty** for existing records. Old records had data in `course_code` and `subject` but not in the new `unit_code` and `faculty` columns.

## ✅ Solution - 2 Simple Steps

### Step 1: Run Migration Script (2 minutes)

**Option A: Using Node.js (Recommended)**
```bash
cd c:\Magic\SomaLux\backend
node fix-past-papers-display.js
```

**Option B: Using Supabase SQL Editor**
1. Open https://supabase.com → Your Project → SQL Editor
2. Copy all SQL from: `backend/migrations/035_migrate_past_papers_data.sql`
3. Run it

### Step 2: Clear Browser Cache (1 minute)

1. Open your browser (where you view admin dashboard)
2. Press `F12` to open DevTools
3. Open Console tab
4. Run: `localStorage.clear()`
5. Press `Ctrl+F5` to hard refresh

## ✨ Result
Unit Code, Unit Name, and Faculty will now display in the admin Past Papers table!

---

## 📊 What Gets Fixed

Before:
```
| Unit Code | Unit Name | Faculty | Downloads |
|-----------|-----------|---------|-----------|
|    —      |     —     |    —    |    45     |
|    —      |     —     |    —    |    123    |
```

After:
```
| Unit Code | Unit Name            | Faculty   | Downloads |
|-----------|----------------------|-----------|-----------|
|   CS101   | Intro to CS          | Science   |    45     |
|   MATH201 | Calculus II          | Maths     |    123    |
```

---

## 🚀 Timeline

- **Done:** Fixed API queries ✅
- **Next:** Run migration script ⏳
- **Then:** Clear cache ⏳
- **Result:** Full functionality ✨

---

## 📝 Files

**Already Updated:**
- ✅ `src/SomaLux/Books/Admin/pastPapersApi.js`
- ✅ `src/SomaLux/Books/Admin/pages/shared/pastPapersApi.js`

**Ready to Use:**
- ⏳ `backend/fix-past-papers-display.js` (run this!)
- ⏳ `backend/migrations/035_migrate_past_papers_data.sql` (or run via SQL editor)

---

## 🎯 Quick Commands

```bash
# Navigate to backend
cd c:\Magic\SomaLux\backend

# Run migration
node fix-past-papers-display.js

# Done! ✅
```

Then clear browser cache and refresh admin dashboard.

---

## ❓ Questions?

See full guide: `PASTPAPERS_DISPLAY_COMPLETE_FIX.md`
