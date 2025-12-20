# RLS Policy Architecture - Before & After

## 🔴 BEFORE: Error State

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER UPLOADS PAST PAPER                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │ Frontend Component   │
                    │ Pastpapers.jsx       │
                    └──────────────────────┘
                                │
                                ▼ (uploadPastPaperFile)
                    ┌──────────────────────┐
                    │ Upload to Storage    │
                    │ Bucket: past-papers  │
                    └──────────────────────┘
                                │
                    ❌ RLS CHECK FAILS ❌
                    "No INSERT policy"
                                │
                                ▼
                    ┌──────────────────────┐
                    │ ❌ UPLOAD ERROR      │
                    │ RLS Policy Violation │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │ createPastPaper()    │
                    │ Never executes       │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │ ❌ OPERATION FAILS   │
                    │ User sees error      │
                    └──────────────────────┘
```

### RLS Policy Status - BEFORE

| Layer | Status | Policies |
|-------|--------|----------|
| Storage Bucket (past-papers) | ❌ No policies | INSERT ❌, SELECT ❌, DELETE ❌ |
| Table (past_papers) | ❌ No INSERT policy | INSERT ❌, SELECT ❌, UPDATE ❌, DELETE ❌ |

---

## 🟢 AFTER: Fixed State

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER UPLOADS PAST PAPER                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │ Frontend Component   │
                    │ Pastpapers.jsx       │
                    │ user.id = "abc123"   │
                    └──────────────────────┘
                                │
                                ▼ (uploadPastPaperFile)
                    ┌──────────────────────┐
                    │ Upload to Storage    │
                    │ Bucket: past-papers  │
                    └──────────────────────┘
                                │
                    ✅ RLS CHECK PASSES ✅
                    "Authenticated user"
                                │
                                ▼
                    ┌──────────────────────┐
                    │ ✅ FILE UPLOADED     │
                    │ path: "uuid.pdf"     │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │ createPastPaper()    │
                    │ metadata + file_path │
                    └──────────────────────┘
                                │
                    ✅ RLS CHECK PASSES ✅
                    auth.uid() = uploaded_by
                                │
                                ▼
                    ┌──────────────────────┐
                    │ ✅ INSERT SUCCEEDS   │
                    │ Record created       │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │ ✅ OPERATION SUCCESS │
                    │ User sees success    │
                    └──────────────────────┘
```

### RLS Policy Status - AFTER

| Layer | Status | Policies |
|-------|--------|----------|
| Storage Bucket (past-papers) | ✅ Configured | INSERT ✅, SELECT ✅, DELETE ✅ |
| Table (past_papers) | ✅ Configured | INSERT ✅, SELECT ✅, UPDATE ✅, DELETE ✅ |

---

## 🔐 Security Policy Flow

### Policy 1: Storage Bucket INSERT
```
┌──────────────────────────────┐
│ User uploads file            │
│ bucket_id = 'past-papers'    │
│ auth.role() = 'authenticated'│
└──────────────────────────────┘
            │
            ▼
┌──────────────────────────────┐
│ Check: Is user authenticated?│
│        Is bucket correct?    │
└──────────────────────────────┘
            │
      ┌─────┴─────┐
      │           │
    YES           NO
     │            │
     ▼            ▼
   ✅ ALLOW     ❌ DENY
```

### Policy 2: Table INSERT
```
┌──────────────────────────────┐
│ Insert into past_papers      │
│ uploaded_by = user.id        │
│ auth.uid() = user.id         │
└──────────────────────────────┘
            │
            ▼
┌──────────────────────────────┐
│ Check: Does auth.uid()       │
│ match uploaded_by field?     │
│ OR is user an admin?         │
└──────────────────────────────┘
            │
      ┌─────┴─────┐
      │           │
     YES           NO
      │            │
      ▼            ▼
    ✅ ALLOW     ❌ DENY
```

---

## 📊 Data Flow with RLS

### Upload Process Flow

```
Step 1: Frontend validates input
        ├─ User authenticated? ✅
        ├─ File selected? ✅
        └─ Form filled? ✅
                │
                ▼
Step 2: Upload file to storage
        ├─ Bucket: past-papers
        ├─ Auth check: authenticated ✅
        ├─ RLS policy: ALLOW ✅
        └─ File stored: uuid.pdf
                │
                ▼
Step 3: Insert record in database
        ├─ Table: past_papers
        ├─ Columns: uploaded_by, file_path, metadata
        ├─ Auth check: user.id matches uploaded_by ✅
        ├─ RLS policy: ALLOW ✅
        └─ Record created: id=123
                │
                ▼
Step 4: Success response
        ├─ Clear cache
        ├─ Show success message
        └─ Redirect user
```

---

## 🎯 Permission Matrix

### Who Can Do What?

| Action | Authenticated User | Owner | Admin | Public |
|--------|---|---|---|---|
| Upload file | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| View paper | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Edit own | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| Edit others | ❌ No | ❌ No | ✅ Yes | ❌ No |
| Delete own | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| Delete others | ❌ No | ❌ No | ✅ Yes | ❌ No |
| Download | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🔄 Policy Application Order

The RLS policies are evaluated in this order:

```
User Request
    │
    ▼
1. Authentication Check
   └─ Is user logged in? (for protected operations)
    │
    ▼
2. RLS Policy Evaluation
   ├─ Check all applicable policies
   ├─ If ANY policy ALLOWS → operation proceeds
   ├─ If NO policy allows → DENY
    │
    ▼
3. Operation Execution
   ├─ INSERT/UPDATE/DELETE executed
   ├─ Data returned
    │
    ▼
4. Response
   ├─ Success or error
```

---

## 📈 Scalability Considerations

### With RLS Policies
- ✅ Secure multi-tenant support
- ✅ User data isolation
- ✅ Admin management capabilities
- ✅ Audit trail support
- ⚠️ Slight performance overhead (negligible)

### Policy Optimization Tips
1. Index columns used in policies (`uploaded_by`)
2. Keep policy conditions simple
3. Avoid complex joins in policies
4. Cache policy results when possible

---

## 🔧 Configuration Checklist

- [x] Storage bucket `past-papers` created
- [x] Storage bucket policies configured
- [x] Table `past_papers` has RLS enabled
- [x] Table policies configured
- [x] Column `uploaded_by` exists and indexed
- [x] Profiles table has `role` column
- [x] Frontend passes user.id as `uploaded_by`
- [x] Backend enforces RLS

---

## 🎓 Learning Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security/policy-examples)

---

**Diagram Status:** ✅ Complete
**Last Updated:** 2025-12-10
**Version:** 1.0
