# Supabase SQL Fixes - Ready to Deploy

## Summary
Fixed all RLS policy violations, trigger issues, and missing columns preventing chat system from working.

## Files to Execute in Supabase (in order)

### 1. **sql/01_CREATE_TABLES.sql**
**What it does**: Adds missing PIN column to profiles table
**Why needed**: Chat locking feature requires PIN storage
**SQL to execute**:
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin text;
```

### 2. **sql/02_RLS_POLICIES.sql** 
**Status**: Already deployed
**No changes needed**

### 3. **sql/03_FUNCTIONS_TRIGGERS.sql**
**What it does**: Adds SECURITY DEFINER to all database write functions
**Why needed**: Triggers and functions must bypass RLS to insert/update records

**Updated functions with SECURITY DEFINER**:
- ✅ `create_user_profile()` - Creates profile on auth.users signup
- ✅ `auto_accept_conversation()` - Creates user_chat_settings entries
- ✅ `update_conversation_last_message_at()` - Updates conversation timestamp
- ✅ `update_group_last_activity()` - Updates group activity
- ✅ `get_or_create_self_chat()` - Creates self-chat if needed
- ✅ `get_or_create_conversation()` - Creates conversation if needed
- ✅ `mark_messages_as_read()` - Records read receipts

## Execution Steps

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `sql/01_CREATE_TABLES.sql` 
3. Paste and execute (look for PIN column addition)
4. Copy contents of `sql/03_FUNCTIONS_TRIGGERS.sql`
5. Paste and execute
6. Verify all functions have `SECURITY DEFINER`:
   ```sql
   SELECT routine_name, routine_definition 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('create_user_profile', 'auto_accept_conversation', 
                        'update_conversation_last_message_at', 'update_group_last_activity',
                        'get_or_create_self_chat', 'get_or_create_conversation', 
                        'mark_messages_as_read')
   ORDER BY routine_name;
   ```

## Expected Results

After deployment:
- ✅ 400 errors on POST /profiles disappear (profiles auto-created on signup)
- ✅ 403 errors on conversation creation disappear (user_chat_settings auto-created)
- ✅ 406 errors on GET messages disappear (query structure fixed)
- ✅ PIN-based chat locking works (pin column exists)
- ✅ Group chat operations work (all triggers have proper permissions)

## Verification Checklist

- [ ] PIN column added to profiles
- [ ] All functions show SECURITY DEFINER
- [ ] All triggers are present
- [ ] Test: Create new user → profile auto-created
- [ ] Test: Start new chat → no 403 errors
- [ ] Test: Get messages → no 406 errors
- [ ] Test: PIN functions work
