# User Suspension System - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Apply Database Migration
```sql
-- Open Supabase SQL Editor and run:
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);
```

### 2. That's it! ✅
The code changes are already in place:
- Backend API: `backend/index.js`
- Frontend API: `src/SomaLux/Books/Admin/api.js`
- Admin UI: `src/SomaLux/Books/Admin/pages/Users.jsx`

## 📋 Using the Suspend Feature

### To Suspend a User:
1. Go to `/books/admin`
2. Click "Users" in sidebar
3. Find user → Click red **"Suspend"** button
4. Add optional reason
5. Click "Suspend" to confirm

### To Unsuspend a User:
1. Find user → Click green **"Unsuspend"** button
2. Click "Unsuspend" to confirm

## 🎯 What Happens When You Suspend

- ✅ User status changes to suspended
- ✅ Suspension reason is recorded
- ✅ Action logged in audit trail
- ✅ Admin dashboard is notified
- ⚠️ User can still login (see optional enhancements)

## 📊 Database Fields Added

| Column | Type | Purpose |
|--------|------|---------|
| `is_suspended` | BOOLEAN | Whether user is suspended |
| `suspended_reason` | TEXT | Why they were suspended |
| `suspended_at` | TIMESTAMP | When they were suspended |

## 🔧 Code Files

**Backend (46 lines added):**
- `backend/index.js` - Suspend endpoint

**Frontend (22 lines added):**
- `src/SomaLux/Books/Admin/api.js` - API function

**Admin UI (60 lines added):**
- `src/SomaLux/Books/Admin/pages/Users.jsx` - Suspend button + dialog

**Database (15 lines):**
- `sql/ADD_SUSPEND_COLUMNS.sql` - Migration

## ✨ Features

- 🔴 Red button to suspend active users
- 🟢 Green button to unsuspend restricted users
- 📝 Optional reason field for documentation
- ✅ Confirmation dialog to prevent accidents
- 📊 Audit trail for compliance
- 🔐 Admin-only access

## 🧪 Testing

```javascript
// Test suspending a user
await suspendUser(userId, true, 'Violates ToS');

// Test unsuspending
await suspendUser(userId, false);
```

## ❓ FAQ

**Q: Can superadmins suspend themselves?**
A: The button appears for all users, but you should be careful!

**Q: What happens when a user is suspended?**
A: Currently just marks them as suspended. You can add extra checks in auth flow.

**Q: Can I see why a user was suspended?**
A: Yes, see the `suspended_reason` column and check `audit_logs` table.

**Q: Can the suspension be reversed?**
A: Yes! Click the green "Unsuspend" button anytime.

---

**Status:** ✅ Ready to use  
**Deploy Time:** < 5 minutes (just run SQL)  
**Files Changed:** 4 files  
**Breaking Changes:** None
