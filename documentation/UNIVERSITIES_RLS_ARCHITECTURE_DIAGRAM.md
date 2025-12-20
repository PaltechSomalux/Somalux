# Universities RLS Fix - Architecture Diagram

## 🎯 The Problem

```
USER UPLOADS UNIVERSITY WITH COVER IMAGE

┌─────────────────────────────────────────────────────────┐
│                   Upload.jsx                             │
│  submitCampus() → createUniversity()                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            campusApi.js                                  │
│  uploadUniversityCover() + createUniversity()           │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌─────────────┐      ┌──────────────┐
    │   Upload    │      │   Insert     │
    │   Cover to  │      │   Record in  │
    │   Bucket    │      │   Database   │
    │ (Storage)   │      │ (universities)
    └──────┬──────┘      └──────┬───────┘
           │                    │
           ▼                    ▼
    ❌ RLS ERROR          ❌ RLS ERROR
    
No policies on              No INSERT policy
university-covers bucket    on universities table
```

---

## ✅ The Solution

```
POLICIES ADDED TO SUPABASE

DATABASE LAYER (universities table)
╔════════════════════════════════════════════════════════╗
║                    RLS ENABLED                         ║
╠════════════════════════════════════════════════════════╣
║ POLICY 1: INSERT                                       ║
║ ✅ Allow users to insert their own universities       ║
║   Condition: auth.uid() = uploaded_by OR admin        ║
╠════════════════════════════════════════════════════════╣
║ POLICY 2: SELECT                                       ║
║ ✅ Allow everyone to view universities                ║
║   Condition: true (public access)                      ║
╠════════════════════════════════════════════════════════╣
║ POLICY 3: UPDATE                                       ║
║ ✅ Allow users to update their own universities       ║
║   Condition: auth.uid() = uploaded_by OR admin        ║
╠════════════════════════════════════════════════════════╣
║ POLICY 4: DELETE                                       ║
║ ✅ Allow users to delete their own universities       ║
║   Condition: auth.uid() = uploaded_by OR admin        ║
╚════════════════════════════════════════════════════════╝

STORAGE LAYER (university-covers bucket)
╔════════════════════════════════════════════════════════╗
║             BUCKET POLICIES CONFIGURED                 ║
╠════════════════════════════════════════════════════════╣
║ POLICY 1: INSERT (Upload)                             ║
║ ✅ Allow authenticated users to upload files          ║
║   Condition: bucket_id = 'university-covers' AND       ║
║             auth.role() = 'authenticated'             ║
╠════════════════════════════════════════════════════════╣
║ POLICY 2: SELECT (Download)                           ║
║ ✅ Allow public to download files                     ║
║   Condition: bucket_id = 'university-covers'          ║
╠════════════════════════════════════════════════════════╣
║ POLICY 3: DELETE                                       ║
║ ✅ Allow users to delete their own files              ║
║   Condition: owner OR admin                           ║
╚════════════════════════════════════════════════════════╝
```

---

## 📊 Data Flow WITH FIX

```
Step 1: User Uploads University
        ┌──────────────────┐
        │  User clicks     │
        │  "Upload"        │
        └────────┬─────────┘
                 │
Step 2: Validate & Submit
        ┌────────▼──────────┐
        │ Frontend validates│
        │ ├─ User logged in?│
        │ ├─ Form filled?   │
        │ └─ File selected? │
        └────────┬──────────┘
                 │
Step 3: Upload Cover to Storage
        ┌────────▼──────────────────┐
        │ supabase.storage          │
        │   .from('university-covers')
        │   .upload(file)           │
        │                           │
        │ RLS Check:                │
        │ ✅ bucket_id matches?     │
        │ ✅ auth.role() = auth?    │
        │ → ALLOWED                 │
        └────────┬──────────────────┘
                 │
Step 4: Get Public URL
        ┌────────▼──────────────────┐
        │ Get public URL for cover  │
        │ Result: https://...       │
        └────────┬──────────────────┘
                 │
Step 5: Insert University Record
        ┌────────▼──────────────────┐
        │ supabase.from('universities')
        │   .insert({               │
        │     name: '...',          │
        │     uploaded_by: user.id, │
        │     cover_image_url: url  │
        │   })                      │
        │                           │
        │ RLS Check:                │
        │ ✅ is INSERT allowed?     │
        │ ✅ auth.uid() = uploaded_by? │
        │ → ALLOWED                 │
        └────────┬──────────────────┘
                 │
Step 6: Success!
        ┌────────▼──────────────────┐
        │ ✅ University created    │
        │ ✅ Cover stored          │
        │ ✅ User notified         │
        └──────────────────────────┘
```

