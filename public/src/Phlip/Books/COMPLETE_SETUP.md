# 🚀 Complete Setup Guide - Fix All Errors

## Current Issues
1. ❌ `[object Object]` runtime errors
2. ❌ Books not displaying
3. ❌ "Bucket not found" when uploading files
4. ❌ Missing columns in database

---

## ✅ Step-by-Step Fix (Do in Order!)

### Step 1: Run Database Migration

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project (hoegjepmtegvgnnaohdr)
3. Go to **SQL Editor**
4. Copy **ALL** the content from `final-schema-fix.sql`
5. Paste and click **Run**

This adds:
- ✅ `pages` column to books
- ✅ `publisher` column to books
- ✅ `updated_at` column to books
- ✅ `book_likes` table
- ✅ `book_comments` table
- ✅ RLS policies for public read access
- ✅ Realtime enabled

---

### Step 2: Verify Buckets Exist

The code expects these buckets:
- `elib-books` (for PDF files) ✅ You have this
- `elib-covers` (for cover images) ✅ You have this

**Check bucket settings:**

1. Go to **Storage** in Supabase Dashboard
2. Click on `elib-books`:
   - ✅ Should be **Public**
   - ✅ File size limit: 50 MB (or higher)
   - ✅ Allowed MIME types: `application/pdf` or `Any`
3. Click on `elib-covers`:
   - ✅ Should be **Public**
   - ✅ File size limit: 10 MB
   - ✅ Allowed MIME types: `image/*` or `Any`

**If buckets are NOT public, make them public:**

```sql
-- Run in SQL Editor
UPDATE storage.buckets 
SET public = true 
WHERE name IN ('elib-books', 'elib-covers');
```

---

### Step 3: Set Up Storage Policies

Both buckets need policies to allow uploads and access:

```sql
-- RLS policies for elib-books bucket
CREATE POLICY "Public Access for Books"
ON storage.objects FOR SELECT
USING (bucket_id = 'elib-books');

CREATE POLICY "Authenticated users can upload books"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'elib-books' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update books"
ON storage.objects FOR UPDATE
USING (bucket_id = 'elib-books' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete books"
ON storage.objects FOR DELETE
USING (bucket_id = 'elib-books' AND auth.role() = 'authenticated');

-- RLS policies for elib-covers bucket
CREATE POLICY "Public Access for Covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'elib-covers');

CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'elib-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'elib-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'elib-covers' AND auth.role() = 'authenticated');
```

**OR use Supabase UI:**
1. Go to **Storage** → **Policies**
2. For each bucket, add policies for:
   - SELECT (public access)
   - INSERT, UPDATE, DELETE (authenticated users)

---

### Step 4: Verify Schema is Complete

Run this query to check all columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'books' 
ORDER BY column_name;
```

**You should see ALL of these columns:**
- author (text)
- category_id (uuid)
- cover_url (text)
- created_at (timestamp with time zone)
- description (text)
- downloads (integer)
- file_path (text)
- id (uuid)
- isbn (text)
- language (text)
- pages (integer) ← NEW
- publisher (text) ← NEW
- title (text)
- updated_at (timestamp with time zone) ← NEW
- uploaded_by (uuid)
- views (integer)
- year (integer)

**Missing any? Re-run `final-schema-fix.sql`**

---

### Step 5: Add Sample Data (For Testing)

```sql
-- Add a test book
INSERT INTO public.books (
  title,
  author,
  description,
  category_id,
  year,
  language,
  isbn,
  views,
  downloads,
  pages,
  publisher
) VALUES (
  'Test Book',
  'Test Author',
  'This is a test book to verify everything works.',
  (SELECT id FROM categories LIMIT 1),
  2024,
  'English',
  '978-0-123456-78-9',
  0,
  0,
  200,
  'Test Publisher'
);
```

---

### Step 6: Clear Cache & Restart

1. **Clear browser cache:**
   - Chrome/Edge: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Or open DevTools (F12) → Right-click Refresh → Empty Cache and Hard Reload

2. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C in terminal)
   # Then restart
   npm start
   ```

---

### Step 7: Test Everything

