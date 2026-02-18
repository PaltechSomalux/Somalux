# API Errors Fix Summary

## Issues Fixed

### ✅ FIXED: book_comments & book_replies 400 Errors

**Problem:** Foreign key join syntax was incorrect in Supabase PostgREST queries

**Location:** [src/SomaLux/Books/BookPanel.jsx](src/SomaLux/Books/BookPanel.jsx)

**Changes Made:**
- Line 1313: Changed `profiles:user_id(...)` → `profiles!user_id(...)`
- Line 1318: Changed `profiles:user_id(...)` → `profiles!user_id(...)`
- Line 1423: Changed `profiles:user_id(...)` → `profiles!user_id(...)`

**Correct Syntax:**
```javascript
// ❌ WRONG (causes 400 error)
.select('*, profiles:user_id(full_name, display_name, email)')

// ✅ CORRECT (uses exclamation mark)
.select('*, profiles!user_id(full_name, display_name, email)')
```

---

## Remaining Issues to Investigate

### 1. conversations 406 Error
**Error:** `GET /conversations?select=*&user1_id=eq.XXX&user2_id=eq.YYY 406 (Not Acceptable)`

**Possible Causes:**
- RLS (Row Level Security) policy blocking the query
- Foreign key constraint issue
- User not authenticated or doesn't have permission

**Action Required:**
- Check RLS policies on `conversations` table
- Verify user has permission to query conversations where they are user1_id or user2_id
- Check if both users exist in `profiles` table

### 2. messages 400 Error
**Error:** `GET /messages?select=...&chat_id=eq.XXX 400 (Bad Request)`

**Possible Causes:**
- Table/column naming mismatch
- RLS policy too restrictive
- Missing `is_deleted` column
- Invalid filter syntax

**Action Required:**
- Verify `messages` table has all required columns: `chat_id`, `is_deleted`, `text`, `content`, `message`, `created_at`, `sender_id`
- Check RLS policies allow user to read messages from conversations they're part of
- Run database schema verification

---

## Recommended Next Steps

1. **Clear Browser Cache:** Hard refresh with Ctrl+Shift+R
2. **Restart Development Server:** Rebuild the app to pick up changes
3. **Check Database State:**
   ```sql
   -- Verify tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name IN ('book_comments', 'messages', 'conversations');
   
   -- Check RLS Policies
   SELECT schemaname, tablename, policyname FROM pg_policies 
   WHERE schemaname = 'public';
   ```

4. **Check Network Tab:** Monitor actual API calls for exact error messages

---

## Test After Fix

After changes deploy:
1. Open user profile dropdown
2. Trigger sign out - modal should appear
3. Check browser console for any remaining errors
4. Verify book comments/replies load without 400 errors

