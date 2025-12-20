# Copy-Paste SQL Solution

## 🎯 Just Run This SQL

### 1️⃣ First - Table Policies

Copy and paste this entire block into Supabase SQL Editor:

```sql
-- ============================================
-- PAST_PAPERS TABLE - RLS POLICIES
-- ============================================

ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Insert
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

-- Policy 2: Select
CREATE POLICY "Allow users to view past papers"
ON past_papers
FOR SELECT
USING (true);

-- Policy 3: Update
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

-- Policy 4: Delete
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

**Click Run** ⏯️

---

### 2️⃣ Second - Storage Policies

Copy and paste this entire block into Supabase SQL Editor:

```sql
-- ============================================
-- PAST-PAPERS BUCKET - RLS POLICIES
-- ============================================

-- Policy 1: Upload
CREATE POLICY "Allow authenticated users to upload past papers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'past-papers' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Download
CREATE POLICY "Allow public read past papers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'past-papers');

-- Policy 3: Delete
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

**Click Run** ⏯️

---

## 3️⃣ Verify It Worked

Copy and paste this to verify:

```sql
-- Check table policies exist
SELECT policyname, permissive, roles 
FROM pg_policies 
WHERE tablename = 'past_papers' 
ORDER BY policyname;

-- Should show 4 rows:
-- ✅ Allow users to delete their own past papers
-- ✅ Allow users to insert their own past papers
-- ✅ Allow users to update their own past papers
-- ✅ Allow users to view past papers
```

---

## 4️⃣ Test It Works

1. Go back to your app
2. Log in as a user
3. Go to **PastPapers** section
4. Click **Share a Past Paper**
5. Fill in the form
6. Upload a PDF
7. Click **Submit**

**Expected:** ✅ Success message appears

---

## 🎉 That's It!

Your past papers upload is now fixed!

---

## If Something Goes Wrong

### Error: "Policy already exists"
```sql
-- Drop existing policy first
DROP POLICY IF EXISTS "Allow users to insert their own past papers" ON past_papers;
```

Then run the creation SQL again.

### Error: "Table not found"
```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'past_papers';
```

If it doesn't exist, you need to create it first.

### Error: "Column not found"
```sql
-- Check columns
\d past_papers

-- If uploaded_by doesn't exist, add it:
ALTER TABLE past_papers ADD COLUMN uploaded_by UUID;
```

---

## 📍 Where to Paste

1. Open Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste the SQL
5. Click **Run** button
6. Wait for success message

---

## ✅ That's All You Need!

The problem is solved. Users can now upload past papers without RLS errors.

Enjoy! 🎉
