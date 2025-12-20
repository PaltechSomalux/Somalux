# Troubleshooting: Past Papers Upload RLS Error

## Error Message
```
Failed to upload file to bucket 'past-papers': new row violates row-level security policy
```

## Root Cause Analysis

### 1. **Storage Bucket Issue**
The `past-papers` storage bucket has no upload policy configured.

**Fix:** Add storage bucket policies (see below)

### 2. **Database Table RLS Issue**
The `past_papers` table has RLS enabled but no INSERT policy.

**Fix:** Add table-level RLS policies (see below)

### 3. **Missing User Context**
The authenticated user context is not being passed correctly.

**Fix:** Ensure user is logged in and session is valid

---

## Implementation Steps

### Step 1: Apply Storage Bucket Policies

**In Supabase Dashboard:**
1. Go to **Storage** → **past-papers** bucket
2. Click **Policies** tab
3. Add this policy for uploads:

```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'past-papers' AND
  auth.role() = 'authenticated'
);
```

4. Add this policy for downloads:

```sql
CREATE POLICY "Allow public downloads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'past-papers');
```

### Step 2: Apply Table RLS Policies

**In Supabase Dashboard:**
1. Go to **SQL Editor**
2. Run this complete setup:

```sql
-- Enable RLS on the past_papers table
ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT their own papers
CREATE POLICY "Allow insert own papers"
ON past_papers
FOR INSERT
WITH CHECK (auth.uid()::text = uploaded_by::text);

-- Allow authenticated users to SELECT (read) papers
CREATE POLICY "Allow select papers"
ON past_papers
FOR SELECT
USING (true);

-- Allow owners/admins to UPDATE
CREATE POLICY "Allow update own papers"
ON past_papers
FOR UPDATE
USING (auth.uid()::text = uploaded_by::text);

-- Allow owners/admins to DELETE
CREATE POLICY "Allow delete own papers"
ON past_papers
FOR DELETE
USING (auth.uid()::text = uploaded_by::text);
```

### Step 3: Verify Table Schema

Check that your `past_papers` table has these columns:

```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'past_papers' 
ORDER BY ordinal_position;
```

Expected columns:
- `id` (uuid, primary key)
- `uploaded_by` (uuid, should reference auth.users)
- `file_path` (text, path in storage bucket)
- `university_id` (uuid, optional)
- `faculty` (text)
- `unit_code` (text)
- `unit_name` (text)
- `year` (integer, optional)
- `semester` (text, optional)
- `exam_type` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Step 4: Update Metadata Passing

**In `src/SomaLux/PastPapers/Pastpapers.jsx`**, ensure metadata is passed correctly:

```javascript
const metadata = {
  uploaded_by: user?.id,  // ✅ Must match user.id
  university_id: currentUni?.id || null,
  faculty: uploadForm.faculty,
  unit_code: uploadForm.unit_code,
  unit_name: uploadForm.unit_name,
  year: uploadForm.year ? Number(uploadForm.year) : null,
  semester: uploadForm.semester || '',
  exam_type: uploadForm.exam_type || 'Main'
};
```

The `uploaded_by` field **must** be:
- The authenticated user's ID (from `auth.uid()`)
- Match the type in your `past_papers` table (usually UUID)
- Not NULL

---

## Testing the Fix

### Test 1: Direct SQL Test

```sql
-- Test INSERT with auth context
INSERT INTO past_papers (
  uploaded_by, 
  faculty, 
  unit_code, 
  unit_name, 
  exam_type, 
  file_path
) VALUES (
  auth.uid(),
  'Science',
  'CS101',
  'Introduction to Programming',
  'Main',
  'past-papers/test.pdf'
);
```

### Test 2: Application Test

1. Log in as a user
2. Navigate to **PastPapers** section
3. Click **Share a Past Paper**
4. Fill in all fields
5. Select a PDF file
6. Click **Submit**

**Expected Result:** Paper uploaded successfully ✅

### Test 3: Verify RLS Policies

```sql
-- List all policies on past_papers table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'past_papers'
ORDER BY policyname;
```

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
if (!user?.id) {
  throw new Error('User must be logged in');
}

// Ensure uploaded_by matches auth.uid()
const metadata = {
  uploaded_by: user.id, // Match this exactly
  // ... other fields
};
```

### ❌ "Storage bucket RLS" error

**Cause:** Storage bucket policies not configured

**Solution:** Add the policies shown in Step 1 above

### ❌ "uploaded_by column doesn't exist"

**Cause:** Table schema mismatch

**Solution:** 
1. Check if column is named differently (e.g., `user_id`, `author_id`)
2. Update both the API and RLS policy to match
3. Or add the missing column:

```sql
ALTER TABLE past_papers 
ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);
```

### ❌ Policies were created but still getting errors

**Cause:** Policies have execution order issues

**Solution:**
1. Drop existing policies:
```sql
DROP POLICY IF EXISTS "Allow insert own papers" ON past_papers;
DROP POLICY IF EXISTS "Allow select papers" ON past_papers;
```

2. Recreate them in this order:
   - SELECT policy first
   - INSERT policy second
   - UPDATE/DELETE policies last

---

## Security Considerations

✅ **Current Setup:**
- Only authenticated users can insert
- Users can only modify their own papers
- Admins can manage all papers
- Public can read all papers

⚠️ **Consider adding:**
- Rate limiting for uploads
- File type validation (PDF only)
- File size limits
- Content moderation

---

## Files to Check/Modify

1. **Database**: `past_papers` table and RLS policies
2. **Frontend**: `src/SomaLux/PastPapers/Pastpapers.jsx` (metadata passing)
3. **API**: `src/SomaLux/Books/Admin/pastPapersApi.js` (upload function)
4. **Supabase**: Storage bucket policies for `past-papers`

---

## Verification Checklist

- [ ] Storage bucket `past-papers` exists
- [ ] Storage bucket policies are created (INSERT, SELECT, DELETE)
- [ ] Table `past_papers` has RLS enabled
- [ ] RLS policies on `past_papers` are created (INSERT, SELECT, UPDATE, DELETE)
- [ ] Column `uploaded_by` exists and is UUID type
- [ ] Frontend passes `uploaded_by: user.id` in metadata
- [ ] User is authenticated before upload
- [ ] Test upload succeeds without RLS errors

---

## Need More Help?

Check these Supabase documentation pages:
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Access Control](https://supabase.com/docs/guides/storage/access-control)
- [Policy SQL Examples](https://supabase.com/docs/guides/auth/row-level-security/policy-examples)

Or check the migration files:
- `backend/migrations/008_fix_past_papers_rls.sql` - SQL migration
- `backend/apply-rls-fix.js` - Automated fix script
