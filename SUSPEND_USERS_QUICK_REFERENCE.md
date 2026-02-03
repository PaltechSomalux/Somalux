# 📌 User Suspension System - Quick Reference Card

## One-Page Guide

### 🎯 What It Does
Lets admins suspend/unsuspend users who misuse the platform with one click.

### 📍 Where to Use It
`/books/admin` → Click "Users" in sidebar → Click "Suspend" button

### 🔴🟢 Button States
- **Red "Suspend"** = User is active, click to suspend
- **Green "Unsuspend"** = User is suspended, click to restore

---

## Quick Setup (Copy-Paste)

### Step 1: Database (Run in Supabase SQL Editor)
```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);
```

### Step 2: Code (Already Done ✅)
- Backend: `backend/index.js` - Line 818
- Frontend: `src/SomaLux/Books/Admin/api.js` - Line 1158
- Admin UI: `src/SomaLux/Books/Admin/pages/Users.jsx` - Multiple locations

### Step 3: Test
```
1. Go to /books/admin/users
2. Click red "Suspend" on any user
3. Click "Suspend" in dialog
4. See button turn green
5. Done!
```

---

## Common Tasks

### Suspend a User
```
1. Admin Panel → Users
2. Find user → Click "Suspend" (red)
3. Add optional reason
4. Click "Suspend"
✅ Done!
```

### Unsuspend a User
```
1. Admin Panel → Users  
2. Find user → Click "Unsuspend" (green)
3. Click "Unsuspend"
✅ Done!
```

### Check If User Is Suspended
```sql
SELECT is_suspended, suspended_reason, suspended_at 
FROM profiles 
WHERE email = 'user@example.com';
```

### View Suspension History
```sql
SELECT actor, action, details, created_at 
FROM audit_logs 
WHERE action IN ('suspend_user', 'unsuspend_user')
ORDER BY created_at DESC
LIMIT 10;
```

### Count Suspended Users
```sql
SELECT COUNT(*) FROM profiles WHERE is_suspended = true;
```

---

## API Reference (Developer)

### Suspend User
```javascript
await suspendUser(userId, true, "Violates ToS");
```

### Unsuspend User
```javascript
await suspendUser(userId, false);
```

### Raw API Call
```
PATCH /api/elib/users/{userId}/suspend
Content-Type: application/json

{
  "suspended": true,
  "reason": "Violates terms of service"
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Button not showing | Clear cache (Ctrl+Shift+Del), refresh page |
| API error | Check backend is running, network connectivity |
| Database error | Run SQL migration from `sql/ADD_SUSPEND_COLUMNS.sql` |
| State not updating | Hard refresh (Ctrl+F5), check browser console |

---

## Files Reference

### Documentation
- Quick Start: `SUSPEND_USERS_QUICKSTART.md`
- Full Docs: `SUSPEND_USERS_IMPLEMENTATION.md`
- Deployment: `SUSPEND_USERS_DEPLOYMENT_CHECKLIST.md`
- Architecture: `SUSPEND_USERS_ARCHITECTURE.md`

### Code
- Backend: `backend/index.js`
- Frontend: `src/SomaLux/Books/Admin/api.js`
- UI: `src/SomaLux/Books/Admin/pages/Users.jsx`
- Migration: `sql/ADD_SUSPEND_COLUMNS.sql`

---

## Keyboard Shortcuts (in Admin Panel)

```
/books/admin          = Admin dashboard
/books/admin/users    = Users page (where suspend feature is)
Ctrl+F5               = Hard refresh (if UI not updating)
F12                   = Developer console (for debugging)
```

---

## FAQ

**Q: Can I undo a suspension?**  
A: Yes! Click the green "Unsuspend" button.

**Q: Is suspension logged?**  
A: Yes! Check `audit_logs` table.

**Q: Can suspended users still login?**  
A: Currently yes. Add auth check to prevent it.

**Q: How do I know who suspended a user?**  
A: Check `audit_logs.actor` field.

**Q: Can I suspend admins?**  
A: Yes, but be careful! Admin-only permission controls.

**Q: Do suspended users get notified?**  
A: Not yet. Can add email notification.

---

## Checklists

### Pre-Deployment
- [ ] SQL migration ready to apply
- [ ] Code changes reviewed
- [ ] Documentation read

### Deployment
- [ ] Database migration applied
- [ ] Code deployed to production
- [ ] No errors in console
- [ ] Suspend button visible

### Post-Deployment
- [ ] Test suspend on test user
- [ ] Test unsuspend
- [ ] Verify database update
- [ ] Check audit logs
- [ ] Document process

---

## Contact & Support

### Quick Help
```
Docs: SUSPEND_USERS_INDEX.md
Code: backend/index.js, src/SomaLux/Books/Admin/*
```

### Full Documentation
See: `SUSPEND_USERS_IMPLEMENTATION.md`

### Deployment Help
See: `SUSPEND_USERS_DEPLOYMENT_CHECKLIST.md`

---

## Version Info

| Item | Value |
|------|-------|
| Feature | User Suspension |
| Status | ✅ Complete |
| Version | 1.0 |
| Ready | ✅ Yes |
| Breaking Changes | None |
| Deployment Risk | Low |

---

**Last Updated:** February 1, 2026  
**Next Review:** After deployment  
**Owner:** Admin Team  

🚀 Ready to deploy!
