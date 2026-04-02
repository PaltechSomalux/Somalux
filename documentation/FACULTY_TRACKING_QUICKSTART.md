# Faculty Tracking - Quick Start (5 Minutes)

## TL;DR
Faculty grid now shows **consistent view/like counts across all browsers and users** by syncing to Supabase database instead of only localStorage.

## What You Need to Do

### 1️⃣ Run the Database Migration (2 minutes)
```sql
/* Copy-paste entire file: sql/CREATE_FACULTY_TRACKING.sql */
```

**How:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** tab
4. Click **New Query**
5. Copy-paste the entire contents of `sql/CREATE_FACULTY_TRACKING.sql`
6. Click **RUN** button
7. ✅ Wait for success message

**What it does:**
- Creates `faculty_views` table
- Creates `faculty_likes` table  
- Creates `get_faculty_like_counts()` RPC function
- Sets up RLS security policies
- Grants permissions to authenticated users

### 2️⃣ Deploy the Frontend Code (1 minute)
The code is already updated. Just deploy normally:
```bash
# Your usual deployment command
git push origin main
# or
npm run deploy
# or
your-ci/cd-pipeline
```

**What changed:**
- `src/SomaLux/PastPapers/Pastpapers.jsx` - Syncs to database

### 3️⃣ Test (2 minutes)

#### Quick Test
1. Open two different browsers
2. Login as same user
3. Select "Engineering" faculty in Browser A
4. Refresh Browser B
5. ✅ View count should be the same in both browsers

#### Like Test
1. User A likes "Engineering"
2. User B logs in
3. ✅ Both see same like count (e.g., "♥ 5")

## Verify It's Working

### In Browser Console
```javascript
// You should see no errors like:
// "get_faculty_like_counts is not a function"
// "permission denied"
// etc
```

### In Supabase Dashboard
Go to **Table Editor** → see data being recorded:
- `faculty_views` table growing as users select faculties
- `faculty_likes` table growing as users like faculties

## What Happens Now

### User Selects Faculty
✅ View count incremented in database
✅ Same count shows across browsers

### User Likes Faculty  
✅ Like recorded in database
✅ Same like count shows to all users
✅ Heart icon fills/empties based on database

### Fresh Page Load
✅ Data loads from database (not just localStorage)
✅ Consistent counts across browser refreshes

## Troubleshooting (1 minute)

### Problem: "Function get_faculty_like_counts not found"
**Solution:** Make sure you ran the ENTIRE `CREATE_FACULTY_TRACKING.sql` file, including the bottom section where the RPC function is created.

### Problem: "Permission denied" errors
**Solution:** Verify RLS policies are enabled. Run this in Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('faculty_views', 'faculty_likes');
```
Both should show `true` for rowsecurity.

### Problem: Data not syncing to database
**Solution:** Check user is authenticated (console.log(user?.id) should show UUID). Anonymous users save to localStorage only.

### Problem: Still getting different counts across browsers
**Solution:** 
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear localStorage: `localStorage.clear()`
3. Log out and log back in
4. Check browser network tab for 200 responses (no 401/403 errors)

## Files Modified

```
✅ src/SomaLux/PastPapers/Pastpapers.jsx
   - Added useEffect to load data from DB
   - Updated handleFacultySelect to upsert views
   - Updated handleToggleFacultyLike to sync likes
   
✅ sql/CREATE_FACULTY_TRACKING.sql (NEW)
   - Database schema
   - RLS policies
   - RPC function
   
📖 FACULTY_TRACKING_SETUP.md (NEW)
   - Comprehensive setup guide
   
📖 FACULTY_TRACKING_DEPLOYMENT.md (NEW)
   - Deployment checklist
   
📖 FACULTY_TRACKING_VISUAL_GUIDE.md (NEW)
   - Architecture diagrams
```

## Rollback (if something breaks)

```sql
-- Run in Supabase SQL Editor to revert
DROP FUNCTION IF EXISTS get_faculty_like_counts();
DROP TABLE IF EXISTS public.faculty_likes;
DROP TABLE IF EXISTS public.faculty_views;
```

Then revert `Pastpapers.jsx` to previous version in git.

## Success Indicators ✅

- [ ] SQL migration runs without errors
- [ ] No console errors in browser
- [ ] View counts match across browsers
- [ ] Like counts are aggregated (same for all users)
- [ ] Fresh page loads show saved data from database
- [ ] data.faculty_views and data.faculty_likes tables have records

## Questions?

See detailed guides:
- 📖 [FACULTY_TRACKING_SETUP.md](./FACULTY_TRACKING_SETUP.md) - Full setup with troubleshooting
- 📖 [FACULTY_TRACKING_DEPLOYMENT.md](./FACULTY_TRACKING_DEPLOYMENT.md) - Step-by-step deployment  
- 📖 [FACULTY_TRACKING_VISUAL_GUIDE.md](./FACULTY_TRACKING_VISUAL_GUIDE.md) - Architecture diagrams
- 📖 [FACULTY_TRACKING_COMPLETE.md](./FACULTY_TRACKING_COMPLETE.md) - Complete overview

---

**Time to Complete:** ~5 minutes
**Complexity:** Low
**Risk Level:** Low (RLS protects data, localStorage fallback)
**Impact:** High (fixes data consistency across browsers/users)

✅ **Ready to Deploy!**
