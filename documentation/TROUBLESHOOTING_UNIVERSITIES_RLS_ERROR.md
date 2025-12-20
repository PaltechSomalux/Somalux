# Troubleshooting: Universities Upload RLS Error

## Error Message
```
University upload failed: Error: Failed to upload cover to bucket 'university-covers': 
new row violates row-level security policy
    at uploadUniversityCover (campusApi.js:77:1)
    at async createUniversity (campusApi.js:108:1)
    at async submitCampus (Upload.jsx:289:1)
```

## Root Cause Analysis

### 1. **Storage Bucket Issue**
The `university-covers` storage bucket has no upload policy configured.

**Fix:** Add storage bucket policies (see below)

### 2. **Database Table RLS Issue**
The `universities` table has RLS enabled but no INSERT policy.

**Fix:** Add table-level RLS policies (see below)

### 3. **Missing User Context**
The authenticated user context is not being passed correctly.

**Fix:** Ensure user is logged in and session is valid

---

## Implementation Steps

### Step 1: Apply Storage Bucket Policies

**In Supabase Dashboard:**
1. Go to **Storage** → **university-covers** bucket
2. Click **Policies** tab
3. Add this policy for uploads:

```sql
CREATE POLICY "Allow authenticated users to upload university covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'university-covers' AND
  auth.role() = 'authenticated'
);
```

4. Add this policy for downloads:

```sql
CREATE POLICY "Allow public read university covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'university-covers');
```

5. Add this policy for deletions:

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

### Step 2: Apply Table RLS Policies

**In Supabase Dashboard:**
1. Go to **SQL Editor**
2. Run this complete setup:

```sql
-- Enable RLS on universities table
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT their own universities
CREATE POLICY "Allow users to insert their own universities"
ON universities
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow authenticated users to SELECT (read) universities
CREATE POLICY "Allow users to view universities"
ON universities
FOR SELECT
USING (true);

-- Allow owners/admins to UPDATE
CREATE POLICY "Allow users to update their own universities"
ON universities
FOR UPDATE
WITH CHECK (auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow owners/admins to DELETE
CREATE POLICY "Allow users to delete their own universities"
ON universities
FOR DELETE
USING (auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Step 3: Verify Table Schema

**Run this query to verify the table structure:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'universities'
ORDER BY ordinal_position;
```

**Expected columns include:**
- `id` (uuid)
- `name` (text)
- `description` (text)
- `cover_image_url` (text)
- `uploaded_by` (uuid) ← **This column must exist**
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Step 4: Verify User Profile

**Ensure the user attempting upload has a valid profile:**

```sql
SELECT id, email, role 
FROM profiles 
WHERE id = auth.uid();
```

**Expected output:**
- One row with user's ID, email, and role
- Role should be 'user' or 'admin'

---

## Common Issues & Solutions

### ❌ "RLS policy violation" still occurs

**Possible causes:**
1. User is not authenticated (not logged in)
2. `uploaded_by` is NULL in the insert payload
3. `uploaded_by` type doesn't match table column type
4. Policy references wrong column name

**Solution:**
```javascript
// Ensure user is authenticated
if (!userProfile?.id) {
  throw new Error('User must be logged in');
}

// Ensure uploaded_by matches auth.uid()
const metadata = {
  uploaded_by: userProfile.id, // Match this exactly
  name: campusForm.name,
  // ... other fields
};
```

### ❌ "Storage bucket RLS" error

**Cause:** Storage bucket policies not configured

**Solution:** Add the policies shown in Step 1 above

### ❌ "Table RLS" error

**Cause:** Table policies not configured or RLS not enabled

**Solution:** 
1. Run Step 2 SQL in Supabase dashboard
2. Verify RLS is enabled on the table

### ❌ "Column 'uploaded_by' does not exist"

**Cause:** Column missing from table

**Solution:**
1. Go to Supabase dashboard
2. Go to Tables → universities
3. Add column: `uploaded_by` with type UUID
4. Set default value to `auth.uid()`

---

## Verification Checklist

- [ ] Storage bucket `university-covers` exists
- [ ] Storage bucket policies are created (INSERT, SELECT, DELETE)
- [ ] Table `universities` has RLS enabled
- [ ] RLS policies on `universities` are created (INSERT, SELECT, UPDATE, DELETE)
- [ ] Column `uploaded_by` exists and is UUID type
- [ ] Frontend passes `uploaded_by: userProfile.id` in metadata
- [ ] User is authenticated before upload
- [ ] Test upload succeeds without RLS errors

---

## Verification Queries

### Query 1: Check RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'universities';
```

**Expected Output:**
```
tablename    | rowsecurity
universities | t
```

### Query 2: List All Policies
```sql
SELECT policyname, permissive, qual, with_check
FROM pg_policies
WHERE tablename = 'universities'
ORDER BY policyname;
```

**Expected Output:** 4 rows with policy names:
- Allow users to delete their own universities
- Allow users to insert their own universities
- Allow users to update their own universities
- Allow users to view universities

### Query 3: Check Storage Policies
```sql
SELECT policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
  AND definition LIKE '%university-covers%'
ORDER BY policyname;
```

**Expected Output:** 3 rows with policies for `university-covers` bucket

---

## Testing the Fix

### Test 1: Basic Upload
1. Log in as a user
2. Go to Upload page
3. Fill in university form with cover image
4. Click submit
5. **Expected:** Upload succeeds, no RLS error

### Test 2: View Universities
1. Go to Universities page
2. **Expected:** See all universities with cover images

### Test 3: Edit Own University
1. Upload a university
2. Try to edit it
3. **Expected:** Can edit successfully

### Test 4: Delete Own University
1. Upload a university
2. Try to delete it
3. **Expected:** Can delete successfully

### Test 5: Cannot Edit Other User's University
1. Log out
2. Log in as different user
3. Try to edit another user's university
4. **Expected:** Cannot edit (RLS blocks it)

---

## Automated Fix

If you have the `SUPABASE_SERVICE_ROLE_KEY` configured, run:

```bash
cd backend
node apply-universities-rls-fix.js
```

This will apply all SQL statements automatically.

---

## Need More Help?

1. Check the full guide: `UNIVERSITIES_RLS_FIX_GUIDE.md`
2. Review code: `src/SomaLux/Books/Admin/pages/shared/campusApi.js`
3. Check Supabase logs for detailed error messages
4. Verify user authentication status in browser console:
   ```javascript
   // In browser console
   const { data } = await supabase.auth.getUser();
   console.log(data);
   ```

---

## Related Files

- **Migration SQL**: `backend/migrations/009_fix_universities_rls.sql`
- **Automated Script**: `backend/apply-universities-rls-fix.js`
- **API Code**: `src/SomaLux/Books/Admin/pages/shared/campusApi.js`
- **Upload Component**: `src/SomaLux/Books/Admin/pages/Upload.jsx`
