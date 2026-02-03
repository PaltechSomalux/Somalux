# Chat System SQL Migration Guide

## Overview

This directory contains the complete SQL schema and migration scripts for the SomaLux chat system in Supabase.

## Files

### 1. `01_CREATE_TABLES.sql`
**Purpose:** Create all base tables for the chat system

**Tables Created:**
- `profiles` - User profiles
- `conversations` - 1-on-1 chats between users
- `messages` - Chat messages
- `message_reads` - Read receipts
- `message_reactions` - Message reactions/emojis
- `user_chat_settings` - Per-user chat preferences (pinned, archived, muted, etc.)
- `groups` - Group chats
- `group_members` - Group membership
- `group_admins` - Group admin roles
- `group_messages` - Messages in groups
- `group_message_reads` - Group message read receipts
- `self_chats` - Metadata for self-chats

**Includes:**
- Table creation with constraints
- Indexes for performance
- Row-Level Security (RLS) enable

**Status:** ✅ Run this first

---

### 2. `02_RLS_POLICIES.sql`
**Purpose:** Set up Row-Level Security policies for all tables

**Policies Include:**
- User can only read their own data
- Users can only read profiles (for search/selection)
- Conversations are private between two users
- Messages are only visible to conversation participants
- Group messages only visible to group members
- Admins can manage group members
- Etc.

**Benefits:**
- Data isolation at the database level
- No need to manually filter queries
- Automatic enforcement of privacy

**Status:** ✅ Run after `01_CREATE_TABLES.sql`

---

### 3. `03_FUNCTIONS_TRIGGERS.sql`
**Purpose:** Database functions and triggers for automation

**Functions/Triggers:**
- `update_conversation_last_message_at()` - Auto-update conversation timestamp
- `update_group_last_activity()` - Auto-update group timestamp
- `update_profile_updated_at()` - Auto-update profile timestamp
- `create_user_profile()` - Auto-create profile on signup
- `auto_accept_conversation()` - Auto-create settings for new conversations
- `get_or_create_self_chat()` - Helper to manage self-chats
- `get_or_create_conversation()` - Helper to manage conversations
- `get_unread_count()` - Get unread messages count
- `mark_messages_as_read()` - Mark messages as read in bulk

**Status:** ✅ Run after `02_RLS_POLICIES.sql`

---

### 4. `04_SAMPLE_DATA.sql`
**Purpose:** Insert sample data for testing

**Includes:**
- Sample user profiles
- Sample conversations
- Sample messages
- Sample groups with members

⚠️ **WARNING:** Do not run in production!

**Status:** ⚠️ Optional - development/testing only

---

### 5. `05_MIGRATION_FROM_FIREBASE.sql`
**Purpose:** Views, helpers, and utilities for Firebase migration

**Includes:**
- `user_chatlist` view - Get chatlist for current user
- `user_group_chatlist` view - Get group chatlist
- `conversation_messages` view - Get messages with metadata
- Migration functions for creating self-chats
- Cleanup functions for maintenance

**Status:** ✅ Optional - useful for migration and maintenance

---

## Installation Order

Run the SQL files in this order:

```bash
# 1. Create all tables and indexes
psql -U postgres -d somalux < 01_CREATE_TABLES.sql

# 2. Set up Row-Level Security
psql -U postgres -d somalux < 02_RLS_POLICIES.sql

# 3. Create functions and triggers
psql -U postgres -d somalux < 03_FUNCTIONS_TRIGGERS.sql

# 4. (Optional) Add sample data for testing
psql -U postgres -d somalux < 04_SAMPLE_DATA.sql

# 5. (Optional) Create views and utilities
psql -U postgres -d somalux < 05_MIGRATION_FROM_FIREBASE.sql
```

Or in Supabase console:
1. Go to SQL Editor
2. Copy entire content of each file
3. Execute in order

---

## Table Schema Summary

### profiles
```
id (uuid, PK)
email (text, unique)
display_name (text)
avatar_url (text)
bio (text)
is_online (boolean)
role (text)
created_at, updated_at (timestamp)
```

### conversations
```
id (uuid, PK)
user1_id, user2_id (uuid, FK to profiles)
created_at, updated_at, last_message_at (timestamp)
```

### messages
```
id (uuid, PK)
conversation_id (uuid, FK to conversations)
sender_id (uuid, FK to profiles)
text (text)
file_url, file_type, file_name, file_size (for files)
is_deleted (boolean)
created_at, updated_at (timestamp)
```

### user_chat_settings
```
id (uuid, PK)
user_id (uuid, FK to profiles)
conversation_id (uuid, FK to conversations)
is_pinned, is_archived, is_muted, is_locked, is_deleted (boolean)
created_at, updated_at (timestamp)
```

### groups
```
id (uuid, PK)
name, description (text)
created_by (uuid, FK to profiles)
created_at, updated_at, last_activity (timestamp)
only_admins_can_send (boolean)
```

### group_members
```
id (uuid, PK)
group_id (uuid, FK to groups)
user_id (uuid, FK to profiles)
role (text: 'admin' or 'member')
joined_at (timestamp)
```

### group_messages
```
id (uuid, PK)
group_id (uuid, FK to groups)
sender_id (uuid, FK to profiles)
text, file_url, file_type (text)
status (text: 'sent', 'delivered', 'read')
reply_to (uuid, self-reference)
timestamp (timestamp)
deleted_by (uuid[])
```

---

## Key Features

✅ **Row-Level Security** - Data automatically filtered by user  
✅ **Real-time Updates** - Use Supabase subscriptions  
✅ **Automatic Timestamps** - Created/updated dates auto-managed  
✅ **Read Receipts** - Track message reads  
✅ **Reactions** - Add emoji reactions to messages  
✅ **Chat Settings** - Per-chat mute/pin/archive  
✅ **Group Chat** - Full group messaging support  
✅ **Soft Deletes** - Messages marked as deleted, not removed  
✅ **Unread Counts** - Quick queries for unread messages  

---

## Common Queries

### Get user's chatlist
```sql
SELECT * FROM public.user_chatlist;
```

### Get conversation messages
```sql
SELECT * FROM public.conversation_messages 
WHERE conversation_id = 'xxx';
```

### Get unread count
```sql
SELECT public.get_unread_count(auth.uid(), conversation_id);
```

### Mark messages as read
```sql
SELECT public.mark_messages_as_read(auth.uid(), conversation_id);
```

### Get or create conversation
```sql
SELECT public.get_or_create_conversation(user1_id, user2_id);
```

---

## Maintenance

### Run cleanup periodically
```sql
-- Clean up old deleted messages (hard delete after 30 days)
SELECT public.cleanup_deleted_messages();

-- Archive conversations with no activity for 1 year
SELECT public.auto_archive_old_conversations();
```

---

## Troubleshooting

### RLS prevents all queries
- Check that auth.uid() returns correct user ID
- Verify RLS policies are correct
- Use service role bypass for admin operations

### Performance issues
- Check that indexes are created
- Use EXPLAIN ANALYZE to profile queries
- Consider archiving old conversations

### Realtime not working
- Enable Realtime in Supabase dashboard
- Check RLS policies allow the operation
- Verify subscription syntax

---

## Support

For issues or questions:
1. Check Supabase documentation
2. Review RLS policies in `02_RLS_POLICIES.sql`
3. Verify table structure in `01_CREATE_TABLES.sql`