#### Test Admin Dashboard:
1. Go to your admin route (e.g., `/admin/books`)
2. ✅ Books should display in table
3. ✅ No `[object Object]` errors
4. ✅ Try uploading a PDF - should work
5. ✅ Try uploading a cover image - should work

#### Test BookPanel:
1. Go to your books page
2. ✅ Books should display with covers
3. ✅ Click a book to view details
4. ✅ All info should show (author, pages, publisher, etc.)

---

## 🐛 Troubleshooting

### Still getting `[object Object]` error?

**Check browser console (F12):**
- Look for the actual error message
- Common errors:
  - `column "pages" does not exist` → Re-run Step 1
  - `column "publisher" does not exist` → Re-run Step 1
  - `relation "book_likes" does not exist` → Re-run Step 1

### Books still not showing?

**Check if data exists:**
```sql
-- Should return at least 1 row
SELECT COUNT(*) FROM books;

-- View first 5 books
SELECT id, title, author FROM books LIMIT 5;
```

**If 0 rows:** Add sample data (Step 5)

**If rows exist but not showing:**
- Check browser Network tab for failed requests
- Check RLS policies allow public SELECT
- Verify Supabase URL/key are correct

### Upload still fails with "Bucket not found"?

**Verify bucket names match exactly:**
```sql
-- Should return 2 rows with names: elib-books, elib-covers
SELECT name, public FROM storage.buckets;
```

**If bucket names are different:**
- Either rename buckets in Supabase to match code
- Or update code to match bucket names

**Check bucket is public:**
```sql
-- Both should return public = true
SELECT name, public FROM storage.buckets 
WHERE name IN ('elib-books', 'elib-covers');
```

### Google Auth not working?

1. Go to **Authentication** → **Providers** → **Google**
2. Ensure enabled with valid Client ID & Secret
3. Add redirect URLs:
   - `https://hoegjepmtegvgnnaohdr.supabase.co/auth/v1/callback`
   - `http://localhost:3000`

---

## 📋 Final Checklist

Before declaring success:

- [ ] Ran `final-schema-fix.sql` successfully
- [ ] Verified all 17 columns exist in books table
- [ ] Buckets `elib-books` and `elib-covers` exist and are public
- [ ] Storage policies allow SELECT for public, INSERT for authenticated
- [ ] Added at least 1 test book
- [ ] Cleared browser cache
- [ ] Restarted dev server
- [ ] Admin dashboard shows books without errors
- [ ] BookPanel shows books without errors
- [ ] Can upload PDF files
- [ ] Can upload cover images
- [ ] No console errors in browser

---

## 🎯 Expected Result

After completing all steps:

### Admin Dashboard
- ✅ Table displays all books
- ✅ Can filter, sort, paginate
- ✅ Can upload new books with PDFs and covers
- ✅ Can edit existing books
- ✅ No runtime errors

### BookPanel (User View)
- ✅ All books display with covers
- ✅ Can click to view book details
- ✅ All metadata shows (title, author, pages, publisher, etc.)
- ✅ Can like books (requires Google auth)
- ✅ Can comment (requires Google auth)
- ✅ Can download (requires Google auth)
- ✅ Real-time updates when others like/comment

---

## 🆘 Still Stuck?

1. **Check Supabase Logs:**
   - Dashboard → Logs → Check for errors

2. **Check Browser Console:**
   - Press F12 → Console tab
   - Copy full error message

3. **Verify connection:**
   ```javascript
   // Run in browser console
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'Using fallback');
   ```

4. **Test Supabase connection:**
   ```sql
   -- Run in SQL Editor - should return current timestamp
   SELECT NOW();
   ```

---

## 📝 Quick Reference

**Your Supabase Details:**
- URL: `https://hoegjepmtegvgnnaohdr.supabase.co`
- Project Ref: `hoegjepmtegvgnnaohdr`

**Bucket Names (must match exactly):**
- Books: `elib-books`
- Covers: `elib-covers`

**Required Tables:**
- `books` (with 17 columns)
- `categories`
- `book_likes`
- `book_comments`
- `profiles`

---

🎉 **Once all steps complete, everything should work perfectly!**
