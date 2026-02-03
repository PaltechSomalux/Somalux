# Delete Functionality Testing Guide

## Quick Test Checklist

### Test 1: Delete Chat from List (Delete from ChatItem)
- [ ] Open chat list (ChatMe.jsx)
- [ ] Right-click or click options menu on a chat
- [ ] Click "Delete"
- [ ] Confirm deletion when prompted
- [ ] **Verify:** Chat disappears immediately from list
- [ ] **Open Browser Console (F12)** and check for:
  - ✅ "🗑️ ChatItem: handleConfirmDelete triggered"
  - ✅ "✅ ChatMe: Chat marked as deleted in database"
  - ✅ "✅ ChatMe: Removed from local state. Remaining: X"
  - ✅ "🔄 ChatMe: Force-refreshing chat list to verify deletion persisted..."
  - ✅ "✅ Delete verification PASSED - chat is gone from database"
- [ ] **Refresh the page** (Ctrl+R or Cmd+R)
- [ ] **Critical:** Deleted chat should NOT reappear

### Test 2: Delete User from Chat Menu (Delete User while viewing chat)
- [ ] Open a chat window
- [ ] Click the user menu (three dots) in chat header
- [ ] Click "Delete User"
- [ ] Confirm deletion when prompted
- [ ] **Verify:** Chat window closes and returns to chat list
- [ ] **Open Browser Console** and check for:
  - ✅ "🗑️ handleDeleteUser called!"
  - ✅ "✅ Chat marked as deleted in database"
  - ✅ "✅ Delete verified - is_deleted is true"
- [ ] **Refresh the page**
- [ ] **Critical:** Deleted chat should NOT appear in list

### Test 3: Database Verification
After deleting a chat, run this SQL in Supabase:

```sql
-- Check if the deleted chat has is_deleted = true
SELECT id, user_id, chat_id, is_deleted, updated_at 
FROM user_chats 
WHERE is_deleted = true 
ORDER BY updated_at DESC 
LIMIT 10;
```

**Expected Result:** Should see your deleted chat with `is_deleted = true` and recent `updated_at` timestamp

### Test 4: Verify Filtering Works
- [ ] Delete a chat
- [ ] Open browser console and run:
```javascript
// Manually fetch and check if deleted chat is filtered
const { SupabaseChatService } = window;
SupabaseChatService.fetchUserChats('YOUR_USER_ID').then(chats => {
  console.log('Active chats:', chats.length);
  console.log('Chat IDs:', chats.map(c => c.id));
});
```
- [ ] **Verify:** Deleted chat ID should NOT appear in the list

## Expected Console Output Sequence

### Successful Deletion Sequence
```
🗑️ ChatItem: Delete button clicked {chat}
🗑️ ChatItem: handleConfirmDelete triggered
🗑️ ChatItem: Will delete with chatId: <uuid>
✅ ChatItem: Calling onDelete with: <uuid>
🗑️ ChatMe: Starting delete for: {chatId, currentUserId}
🗑️ ChatMe: Chat to delete: {id, chat_id, name}
🗑️ ChatMe: Calling SupabaseChatService.deleteChat with: {userId, chatId}
🗑️ deleteChat: Normalized ID: {originalId, normalizedId}
🗑️ deleteChat: Updating user_chats with: {user_id, chat_id, original_conversationId}
✅ deleteChat: Chat deleted successfully {userId, chatId, resultData, is_deleted}
✅ deleteChat VERIFICATION: is_deleted confirmed as true
✅ ChatMe: Chat marked as deleted in database: {is_deleted: true}
✅ ChatMe: Delete verified - is_deleted is true
✅ ChatMe: Removed from local state. Remaining: X
✅ ChatMe: Clearing selected chat
🔄 ChatMe: Force-refreshing chat list to verify deletion persisted...
📊 Filtered out X deleted chats from Y total
✅ ChatMe: Refreshed chat list. Found X chats (was Y)
✅ ChatMe: Delete verification PASSED - chat is gone from database
✅ ChatMe: Chat deleted successfully: <uuid>
```

### Error Scenarios

#### Error 1: Database Update Failed
```
❌ deleteChat: Failed to update chat: {error, code, details, hint}
```
**Action:** Check database schema, permissions, or Supabase status

#### Error 2: Chat Not Found in Database
```
🗑️ deleteChat: Chat entry not found for user {userId, chatId}
🗑️ deleteChat: Created user_chats entry as deleted
```
**Status:** OK - New entry was created with is_deleted=true

