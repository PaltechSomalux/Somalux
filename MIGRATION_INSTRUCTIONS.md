# Database Migration: Add Role Column

## Problem
The application is trying to fetch a `role` column from the `profiles` table that doesn't exist yet, causing 400 errors.

## Solution
Run the migration to add the missing `role` column to the profiles table.

## How to Run the Migration

### Option 1: Using Supabase Web Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste this SQL:

```sql
-- Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
```

6. Click **Run** (or Cmd+Enter / Ctrl+Enter)
7. You should see a result showing the role column exists

### Option 2: Using psql Command Line

```bash
# First, get your Supabase connection string from:
# https://supabase.com/dashboard/project/[your-project]/settings/database

psql "postgresql://postgres.xxxxxxxxxxxxxxxxxxxx:password@db.xxxxxxxxxxxxxxxxxxxx.supabase.co:5432/postgres" < ADD_MISSING_COLUMNS.sql
```

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Verify the Migration

After running the migration, verify it worked by running this query in the Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
```

You should see:
```
column_name | data_type
role        | text
```

## After Migration

Once the migration is complete:

1. The errors should stop appearing
2. Role assignments will be immediately visible when assigned in the admin panel
3. Admin and Editor buttons will appear correctly for users with those roles

## Code Changes Made

The frontend code has been updated to be defensive:
- **BookPanel.jsx**: Removed `role` from initial select query (will only select it once column exists)
- **Pastpapers.jsx**: Removed `role` from initial select query (will only select it once column exists)
- Both components still initialize user role to 'viewer' as a fallback

Once the database column is added, the full realtime update system will be active.
