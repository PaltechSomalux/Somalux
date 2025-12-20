# Quick Reference: RLS Error Fix

## 🚨 The Error
```
Failed to upload file to bucket 'past-papers': new row violates row-level security policy
```

## ⚡ Quick Fix (2 minutes)

### Step 1: Copy SQL
Open `RLS_POLICY_FIX_GUIDE.md` and copy the SQL section

### Step 2: Execute SQL
Go to Supabase Dashboard → SQL Editor → Paste & Execute

### Step 3: Done!
Try uploading a past paper - it should work now

---

## 📋 What the Fix Does

| Entity | Issue | Solution |
|--------|-------|----------|
| past_papers table | No INSERT policy | Allow users to insert their own papers |
| past-papers bucket | No upload policy | Allow authenticated users to upload |
| past_papers table | No SELECT policy | Allow public reading |
| past_papers table | No DELETE policy | Allow owners to delete |

---

## ✅ Verification

After applying:
1. Login to app
2. Go to PastPapers section
3. Click "Share a Past Paper"
4. Upload a PDF
5. Should succeed ✅

---

## 📁 Files Created

- `backend/migrations/008_fix_past_papers_rls.sql` - SQL migration
- `backend/apply-rls-fix.js` - Automated fix script
- `RLS_POLICY_FIX_GUIDE.md` - Step-by-step guide
- `TROUBLESHOOTING_RLS_ERROR.md` - Troubleshooting guide
- `RLS_FIX_SUMMARY.md` - Detailed summary
- `RLS_QUICK_REFERENCE.md` - This file

---

## 🔑 Key Policies

### Table Policy (past_papers)
```sql
CREATE POLICY "Allow users to insert their own past papers"
ON past_papers
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);
```

### Bucket Policy (past-papers)
```sql
CREATE POLICY "Allow authenticated users to upload past papers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'past-papers' AND
  auth.role() = 'authenticated'
);
```

---

## 🎯 Next Steps

1. **Apply the fix** → Run SQL from `RLS_POLICY_FIX_GUIDE.md`
2. **Test** → Upload a past paper
3. **Verify** → Check that upload succeeds
4. **Document** → Note in your project that RLS is configured

---

## ❓ Still Having Issues?

Check `TROUBLESHOOTING_RLS_ERROR.md` for:
- Common issues and solutions
- Testing procedures
- Schema validation
- Security considerations

---

## 📞 Support Resources

- Supabase [RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- Supabase [Storage Access Control](https://supabase.com/docs/guides/storage/access-control)
- Check migration file: `backend/migrations/008_fix_past_papers_rls.sql`

---

**Time to fix:** ⏱️ 2-5 minutes
**Difficulty:** 🟢 Easy
**Risk:** 🟢 Low
