# 🎯 SomaLux Supabase Setup Checklist

Complete step-by-step checklist to get your system fully operational.

## Phase 1: Prerequisites ✓

### 1.1 Supabase Account Setup
- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project named "SomaLux"
- [ ] Set strong database password
- [ ] Select region closest to your users
- [ ] Wait for project to initialize (2-3 minutes)

### 1.2 API Credentials
- [ ] Go to Settings → API
- [ ] Copy Project URL
- [ ] Copy `anon public` API key
- [ ] Copy `service_role secret` key
- [ ] Save credentials securely

### 1.3 Environment Setup
- [ ] Navigate to `backend/` directory
- [ ] Check `.env` file exists
- [ ] Update `.env` with Supabase credentials:
  ```
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  ```
- [ ] Never commit `.env` to git
- [ ] Use `.env.example` as template

### 1.4 Node.js Setup
- [ ] Check Node.js version (16+ required): `node --version`
- [ ] Check npm version: `npm --version`
- [ ] Run `npm install` in backend directory
- [ ] Verify @supabase/supabase-js installed

---

## Phase 2: Database Setup 🏗️

### 2.1 Verify Migration Files
- [ ] Check `backend/migrations/` directory
- [ ] Confirm `001_initial_schema.sql` exists (30 KB)
- [ ] Confirm `002_functions_triggers.sql` exists (25 KB)
- [ ] Confirm `003_sample_data.sql` exists (8 KB)
- [ ] Confirm `run-migrations.js` exists (10 KB)
- [ ] All files have content (no empty files)

### 2.2 Run Automatic Migrations
```bash
cd backend/migrations
node run-migrations.js
```

- [ ] Command executes without fatal errors
- [ ] Script detects 3 pending migrations
- [ ] All 3 migrations marked as successful
- [ ] No "Failed" migrations reported
- [ ] Final message shows "🎉 All migrations applied successfully!"

### 2.3 Verify Schema Created
In Supabase Dashboard → SQL Editor, run:

```sql
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public';
```

- [ ] Query returns at least 23 tables
- [ ] Check specific tables exist:
  - [ ] profiles
  - [ ] books
  - [ ] categories
  - [ ] reading_sessions
  - [ ] user_reading_stats
  - [ ] subscriptions
  - [ ] ads
  - [ ] audit_logs
  - [ ] universities
  - [ ] past_papers

### 2.4 Verify Functions Created
In Supabase Dashboard → SQL Editor:

```sql
SELECT COUNT(*) as function_count 
FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
```

- [ ] Query shows 50+ functions created
- [ ] Check specific functions:
  - [ ] update_updated_at_column
  - [ ] calculate_user_ranking_score
  - [ ] update_book_rating
  - [ ] check_user_achievements
  - [ ] get_system_health_stats

---

## Phase 3: Storage Buckets 🗂️

### 3.1 Create Buckets
In Supabase Dashboard → Storage → Buckets:

#### Bucket 1: book-covers
- [ ] Name: `book-covers`
- [ ] Public: Yes ✅
- [ ] File size limit: 500 MB
- [ ] Created successfully

#### Bucket 2: book-files
- [ ] Name: `book-files`
- [ ] Public: No ❌
- [ ] File size limit: 500 MB
- [ ] Created successfully

#### Bucket 3: past-papers
- [ ] Name: `past-papers`
- [ ] Public: No ❌
- [ ] File size limit: 500 MB
- [ ] Created successfully

#### Bucket 4: user-avatars
- [ ] Name: `user-avatars`
- [ ] Public: Yes ✅
- [ ] File size limit: 10 MB
- [ ] Created successfully

#### Bucket 5: ads
- [ ] Name: `ads`
- [ ] Public: Yes ✅
- [ ] File size limit: 100 MB
- [ ] Created successfully

### 3.2 Configure Bucket Policies
For each public bucket, set policies in Settings:

```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (true);
```

- [ ] book-covers allows public read
- [ ] user-avatars allows public read
- [ ] ads allows public read
- [ ] book-files allows authenticated read
- [ ] past-papers allows authenticated read

---

## Phase 4: Authentication 🔐

### 4.1 Configure Providers
In Supabase Dashboard → Authentication → Providers:

- [ ] Email Provider
  - [ ] Enabled ✅
  - [ ] Auto confirm enabled (for testing)
  
- [ ] Google OAuth
  - [ ] Enabled ✅
  - [ ] Client ID configured
  - [ ] Client Secret configured
  
- [ ] GitHub OAuth (Optional)
  - [ ] Enabled (optional)
  - [ ] Credentials configured

### 4.2 Configure Redirect URLs
In Supabase Dashboard → Authentication → URL Configuration:

- [ ] Site URL: `http://localhost:3000` (dev) or your domain (prod)
- [ ] Redirect URLs (add all):
  - [ ] `http://localhost:3000/**` (dev)
  - [ ] `http://localhost:5001/**` (backend)
  - [ ] `https://yourdomain.com/**` (production)
  - [ ] `https://yourdomain.com/auth/callback`

