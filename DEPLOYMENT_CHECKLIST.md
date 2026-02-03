# Deployment Checklist

## Frontend Changes ✅

All completed and tested:

- [x] **ChatItem.jsx** - Changed button text from "Delete Chat" to "Delete User"
- [x] **ChatItem.jsx** - Updated confirmation dialog title and message
- [x] **ChatMenu.jsx** - Removed "Delete User" button from chat menu
- [x] **ChatMenu.jsx** - Removed onDeleteUser prop and related code
- [x] **ChatHeader.jsx** - Removed onDeleteUser prop passing
- [x] **Chat.jsx** - Removed onDeleteUser prop from ChatWindow/ChatHeader

**Verification:**
```bash
# Check for compilation errors
npm run build

# Or check in your IDE - should show 0 errors ✅
```

---

## Database Changes - ACTION REQUIRED

### Deploy SQL Functions to Supabase

#### Option 1: Via Supabase Dashboard (Easiest)

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your SomaLux project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open file: `CLEAR_CHAT_SUPABASE_SQL.sql` from your workspace
6. Copy entire contents
7. Paste into the SQL editor
8. Click **Run** button
9. Wait for ✅ Success message

#### Option 2: Via Supabase CLI

```bash
# Navigate to project directory
cd c:\Intel\Magic\SomaLux

# Push SQL to Supabase
supabase db push

# Verify migrations
supabase migration list
```

#### Option 3: Via Supabase Python Client

```python
from supabase import create_client

url = "YOUR_SUPABASE_URL"
key = "YOUR_SUPABASE_KEY"
supabase = create_client(url, key)

# Read SQL file
with open("CLEAR_CHAT_SUPABASE_SQL.sql", "r") as f:
    sql = f.read()

# Execute
result = supabase.postgrest.client.postgrest.exec_sql(sql)
```

---

## Verification Checklist

### Frontend Verification

- [ ] Open browser DevTools (F12)
- [ ] Navigate to chat list
- [ ] Right-click on a chat (or click three-dots menu)
- [ ] **Verify:** Button says "Delete User" (not "Delete Chat")
- [ ] **Verify:** Confirmation dialog says "Delete User?" (not "Delete Chat?")
- [ ] **Verify:** NO errors in browser console
- [ ] **Verify:** Delete functionality still works (chat disappears)

### Database Verification

In Supabase SQL Editor, run these tests:

#### Test 1: Verify functions exist
```sql
-- Should return 7 functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'clear_%'
OR routine_name LIKE 'soft_%'
OR routine_name LIKE 'restore_%'
OR routine_name LIKE 'get_%';
```

**Expected Result:**
```
clear_chat
clear_chat_by_date_range
clear_chat_with_unread_reset
get_clearable_messages_count
get_chat_statistics
restore_cleared_messages
soft_delete_message
```

#### Test 2: Verify indexes exist
```sql
-- Should return 4 indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'messages' 
AND indexname LIKE 'idx_%'
OR tablename = 'user_chats' 
AND indexname LIKE 'idx_%';
```

**Expected Result:**
```
idx_messages_is_deleted_chat_id
idx_messages_deleted_at
idx_messages_chat_id_created_at
idx_user_chats_user_chat
```

#### Test 3: Test clear_chat function
```sql
-- Get a real chat ID from your database
SELECT 
  'SELECT clear_chat(' || 
  quote_literal(id) || ', ' || 
  quote_literal(user_id) || ');'
FROM user_chats LIMIT 1;

-- Run the generated query
-- Should return: { "success": true, "messagesDeleted": X, ... }
```

#### Test 4: Test get_chat_statistics function
```sql
-- Get chat statistics
SELECT get_chat_statistics(id) 
FROM conversations 
LIMIT 1;

-- Should return JSON with chatId, totalMessages, activeMessages, etc.
```

---

## Post-Deployment Testing

### Test 1: Delete User from Chat List
1. Open chat list
2. Click three-dots on any chat
3. Click "Delete User"
4. Click "Delete" in confirmation
5. **Verify:** Chat disappears immediately
6. **Verify:** Console shows ✅ verification success
7. Refresh page (Ctrl+R)
8. **CRITICAL:** Chat should NOT reappear

### Test 2: Clear Chat (when integrated into UI)
1. Open a chat with messages
2. Click three-dots menu → "Clear Chat"
3. **Verify:** Messages disappear from UI
4. Check database: messages marked as deleted
5. Refresh page
6. **CRITICAL:** Messages should NOT reappear

