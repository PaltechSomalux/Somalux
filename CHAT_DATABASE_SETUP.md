# Chat System Database Setup Guide

## Problem
The chat/messaging system is failing because the required Supabase database tables don't exist.

### Error Messages Indicating Missing Tables:
```
❌ relation "public.profiles" does not exist (400)
❌ relation "public.conversations" does not exist (404)
❌ relation "public.user_chat_settings" does not exist (42P01)
❌ relation "public.user_chat_folders" does not exist (404)
```

## Solution

### Step 1: Access Supabase Console
1. Go to your Supabase project: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Create the Database Tables
1. Click **New Query**
2. Copy the entire contents of `sql/CREATE_CHAT_SYSTEM_TABLES.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Were Created
After running the script, you should see these tables in your Supabase database:

✅ **public.users** - Basic user records
✅ **public.profiles** - Extended user profile information  
✅ **public.conversations** - One-to-one chat conversations
✅ **public.user_chats** - User-specific chat settings & metadata
✅ **public.messages** - Individual chat messages
✅ **public.user_chat_folders** - Folders for organizing chats
✅ **public.chat_folder_assignments** - Many-to-many chat-to-folder mapping
✅ **public.chats** - Alias table for conversation compatibility

## Table Schema Details

### users
```sql
id (UUID, Primary Key)
email (VARCHAR)
name (VARCHAR)
full_name (VARCHAR)
avatar_url (TEXT)
created_at (TIMESTAMP)
pin (VARCHAR) - For PIN protection
last_active_at (TIMESTAMP)
```

### profiles
```sql
id (UUID, Primary Key - FK to users.id)
email (VARCHAR)
full_name (VARCHAR)
display_name (VARCHAR)
avatar_url (TEXT)
username (VARCHAR, Unique)
bio (TEXT)
is_online (BOOLEAN)
last_active_at (TIMESTAMP)
created_at (TIMESTAMP)
```

### conversations
```sql
id (VARCHAR, Primary Key)
user1_id (UUID, FK to users.id)
user2_id (UUID, FK to users.id)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
last_message_at (TIMESTAMP)
```

### user_chats
```sql
id (UUID, Primary Key)
user_id (UUID, FK to users.id)
chat_id (VARCHAR, FK to conversations.id)
is_pinned (BOOLEAN)
is_archived (BOOLEAN)
is_muted (BOOLEAN)
is_locked (BOOLEAN)
is_deleted (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### messages
```sql
id (UUID, Primary Key)
chat_id (VARCHAR, FK to conversations.id)
sender_id (UUID, FK to users.id)
content (TEXT)
is_edited (BOOLEAN)
is_deleted (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### user_chat_folders
```sql
id (UUID, Primary Key)
user_id (UUID, FK to users.id)
name (VARCHAR)
description (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

## After Setup

Once tables are created:

1. **Refresh your browser** - Clear any cached data
2. **Check browser console** - Errors should no longer appear
3. **Test chat functionality**:
   - Open the ChatMe feature
   - Try to add a contact from smart suggestions
   - Try to start a chat with a user

## Troubleshooting

### Still Getting 404 or 400 Errors?
1. Verify all tables exist in Supabase → Tables section
2. Check table names are exactly: `profiles`, `conversations`, `user_chats`, `messages`, `user_chat_folders`
3. Ensure you ran the script in the **correct Supabase project**

### Check if Tables Exist
Run this in SQL Editor:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- chat_folder_assignments
- chats
- conversations
- messages
- profiles
- user_chat_folders
- user_chats
- users

### Still Have Issues?
1. Go to **Authentication** section and verify user profiles are being created
2. Check that user UUID matches between `auth.users` and `public.users`
3. Run the migration fresh if tables have corrupt data

## Related Files
- `sql/CREATE_CHAT_SYSTEM_TABLES.sql` - Complete database schema
- `src/components/ChatMe/services/SupabaseChatService.js` - Chat service implementation
- `src/SomaLux/Chat/ChatList/Components/FloatingActionButton.jsx` - Chat UI component
