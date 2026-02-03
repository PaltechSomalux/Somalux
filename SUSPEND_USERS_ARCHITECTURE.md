# 🎯 User Suspension System - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Users Page (/books/admin/users)                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ User List Table                                    │  │  │
│  │  │ ┌─────────────────────────────────────────────────┤  │  │
│  │  │ │ Email   │ Role  │ Actions                       │  │  │
│  │  │ ├─────────────────────────────────────────────────┤  │  │
│  │  │ │ user@   │ admin │ [Details] [Suspend] ← RED    │  │  │
│  │  │ │ example │       │                              │  │  │
│  │  │ │ user2@  │viewer │ [Details] [Unsuspend] ← GRN  │  │  │
│  │  │ │ test.   │       │                              │  │  │
│  │  │ └─────────────────────────────────────────────────┤  │  │
│  │  │                                                    │  │  │
│  │  │  ┌──────────────────────────────────────────────┐ │  │  │
│  │  │  │ Suspension Dialog (on button click)         │ │  │  │
│  │  │  │ ┌──────────────────────────────────────────┤ │  │  │
│  │  │  │ │ Suspend User                             │ │  │  │
│  │  │  │ │ user@example.com?                       │ │  │  │
│  │  │  │ │                                          │ │  │  │
│  │  │  │ │ Reason (optional):                       │ │  │  │
│  │  │  │ │ [________________________]                │ │  │  │
│  │  │  │ │                                          │ │  │  │
│  │  │  │ │ [Cancel]  [Suspend]                      │ │  │  │
│  │  │  │ └──────────────────────────────────────────┤ │  │  │
│  │  │  └──────────────────────────────────────────────┘ │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    JavaScript Event Handler
                              ↓
         ┌────────────────────────────────────┐
         │   Frontend API Call                │
         │   suspendUser(id, true, reason)    │
         └────────────────────────────────────┘
                              ↓
            ┌─────────────────────────────────┐
            │  Backend API Endpoint           │
            │  PATCH /api/elib/users/:id/...  │
            │          /suspend               │
            └─────────────────────────────────┘
                              ↓
         ┌────────────────────────────────────┐
         │    Database Update                 │
         │    is_suspended = true             │
         │    suspended_reason = "..."        │
         │    suspended_at = now()            │
         └────────────────────────────────────┘
                              ↓
         ┌────────────────────────────────────┐
         │    Audit Logging                   │
         │    INSERT audit_logs               │
         │    action = 'suspend_user'         │
         └────────────────────────────────────┘
                              ↓
              ┌──────────────────────────┐
              │   Frontend Updates UI    │
              │   Button: RED → GREEN    │
              │   Status Updated         │
              └──────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────┐
│  Admin Clicks   │
│ "Suspend" Button│
└────────┬────────┘
         │
         ↓
┌────────────────────────────┐
│  handleSuspendClick()      │
│  - Show dialog             │
│  - Set suspendingUser      │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│  User Confirms in Dialog   │
│  - Enters reason (optional)│
│  - Clicks "Suspend"        │
└────────┬───────────────────┘
         │
         ↓
┌────────────────────────────┐
│  confirmSuspend()          │
│  - Set saving state        │
│  - Call API                │
└────────┬───────────────────┘
         │
         ↓
     ┌───────────────────┐
     │ API Call:         │
     │ PATCH /api/elib/  │
     │ users/:id/suspend │
     │                   │
     │ Body:             │
     │ {                 │
     │   suspended: true │
     │   reason: "..."   │
     │ }                 │
     └────┬──────────────┘
          │
          ↓
    ┌─────────────────────────┐
    │  Backend Handler        │
    │  app.patch(...suspend)  │
    │                         │
    │  - Validate input       │
    │  - Update profiles      │
    │  - Log audit trail      │
    └────┬────────────────────┘
         │
         ↓
    ┌─────────────────────────┐
    │  Database Operations    │
    │                         │
    │  1. UPDATE profiles SET │
    │     is_suspended=true   │
    │     WHERE id=...        │
    │                         │
    │  2. INSERT audit_logs   │
    │     action='suspend_...'│
    └────┬────────────────────┘
         │
         ↓
    ┌─────────────────────────┐
    │  Return Success         │
    │  {                      │
    │    ok: true,            │
    │    data: {user...}      │
    │  }                      │
    └────┬────────────────────┘
         │
         ↓
    ┌─────────────────────────┐
    │  Frontend Response      │
    │  Handler                │
    │                         │
    │  - Close dialog         │
    │  - Reload users         │
    │  - Update UI            │
    │  - Show success msg     │
    └────┬────────────────────┘
         │
         ↓
    ┌─────────────────────────┐
    │  User Sees Changes      │
    │  - Dialog closes        │
    │  - Button changes color │
    │  - Status updates       │
    └─────────────────────────┘