---

## 🔐 Security Model

### Who Can Do What?

```
                   Anonymous   Authenticated   Admin
                      User         User        User
                   ┌─────────┬─────────────┬─────────┐
Create University  │   ❌    │      ✅     │    ✅   │
View University    │   ✅    │      ✅     │    ✅   │
Edit Own Univ.     │   ❌    │      ✅     │    ✅   │
Edit Other's Univ. │   ❌    │      ❌     │    ✅   │
Delete Own Univ.   │   ❌    │      ✅     │    ✅   │
Delete Other's     │   ❌    │      ❌     │    ✅   │
Upload Cover       │   ❌    │      ✅     │    ✅   │
Download Cover     │   ✅    │      ✅     │    ✅   │
                   └─────────┴─────────────┴─────────┘
```

---

## 🔄 Comparison: Before vs After

### BEFORE FIX
```
User submits university with cover

        Upload Cover File
              │
              ▼
        ❌ RLS POLICY ERROR
        "new row violates row-level security policy"
        
        Storage bucket policies missing
        → Cannot upload to 'university-covers'
```

### AFTER FIX
```
User submits university with cover

        Upload Cover File
              │
              ▼
        ✅ Check bucket policy
        "Allow authenticated to upload"
              │
              ▼
        ✅ Upload successful
        File stored in bucket
              │
              ▼
        Insert database record
              │
              ▼
        ✅ Check table policy
        "Allow user to insert own"
              │
              ▼
        ✅ Insert successful
        Record created in database
              │
              ▼
        ✅ COMPLETE SUCCESS
        Cover image appears in list
```

---

## 📈 Policy Effectiveness

### RLS on universities table
```
┌──────────────────────────────────────┐
│   Request to INSERT into table       │
└────────────────┬─────────────────────┘
                 │
        ┌────────▼────────┐
        │  Check RLS      │
        │  Policies       │
        └────────┬────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
Policy 1: INSERT Policy     No policy
    ✅ ALLOW              ❌ DENY ALL

Does request match:
  auth.uid() = uploaded_by
  OR admin role?
    │
    ├─ YES → ✅ ALLOW INSERT
    └─ NO  → ❌ DENY INSERT
```

### RLS on storage.objects
```
┌──────────────────────────────────────┐
│   Request to upload to bucket        │
└────────────┬───────────────────────────┘
             │
      ┌──────▼──────┐
      │ Check bucket│
      │  policies   │
      └──────┬──────┘
             │
   ┌─────────┴─────────┐
   │                   │
   ▼                   ▼
Policy 1: INSERT   No policy
   ✅ ALLOW        ❌ DENY ALL

Does request match:
  bucket_id = 'university-covers'
  AND auth.role() = 'authenticated'?
    │
    ├─ YES → ✅ ALLOW UPLOAD
    └─ NO  → ❌ DENY UPLOAD
```

---

## 🎯 Key Policy Rules

### Table Policy: INSERT
```
CREATE POLICY "Allow users to insert their own universities"
ON universities
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by         ← User owns it
  OR                                 
  EXISTS (                           
    SELECT 1 FROM profiles           
    WHERE id = auth.uid()            
      AND role = 'admin'             ← Or is admin
  )
);

Result:
✅ User can insert: their.id = uploaded_by
✅ Admin can insert: even if different user
❌ Other users cannot insert
❌ Anonymous cannot insert
```

### Storage Policy: INSERT
```
CREATE POLICY "Allow authenticated to upload covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'university-covers'    ← Right bucket
  AND
  auth.role() = 'authenticated'      ← Must be logged in
);

Result:
✅ Any authenticated user can upload
❌ Anonymous users cannot upload
❌ Cannot upload to other buckets
```

---

## 🔗 Component Interactions

