# Fix: Universities RLS Policy Violation

## Problem
```
University upload failed: Error: Failed to upload cover to bucket 'university-covers': new row violates row-level security policy
    at uploadUniversityCover (campusApi.js:77:1)
    at async createUniversity (campusApi.js:108:1)
    at async submitCampus (Upload.jsx:289:1)
```

This error occurs when:
1. The `universities` table has Row-Level Security (RLS) enabled
2. No INSERT policy exists that allows authenticated users to insert
3. The `university-covers` storage bucket policies don't allow uploads

## Solution

### Step 1: Enable RLS and Add Policies to `universities` Table

Go to **Supabase Dashboard → SQL Editor** and execute:

```sql
-- Enable RLS on universities table
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to insert their own universities
CREATE POLICY "Allow users to insert their own universities"
ON universities
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 2: Allow everyone to view universities (public reading)
CREATE POLICY "Allow users to view universities"
ON universities
FOR SELECT
USING (true);

-- Policy 3: Allow users to update their own universities
CREATE POLICY "Allow users to update their own universities"
ON universities
FOR UPDATE
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 4: Allow users to delete their own universities
CREATE POLICY "Allow users to delete their own universities"
ON universities
FOR DELETE
USING (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Step 2: Configure Storage Bucket Policies

Go to **Supabase Dashboard → Storage → university-covers bucket → Policies**

Add these policies:

#### Policy 1: Upload (INSERT)
```sql
CREATE POLICY "Allow authenticated users to upload university covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'university-covers' AND
  auth.role() = 'authenticated'
);
```

#### Policy 2: Download (SELECT)
```sql
CREATE POLICY "Allow public read university covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'university-covers');
```

#### Policy 3: Delete
```sql
CREATE POLICY "Allow users to delete their own university cover files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'university-covers' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);
```

### Step 3: Verify the Fix

After applying the policies, test by:

1. Upload a university with a cover image
2. Verify the upload succeeds without RLS errors
3. Check that the cover image appears in the university details

## Automated Fix

If you have `SUPABASE_SERVICE_ROLE_KEY` configured in your `.env` file, you can run:

```bash
cd backend
node apply-universities-rls-fix.js
```

## Policy Breakdown

| Policy | Table | Operation | Allows |
|--------|-------|-----------|--------|
| Insert own universities | universities | INSERT | Users uploading their own universities, admins |
| View universities | universities | SELECT | Everyone (public reading) |
| Update universities | universities | UPDATE | University owners and admins |
| Delete universities | universities | DELETE | University owners and admins |
| Upload covers | storage.objects | INSERT | Authenticated users to university-covers bucket |
| Download covers | storage.objects | SELECT | Public access to university-covers bucket |
| Delete covers | storage.objects | DELETE | Cover owners and admins |

## Migration Files

Two files have been created:

1. **`backend/migrations/009_fix_universities_rls.sql`** - The SQL migration
2. **`backend/apply-universities-rls-fix.js`** - Automated script to apply the fix

## Testing

After applying the fix, users should be able to:

✅ Upload universities with cover images
✅ View all universities
✅ Edit their own universities
✅ Delete their own universities
✅ Admins can manage all universities

## Related Issues

This fix addresses:
- RLS violation on `universities` table insert
- Storage bucket permission errors for `university-covers`
- University upload failures with cover images

## Need Help?

1. Verify the `uploaded_by` column exists in `universities` table
2. Verify the `profiles` table exists with `role` column
3. Check Supabase dashboard for policy creation errors
4. Review RLS policies under **Authentication → Policies**