### 4.3 Email Templates (Optional)
Customize in Authentication → Email Templates:

- [ ] Confirm signup email
- [ ] Password reset email
- [ ] Invite email
- [ ] Change email address email

---

## Phase 5: Utility Files Setup 🛠️

### 5.1 Verify Utility Files
- [ ] `backend/utils/supabase-integration.js` exists
- [ ] File contains Database helper object
- [ ] File contains 50+ documented methods
- [ ] `backend/utils/api-reference.js` exists
- [ ] File contains complete API documentation

### 5.2 Test Integration Helper
Create test file `backend/test-integration.js`:

```javascript
import { Database } from './utils/supabase-integration.js';

try {
  const result = await Database.Admin.getSystemHealth();
  console.log('✅ Integration working!', result.data);
} catch (error) {
  console.error('❌ Integration failed:', error);
}
```

- [ ] Run: `node backend/test-integration.js`
- [ ] Should output system health stats
- [ ] No authentication errors
- [ ] Connection successful

---

## Phase 6: Verification 🔍

### 6.1 Run Verification Script
```bash
node backend/utils/verify-setup.js
```

Expected output sections:
- [ ] ✅ Environment Variables
  - [ ] SUPABASE_URL is set
  - [ ] SUPABASE_ANON_KEY is set
  - [ ] SUPABASE_SERVICE_ROLE_KEY is set

- [ ] ✅ Migration Files
  - [ ] 001_initial_schema.sql exists
  - [ ] 002_functions_triggers.sql exists
  - [ ] 003_sample_data.sql exists
  - [ ] run-migrations.js exists
  - [ ] SETUP_GUIDE.md exists

- [ ] ✅ Utility Files
  - [ ] supabase-integration.js exists
  - [ ] api-reference.js exists

- [ ] ✅ Supabase Connection
  - [ ] Successfully connected to Supabase
  - [ ] No authentication errors

- [ ] ✅ Database Schema
  - [ ] All 23 tables exist
  - [ ] No tables are missing

- [ ] ✅ Overall Score
  - [ ] Score should be 80% or higher
  - [ ] All critical items passed

### 6.2 Test Sample Queries
In Supabase Dashboard → SQL Editor:

```sql
-- Check system health
SELECT * FROM get_system_health_stats();
```
- [ ] Returns: total_users, total_books, total_ads, active_subscriptions

```sql
-- Check sample data loaded
SELECT COUNT(*) as book_count FROM books WHERE status = 'published';
```
- [ ] Returns: 6 (6 sample books)

```sql
-- Check categories
SELECT COUNT(*) as category_count FROM categories;
```
- [ ] Returns: 7 (7 categories)

```sql
-- Check universities
SELECT COUNT(*) as university_count FROM universities;
```
- [ ] Returns: 8 (8 universities)

```sql
-- Check schema migrations
SELECT COUNT(*) as applied_migrations FROM schema_migrations WHERE success = true;
```
- [ ] Returns: 3 (3 migrations applied)

---

## Phase 7: Frontend Integration 🎨

### 7.1 Install Supabase Client
```bash
npm install @supabase/supabase-js
```

- [ ] Package installed successfully
- [ ] Available in node_modules

### 7.2 Create Frontend Config
Create `src/config/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
```

- [ ] File created
- [ ] Imports working
- [ ] No console errors

### 7.3 Add Environment Variables
In `src/` or `.env`:

```
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

- [ ] Variables added
- [ ] No service role key exposed
- [ ] Frontend can access values

### 7.4 Test Frontend Connection
In React component:

```javascript
import { supabase } from '@/config/supabase';

useEffect(() => {
  const testConnection = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('COUNT(*)')
      .limit(1);
    
    console.log(error ? '❌ Failed' : '✅ Connected', data);
  };
  
  testConnection();
}, []);
```

- [ ] Component renders without errors
- [ ] Console shows "✅ Connected" or "❌ Failed"
- [ ] Can fetch data from database
- [ ] Authentication working if using auth

---

## Phase 8: API Integration 🔗

### 8.1 Backend Routes Updated
Verify backend/index.js includes:

```javascript
import { createRankingRoutes } from './routes/rankings.js';
import adsRouter from './routes/adsApi.js';
```

- [ ] All route imports present
- [ ] Routes mounted on app
- [ ] No import errors

### 8.2 Test API Endpoints
```bash
# Start backend server
npm start