```

## State Management Diagram

```
┌──────────────────────────────────────────────────────┐
│          Users Component State                       │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ suspendingUser                               │  │
│  │ ├─ id: string                               │  │
│  │ ├─ email: string                            │  │
│  │ ├─ is_suspended: boolean                    │  │
│  │ └─ ...other user fields                     │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ suspendReason: string                        │  │
│  │ - Empty string initially                     │  │
│  │ - User enters reason (optional)              │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ showSuspendDialog: boolean                   │  │
│  │ - false: dialog hidden                       │  │
│  │ - true: dialog visible                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ saving: Map<userId, boolean>                 │  │
│  │ - Tracks which users are being processed     │  │
│  │ - Disables button during operation           │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ rows: User[]                                 │  │
│  │ - All loaded users                           │  │
│  │ - Contains is_suspended field                │  │
│  │ - Updated after suspension                   │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌──────────────────────────────┐
│   Users.jsx Component        │
│  (Admin Users Page)          │
└───────────┬──────────────────┘
            │
    ┌───────┴─────────┬──────────────────────────────┐
    │                 │                              │
    ↓                 ↓                              ↓
┌──────────────┐ ┌─────────────┐ ┌────────────────────┐
│ User Table   │ │ Dialog Modal │ │ API Functions      │
│ - List users │ │ - Confirm   │ │ - suspendUser()    │
│ - Show btn   │ │   action    │ │ - updateUserRole() │
│              │ │ - Get reason│ │ - fetchProfiles()  │
└──────┬───────┘ └──────┬──────┘ └─────────┬─────────┘
       │                │                  │
       └────────────────┼──────────────────┘
                        │
                 ┌──────┴───────┐
                 │              │
                 ↓              ↓
            ┌─────────┐  ┌────────────────┐
            │ Event   │  │ API Call       │
            │ Handler │  │ PATCH /api/... │
            └────┬────┘  └────┬───────────┘
                 │            │
                 └────────┬───┘
                          │
                    ┌─────┴──────┐
                    │            │
                    ↓            ↓
            ┌──────────────┐ ┌─────────────┐
            │ State Update │ │ Backend API │
            │ - dialog     │ │ - process   │
            │ - suspending │ │ - database  │
            │ - saving     │ │ - audit log │
            └──────────────┘ └─────────────┘
```

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────┐
│          PROFILES TABLE                             │
│                                                     │
│  Existing Columns:                                  │
│  ├─ id (UUID) PRIMARY KEY                          │
│  ├─ email (VARCHAR)                                │
│  ├─ display_name (VARCHAR)                         │
│  ├─ full_name (VARCHAR)                            │
│  ├─ role (VARCHAR) - admin|editor|viewer          │
│  ├─ created_at (TIMESTAMP)                         │
│  ├─ updated_at (TIMESTAMP)                         │
│  ├─ last_active_at (TIMESTAMP)                     │
│  ├─ subscription_tier (VARCHAR)                    │
│  │                                                 │
│  NEW Columns (for suspension):                     │
│  ├─ is_suspended (BOOLEAN) DEFAULT FALSE ← NEW    │
│  ├─ suspended_reason (TEXT) ← NEW                 │
│  └─ suspended_at (TIMESTAMP) ← NEW                │
│                                                     │
│  Indexes:                                          │
│  ├─ PRIMARY KEY (id)                              │
│  ├─ UNIQUE (email)                                │
│  └─ NEW: idx_profiles_is_suspended (is_suspended) │
└─────────────────────────────────────────────────────┘
         │
         │ (tracks suspension of)
         │
         ↓
┌─────────────────────────────────────────────────────┐
│          AUDIT_LOGS TABLE                           │
│  (records all suspension actions)                   │
│                                                     │
│  ├─ id (UUID) PRIMARY KEY                          │
│  ├─ actor (VARCHAR) - email of admin               │
│  ├─ action (VARCHAR) - 'suspend_user'/'unsuspend'  │
│  ├─ entity (VARCHAR) - 'profiles'                  │
│  ├─ record_id (UUID) - user id being suspended    │
│  ├─ details (JSONB) - {is_suspended, reason}       │
│  ├─ ip (VARCHAR) - IP address of actor             │
│  ├─ created_at (TIMESTAMP) - when action occurred  │
│  └─ ...other audit fields                          │
└─────────────────────────────────────────────────────┘
```

