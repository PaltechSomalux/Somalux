# Quick Fix: Universities RLS Error

## 🚨 The Error
```
Failed to upload cover to bucket 'university-covers': 
new row violates row-level security policy
```

## ⚡ 2-Minute Fix

### Option 1: Automated (Easiest)
```bash
cd backend
node apply-universities-rls-fix.js
```

### Option 2: Manual (2 minutes)
1. Open `UNIVERSITIES_RLS_FIX_GUIDE.md`
2. Copy the SQL from Step 1 and Step 2
3. Go to Supabase Dashboard → SQL Editor
4. Paste and execute
5. Done!

---

## 📋 What the Fix Does

| Component | Before | After |
|-----------|--------|-------|
| Table RLS | ❌ No policies | ✅ 4 policies configured |
| Storage RLS | ❌ No policies | ✅ 3 policies configured |
| Upload capability | ❌ Blocked | ✅ Allowed |
| Read capability | ❌ Blocked | ✅ Allowed |
| Delete capability | ❌ Blocked | ✅ Allowed for owners |

---

## 🔐 Security

- ✅ Users can only upload their own universities
- ✅ Admins can manage all universities
- ✅ Public can view all universities
- ✅ Users can only delete their own universities

---

## 📍 Files

- **Migration SQL**: `backend/migrations/009_fix_universities_rls.sql`
- **Automated Script**: `backend/apply-universities-rls-fix.js`
- **Full Guide**: `UNIVERSITIES_RLS_FIX_GUIDE.md`

---

## ✅ After the Fix

Users can now:
- Upload universities with cover images
- View all universities
- Edit/delete their own universities
- Admins manage all universities
