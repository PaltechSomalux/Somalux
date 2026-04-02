# Database Migration - URGENT FIX for 400 Errors

## Current Status: 🔴 CRITICAL

You're still getting 400 errors because the database migration has NOT been run yet. The `profiles` table is either:
1. Missing required columns
2. Missing RLS (Row Level Security) policies
3. Not properly configured

## IMMEDIATE ACTION REQUIRED

### Step 1: Open Your Supabase Dashboard

Go to: https://supabase.com/dashboard

### Step 2: Run the COMPREHENSIVE Migration

1. Click on your project
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the ENTIRE contents from `COMPREHENSIVE_MIGRATION.sql` and paste it
5. Click **Run** button (or press Ctrl+Enter)

**Why use COMPREHENSIVE_MIGRATION.sql instead of ADD_MISSING_COLUMNS.sql?**
- It creates the profiles table from scratch if needed
- It handles RLS policies
- It's more robust and handles all edge cases

### Step 3: Verify the Migration Worked

After running COMPREHENSIVE_MIGRATION.sql, you should see:
- ✅ "Query successful" message
- Results showing your profiles table structure
- At least one row in the verification query

**If you see errors**, note the exact error message and:
1. Check if the `profiles` table exists
2. Check if RLS policies are blocking access
3. Verify your user has proper permissions

## What Gets Fixed

✅ Creates profiles table (if it doesn't exist)
✅ Adds subscription_tier column
✅ Adds subscription_started_at column  
✅ Adds subscription_expires_at column
✅ Adds role column (for admin/editor functionality)
✅ Adds last_active_at column
✅ Creates performance indexes
✅ Enables RLS (Row Level Security)
✅ Adds RLS policies for read access

## After Running the Migration

The following errors will be fixed:
```
Failed to load resource: the server responded with a status of 400
```

And these will start working:
- 👤 User profile loading
- 🔑 Role assignment and display
- 📊 Subscription tier tracking
- ⏰ Last active tracking
- 🔒 Secure data access via RLS

## Troubleshooting

### If you get: "relation 'public.profiles' does not exist"
This means the profiles table doesn't exist. The COMPREHENSIVE_MIGRATION.sql will create it.

### If you get: "column already exists"
This is normal and expected. The `IF NOT EXISTS` clause handles this.

### If queries still return 400 errors after migration
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check that all columns were created:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   ORDER BY column_name;
   ```

### If you see "permission denied" errors
You might need to grant permissions to the service role:
```sql
GRANT ALL PRIVILEGES ON TABLE profiles TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

## Files Reference

- **COMPREHENSIVE_MIGRATION.sql** - Use this if profiles table doesn't exist
- **ADD_MISSING_COLUMNS.sql** - Simpler version if table already exists
- **MIGRATION_INSTRUCTIONS.md** - Original instructions

## Next Steps After Migration

1. ✅ Run the migration (CRITICAL)
2. ✅ Verify migration succeeded
3. ✅ Clear browser cache and refresh
4. ✅ Errors should be gone
5. ✅ Test role assignment and immediate visibility
