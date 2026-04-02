# Remaining Errors - Diagnostic & Fixes

## Active Errors in Browser Console

### 1. **406 Not Acceptable - GET /messages**
**Error**: Multiple requests to fetch last message returning 406
```
GET https://wuwlnawtuhjoubfkdtgc.supabase.co/rest/v1/messages?select=*&conversation_id=eq.xxx&is_deleted=eq.false&order=created_at.desc&limit=1
406 (Not Acceptable)
```

**Root Cause**: The 406 error typically means:
- Supabase REST API cannot return response in acceptable format
- OR the query is hitting RLS policy that returns no rows (Supabase returns 406 instead of 200 with empty array)
- OR there's an Accept header mismatch

**Solution**: The RLS policy for messages is correctly checking if user is in the conversation. The issue might be:
1. User is not actually in the conversation (RLS denies access)
2. Query format is causing issues

**Recommended Fix**:
- Check that `conversations` table has proper records for user
- Check that `message_reads` are being created properly
- Verify user is actual participant in conversation

### 2. **400 Bad Request - POST /profiles**
**Error**: Multiple POST requests to create/update profiles returning 400
```
POST https://wuwlnawtuhjoubfkdtgc.supabase.co/rest/v1/profiles
400 (Bad Request)
```

**Root Cause**: Likely invalid data being posted to profiles table. Possible issues:
1. Required column not provided
2. Invalid data type
3. Column value violating constraints

**Who's Posting**: The `handle_new_user()` function is called manually now, so check if something else is trying to create profiles

**Recommended Fixes**:
1. Check browser Network tab for POST body details
2. Ensure `email` field is unique (constraints)
3. Verify `display_name` is being properly set

### 3. **500 Internal Server Error - GET /group_members**
**Error**: Query with malformed syntax returning 500
```
GET https://wuwlnawtuhjoubfkdtgc.supabase.co/rest/v1/group_members?select=group_id&user_id=eq.xxx
500 (Internal Server Error)
```

**Root Cause**: The query `select=group_id&user_id=eq.xxx` is malformed. It's mixing:
- `select=group_id` (column selection)
- `user_id=eq.xxx` (this isn't proper Supabase syntax)

**Location**: Line 39 in `src/supabase.js`

**Fix**: The query should be:
```javascript
.select('group_id, groups(*)')
.eq('user_id', userId)
```

### 4. **409 Conflict - POST /user_chat_settings**
**Error**: Upsert with on_conflict failing
```
POST https://wuwlnawtuhjoubfkdtgc.supabase.co/rest/v1/user_chat_settings?on_conflict=user_id%2Cconversation_id&select=*
409 (Conflict)
```

**Root Cause**: The `on_conflict` parameter format might be incorrect. Modern Supabase expects `.upsert()` method instead.

**Recommended Fix**: Use proper upsert syntax instead of query parameters

---

## Priority Fixes (In Order)

### **CRITICAL - Fix Invalid Profiles POSTs**
Check Network tab → find POST to profiles → see what data is being sent  
Most likely: Trying to create profile with invalid/missing fields

### **HIGH - Fix 406 Messages (RLS Issue)**
The RLS policy is checking if user is in conversation. Possible issues:
1. Conversation record missing
2. User IDs don't match
3. RLS policy too restrictive

Consider adding simpler debug query:
```sql
-- Test if user can read conversations
SELECT * FROM conversations WHERE user1_id = auth.uid() OR user2_id = auth.uid();

-- Test if user can read messages from those conversations
SELECT * FROM messages WHERE conversation_id IN (
  SELECT id FROM conversations WHERE user1_id = auth.uid() OR user2_id = auth.uid()
);
```

### **HIGH - Fix Malformed group_members Query**
In `src/supabase.js` line 39, change:
```javascript
// WRONG:
.from('group_members')
.select('group_id, groups(*)')
.eq('user_id', userId);

// Proper format should have all params in correct order
```

---

## Next Steps

1. **Open browser DevTools → Network tab**
2. **Find failing POST to /profiles**
3. **Click on request → Request body**
4. **Share what fields are being sent**

This will tell us exactly what invalid data is being posted.

---

## Quick Debug Queries to Run in Supabase

```sql
-- Check if RLS is too restrictive for current user
SELECT current_user, auth.uid();

-- Check conversations visible to current user
SELECT id, user1_id, user2_id FROM conversations 
WHERE user1_id = auth.uid() OR user2_id = auth.uid()
LIMIT 5;

-- Check messages visible (should match conversations above)
SELECT m.id, m.conversation_id, m.sender_id 
FROM messages m
WHERE EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = m.conversation_id
  AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
)
LIMIT 5;

-- Check user_chat_settings exist
SELECT user_id, conversation_id FROM user_chat_settings
WHERE user_id = auth.uid()
LIMIT 5;
```

Run these queries in Supabase SQL editor to verify data exists and RLS isn't blocking access.
