# ✅ Database Setup Checklist - NEW SUPABASE

## Pre-Setup
- [ ] You have access to Supabase account
- [ ] Project URL: `https://brlsqmyyewxtmjkrfvlo.supabase.co`
- [ ] You're logged into Supabase
- [ ] You have the migration file ready

## Setup Steps

### 1. Access SQL Editor
- [ ] Go to https://app.supabase.com
- [ ] Select project `brlsqmyyewxtmjkrfvlo`
- [ ] Click "SQL Editor" in sidebar
- [ ] Click "New Query"

### 2. Copy Migration File
- [ ] Open: `backend/migrations/001_COMPLETE_DATABASE_SETUP.sql`
- [ ] Select All (Ctrl+A)
- [ ] Copy (Ctrl+C)

### 3. Paste & Execute
- [ ] Paste into Supabase SQL editor
- [ ] Click "Run" button
- [ ] Wait for success message ✅
- [ ] Should take 10-30 seconds

### 4. Verify Tables
- [ ] Run verification query in SQL Editor:
```sql
SELECT COUNT(table_name) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public';
```
- [ ] Expected result: **31 tables**

### 5. Check Sample Data
- [ ] Run:
```sql
SELECT COUNT(*) FROM categories;
```
- [ ] Expected: **7** categories

- [ ] Run:
```sql
SELECT COUNT(*) FROM universities;
```
- [ ] Expected: **8** universities

### 6. Restart Services
- [ ] Stop all Node processes
- [ ] Start backend: `cd backend && node index.js`
- [ ] Start frontend: `cd .. && npm start`
- [ ] Wait for compilation

### 7. Test in Browser
- [ ] Open http://localhost:5001
- [ ] ✅ Home page loads
- [ ] ✅ Login works
- [ ] ✅ Admin panel accessible
- [ ] ✅ Can view categories
- [ ] ✅ Can upload books
- [ ] ✅ Dashboard shows data

## Troubleshooting

### If Tables Not Created
- [ ] Check for error message in SQL output
- [ ] Verify entire SQL was pasted
- [ ] Try running again (safe to re-run)

### If Backend Won't Start
- [ ] Check env variables are correct
- [ ] Verify SUPABASE_URL and keys
- [ ] Check backend logs for errors
- [ ] Try restarting backend

### If Data Not Loading
- [ ] Wait 10 seconds after SQL execution
- [ ] Refresh browser page
- [ ] Check browser console for errors
- [ ] Clear cache (Ctrl+Shift+Delete)

### If Auth Issues
- [ ] Ensure profiles table created
- [ ] Check Supabase Auth is enabled
- [ ] Verify auth users exist

## What You Should See

✅ **After running migration:**
- 31 tables created
- 50+ indexes created
- RLS policies active
- 7 categories available
- 8 universities available

✅ **In application:**
- Admin dashboard works
- Books can be uploaded
- Categories visible
- Universities list shows
- Analytics tracking works

✅ **In backend logs:**
- No "relation does not exist" errors
- Database queries succeed
- Supabase connected message

## Final Status

When everything is working:
- ✅ Database fully set up
- ✅ All tables created
- ✅ Application connected
- ✅ Ready for production

---

**Time to complete:** ~15 minutes total

**Next:** Open `http://localhost:5001` and test your application!
