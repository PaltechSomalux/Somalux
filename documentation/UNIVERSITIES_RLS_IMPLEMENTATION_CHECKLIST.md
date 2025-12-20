# Universities RLS Policy Implementation Checklist

## 🎯 Overview
Fix for: "Failed to upload cover to bucket 'university-covers': new row violates row-level security policy"

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

#### Step 1: Verify Table Schema
- [ ] Log into Supabase dashboard
- [ ] Go to **Tables** → **universities**
- [ ] Verify column `uploaded_by` exists (type: uuid)
- [ ] If missing, add it:
  ```sql
  ALTER TABLE universities ADD COLUMN uploaded_by UUID DEFAULT auth.uid();
  ```

#### Step 2: Enable RLS on Table
- [ ] Go to **SQL Editor**
- [ ] Run this command:
  ```sql
  ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
  ```
- [ ] Verify output shows success

#### Step 3: Add Table Policies
- [ ] Still in **SQL Editor**
- [ ] Copy entire SQL block from `UNIVERSITIES_RLS_FIX_GUIDE.md` Step 1
- [ ] Paste into editor
- [ ] Execute
- [ ] Verify all 4 policies created without errors

#### Step 4: Verify RLS Enabled
- [ ] Run this verification SQL:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'universities';
```
- [ ] Verify output shows `rowsecurity = t` (true)

#### Step 5: List Policies
- [ ] Run this verification SQL:
```sql
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'universities'
ORDER BY policyname;
```
- [ ] Should list 4 policies:
  - [ ] Allow users to delete their own universities
  - [ ] Allow users to insert their own universities
  - [ ] Allow users to update their own universities
  - [ ] Allow users to view universities

#### Step 6: Add Storage Bucket Policies
- [ ] Go to **Storage** → **university-covers** bucket
- [ ] Click **Policies** tab
- [ ] Click **New Policy** button
- [ ] Add INSERT policy:
  ```sql
  CREATE POLICY "Allow authenticated users to upload university covers"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'university-covers' AND
    auth.role() = 'authenticated'
  );
  ```
- [ ] Verify policy created
- [ ] Add SELECT policy:
  ```sql
  CREATE POLICY "Allow public read university covers"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'university-covers');
  ```
- [ ] Verify policy created
- [ ] Add DELETE policy:
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
- [ ] Verify policy created

#### Step 7: Verify Storage Policies
- [ ] Go to **Storage** → **university-covers** → **Policies**
- [ ] Verify 3 policies listed:
  - [ ] Allow authenticated users to upload university covers (INSERT)
  - [ ] Allow public read university covers (SELECT)
  - [ ] Allow users to delete their own university cover files (DELETE)

### Option B: Automated Script

#### Prerequisites
- [ ] Node.js installed
- [ ] `.env` file has `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] Backend directory accessible

#### Steps
- [ ] Open terminal
- [ ] Navigate to project: `cd backend`
- [ ] Run script: `node apply-universities-rls-fix.js`
- [ ] Verify output shows success
- [ ] Check Supabase dashboard to confirm policies created

---

## ✅ Post-Implementation Checklist

### Database Verification

#### Table Policy Verification
```sql
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'universities' 
ORDER BY policyname;
```
- [ ] 4 policies listed
- [ ] INSERT policy includes: `auth.uid() = uploaded_by` or admin check
- [ ] SELECT policy includes: `true` (public access)
- [ ] UPDATE policy includes: `auth.uid() = uploaded_by` or admin check
- [ ] DELETE policy includes: `auth.uid() = uploaded_by` or admin check

#### Storage Bucket Verification
- [ ] Open Supabase dashboard
- [ ] Go to **Storage** → **university-covers** bucket
- [ ] Click **Policies** tab
- [ ] [ ] 3 policies visible:
  - [ ] "Allow authenticated users to upload university covers" (INSERT)
  - [ ] "Allow public read university covers" (SELECT)
  - [ ] "Allow users to delete their own university cover files" (DELETE)

#### User Profile Verification
```sql
SELECT id, email, role 
FROM profiles 
WHERE role = 'user' OR role = 'admin'
LIMIT 1;
```
- [ ] At least one user profile exists
- [ ] User has valid `role` value

---

## 🧪 Testing the Fix

### Test 1: Upload University with Cover
- [ ] Log in to application
- [ ] Go to Upload page
- [ ] Fill in university form:
  - [ ] Name: "Test University"
  - [ ] Description: "Test Description"
  - [ ] Location: "Test City"
  - [ ] Select cover image
- [ ] Click Submit
- [ ] **Expected Result:** Upload succeeds, no RLS error
- [ ] **Expected Result:** University appears in list with cover image