#### Error 3: Verification Failed
```
❌ deleteChat VERIFICATION FAILED: is_deleted is still false!
❌ Delete verification FAILED - chat still exists in database!
❌ Error: Failed to delete chat. Please try again or contact support.
```
**Action:** Delete failed - try again or check database permissions

## Browser Console Commands

### Enable Maximum Logging
```javascript
// Set to see ALL chat-related operations
localStorage.setItem('DEBUG_CHAT_OPERATIONS', 'true');
```

### Test Delete Directly
```javascript
// Manually trigger delete (requires variables to be set)
const userId = 'YOUR_USER_ID';
const chatId = 'CHAT_ID_TO_DELETE';
SupabaseChatService.deleteChat(userId, chatId).then(result => {
  console.log('Delete result:', result);
});
```

### Verify Chat Exists
```javascript
// Check if a chat still exists in the database
const { SupabaseChatService } = window;
const userId = 'YOUR_USER_ID';
SupabaseChatService.fetchUserChats(userId).then(chats => {
  const chatToFind = chats.find(c => c.chat_id === 'CHAT_ID_TO_CHECK');
  if (chatToFind) {
    console.log('❌ Chat still exists:', chatToFind);
  } else {
    console.log('✅ Chat deleted successfully');
  }
});
```

## Clear Chat Testing

### Test Clear Chat Messages
- [ ] Open a chat with messages
- [ ] Click options menu (three dots)
- [ ] Click "Clear Chat" (if available)
- [ ] Confirm action when prompted
- [ ] **Verify:** All messages disappear from the UI
- [ ] **Open Browser Console** and check for:
  - ✅ "useChatActions.js: clearChat: Starting"
  - ✅ "useChatActions.js: clearChat: Messages fetched"
  - ✅ "useChatActions.js: clearChat: Updated all messages"
- [ ] **Refresh the page**
- [ ] **Important:** Messages should NOT reappear

### Clear Chat Database Check
```sql
-- Check if messages were marked as deleted
SELECT id, content, deleted_at, is_deleted, created_at 
FROM messages 
WHERE chat_id = '<chat-id>' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected Result:** Messages should have `deleted_at` timestamp set

## Troubleshooting Guide

### Problem: Deleted chat reappears after refresh
1. Check console for "❌ deleteChat VERIFICATION FAILED"
2. Verify user has UPDATE permissions on user_chats table
3. Check if chat_id format matches between tables
4. Run SQL to manually check is_deleted flag is set

### Problem: Delete button doesn't work
1. Check console for "❌ ChatItem: onDelete is not a function"
2. Verify ChatItem is receiving onDelete prop from ChatMe
3. Check ChatMe is receiving onDelete prop from parent
4. Look for prop-passing chain errors

### Problem: Messages don't clear
1. Check console for "useChatActions.js: clearChat" errors
2. Verify chat_id (not conversation_id) is being used
3. Check messages table has is_deleted column
4. Verify UPDATE permissions on messages table

### Problem: Database shows is_deleted=false after deletion
1. Normalization issue: Check if chat_id is being normalized differently in different queries
2. Foreign key issue: Verify conversation_id exists in conversations table
3. Update issue: Check Supabase query logs for update failures
4. Timing issue: Add longer delay (increase 500ms timeout) before verification

## Performance Notes

- First delete refresh happens after 500ms (allows database to finalize)
- Chat list polling happens every 5 seconds (defined in subscribeToUserChats)
- With force refresh, deleted chats should be gone within 1 second
- If using multiple tabs, refresh may take up to 5 seconds to sync

## Success Criteria

✅ **Delete is Persistent if:**
1. Chat disappears immediately from UI after delete
2. Console shows "✅ Delete verification PASSED"
3. Chat does NOT reappear after page refresh
4. SQL query shows is_deleted=true in user_chats table

❌ **Delete Failed if:**
1. Chat disappears but reappears after refresh
2. Console shows "❌ Delete verification FAILED"
3. User receives error alert
4. SQL query shows is_deleted=false or row doesn't exist

## Contact Support

If deletion continues to fail after following this guide:
1. Capture complete console output
2. Record steps to reproduce
3. Include browser version (F12 → Help → About)
4. Include Supabase database logs
5. Share the "DELETE_PERSISTENCE_FIX_SUMMARY.md" findings
