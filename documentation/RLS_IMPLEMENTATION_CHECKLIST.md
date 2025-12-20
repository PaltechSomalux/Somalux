# RLS Policy Implementation Checklist

## 🎯 Overview
Fix for: "Failed to upload file to bucket 'past-papers': new row violates row-level security policy"

**Status:** Ready to implement ✅
**Difficulty:** Low 🟢
**Time Required:** 5-10 minutes ⏱️

---

## 📋 Pre-Implementation Checklist

### Prerequisites
- [ ] Access to Supabase dashboard
- [ ] Basic SQL knowledge (optional - can copy/paste)
- [ ] Database backup (recommended but not required)
- [ ] Web browser for Supabase console

### Verification Steps
- [ ] Supabase project is live and accessible
- [ ] User is authenticated in Supabase dashboard
- [ ] Can access SQL Editor
- [ ] Have SUPABASE_SERVICE_ROLE_KEY available (for optional automated fix)

---

## 🚀 Implementation Steps

### Option A: Manual SQL (Recommended for First Time)

#### Step 1: Access SQL Editor
- [ ] Open Supabase dashboard
- [ ] Click on **SQL Editor** in left sidebar
- [ ] Click **New Query**

#### Step 2: Copy Database Table Policies
- [ ] Open file: `RLS_POLICY_FIX_GUIDE.md`
- [ ] Copy the "Step 1" SQL section (table policies)
- [ ] Paste into SQL Editor
- [ ] Click **Run** button
- [ ] Verify: All statements executed successfully ✅

#### Step 3: Copy Storage Bucket Policies
- [ ] Copy the "Step 2" SQL section (bucket policies)
- [ ] Paste into SQL Editor
- [ ] Click **Run** button
- [ ] Verify: All statements executed successfully ✅

#### Step 4: Verify RLS Enabled
- [ ] Run this verification SQL:
```sql
-- Verify table RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'past_papers';

-- Should show: rowsecurity = 't' (true)
```
- [ ] Verify output shows `rowsecurity = true`

#### Step 5: List Policies
- [ ] Run this verification SQL:
```sql
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'past_papers'
ORDER BY policyname;
```
- [ ] Should list 4 policies:
  - [ ] Allow users to insert their own past papers
  - [ ] Allow users to view past papers
  - [ ] Allow users to update their own past papers
  - [ ] Allow users to delete their own past papers

---

### Option B: Automated Fix (For Power Users)

#### Prerequisites
- [ ] Node.js installed
- [ ] SUPABASE_URL environment variable set
- [ ] SUPABASE_SERVICE_ROLE_KEY environment variable set
- [ ] In correct directory: `backend/`

#### Steps
```bash
# 1. Navigate to backend directory
cd backend

# 2. Run the fix script
node apply-rls-fix.js

# 3. Wait for completion
# 4. Verify success message
```

- [ ] No errors in output
- [ ] All policies created successfully
- [ ] Summary shows successful count > 0

---

### Option C: Migration File Execution

#### Steps
- [ ] Copy full contents of: `backend/migrations/008_fix_past_papers_rls.sql`
- [ ] Paste into Supabase SQL Editor
- [ ] Execute
- [ ] Verify success

---

## ✅ Post-Implementation Checklist

### Database Verification

#### Table Policy Verification
```sql
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'past_papers' 
ORDER BY policyname;
```
- [ ] 4 policies listed
- [ ] INSERT policy includes: `auth.uid() = uploaded_by`
- [ ] SELECT policy includes: `true` (public access)
- [ ] UPDATE policy includes: `auth.uid() = uploaded_by`
- [ ] DELETE policy includes: `auth.uid() = uploaded_by`

#### Storage Bucket Verification
- [ ] Open Supabase dashboard
- [ ] Go to **Storage** → **past-papers** bucket
- [ ] Click **Policies** tab
- [ ] [ ] 3 policies visible:
  - [ ] "Allow authenticated users to upload past papers" (INSERT)
  - [ ] "Allow public read past papers" (SELECT)
  - [ ] "Allow users to delete their own past paper files" (DELETE)

---

## 🧪 Testing Checklist

### Unit Test
1. [ ] Open browser console
2. [ ] Log in to application
3. [ ] Verify `user.id` is set in console

### Integration Test
1. [ ] Navigate to **PastPapers** section
2. [ ] Click **Share a Past Paper** button
3. [ ] Fill in form:
   - [ ] University: Select one
   - [ ] Faculty: Enter value
   - [ ] Unit Code: Enter value (e.g., "CS101")
   - [ ] Unit Name: Enter value
   - [ ] Year: Enter value (optional)
   - [ ] Semester: Select value (optional)
   - [ ] Exam Type: Select "Main"