### Test 2: View All Universities
- [ ] Navigate to Universities page
- [ ] Scroll through list
- [ ] **Expected Result:** See all universities with cover images displayed

### Test 3: Edit Own University
- [ ] Create a university (if not done in Test 1)
- [ ] Click Edit on your own university
- [ ] Modify description
- [ ] Click Save
- [ ] **Expected Result:** Changes saved successfully

### Test 4: Delete Own University
- [ ] Create a test university
- [ ] Click Delete
- [ ] Confirm deletion
- [ ] **Expected Result:** University deleted successfully

### Test 5: Cannot Edit Other User's University (Multi-user test)
- [ ] Log out
- [ ] Log in as different user
- [ ] Try to edit another user's university
- [ ] **Expected Result:** Cannot edit (RLS blocks it) OR edit button disabled

### Test 6: Admin Can Manage All Universities
- [ ] Log out
- [ ] Log in as admin user
- [ ] Try to edit/delete another user's university
- [ ] **Expected Result:** Can edit and delete (admin override)

---

## 📊 Verification Queries

### Query 1: Check RLS Status
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'universities';
```

**Expected Output:**
```
schemaname | tablename    | rowsecurity
public     | universities | t
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
WHERE tablename = 'universities'
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
  AND definition LIKE '%university-covers%'
ORDER BY policyname;
```

**Expected Output:** Policies for university-covers bucket

---

## 🚨 Troubleshooting

### Policy already exists error
- [ ] This is normal - skip this policy
- [ ] Verify all 4 table policies exist
- [ ] Verify all 3 storage policies exist

### RLS still blocking uploads
- [ ] Verify user is logged in
- [ ] Verify `uploaded_by` is set to `auth.uid()`
- [ ] Check browser console for authentication errors
- [ ] Verify policies were created successfully

### Cannot see uploaded universities
- [ ] Verify SELECT policy exists and is `true` (public)
- [ ] Refresh page
- [ ] Check browser cache

### Admin cannot manage all universities
- [ ] Verify admin role in database
- [ ] Check admin condition in policies
- [ ] Verify profiles table has role column

---

## 📋 Policy Breakdown

| Policy | Table | Operation | Allows | Denies |
|--------|-------|-----------|--------|--------|
| Insert | universities | INSERT | Users insert own, admins insert any | Anonymous users |
| View | universities | SELECT | Everyone reads | None |
| Update | universities | UPDATE | Users update own, admins update any | Users edit others' |
| Delete | universities | DELETE | Users delete own, admins delete any | Users delete others' |
| Upload | storage.objects | INSERT | Authenticated to bucket | Anonymous users |
| Download | storage.objects | SELECT | Public from bucket | None |
| Delete files | storage.objects | DELETE | Users delete own, admins delete any | Users delete others' |

---

## 📁 Migration Files

Two files have been created for this fix:

1. **`backend/migrations/009_fix_universities_rls.sql`**
   - Complete SQL migration
   - Can be run in Supabase dashboard SQL editor
   - Contains all table and storage policies

2. **`backend/apply-universities-rls-fix.js`**
   - Automated Node.js script
   - Requires SUPABASE_SERVICE_ROLE_KEY
   - Executes migration programmatically

---

## 🎯 Success Criteria

All of these should be true:

- [ ] RLS enabled on universities table
- [ ] 4 policies configured on universities table
- [ ] 3 policies configured on university-covers bucket
- [ ] Users can upload universities with covers
- [ ] Public can view all universities
- [ ] Users can edit/delete their own universities
- [ ] Users cannot edit/delete other users' universities
- [ ] Admins can manage all universities
- [ ] No RLS errors in browser console

---

## 📚 Related Documentation

- 📖 `UNIVERSITIES_RLS_FIX_GUIDE.md` - Step-by-step fix guide
- 📖 `UNIVERSITIES_RLS_QUICK_REFERENCE.md` - 2-minute quick fix
- 📖 `TROUBLESHOOTING_UNIVERSITIES_RLS_ERROR.md` - Detailed troubleshooting
- 📖 `backend/migrations/009_fix_universities_rls.sql` - SQL migration
- 📖 `backend/apply-universities-rls-fix.js` - Automated script

---

## ✨ Notes

- This fix follows the same pattern as the past papers RLS fix
- No code changes needed in frontend/backend
- Compatible with existing implementation
- Follows Supabase security best practices
- Policies are secure and production-ready

---

## 🆘 Need Help?

1. Read `UNIVERSITIES_RLS_FIX_GUIDE.md` for detailed explanations
2. Check `TROUBLESHOOTING_UNIVERSITIES_RLS_ERROR.md` for common issues
3. Verify using the verification queries above
4. Review Supabase documentation on RLS policies
5. Check browser console for detailed error messages
