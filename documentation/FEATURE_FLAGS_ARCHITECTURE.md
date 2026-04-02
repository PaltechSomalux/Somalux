# Feature Flags System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSERS                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React Application                                           │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Component 1     Component 2     Component 3           │  │  │
│  │  │  useFeatureFlag  useFeatureFlag  useFeatureFlag        │  │  │
│  │  │    'dark_mode'     'new_ui'        'analytics'         │  │  │
│  │  └────────────────────┬─────────────────────────────────┘  │  │
│  │                       │                                      │  │
│  │              ┌────────▼────────┐                            │  │
│  │              │FeatureFlagsCtx  │◄─┐                         │  │
│  │              │ (Provider)      │  │                         │  │
│  │              └────────┬────────┘  │                         │  │
│  │                       │           │                         │  │
│  │  ┌────────────────────▼──────────┐│                         │  │
│  │  │  features = {                 ││                         │  │
│  │  │    dark_mode: {...}           ││                         │  │
│  │  │    new_ui: {...}              ││ Updates on change       │  │
│  │  │    analytics: {...}           ││                         │  │
│  │  │  }                            ││                         │  │
│  │  └───────────────────────────────┘│                         │  │
│  │                                   │                         │  │
│  └───────────────────────────────────┼─────────────────────────┘  │
│                                      │                            │
│    ┌─────────────────────────────────▼──────────────────────┐    │
│    │ Service Worker (Smart Caching)                         │    │
│    │ - Network-first for /api/features                      │    │
│    │ - Cache-first for static assets                        │    │
│    │ - Auto-invalidate on feature update                    │    │
│    │ - localStorage: app_features_cache (5 min TTL)         │    │
│    └─────────────────────┬──────────────────────────────────┘    │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          │                │                │
          ▼                ▼                ▼
    ┌─────────────┐   ┌──────────┐   ┌─────────────┐
    │ Fetch API   │   │WebSocket │   │IndexedDB/   │
    │/api/features│   │Updates   │   │localStorage │
    │ (Network)   │   │(Real-time)   │ (Cache)    │
    └──────┬──────┘   └────┬─────┘   └─────────────┘
           │               │
           └───────┬───────┘
                   │
                   ▼
    ┌──────────────────────────────────────────┐
    │        BACKEND (Express.js)              │
    │                                          │
    │  ┌────────────────────────────────────┐  │
    │  │ Feature Flags Routes               │  │
    │  │ GET    /api/features               │  │
    │  │ GET    /api/features/check/:key    │  │
    │  │ POST   /api/features               │  │
    │  │ POST   /api/features/:key/rollout  │  │
    │  │ DELETE /api/features/:key          │  │
    │  └────────────────────┬───────────────┘  │
    │                       │                  │
    │  ┌────────────────────▼───────────────┐  │
    │  │ WebSocket Server                   │  │
    │  │ - Broadcasts feature updates       │  │
    │  │ - Notifies all connected clients   │  │
    │  └────────────────────┬───────────────┘  │
    │                       │                  │
    └───────────────────────┼──────────────────┘
                            │
                    ┌───────▼────────┐
                    │   Supabase     │
                    │   PostgreSQL   │
                    │                │
                    │ Tables:        │
                    │ - feature_flags│
                    │ - feature_flag │
                    │   _events      │
                    └────────────────┘
```

## Data Flow: User Loads App

```
1. User opens app
   │
   ├─ Service Worker registered
   │
   ├─ React mounts, FeatureFlagsProvider initializes
   │
   ├─ Check localStorage for cached features
   │  └─ Found? Use cache (TTL check)
   │  └─ Expired? Fetch fresh
   │
   ├─ Fetch /api/features from backend
   │  ├─ Pass user_id, user_tier in params
   │  └─ Backend filters based on:
   │     ├─ enabled = true
   │     ├─ user_tier ≥ min_tier
   │     └─ rollout_percentage (consistent hash)
   │
   ├─ Backend returns features
   │
   ├─ Service Worker caches response
   │
   ├─ React Context updates features state
   │
   ├─ Components re-render with useFeatureFlag hooks
   │
   └─ Setup WebSocket listener for real-time updates
```

## Data Flow: Admin Updates Feature

```
1. Admin clicks "Enable dark_mode" in dashboard
   │
   ├─ Frontend POST /api/features with updated data
   │
   ├─ Backend validates and saves to database
   │  └─ feature_flags table updated
   │  └─ feature_flag_events table: log change
   │
   ├─ Backend broadcasts via WebSocket
   │  ├─ Message: { type: 'feature_update', feature: {...} }
   │  └─ To: all connected clients
   │
   ├─ All connected browsers receive message
   │  │
   │  ├─ Service Worker receives push (if using push API)
   │  │  └─ Clear features cache
   │  │
   │  ├─ FeatureFlagsContext receives via WebSocket handler
   │  │  └─ Calls refreshFeatures()
   │  │
   │  ├─ Frontend fetches fresh /api/features
   │  │
   │  ├─ Updates localStorage with new features
   │  │
   │  └─ All useFeatureFlag hooks update
   │     └─ Components re-render instantly
   │
   └─ Admin dashboard updates UI without refresh
```

## User Tier System

```
User Tier Hierarchy:
  free     ≤ pro     ≤ premium
    0            1            2

Feature min_tier = 'pro':
  free user:    NOT AVAILABLE (tier 0 < 1)
  pro user:     AVAILABLE (tier 1 = 1)
  premium user: AVAILABLE (tier 2 > 1)