```
Frontend                Backend              Database           Storage
┌──────────┐          ┌──────────┐         ┌──────────┐       ┌──────────┐
│ Upload   │          │ Supabase │         │          │       │ Bucket   │
│ Component├─Upload──→│ Client   │         │          │       │          │
└──────────┘  Cover   └────┬─────┘         │          │       │          │
                           │               │          │       │          │
                    ┌──────▼──────┐        │          │       │          │
                    │ Storage API │───────→│          │  ────→│ university
                    │             │     Upload       │  Save │-covers   │
                    └──────┬──────┘        │          │       │          │
                           │               │          │       └──────────┘
                    ┌──────▼──────┐        │          │            ▲
                    │ Database API│───────→│          │────────────│
                    │             │      Insert       │   Get      │
                    └──────────────┘     Record       │ Public URL │
                           │               │          │            │
                    Return Success         │          │            │
                           │               │          │            │
                    ◄──────┴───────────────┴──────────┴────────────┘

RLS Checks Applied At Each Step:
1. Storage upload: ✅ bucket_id + auth.role()
2. Database insert: ✅ auth.uid() + uploaded_by
```

---

## 🧩 Policy Integration Points

```
REQUEST FLOW WITH RLS

Browser
  │
  ├─ Check authentication
  │  └─ GET auth.uid()
  │
  ├─ Upload file
  │  ├─ to storage.objects
  │  ├─ RLS Policy: "Allow authenticated to upload"
  │  ├─ Check: bucket = 'university-covers' ✅
  │  ├─ Check: auth.role() = 'authenticated' ✅
  │  └─ Result: ✅ FILE UPLOADED
  │
  └─ Insert record
     ├─ to universities table
     ├─ RLS Policy: "Allow users to insert own"
     ├─ Check: auth.uid() = uploaded_by ✅
     ├─ OR check: role = 'admin' ✅
     └─ Result: ✅ RECORD CREATED
```

---

## 🎯 Why Each Policy Exists

| Policy | Why | What it prevents |
|--------|-----|-----------------|
| INSERT on table | Users should upload their own | Users uploading others' records |
| SELECT on table | Everyone should see universities | Public data becomes private |
| UPDATE on table | Users should edit their own | Users editing others' data |
| DELETE on table | Users should delete their own | Users deleting others' data |
| INSERT on storage | Users should upload covers | Unauthorized storage usage |
| SELECT on storage | Public should download | Content becomes private |
| DELETE on storage | Users should delete their own | Users deleting others' files |

---

## 📋 Implementation Summary

```
Migration 009: Universities RLS Fix

┌─────────────────────────────────────────┐
│  Policies to Add: 7 total               │
├─────────────────────────────────────────┤
│ universities table: 4 policies           │
│  ├─ INSERT (with auth check)            │
│  ├─ SELECT (public)                     │
│  ├─ UPDATE (with ownership check)       │
│  └─ DELETE (with ownership check)       │
├─────────────────────────────────────────┤
│ university-covers bucket: 3 policies     │
│  ├─ INSERT (authenticated only)         │
│  ├─ SELECT (public)                     │
│  └─ DELETE (with ownership check)       │
├─────────────────────────────────────────┤
│ Result:                                  │
│ ✅ Secure multi-user system             │
│ ✅ Public read access                   │
│ ✅ User ownership enforced               │
│ ✅ Admin override capability             │
│ ✅ Production ready                      │
└─────────────────────────────────────────┘
```

---

## ✨ The Complete Picture

```
BEFORE FIX:
User → Upload → ❌ RLS Error → No university created
                               No cover stored

AFTER FIX:
User → Upload → ✅ Storage policy check → ✅ Cover saved
       │
       └─→ Insert record → ✅ Table policy check → ✅ Record created
                             ✅ University visible in list
                             ✅ Cover image displays
```

---

## 🚀 Ready to Implement?

This architecture is:
- ✅ Secure (RLS enforced at multiple layers)
- ✅ Scalable (works with any number of users)
- ✅ Production-ready (follows best practices)
- ✅ Well-documented (7 policies explained)
- ✅ Tested approach (based on past papers fix)

**Everything is designed and ready to deploy!** 🎉
