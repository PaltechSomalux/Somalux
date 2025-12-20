# ⚡ Quick Start Guide - 10 Minutes to Operational

Get your SomaLux Supabase database running in 10 minutes.

---

## Step 1: Get Credentials (2 minutes)

1. Go to https://supabase.com/dashboard
2. Select your SomaLux project
3. Click **Settings** → **API**
4. Copy and save:
   - Project URL → `SUPABASE_URL`
   - Anon Key → `SUPABASE_ANON_KEY`
   - Service Role → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Configure Environment (1 minute)

Edit `backend/.env`:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Step 3: Run Migrations (3 minutes)

```bash
cd backend/migrations
node run-migrations.js
```

Wait for success message:
```
✅ Successful: 3
❌ Failed: 0
🎉 All migrations applied successfully!
```

---

## Step 4: Create Storage Buckets (2 minutes)

In Supabase Dashboard → **Storage** → **New Bucket**:

Create 5 buckets:
1. `book-covers` (Public)
2. `book-files` (Private)
3. `past-papers` (Private)
4. `user-avatars` (Public)
5. `ads` (Public)

---

## Step 5: Verify Setup (2 minutes)

```bash
cd backend/utils
node verify-setup.js
```

Expected: **80%+ score** ✅

---

## 🎉 Done!

Your database is ready:
- ✅ 23 tables created
- ✅ 50+ functions deployed
- ✅ Sample data loaded
- ✅ RLS policies active

---

## What You Can Do Now

### Frontend
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey);

const { data } = await supabase
  .from('books')
  .select('*')
  .eq('status', 'published')
  .limit(6);
```

### Backend
```javascript
import { Database } from './utils/supabase-integration.js';

const { data } = await Database.Books.searchBooks('python');
const stats = await Database.Admin.getSystemHealth();
```

### Database
Query directly in Supabase SQL Editor:

```sql
-- Get system stats
SELECT * FROM get_system_health_stats();

-- See sample books
SELECT title, author FROM books LIMIT 5;

-- Check rankings
SELECT rank, total_score FROM user_rankings LIMIT 10;
```

---

## 📋 Detailed Guides

| Document | For | Time |
|----------|-----|------|
| `SETUP_GUIDE.md` | Complete walkthrough | 30 min |
| `SUPABASE_CHECKLIST.md` | Phase-by-phase setup | 2-3 hours |
| `README.md` | Overview & features | 10 min |
| `api-reference.js` | API endpoints | Reference |

---

## 🆘 Troubleshooting

### Error: "SUPABASE_URL is missing"
→ Check `.env` file has credentials

### Error: "Connection refused"
→ Verify URL is correct

### Migration shows "0 pending migrations"
→ Good! Already applied

### Test connection:
```bash
node backend/utils/verify-setup.js
```

---

## 🚀 Next Steps

1. ✅ Configure authentication providers
   - Go to Auth → Providers
   - Enable Email, Google OAuth

2. ✅ Deploy frontend
   - Set REACT_APP_SUPABASE_URL
   - Set REACT_APP_SUPABASE_ANON_KEY

3. ✅ Deploy backend
   - Set SUPABASE_URL
   - Set SUPABASE_SERVICE_ROLE_KEY

4. ✅ Monitor production
   - Go to Database → Usage
   - Watch metrics

---

## 📞 Need Help?

- 📖 Read `backend/migrations/SETUP_GUIDE.md`
- ✅ Run `node backend/utils/verify-setup.js`
- 💬 Check Supabase Discord: https://discord.supabase.com
- 🐛 Review troubleshooting section

---

**You're all set! Your database is now operational. 🎉**
