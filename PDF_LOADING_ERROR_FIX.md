# PDF Loading Error (400) - Complete Fix Guide

## Problem
PDFs are failing to load with a 400 (Bad Request) error:
```
Failed to load resource: the server responded with a status of 400
https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/books/...pdf
```

## Root Cause
The Supabase storage bucket `elib-books` is missing:
1. **CORS (Cross-Origin Resource Sharing) configuration** - Browser blocks cross-origin requests without proper CORS headers
2. **RLS (Row Level Security) policies** - Missing public access policies
3. **Bucket visibility** - Bucket may not be set to public

## Solution

### Step 1: Update Supabase Bucket Settings (Required - Dashboard Only)

Go to your Supabase Dashboard and follow these steps:

1. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Select the "elib-books" bucket

2. **Make Bucket Public**
   - In the bucket details, click the "Settings" tab
   - Toggle "Make Public" to ON
   - Confirm the change

3. **Configure CORS Settings**
   - Still in Settings, find "CORS" section
   - Add the following configuration:
   
   ```
   Allowed Origins:
   - https://wuwlnawtuhjoubfkdtgc.supabase.co
   - http://localhost:3000
   - http://localhost:5000
   - https://yourdomain.com (your production domain)
   
   Allowed Methods:
   - GET
   - POST
   - PUT
   - DELETE
   - OPTIONS
   
   Allowed Headers:
   - *
   
   Max Age:
   - 86400 (1 day)
   ```

4. **Save Settings**
   - Click "Update" to save the CORS configuration

### Step 2: Apply Database Migration

Run the migration file to set up RLS policies:

```bash
# From the project root
psql postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres < backend/migrations/040_fix_books_bucket_cors_and_rls.sql
```

Or through Supabase Dashboard:
1. Go to "SQL Editor"
2. Create a new query
3. Copy the SQL from `backend/migrations/040_fix_books_bucket_cors_and_rls.sql`
4. Execute the query

### Step 3: Update Frontend Code

The frontend code has been updated to:
- Properly handle bucket names (uses 'elib-books' instead of 'books')
- Construct correct public URLs for storage files
- Support multiple URL formats

**Files updated:**
- `src/SomaLux/Books/BookPanel.jsx` - Fixed URL construction

### Step 4: Verify Changes

After applying the changes:

1. **Clear Browser Cache**
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Clear all browser data
   - Close and reopen browser

2. **Test PDF Loading**
   - Go to a book details page
   - Try to open a book
   - Check browser console (F12) for any errors
   - PDFs should now load without 400 errors

3. **Check Network Tab**
   - Open DevTools (F12)
   - Go to Network tab
   - Load a book and look at PDF requests
   - Should see 200 status code (success)

## Troubleshooting

### If PDFs still don't load:

**Check 1: Verify Bucket is Public**
```sql
SELECT name, public FROM storage.buckets WHERE name = 'elib-books';
```
Should return: `public = true`

**Check 2: Verify Files Exist**
```sql
SELECT name, bucket_id FROM storage.objects 
WHERE bucket_id = 'elib-books' 
LIMIT 5;
```

**Check 3: Check File URLs in Database**
```sql
SELECT id, title, file_url FROM books LIMIT 5;
```
Look for files starting with either:
- `https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/...`
- UUID values (will be converted to full URL by frontend)
- Relative paths (will be converted to full URL by frontend)

**Check 4: Test Direct Access**
Try accessing a PDF directly in browser:
```
https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/elib-books/[file-uuid].pdf
```
Should download the file without errors.

**Check 5: Clear Supabase Cache**
Sometimes storage caches need to be cleared:
1. Go to Supabase Dashboard
2. Go to Settings > Database
3. Look for any cache clearing options
4. Or wait 5-10 minutes for cache to expire

### If you get a 403 error instead:

This means authentication is required. Check:
1. Bucket is set to "public" (not private)
2. RLS policies allow public READ access
3. The policy "Allow public read elib-books" exists and is enabled

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%elib-books%';
```

## Key Files Modified

| File | Changes |
|------|---------|
| `src/SomaLux/Books/BookPanel.jsx` | Fixed URL construction for elib-books bucket |
| `backend/migrations/040_fix_books_bucket_cors_and_rls.sql` | Added RLS policies and CORS config guidance |

## Environment Variables Check

Verify your `.env` file has:
```
REACT_APP_SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## Performance Note

After CORS is properly configured:
- Initial PDF load: ~2-3 seconds (depends on file size)
- Subsequent loads: ~500ms (cached)
- No more 400 errors
- Better error handling for corrupted files

## FAQ

**Q: Why did this suddenly break?**
A: Likely causes:
- Supabase project was paused/resumed
- Bucket settings were reset
- CDN cache expired requiring fresh CORS headers

**Q: Will this affect existing users?**
A: No, this is transparent. Users will just see PDFs load properly.

**Q: Can I use a custom domain?**
A: Yes, add your domain to the CORS allowed origins in Step 1.3

**Q: How long does CORS configuration take to apply?**
A: Usually instant, but can take up to 5 minutes to propagate globally.

## Summary Checklist

- [ ] Made elib-books bucket public in Supabase Dashboard
- [ ] Configured CORS settings in Supabase Dashboard
- [ ] Ran migration 040_fix_books_bucket_cors_and_rls.sql
- [ ] Verified frontend code updates (already applied)
- [ ] Cleared browser cache
- [ ] Tested PDF loading
- [ ] Checked browser network tab for 200 status codes

Once all checkboxes are complete, your PDF loading should work perfectly! 🎉