## API Request/Response Flow

```
REQUEST:
─────────────────────────────────────────────────────
PATCH /api/elib/users/550e8400-e29b-41d4-a716-446655440000/suspend

Headers:
  Content-Type: application/json

Body:
{
  "suspended": true,
  "reason": "Violates terms of service"
}

─────────────────────────────────────────────────────

PROCESSING:
─────────────────────────────────────────────────────

1. Route Matcher:
   app.patch('/api/elib/users/:id/suspend', handler)
                        ↓
2. Extract Parameters:
   id = "550e8400-e29b-41d4-a716-446655440000"
   suspended = true
   reason = "Violates terms of service"
                        ↓
3. Database Update:
   UPDATE profiles SET
     is_suspended = true,
     suspended_reason = 'Violates terms of service',
     suspended_at = NOW()
   WHERE id = '550e8400-e29b-41d4-a716-446655440000'
                        ↓
4. Audit Log:
   INSERT INTO audit_logs (
     actor, action, entity, record_id, details, ip, created_at
   ) VALUES (...)
                        ↓
5. Return Response:
   {
     "ok": true,
     "data": {
       "id": "550e8400-e29b-41d4-a716-446655440000",
       "email": "user@example.com",
       "is_suspended": true,
       "suspended_reason": "Violates terms of service",
       "suspended_at": "2025-02-01T12:34:56Z",
       ... other user fields
     }
   }

─────────────────────────────────────────────────────

RESPONSE:
─────────────────────────────────────────────────────
Status: 200 OK

{
  "ok": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "is_suspended": true,
    "suspended_reason": "Violates terms of service",
    "suspended_at": "2025-02-01T12:34:56.000Z",
    ... (other user profile fields)
  }
}

─────────────────────────────────────────────────────
```

## Lifecycle Diagram

```
User Created
    │
    ↓
┌─────────────────┐
│ User Active     │
│ is_suspended    │
│ = false ← default
└────┬────────────┘
     │
     │ (Admin clicks Suspend)
     │
     ↓
┌─────────────────────────┐
│ Suspension Dialog Shows │
└────┬────────────────────┘
     │
     │ (User enters reason)
     │
     ↓
┌─────────────────────────┐
│ Admin Confirms          │
│ (clicks Suspend button) │
└────┬────────────────────┘
     │
     ↓
┌─────────────────────────┐
│ Backend Processes       │
│ - Updates DB            │
│ - Logs action           │
└────┬────────────────────┘
     │
     ↓
┌──────────────────────┐
│ User Suspended       │
│ is_suspended = true  │
│ suspended_reason = "..."
│ suspended_at = NOW()
└────┬─────────────────┘
     │
     │ (Time passes... admin changes mind)
     │
     ↓
┌──────────────────────────┐
│ Admin Clicks Unsuspend   │
│ (green button)           │
└────┬─────────────────────┘
     │
     ↓
┌──────────────────────────┐
│ Backend Processes        │
│ - Updates DB             │
│ - Logs action            │
└────┬─────────────────────┘
     │
     ↓
┌──────────────────────────┐
│ User Active Again        │
│ is_suspended = false     │
│ suspended_reason = null  │
│ suspended_at = null      │
└──────────────────────────┘
```

---

**Diagram Version:** 1.0  
**Created:** February 1, 2026  
**All flows shown are implemented and tested**
