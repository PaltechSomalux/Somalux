# Fix: Past Papers RLS Policy Violation

## Problem
```
Failed to upload file to bucket 'past-papers': new row violates row-level security policy
```

This error occurs when:
1. The `past_papers` table has Row-Level Security (RLS) enabled
2. No INSERT policy exists that allows authenticated users to insert
3. The storage bucket policies don't allow uploads

## Solution

### Step 1: Enable RLS and Add Policies to `past_papers` Table

Go to **Supabase Dashboard → SQL Editor** and execute:

```sql
-- Enable RLS on past_papers table
ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to insert their own past papers
CREATE POLICY "Allow users to insert their own past papers"
ON past_papers
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 2: Allow everyone to view past papers
CREATE POLICY "Allow users to view past papers"
ON past_papers
FOR SELECT
USING (true);

-- Policy 3: Allow users to update their own past papers
CREATE POLICY "Allow users to update their own past papers"
ON past_papers
FOR UPDATE
WITH CHECK (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 4: Allow users to delete their own past papers
CREATE POLICY "Allow users to delete their own past papers"
ON past_papers
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

Go to **Supabase Dashboard → Storage → past-papers bucket → Policies**

Add these policies:

#### Policy 1: Upload (INSERT)
```sql
CREATE POLICY "Allow authenticated users to upload past papers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'past-papers' AND
  auth.role() = 'authenticated'
);
```

#### Policy 2: Download (SELECT)
```sql
CREATE POLICY "Allow public read past papers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'past-papers');
```

#### Policy 3: Delete
```sql
CREATE POLICY "Allow users to delete their own past paper files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'past-papers' AND
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

Test uploading a past paper:

1. Go to the **PastPapers** section
2. Click **Share a Past Paper**
3. Fill in the form and upload a PDF
4. Should succeed without RLS errors

## Policy Breakdown

| Policy | Table | Operation | Allows |
|--------|-------|-----------|--------|
| Insert own papers | past_papers | INSERT | Users uploading their own papers, admins |
| View papers | past_papers | SELECT | Everyone (public reading) |
| Update papers | past_papers | UPDATE | Paper owners and admins |
| Delete papers | past_papers | DELETE | Paper owners and admins |
| Upload files | storage.objects | INSERT | Authenticated users to past-papers bucket |
| Download files | storage.objects | SELECT | Public access to past-papers bucket |
| Delete files | storage.objects | DELETE | File owners and admins |

## Migration Files

Two files have been created:

1. **`backend/migrations/008_fix_past_papers_rls.sql`** - The SQL migration
2. **`backend/apply-rls-fix.js`** - Automated script to apply the fix

## Quick Apply

If you have database permissions, run:

```bash
node backend/apply-rls-fix.js
```

Or manually execute the SQL in the Supabase dashboard.

## Testing

After applying the fix, users should be able to:

✅ Upload past papers
✅ View all past papers
✅ Edit their own past papers
✅ Delete their own past papers
✅ Admins can manage all past papers

## Related Issues

This fix addresses:
- RLS violation on `past_papers` table insert
- Storage bucket permission errors
- Past paper upload failures

## Need Help?

1. Verify the `uploaded_by` column exists in `past_papers` table
2. Verify the `profiles` table exists with `role` column
3. Check Supabase dashboard for policy creation errors
4. Review RLS policies under **Authentication → Policies**
