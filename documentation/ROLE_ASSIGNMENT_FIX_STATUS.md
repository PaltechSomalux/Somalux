# Role Assignment Fix - Status Report

## Issue
The role assignment functionality was working on the backend but:
1. Users weren't seeing the admin/editor buttons after role assignment
2. 400 errors appearing for profile queries trying to fetch non-existent `role` column

## Root Causes Identified

### 1. Missing Database Column
The `role` column doesn't exist in the Supabase `profiles` table yet. The code was trying to fetch it, causing 400 errors.

**Status**: ✅ Migration SQL created, needs to be executed in Supabase dashboard

### 2. User Profile Not Refreshing After Role Change
Both BookPanel.jsx and Pastpapers.jsx were caching the user profile at initial load and never updating it when the role was changed in the admin panel.

**Status**: 🔧 Partially Fixed
- ✅ BookPanel.jsx: Realtime listener added (will work once role column exists)
- ✅ Pastpapers.jsx: Realtime listener added (will work once role column exists)
- 🔧 Queries updated to be defensive (don't fetch role until column exists)

## Changes Made

### 1. Database Migration
**File**: `ADD_MISSING_COLUMNS.sql` (updated)

Added:
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';
```

**How to Run**: See [MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md)

### 2. BookPanel.jsx
**Lines**: ~861-890, ~1020-1055

**Changes**:
- Removed `role` from initial select query (to avoid 400 errors)
- Made profile fetch error handling more graceful
- Preserved realtime listener for when role column is added
- Realtime listener listens for UPDATE events on profiles table and updates user state

### 3. Pastpapers.jsx
**Lines**: ~405-430, ~433-450, ~453-500

**Changes**:
- Removed `role` from both initial check and auth listener select queries
- Made profile fetch error handling more graceful
- Added realtime listener for profile updates
- Realtime listener listens for UPDATE events on profiles table and updates user state

## How the Role System Works (After Migration)

### When a role is assigned:
1. Admin clicks "Make Admin" or "Make Editor" in Users panel (in Books)
2. Backend updates the `profiles.role` column in Supabase
3. Supabase sends a postgres_changes event (realtime)
4. BookPanel's realtime listener receives the event and updates user state
5. Pastpapers' realtime listener receives the event and updates user state
6. Admin/Editor buttons appear immediately without page reload

### Components Affected:
- **BookPanel.jsx**: Shows admin button (line 2734) when `user?.role === 'admin'`
- **PaperGrid.jsx** (used in Pastpapers.jsx): Shows admin button (line 124) when `user?.role === 'admin'`

## Next Steps

### 1. Execute the Migration (CRITICAL)
You MUST run the ADD_MISSING_COLUMNS.sql migration in your Supabase dashboard to add the `role` column.

See [MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md) for detailed steps.

### 2. Test After Migration
1. Assign a role to a user in the admin panel
2. Verify the admin/editor button appears immediately in BookPanel
3. Verify the admin/editor button appears immediately in PaperGrid
4. No page reload should be needed

### 3. If Errors Still Occur
- Check that the migration was successfully applied
- Check browser console for specific error messages
- Verify the `profiles` table has the `role` column using:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'profiles' AND column_name = 'role';
  ```

## Files Modified
- ✅ `src/SomaLux/Books/BookPanel.jsx` - Defensive queries + realtime listener
- ✅ `src/SomaLux/PastPapers/Pastpapers.jsx` - Defensive queries + realtime listener
- ✅ `ADD_MISSING_COLUMNS.sql` - Added role column migration
- ✅ `MIGRATION_INSTRUCTIONS.md` - Created migration guide

## Important Notes

1. **The code is now defensive**: Even if the `role` column doesn't exist, the app won't crash - it just won't show role-based features until the migration is run.

2. **Realtime listeners are active**: Once the migration adds the `role` column, the realtime listeners will automatically pick up changes without needing any code modifications.

3. **Default role is 'viewer'**: If the role column doesn't exist, users default to 'viewer' role (not admin/editor functionality).

4. **Backward compatible**: Once the migration is applied, both existing users (defaulting to 'viewer') and new users will work correctly.
