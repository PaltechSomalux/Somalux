# Delete Chat - Quick Reference Card

## 🚀 Quick Start (5 minutes)

### Step 1: Run SQL (1 min)
```
Supabase > SQL Editor > New Query > Paste from sql/FIX_DELETE_CHAT_ERROR.sql > Run
```

### Step 2: Test Delete (2 min)
```
1. Open app
2. F12 (open DevTools)
3. Console tab
4. Delete any chat
5. Look for ✅ success logs
```

### Step 3: Verify (2 min)
```
1. Chat should disappear
2. Refresh page (Ctrl+R)
3. Chat should still be gone
4. Done! ✅
```

---

## 🔍 Console Logs Reference

### Success:
```
🗑️ deleteChat: Starting delete process { userId, conversationId }
🗑️ deleteChat: Normalized ID: { originalId, normalizedId }
✅ deleteChat: Chat deleted successfully { userId, chatId }
📊 Filtered out 1 deleted chats from 5 total
```

### Error:
```
❌ deleteChat error: {
  message: "...",
  stack: "...",
  userId: "...",
  conversationId: "..."
}
```

---

## 🛠️ Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `is_deleted column does not exist` | Column not added | Run FIX_DELETE_CHAT_ERROR.sql |
| `user_chats does not exist` | Wrong table name | Check table names in Supabase |
| RLS policy violation | Permission issue | Update RLS policies |
| Chat doesn't disappear | UI not updating | Hard refresh with Ctrl+Shift+R |
| Chat reappears | Not saved to DB | Check Supabase logs |

---

## 📋 SQL Commands

### Check if is_deleted column exists:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='user_chats' 
AND column_name='is_deleted';
```

### View all deleted chats:
```sql
SELECT user_id, chat_id, updated_at 
FROM public.user_chats 
WHERE is_deleted = TRUE;
```

### Restore a deleted chat:
```sql
SELECT public.restore_deleted_chat(
  'user-uuid'::UUID, 
  'chat-uuid'::UUID
);
```

### Get only active chats:
```sql
SELECT * FROM public.get_user_active_chats('user-uuid'::UUID);
```

---

## 📁 Important Files

| File | Purpose | Action |
|------|---------|--------|
| `sql/FIX_DELETE_CHAT_ERROR.sql` | Setup is_deleted column | **RUN THIS** |
| `src/components/ChatMe/services/SupabaseChatService.js` | New deleteChat() method | Already updated ✅ |
| `src/components/ChatMe/ChatList/ChatMe.jsx` | Uses new deleteChat() | Already updated ✅ |
| `DELETE_CHAT_STEP_BY_STEP.md` | Visual guide | Read if stuck |
| `DELETE_CHAT_FIX_GUIDE.md` | Technical details | Read for deep dive |

---

## ✅ Success Criteria

- [ ] SQL runs without error
- [ ] Console shows 🗑️ logs when deleting
- [ ] Chat disappears from list
- [ ] Chat stays deleted after refresh
- [ ] Other chats work normally
- [ ] No red errors in console

---

## 🆘 Still Not Working?

1. Check console for exact error message
2. Go to Supabase > Logs > API > filter by PATCH /user_chats
3. Look for status 400/403 (bad request / permission denied)
4. Read DELETE_CHAT_FIX_GUIDE.md > Common Issues section
5. If still stuck, take screenshot of console error + Supabase logs

---

## 🔑 Key Concepts

**Soft Delete:** Chat is marked as deleted (`is_deleted=true`) but stays in database
- Pro: Can recover deleted chats
- Pro: Maintains referential integrity
- Pro: No data loss

**Hard Delete:** Chat is completely removed from database
- Con: No recovery possible
- Con: Can break relationships

**Current Implementation:** Soft Delete ✅

---

## 📞 Support Info

If you encounter issues:
1. Note the exact error message
2. Screenshot of console
3. Screenshot of Supabase logs (API section)
4. Steps to reproduce
5. Report with these details

---

**Last Updated:** February 2, 2026
**Status:** ✅ Ready for Testing
