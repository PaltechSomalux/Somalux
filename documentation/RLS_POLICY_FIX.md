# RLS (Row Level Security) Policy Fix

If you're still getting 400 errors after running the migration, the issue might be **Row Level Security policies**.

## Quick RLS Policy Setup

If you have strict RLS policies that are blocking access, run this in your Supabase SQL Editor:

```sql
-- Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- Disable RLS temporarily to debug (if needed)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Or create permissive policies for authenticated users
-- Policy 1: Allow authenticated users to read their own profile
CREATE POLICY "Allow users to read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Allow authenticated users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Policy 3: Allow service role (backend) to do everything
CREATE POLICY "Allow service role full access"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

## Understanding the 400 Error

A 400 (Bad Request) error from Supabase typically means:

1. **RLS Policy blocked the query** - Most common
   - User doesn't have permission to read their own profile
   - Service role doesn't have permission to read all profiles

2. **Invalid column in SELECT clause**
   - Trying to select a column that doesn't exist
   - This is why we made the code defensive

3. **Malformed query**
   - Invalid filter syntax
   - Invalid data types

## Debugging Steps

1. Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
```

2. Check all RLS policies:
```sql
SELECT policyname, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
```

3. Check if profiles table exists and has data:
```sql
SELECT COUNT(*) as total FROM public.profiles;
SELECT * FROM public.profiles LIMIT 1;
```

4. Try a simple query with RLS disabled:
```sql
-- Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Now try the query in your app
-- Then re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

## If Still Getting 400 Errors

Try these diagnostic queries in order:

```sql
-- 1. Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'profiles'
);

-- 2. Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY column_name;

-- 3. Check data exists
SELECT COUNT(*) FROM public.profiles;

-- 4. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 5. Try basic select (might fail with RLS error)
SELECT * FROM public.profiles LIMIT 1;

-- 6. Check role permissions
SELECT * FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';
```

## Quick Disable RLS (Last Resort)

If you want to temporarily disable RLS to verify that's the issue:

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

⚠️ **WARNING**: This is a security risk. Only do this for debugging. Re-enable it after:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

## Common RLS Issues

| Issue | Solution |
|-------|----------|
| User can't read their own profile | Add SELECT policy with `auth.uid() = id` |
| Backend can't read all profiles | Add service_role policy with `auth.role() = 'service_role'` |
| All queries blocked | Check if policies use AND vs OR |
| Column not visible | Column might need explicit SELECT grant |

## Contact Support

If after running COMPREHENSIVE_MIGRATION.sql and setting RLS policies you still get errors:

1. Note the exact error message
2. Check the browser Network tab for the full request/response
3. Get the request URL (shows which columns are being selected)
4. Run the diagnostic queries above
5. Contact Supabase support with this information
