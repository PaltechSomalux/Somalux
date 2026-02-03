# Delete Chat Functionality - Fix Guide

## Error Analysis

The error "deleteChat: Failed to delete chat: Object" occurs because error details aren't being logged properly. The following improvements have been made:

### Root Causes

1. **Missing `is_deleted` column** - The `user_chats` table must have an `is_deleted` boolean column
2. **No `user_chats` entry** - The chat might not have an entry in `user_chats` for the current user
3. **Normalization issue** - The conversation ID format might not be converting properly to UUID
4. **Permission issue** - RLS policies might prevent the update

---

## Changes Made

### 1. Enhanced Error Logging in SupabaseChatService.js

**What was changed:**
- Added detailed console logs with emojis for easy tracking
- Changed from `.single()` to `.maybeSingle()` to handle cases where entry doesn't exist
- Added pre-check to see if user_chats entry exists
- If entry doesn't exist, creates it with `is_deleted: true`
- Logs all error details: message, code, details, hint

**New flow:**
```
1. Log start of delete process ✅
2. Normalize conversation ID
3. Check if user_chats entry exists
   - If not found: Create it with is_deleted=true
   - If found: Update to set is_deleted=true
4. Log success/failure with full error details
```

### 2. Enhanced Error Logging in ChatMe.jsx

Changed error logging to show:
- Error message
- Error stack trace
- ChatId
- UserId

---

## Database Setup Required

### Step 1: Verify `is_deleted` Column Exists

```sql
-- Check if column exists:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_chats'
  AND column_name = 'is_deleted';
```

**If it returns nothing, run this:**

```sql
ALTER TABLE public.user_chats 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
```

### Step 2: Add Index for Performance

```sql
CREATE INDEX IF NOT EXISTS idx_user_chats_active 
ON public.user_chats(user_id, is_deleted) 
WHERE is_deleted = FALSE;
```

### Step 3: Run Soft Delete Functions

Execute the entire `SOFT_DELETE_CHAT_FUNCTIONALITY.sql` file:

```bash
# In Supabase SQL Editor, paste entire file and run
```

---

## How to Debug

### 1. Open Browser Dev Tools (F12)

### 2. Go to Console Tab

### 3. Delete a chat and look for these logs:

**Success case:**
```
🗑️ deleteChat: Starting delete process { userId, conversationId }
🗑️ deleteChat: Normalized ID: { originalId, normalizedId }
✅ deleteChat: Chat deleted successfully { userId, chatId }
📊 Filtered out 1 deleted chats from 5 total
```

**Error case:**
```
🗑️ deleteChat: Starting delete process...
🗑️ deleteChat: Normalized ID: ...
❌ deleteChat error: {
  message: "...",
  stack: "...",
  userId: "...",
  conversationId: "..."
}
ChatMe: Error deleting chat: {
  message: "...",
  stack: "..."
}
```

### 4. Check Supabase Logs

Go to **Supabase Dashboard > Logs > API** and filter by:
- Method: `PATCH` (updates)
- Path: `/user_chats`
- Look at status codes and responses

---

## Common Issues & Solutions

### Issue 1: "user_chats does not exist"
**Solution:** The table might be named differently. Check:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%chat%';
```

### Issue 2: "Column is_deleted does not exist"
**Solution:** Add the column:
```sql
ALTER TABLE public.user_chats 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
```

### Issue 3: Permission denied / RLS policy blocks update
**Solution:** Check RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'user_chats';
```

Ensure the policy allows authenticated users to update their own records:
```sql
-- Example: Allow users to update their own chats
CREATE POLICY "Users can update their own chats"
ON public.user_chats
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Issue 4: Chat not found after deletion (but deletion succeeded)
**Solution:** This is expected! The `fetchUserChats()` method now filters out deleted chats. The chat is still in the database but hidden from the UI.

To restore a deleted chat, use:
```sql
SELECT public.restore_deleted_chat('your-user-id'::UUID, 'chat-id'::UUID);
```

---

## Features Added

### ✅ Soft Delete
- Chat marked as deleted in `user_chats` table
- Original conversation in `conversations` table remains untouched
- Allows for data recovery

### ✅ Auto-Creation of user_chats Entry
- If a user tries to delete a chat without a corresponding `user_chats` entry, it's created automatically with `is_deleted=true`

### ✅ Automatic Filtering
- `fetchUserChats()` automatically filters out deleted chats
- User won't see deleted chats in their chat list

### ✅ Recovery Functions
- `restore_deleted_chat()` - Restore a single deleted chat
- `get_user_active_chats()` - Get only active (non-deleted) chats
- `purge_deleted_chats()` - Permanently delete chats older than X days

### ✅ Admin View
- `deleted_chats_view` - See all deleted chats across the system

---

## Testing Checklist

- [ ] Open DevTools Console
- [ ] Load chat list
- [ ] Select a chat
- [ ] Click delete button
- [ ] Check console for success logs with ✅
- [ ] Verify chat disappears from list
- [ ] Refresh page - chat should still be gone
- [ ] Check Supabase logs for successful PATCH request
- [ ] Verify `is_deleted` column in `user_chats` is TRUE for that chat

---

## Rollback/Recovery

If you need to restore a deleted chat:

```sql
-- In Supabase SQL Editor:
SELECT public.restore_deleted_chat(
  'user-uuid-here'::UUID, 
  'chat-uuid-here'::UUID
);
```

Or update directly:
```sql
UPDATE public.user_chats
SET is_deleted = FALSE
WHERE user_id = 'user-uuid'::UUID
  AND chat_id = 'chat-uuid'::UUID;
```

Then refresh the UI.