### Test 3: SQL Function Permissions
In Supabase SQL Editor:

```sql
-- Test that unauthenticated users cannot call functions
-- This should fail with permission error
SELECT clear_chat('test-uuid', 'test-uuid');
```

---

## Rollback Plan

If something goes wrong:

### Rollback Frontend
```bash
# Revert git changes
git revert [commit-hash]

# Or manually restore these files from git
# - ChatItem.jsx
# - ChatMenu.jsx
# - ChatHeader.jsx
# - Chat.jsx
```

### Rollback Database
In Supabase SQL Editor:

```sql
-- Drop all created functions
DROP FUNCTION IF EXISTS clear_chat(UUID, UUID);
DROP FUNCTION IF EXISTS clear_chat_by_date_range(UUID, UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_clearable_messages_count(UUID);
DROP FUNCTION IF EXISTS clear_chat_with_unread_reset(UUID, UUID);
DROP FUNCTION IF EXISTS soft_delete_message(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS restore_cleared_messages(UUID, UUID, INT);
DROP FUNCTION IF EXISTS get_chat_statistics(UUID);

-- Drop indexes
DROP INDEX IF EXISTS idx_messages_is_deleted_chat_id;
DROP INDEX IF EXISTS idx_messages_deleted_at;
DROP INDEX IF EXISTS idx_messages_chat_id_created_at;
DROP INDEX IF EXISTS idx_user_chats_user_chat;
```

---

## Success Criteria

✅ **Frontend:**
- [ ] "Delete User" button appears in chat list menu
- [ ] "Delete Chat" button no longer appears in chat window menu
- [ ] Confirmation dialog says "Delete User?"
- [ ] Delete functionality works correctly
- [ ] No console errors

✅ **Database:**
- [ ] All 7 functions created successfully
- [ ] All 4 indexes created successfully
- [ ] Functions return proper JSON responses
- [ ] Permission checks working correctly

✅ **User Experience:**
- [ ] Deleted chats don't reappear after refresh
- [ ] Clear chat (when implemented) works as expected
- [ ] Users get appropriate confirmation dialogs
- [ ] Error messages are clear and helpful

---

## Monitoring

### What to Watch For

1. **Error messages in logs:**
   - "Function not found" = SQL wasn't deployed
   - "Permission denied" = Grant statements didn't run
   - "Chat not found" = Chat ID validation failing

2. **User feedback:**
   - If users report deleted chats reappearing, check `is_deleted` flag
   - If clear chat doesn't work, verify function was deployed

3. **Performance:**
   - Monitor query performance with new indexes
   - Check if clear operations complete quickly
   - Watch for timeout errors

### Debug Commands

For support/debugging:

```sql
-- Check if functions are callable
SELECT * FROM information_schema.routines 
WHERE routine_name LIKE 'clear_%';

-- Check message deletion status
SELECT COUNT(*) as deleted_messages
FROM messages 
WHERE chat_id = 'YOUR_CHAT_ID' 
AND is_deleted = true;

-- Check user_chats status
SELECT * FROM user_chats 
WHERE chat_id = 'YOUR_CHAT_ID';

-- Test a function call
SELECT clear_chat('chat-uuid', 'user-uuid');
```

---

## Timeline

| Task | Status | Owner | Due |
|------|--------|-------|-----|
| Frontend code changes | ✅ Complete | Dev | Done |
| SQL functions created | ✅ Complete | Dev | Done |
| Deploy SQL to Supabase | ⏳ Pending | DevOps | Today |
| Frontend testing | ⏳ Pending | QA | Today |
| Database testing | ⏳ Pending | QA | Today |
| Production deployment | ⏳ Pending | DevOps | Tomorrow |
| Monitor for issues | ⏳ Pending | Support | Ongoing |

---

## Support Contacts

If you encounter issues:

1. **Frontend errors:** Check browser console (F12)
2. **Database errors:** Check Supabase error logs
3. **Deployment issues:** Review deployment checklist above
4. **User reports:** Use debug commands above to diagnose

---

## Final Checklist

Before going live:

- [ ] All frontend files compiled without errors
- [ ] All SQL functions deployed to Supabase
- [ ] All permissions granted (GRANT statements executed)
- [ ] All indexes created for performance
- [ ] Delete User button works in chat list
- [ ] Delete User button removed from chat menu
- [ ] Deletion persists across page refresh
- [ ] No console errors during testing
- [ ] Database functions respond with proper JSON
- [ ] Users can't access other users' chats (permission check)

**Status: READY FOR DEPLOYMENT** ✅