4. [ ] Click **Choose PDF File**
5. [ ] Select a PDF from your computer
6. [ ] Click **Submit** button
7. [ ] **Expected Result:** ✅ Success message appears

### Error Verification
- [ ] No RLS error message
- [ ] No "permission denied" error
- [ ] Success message shown
- [ ] Paper appears in list (after refresh)

### Admin Test (If applicable)
- [ ] Log in as admin user
- [ ] Verify admin can upload papers
- [ ] Verify admin can edit all papers
- [ ] Verify admin can delete all papers

### Public Access Test
- [ ] Log out (or use incognito window)
- [ ] Navigate to past papers list
- [ ] [ ] Can view papers (public SELECT works)
- [ ] [ ] Cannot upload (public user blocked) ✅

---

## 📊 Verification Queries

### Query 1: Check RLS Status
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'past_papers';
```

**Expected Output:**
```
schemaname | tablename   | rowsecurity
public     | past_papers | t
```

### Query 2: List All Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'past_papers'
ORDER BY policyname;
```

**Expected Output:** 4 rows with policy details

### Query 3: Check Storage Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
```

**Expected Output:** Policies for past-papers bucket

---

## 🔍 Troubleshooting During Implementation

### Issue: Policy Already Exists Error
**Error:** "Duplicate policy name"
**Solution:** 
- [ ] Drop existing policy: `DROP POLICY IF EXISTS "policy_name" ON table_name;`
- [ ] Run creation SQL again

### Issue: Table Not Found
**Error:** "relation 'past_papers' does not exist"
**Solution:**
- [ ] Verify table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'past_papers';`
- [ ] If missing, create table before running fix

### Issue: Column Not Found
**Error:** "column 'uploaded_by' does not exist"
**Solution:**
- [ ] Check table schema: `\d past_papers`
- [ ] If missing, add column: `ALTER TABLE past_papers ADD COLUMN uploaded_by UUID;`

### Issue: Reference Error
**Error:** "role 'postgres' does not exist"
**Solution:**
- [ ] This is normal, policies may reference different roles
- [ ] Fix will still work correctly

---

## 📋 Post-Fix Configuration

### Update Frontend (If Needed)
- [ ] Verify `src/SomaLux/PastPapers/Pastpapers.jsx` line ~290
- [ ] Ensure `uploaded_by: user?.id` is in metadata object
- [ ] No code changes needed if already correct

### Update Backend (If Needed)
- [ ] Verify `src/SomaLux/Books/Admin/pastPapersApi.js`
- [ ] Ensure upload function exists
- [ ] No changes needed if already correct

### Configuration Notes
- [ ] RLS is enforced at database level
- [ ] No application code changes required
- [ ] Works automatically with existing upload flow

---

## 🎯 Success Criteria

✅ **All of these should be true:**

1. [ ] No RLS policy violation errors
2. [ ] Users can upload past papers
3. [ ] Papers appear in list after upload
4. [ ] Users can view their own papers
5. [ ] Users can view others' papers
6. [ ] Users can edit only their own papers
7. [ ] Users can delete only their own papers
8. [ ] Admins can edit/delete any paper
9. [ ] Public users can view papers (not upload)
10. [ ] No database permission errors

---

## 📞 Support & Escalation

### If Upload Still Fails:
1. [ ] Check browser console for errors
2. [ ] Check Supabase dashboard logs
3. [ ] Verify user is authenticated (user.id exists)
4. [ ] Review `TROUBLESHOOTING_RLS_ERROR.md` file
5. [ ] Verify table schema matches expectations

### Escalation Path:
1. [ ] Review troubleshooting guide
2. [ ] Check verification queries
3. [ ] Review migration file for correctness
4. [ ] Check Supabase documentation
5. [ ] Contact Supabase support with error details

---

## 📚 Related Documentation

- 📖 **RLS_POLICY_FIX_GUIDE.md** - Step-by-step guide
- 📖 **TROUBLESHOOTING_RLS_ERROR.md** - Troubleshooting guide
- 📖 **RLS_ARCHITECTURE_DIAGRAM.md** - Visual diagrams
- 📖 **RLS_QUICK_REFERENCE.md** - Quick reference
- 📁 **backend/migrations/008_fix_past_papers_rls.sql** - SQL migration
- 📁 **backend/apply-rls-fix.js** - Automated script

---

## ✨ Summary

**Implementation Time:** 5-10 minutes
**Risk Level:** Low 🟢
**Rollback Path:** Easy (drop policies if needed)
**Testing Time:** 5 minutes
**Total Time:** ~15 minutes

**Status:** Ready to implement ✅

---

**Last Updated:** 2025-12-10
**Version:** 1.0
**Prepared by:** AI Assistant