```

## Rollout Percentage System

```
Feature: dark_mode
Rollout: 50%

For each user:
  hash = MD5(user_id + feature_id)
  value = int(hash[0:8], 16) % 100
  
  User A: hash=abc123... → value=45 → 45 < 50 ✓ ENABLED
  User B: hash=def456... → value=75 → 75 > 50 ✗ DISABLED
  User C: hash=ghi789... → value=20 → 20 < 50 ✓ ENABLED

Same user always gets same result (consistent hashing)
```

## Cache Strategy

```
┌─────────────────────────────────────────────────┐
│          Request for Resource                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │ Is /api/?    │
         └──────┬───────┘
                │
         Yes    │    No
         ┌──────┴──────┐
         │             │
         ▼             ▼
    ┌────────┐    ┌──────────┐
    │Network-│    │ Cache-   │
    │ First  │    │  First   │
    │        │    │          │
    │ Try    │    │ Try      │
    │Network │    │ Cache    │
    │ ↓      │    │ ↓        │
    │Cache   │    │ Network  │
    │ ↓      │    │ ↓        │
    │Error→  │    │ Error→   │
    │ Old    │    │ Error    │
    └────────┘    └──────────┘
```

## Real-time Update Flow with WebSocket

```
Admin Makes Change
       │
       ▼
Frontend: POST /api/features
       │
       ▼
Backend: Save to DB
       │
       ├─ Broadcast via WebSocket
       │  └─ To all clients: 
       │     { type: 'feature_update', feature: {...} }
       │
       ├─ Clients receive message
       │
       ├─ Service Worker: Clear features cache
       │
       ├─ FeatureFlagsContext: Refresh features
       │
       ├─ useFeatureFlag hooks: Update
       │
       └─ Components: Re-render
```

## Offline Mode

```
Online Mode:
  ┌─────────────────────────────────────┐
  │ Fetch /api/features (Network-first) │
  └────────────┬────────────────────────┘
               │
        ┌──────▼──────┐
        │ Network OK? │
        └──┬───────┬──┘
      Yes  │       │  No
           ▼       ▼
      ┌────────┐ ┌────────────┐
      │ Return │ │Use cached  │
      │Fresh   │ │features    │
      │Data    │ │from Service│
      └────────┘ │Worker      │
                 └────────────┘

Offline Mode (No Network):
  ┌──────────────────┐
  │ Network Down     │
  └────┬─────────────┘
       │
       ▼
  ┌─────────────────────────────────┐
  │ Service Worker: Use Cache-First │
  └────┬────────────────────────────┘
       │
       ├─ IndexedDB cached features
       │ └─ Last 5 minutes
       │
       ├─ localStorage fallback
       │ └─ Last 5 minutes
       │
       └─ Offline features available
          App continues to work
```

## Feature Flag State Machine

```
         ┌─────────────────┐
         │   NOT ENABLED   │
         │ (enabled: false)│
         └────────┬────────┘
                  │
                  │ Admin: Enable
                  │ & set rollout 10%
                  │
                  ▼
         ┌──────────────────────┐
         │  GRADUAL ROLLOUT     │
         │  rollout: 10-99%     │
         └─────┬────────────────┘
               │
        ┌──────┴─────────┐
        │ Increase %     │
        │ 10% ──────────>▼ 25%
        │                │
        │                ▼
        │              50%
        │                │
        │                ▼
        │              99%
        │
        └────────────────┐
                         │ Increase to 100%
                         ▼
            ┌──────────────────────┐
            │  FULLY ENABLED       │
            │  rollout: 100%       │
            │  All users see it    │
            └──────────┬───────────┘
                       │
                       │ (Later) Disable
                       │
                       ▼
            ┌──────────────────────┐
            │  DISABLED            │
            │  enabled: false      │
            │  Hide from all users │
            └──────────────────────┘
```

## Component Rendering Flow

```
App Component Mounts
       │
       ▼
FeatureFlagsProvider Mount
       │
       ├─ Load from localStorage cache
       │
       ├─ Fetch /api/features
       │
       ├─ Setup WebSocket listener
       │  └─ On message: refresh features
       │
       ├─ Setup periodic refresh timer (10 min)
       │
       └─ Set loading: false
          (Components can now render)

       │
       ▼
Child Components Mount
       │
       ├─ useFeatureFlag('dark_mode')
       │
       ├─ Get from context.features
       │
       └─ Render with enabled status

Feature Changes on Backend
       │
       ├─ WebSocket message received
       │
       ├─ Trigger refreshFeatures()
       │
       ├─ Fetch fresh /api/features
       │
       ├─ Update context.features
       │
       └─ Re-render all useFeatureFlag hooks
          (Instant, no page refresh)
```

## Authentication & Authorization

```
Public Endpoints:
  GET /api/features
  GET /api/features/check/:key
  └─ Anyone can use
  └─ Filtered by user_id & tier
  └─ No auth required

Admin Endpoints (Need Auth):
  POST /api/features
  POST /api/features/:key/rollout
  DELETE /api/features/:key
  └─ Require admin authentication
  └─ Validate in middleware
  └─ Log changes to audit table
```

## Error Handling & Fallbacks

```
Feature Load Fails
       │
       ├─ Network error
       │
       ├─ Try localStorage cache
       │
       ├─ Cache found?
       │  ├─ Yes: Use cache (show stale-data warning)
       │  └─ No: Use empty features {}
       │
       └─ App continues with safe defaults
          (Features disabled = backward compatible)
```

---

This system is designed to be **resilient**, **scalable**, and **user-friendly** for feature deployment!
