# 📊 Database Schema Diagram - Chat System

## Table Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     PUBLIC SCHEMA TABLES                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      USERS           │ ◄─────────┐
├──────────────────────┤           │
│ id (UUID) PK         │           │
│ email (VARCHAR)      │           │
│ name (VARCHAR)       │           │ references
│ full_name (VARCHAR)  │           │
│ avatar_url (TEXT)    │           │
│ pin (VARCHAR)        │           │
│ created_at           │           │
│ last_active_at       │           │
└──────────────────────┘           │
         ▲                          │
         │                          │
         │ references               │
         │                          │
    ┌────┴──────────────────────────┴─────────┐
    │                                          │
    │                                          │
┌───┴────────────────────┐      ┌─────────────┴───────┐
│    PROFILES            │      │  CONVERSATIONS      │
├────────────────────────┤      ├─────────────────────┤
│ id (UUID) PK/FK        │      │ id (VARCHAR) PK     │
│ email (VARCHAR)        │      │ user1_id (FK)  ────┼──→ USERS
│ full_name (VARCHAR)    │      │ user2_id (FK)  ────┼──→ USERS
│ display_name (VARCHAR) │      │ created_at          │
│ avatar_url (TEXT)      │      │ updated_at          │
│ username (VARCHAR)     │      │ last_message_at     │
│ bio (TEXT)             │      └─────────────────────┘
│ is_online (BOOLEAN)    │               ▲
│ created_at             │               │
│ last_active_at         │               │ references
└────────────────────────┘               │
                                    ┌────┴──────────────────┐
                                    │    USER_CHATS         │
                                    ├───────────────────────┤
                                    │ id (UUID) PK          │
                                    │ user_id (FK) ────────┼──→ USERS
                                    │ chat_id (FK) ────────┼──→ CONVERSATIONS
                                    │ is_pinned (BOOLEAN)   │
                                    │ is_archived (BOOLEAN) │
                                    │ is_muted (BOOLEAN)    │
                                    │ is_locked (BOOLEAN)   │
                                    │ is_deleted (BOOLEAN)  │
                                    │ created_at            │
                                    │ updated_at            │
                                    └───────────────────────┘
                                            ▲
                                            │
                                            │ references
                                            │
                              ┌─────────────┴──────────┐
                              │    MESSAGES            │
                              ├────────────────────────┤
                              │ id (UUID) PK           │
                              │ chat_id (FK) ────────┬┼──→ CONVERSATIONS
                              │ sender_id (FK) ──────┼┼──→ USERS
                              │ content (TEXT)        ││
                              │ is_edited (BOOLEAN)   ││
                              │ is_deleted (BOOLEAN)  ││
                              │ created_at            ││
                              │ updated_at            ││
                              └────────────────────────┘
                                            ▲
                                            │
                                            │
                          ┌─────────────────┴──────────────┐
                          │                                │
                   ┌──────┴──────────────┐      ┌─────────┴──────┐
                   │ USER_CHAT_FOLDERS   │      │      CHATS     │
                   ├─────────────────────┤      ├────────────────┤
                   │ id (UUID) PK        │      │ id (VARCHAR) PK│
                   │ user_id (FK) ──────┬┼──→ USERS             │
                   │ name (VARCHAR)      ││      │ participants[] │
                   │ description (TEXT)  ││      │ created_at     │
                   │ created_at          ││      │ updated_at     │
                   │ updated_at          ││      └────────────────┘
                   └───────────┬─────────┘
                               │
                               │ via CHAT_FOLDER_ASSIGNMENTS
                               │
                   ┌───────────┴──────────────┐
                   │ CHAT_FOLDER_ASSIGNMENTS  │
                   ├────────────────────────┤
                   │ id (UUID) PK            │
                   │ folder_id (FK) ────┬──→ USER_CHAT_FOLDERS
                   │ chat_id (FK) ──────┼──→ CONVERSATIONS
                   │ created_at          │
                   └────────────────────┘
```

## Key Relationships

### One-to-Many
- `users` → `profiles` (One user has one profile)
- `users` → `user_chats` (One user has many chats)
- `users` → `messages` (One user sends many messages)
- `users` → `user_chat_folders` (One user has many folders)
- `conversations` → `messages` (One conversation has many messages)
- `user_chat_folders` → `chat_folder_assignments` (One folder has many chat assignments)

### Many-to-Many
- `conversations` ←→ `user_chat_folders` (via `chat_folder_assignments`)

### Foreign Keys (Constraints)
```
conversations.user1_id → users.id (ON DELETE CASCADE)
conversations.user2_id → users.id (ON DELETE CASCADE)
user_chats.user_id → users.id (ON DELETE CASCADE)
user_chats.chat_id → conversations.id (ON DELETE CASCADE)
messages.chat_id → conversations.id (ON DELETE CASCADE)
messages.sender_id → users.id (ON DELETE CASCADE)
user_chat_folders.user_id → users.id (ON DELETE CASCADE)
chat_folder_assignments.folder_id → user_chat_folders.id (ON DELETE CASCADE)
chat_folder_assignments.chat_id → conversations.id (ON DELETE CASCADE)
profiles.id → users.id (ON DELETE CASCADE)
```

## Data Flow

```
1. USER CREATION
   │
   └─→ users table
        └─→ profiles table (extended info)

2. STARTING A CHAT
   │
   ├─→ conversations table (creates chat session)
   │
   └─→ user_chats table (stores chat metadata for each user)

3. SENDING A MESSAGE
   │
   └─→ messages table (stores message in conversation)

4. ORGANIZING CHATS
   │
   ├─→ user_chat_folders table (creates folder)
   │
   └─→ chat_folder_assignments table (assigns chats to folders)
```

## Indexes for Performance

```
USERS TABLE
├─ idx_users_email (email)
└─ idx_users_id (id)

PROFILES TABLE
├─ idx_profiles_id (id)
├─ idx_profiles_email (email)
├─ idx_profiles_username (username)
└─ idx_profiles_full_name (full_name)

CONVERSATIONS TABLE
├─ idx_conversations_user1_id (user1_id)
├─ idx_conversations_user2_id (user2_id)
└─ idx_conversations_id (id)

USER_CHATS TABLE
├─ idx_user_chats_user_id (user_id)
├─ idx_user_chats_chat_id (chat_id)
└─ idx_user_chats_user_id_chat_id (user_id, chat_id)

MESSAGES TABLE
├─ idx_messages_chat_id (chat_id)
├─ idx_messages_sender_id (sender_id)
└─ idx_messages_created_at (created_at DESC)

USER_CHAT_FOLDERS TABLE
├─ idx_user_chat_folders_user_id (user_id)
└─ idx_user_chat_folders_created_at (created_at DESC)

CHAT_FOLDER_ASSIGNMENTS TABLE
├─ idx_chat_folder_assignments_folder_id (folder_id)
└─ idx_chat_folder_assignments_chat_id (chat_id)

CHATS TABLE
└─ idx_chats_id (id)
```

## Unique Constraints

```
users.email (UNIQUE)
profiles.username (UNIQUE)
profiles.id (PRIMARY KEY - also referenced by users.id)
user_chats (user_id, chat_id) - UNIQUE
chat_folder_assignments (folder_id, chat_id) - UNIQUE
```

---

## Summary
- **8 Main Tables**
- **7 Foreign Key Constraints**
- **18 Indexes** for optimal performance
- **2 Unique Constraints** for data integrity
- **Cascading Deletes** to maintain referential integrity
