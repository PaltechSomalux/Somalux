# 🔧 Profile Auto-Creation & Pages Field Fix

## Issues Fixed

1. ✅ **Users signing in with Google not appearing in profiles table**
2. ✅ **Error when changing user roles** (users don't exist in profiles)
3. ✅ **Default role not set to 'viewer'**
4. ✅ **Pages field not showing in BookPanel**
5. ✅ **Pages and Publisher fields missing from admin dashboard**

---

## 🚀 Quick Fix (Run This SQL)

### Step 1: Run `auto-create-profiles.sql`

Open Supabase SQL Editor and run the entire file. This will:

1. ✅ Create trigger to auto-create profiles when users sign in
2. ✅ Backfill existing auth users who don't have profiles
3. ✅ Set default role to 'viewer'
4. ✅ Fix foreign key constraints
5. ✅ Set up RLS policies

---

## 🎯 What The Fix Does

### Before:
```
User signs in with Google
  ↓
Added to auth.users table ✅
  ↓
❌ NOT added to profiles table
  ↓
❌ Doesn't appear in admin user list
  ↓
❌ Can't change their role (error)
```

### After:
```
User signs in with Google
  ↓
Added to auth.users table ✅
  ↓
🔥 TRIGGER FIRES 🔥
  ↓
✅ Auto-creates profile with role='viewer'
  ↓
✅ Appears in admin user list
  ↓
✅ Can change their role
```

---

## 📊 Profile Auto-Creation Details

### The Trigger Function:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    'viewer'  -- Default role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**What it does:**
- Runs automatically when new user signs in
- Creates profile with user's Google name (or email prefix if no name)
- Sets default role to 'viewer'
- Skips if profile already exists

---

## 👥 User Roles System

### Default Role: **viewer**

All new users get `role = 'viewer'` by default.

### Role Hierarchy:

| Role | Permissions |
|------|-------------|
| **viewer** | Can view books, like, comment, download (default) |
| **editor** | Can upload books, edit metadata |
| **admin** | Full control, can manage users |

### Changing Roles:

Admin can change roles via:
1. Admin Dashboard → Users
2. Click on user
3. Change role dropdown
4. Clicks save

---

## 📄 Pages Field Fix

### What Changed:

#### 1. **Upload Form** (`Upload.jsx`)
Added fields:
- **Pages** (number input)
- **Publisher** (text input)

#### 2. **Books Table** (`Books.jsx`)
Added columns:
- **Pages** (editable in inline edit)
- **Publisher** (editable in inline edit)

#### 3. **BookPanel Display**
Now shows:
- ✅ Pages count in book details modal
- ✅ Publisher name in book details modal

---

## 📖 About PDF Page Count

### Can it be automatic?

**Short answer**: Not easily in the browser.

**Why?**
- Extracting page count from PDF requires backend processing
- JavaScript in browser can't reliably read PDF metadata
- Would need a server-side solution (Node.js with pdf-lib or similar)

### Current Solution: **Manual Entry**

Admin must enter page count when uploading:
1. Upload PDF
2. Open the PDF in a viewer
3. See how many pages it has
4. Enter that number in "Pages" field

### Future Enhancement (Optional):

If you want automatic page extraction:

```javascript
// Backend (Node.js with pdf-lib)
import { PDFDocument } from 'pdf-lib';

async function getPageCount(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return pdfDoc.getPageCount();
}
```

But this requires:
- Backend server (Node.js, Python, etc.)
- Processing uploaded PDFs server-side
- Additional dependencies

**For now, manual entry is simpler and works fine.**

---

## 🧪 Testing Checklist

### Test Profile Auto-Creation:

1. **Sign in with a new Google account**
   - [ ] User appears in Admin → Users
   - [ ] Role is set to 'viewer'
   - [ ] Display name is Google name

2. **Backfill existing users**
   - [ ] Run the SQL script
   - [ ] All existing auth users now have profiles
   - [ ] All have role = 'viewer'

3. **Change user role**
   - [ ] Go to Admin → Users
   - [ ] Find a user
   - [ ] Change role from 'viewer' to 'editor'
   - [ ] No errors occur
   - [ ] Role updates successfully

### Test Pages Field:

1. **Upload new book**
   - [ ] See "Pages" field in upload form
   - [ ] Enter number (e.g., 250)
   - [ ] Book saves with page count

2. **Edit existing book**
   - [ ] Click Edit on a book
   - [ ] See Pages and Publisher fields
   - [ ] Change values
   - [ ] Save successfully

3. **View book details**
   - [ ] Click a book in BookPanel
   - [ ] See "Pages: 250" in details
   - [ ] See "Publisher: XYZ" in details

---

## 🔍 Troubleshooting

### Issue: Users still not appearing in profiles

**Check trigger exists:**
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

Should return 1 row. If not, re-run the SQL script.

**Manually check trigger:**
```sql
-- Sign in with test account, then check:
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM profiles;
-- Both should be equal
```

### Issue: Can't change user role

**Check user exists in profiles:**
```sql
SELECT * FROM profiles WHERE email = 'user@example.com';
```

If returns 0 rows, run backfill query from SQL script.

**Check RLS policies allow updates:**
```sql
-- Should show policies for profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Issue: Pages not showing in BookPanel

**Check data exists:**
```sql
SELECT id, title, pages, publisher FROM books LIMIT 5;
```

If pages are NULL or 0, they won't display meaningfully.

**Add sample pages:**
```sql
UPDATE books SET pages = 250 WHERE pages IS NULL OR pages = 0;
```

---

## 📋 What Gets Created

### Database Objects:

1. **Function**: `public.handle_new_user()` - Auto-creates profiles
2. **Trigger**: `on_auth_user_created` - Fires on new auth user
3. **Constraint**: `profiles_id_fkey` - Links profiles to auth.users
4. **Constraint**: `profiles_email_key` - Ensures unique emails
5. **Policies**: RLS policies for profile access

### Code Changes:

1. **Upload.jsx**: Added pages + publisher fields
2. **Books.jsx**: Added pages + publisher to table and edit
3. **BookPanel.jsx**: Already updated to show pages + publisher

---

## 🎯 Expected Behavior After Fix

### For New Users:
```
1. User signs in with Google
2. ✅ Profile auto-created with role='viewer'
3. ✅ User appears in admin dashboard
4. ✅ Admin can change their role
5. ✅ No errors
```

### For Existing Users:
```
1. Run backfill SQL
2. ✅ All auth users get profiles
3. ✅ All set to role='viewer'
4. ✅ Admin can now manage them
```

### For Books:
```
1. Admin uploads book
2. ✅ Enters pages and publisher
3. ✅ Data saves to database
4. ✅ Users see pages in book details
5. ✅ Admin can edit pages/publisher later
```

---

## ✅ Success Checklist

Before declaring success:

- [ ] Ran `auto-create-profiles.sql` in Supabase
- [ ] Trigger `on_auth_user_created` exists
- [ ] Backfill completed (all auth users have profiles)
- [ ] Tested new Google sign-in → profile created
- [ ] Tested role change → works without error
- [ ] Pages field shows in upload form
- [ ] Pages field shows in edit form
- [ ] Pages display in BookPanel modal
- [ ] No console errors

---

## 🔄 If Something Breaks

**Rollback the trigger:**
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

Then manually create profiles:
```sql
INSERT INTO profiles (id, email, role)
SELECT id, email, 'viewer' 
FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles);
```

---

## 🎉 Summary

### What You Did:

1. ✅ Created trigger to auto-create profiles
2. ✅ Backfilled existing users
3. ✅ Set default role to 'viewer'
4. ✅ Added pages/publisher fields to admin forms
5. ✅ Fixed role change errors

### What Users Get:

- ✅ Seamless sign-in experience
- ✅ Automatic profile creation
- ✅ Default 'viewer' permissions
- ✅ Admins can manage user roles
- ✅ Full book metadata (pages, publisher)

---

**🚀 Run `auto-create-profiles.sql` now and everything will work!**