# In another terminal, test endpoints
curl http://localhost:5001/api/books/featured?limit=3
curl http://localhost:5001/api/rankings/books?limit=10
curl http://localhost:5001/api/admin/dashboard
```

- [ ] Endpoints return valid JSON
- [ ] No 404 errors
- [ ] Data retrieved successfully
- [ ] CORS working

### 8.3 Test Authentication
- [ ] Sign up with new email
  - [ ] Confirmation email received
  - [ ] User record created in profiles
  - [ ] Tier set to 'free' by default
  - [ ] Role set to 'user' by default

- [ ] Sign in with email
  - [ ] Token generated
  - [ ] Can access protected routes

- [ ] Access protected resources
  - [ ] Get own profile data
  - [ ] Cannot access other user's data
  - [ ] RLS policies enforced

---

## Phase 9: Data Testing 📊

### 9.1 Test Book Management
- [ ] Fetch featured books
  - [ ] 6 books returned
  - [ ] All fields present
  - [ ] Images loading (if configured)

- [ ] Search books
  - [ ] Search by title works
  - [ ] Search by author works
  - [ ] Filters working (category, rating)
  - [ ] Sorting works (downloads, rating)

### 9.2 Test Reading Analytics
- [ ] Start reading session
  - [ ] Session created with timestamp
  - [ ] Book ID associated
  - [ ] User ID captured

- [ ] Update reading progress
  - [ ] Pages read updated
  - [ ] Progress percentage updated
  - [ ] Duration tracked

- [ ] Check user stats
  - [ ] Total books count updated
  - [ ] Reading minutes tracked
  - [ ] Pages read accumulated

### 9.3 Test Ranking System
- [ ] User ranking calculated
  - [ ] Score reflects activity
  - [ ] Rank assigned correctly
  - [ ] Leaderboard populated

- [ ] Book ranking
  - [ ] Downloads tracked
  - [ ] Views tracked
  - [ ] Rating calculated

### 9.4 Test Admin Features
- [ ] View system health
  - [ ] User count correct
  - [ ] Book count correct
  - [ ] Stats accurate

- [ ] View audit logs
  - [ ] Actions logged
  - [ ] Timestamps correct
  - [ ] Actor identified

---

## Phase 10: Production Readiness ✨

### 10.1 Security Review
- [ ] RLS policies enabled on all sensitive tables
- [ ] Service role key never exposed to frontend
- [ ] API keys rotated (if redeployed)
- [ ] SSL/TLS enforced
- [ ] Audit logging enabled
- [ ] Backup strategy in place

### 10.2 Performance Optimization
- [ ] All indexes created (verify with query plans)
- [ ] No N+1 query issues
- [ ] Pagination implemented
- [ ] Connection pooling enabled
- [ ] Database size monitored
- [ ] Slow queries identified and optimized

### 10.3 Monitoring Setup
- [ ] Database monitoring enabled
  - [ ] CPU usage tracked
  - [ ] Memory usage tracked
  - [ ] Disk usage tracked
  - [ ] Connection count tracked

- [ ] Query monitoring
  - [ ] Slow query log enabled
  - [ ] Query plans reviewed
  - [ ] Indexes verified

- [ ] Alerts configured
  - [ ] High CPU alert
  - [ ] Low disk space alert
  - [ ] Connection limit alert

### 10.4 Backup & Recovery
- [ ] Automated backups enabled
  - [ ] Daily backups configured
  - [ ] Retention period set to 30+ days
  - [ ] Test restore procedure

- [ ] Disaster recovery plan
  - [ ] Documented recovery steps
  - [ ] Backup locations verified
  - [ ] Tested restoration process

### 10.5 Documentation
- [ ] SETUP_GUIDE.md reviewed and understood
- [ ] API reference documentation complete
- [ ] Database schema documented
- [ ] Troubleshooting guide prepared
- [ ] Team onboarded with documentation

---

## Final Verification ✅

Run this final check:

```bash
# Verify all migrations applied
node backend/utils/verify-setup.js

# Expected: 80%+ passing score
# All critical items should be ✅
```

### Checklist Summary
- [ ] ✅ All 10 phases completed
- [ ] ✅ 23 database tables created
- [ ] ✅ 50+ functions and triggers working
- [ ] ✅ 5 storage buckets configured
- [ ] ✅ Authentication setup complete
- [ ] ✅ RLS policies active
- [ ] ✅ Sample data loaded
- [ ] ✅ Integration tested
- [ ] ✅ API endpoints working
- [ ] ✅ Production ready

---

## 🎉 You're All Set!

Your SomaLux Supabase database is now:

✅ **Fully configured** - All tables, functions, and policies in place  
✅ **Secured** - RLS enforced, audit logging enabled  
✅ **Tested** - All endpoints verified, data verified  
✅ **Documented** - Complete guides and references provided  
✅ **Integrated** - Frontend and backend connected  
✅ **Monitored** - Metrics and alerts configured  

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Discord**: https://discord.supabase.com
- **GitHub**: https://github.com/supabase/supabase

---

## 📝 Next Steps

1. Deploy frontend to production
2. Deploy backend to production
3. Update API endpoints for production domain
4. Monitor production metrics
5. Plan for scaling as user base grows
6. Schedule regular database maintenance

**Enjoy your fully operational SomaLux platform! 🚀**
