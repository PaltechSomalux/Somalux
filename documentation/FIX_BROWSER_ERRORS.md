# Fixing Browser Console Errors

Your browser console shows two issues that need fixing:

## Issue 1: Invalid PDF Structure Error ✅ FIXED

**Problem:** "Warning: InvalidPDFException: Invalid PDF structure"

**Root Cause:** PDF files were being corrupted during base64 encoding/decoding in transit.

**Solution Applied:** 
- Modified PDF upload process to use direct file uploads to Supabase Storage instead of base64 encoding
- Updated `src/SomaLux/Books/Admin/pastPapersApi.js` to upload PDF files directly (avoiding base64 conversion)
- Added PDF validation in backend to check PDF header (%PDF)

**Changes Made:**
1. `src/SomaLux/Books/Admin/pastPapersApi.js` - Updated `createPastPaper()` to use direct file upload
2. `backend/index.js` - Enhanced `/api/elib/past-papers/create` with PDF validation
3. Increased JSON payload limits from 10MB to 50MB for larger files

**Next Steps:** Re-upload your PDFs - they should now be stored correctly without corruption.

---

## Issue 2: 404 Errors for `university_ratings` Table ✅ TO FIX MANUALLY

**Problem:** "Failed to load resource: the server responded with a status of 404" when fetching university ratings.

**Root Cause:** The `university_ratings` table doesn't exist in your Supabase database.

**Solution Required:** Create the table in Supabase

### Steps to Create the Table:

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Select your project (SomaLux)

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query** button

3. **Copy and Paste This SQL:**

```sql
-- Create university_ratings table
CREATE TABLE IF NOT EXISTS public.university_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(university_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_university_ratings_university_id ON public.university_ratings(university_id);
CREATE INDEX IF NOT EXISTS idx_university_ratings_user_id ON public.university_ratings(user_id);

-- Enable Row Level Security
ALTER TABLE public.university_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view ratings"
  ON public.university_ratings
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Users can insert own ratings"
  ON public.university_ratings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.university_ratings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.university_ratings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

4. **Click Run**
   - The table should be created successfully
   - You should see "Success" message

5. **Verify**
   - Go to **Table Editor** in the left sidebar
   - Look for `university_ratings` table in the list

---

## Testing After Fixes

### Test PDF Display:
1. Go to Past Papers section
2. Upload a new PDF file
3. Open the PDF - it should display correctly without "Invalid PDF" errors

### Test University Ratings:
1. Go to Universities section
2. Open a university profile
3. You should be able to rate it (1-5 stars)
4. No more 404 errors in the console

---

## Migration File Created

Migration 013 has been created for the university_ratings table:
- Location: `backend/migrations/013_create_university_ratings.sql`
- This can be applied programmatically later or you can apply it manually above

---

## Summary of Changes

| Component | Change | Status |
|-----------|--------|--------|
| PDF Upload | Direct file upload instead of base64 | ✅ Implemented |
| PDF Validation | Check PDF header on receipt | ✅ Implemented |
| university_ratings table | Need to create in Supabase | ⏳ Manual Action Required |
| RLS Policies | Added for university_ratings | ⏳ Included in SQL above |

Once you apply the SQL above and re-upload PDFs, both issues should be resolved.
