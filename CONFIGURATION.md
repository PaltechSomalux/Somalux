# SomaLux Configuration Guide
# This file documents all configuration needed for full-stack deployment

## 🌐 FRONTEND CONFIGURATION

### Frontend Hosting
- Platform: Render (served via backend)
- Custom Domain: https://somalux.co.ke
- Config Files:
- src/supabase.js ✅ (Supabase config)

### Environment Variables (.env in root)
```
REACT_APP_API_URL=https://somalux-backend.onrender.com
REACT_APP_SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔧 BACKEND CONFIGURATION

### Node.js/Express Server
- Runtime: Node.js
- Platform: Render
- Port: 5000 (local) or dynamic on Render
- Entry Point: backend/index.js

### Environment Variables (backend/.env)
**Supabase Configuration:**
```
SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZWdqZXBtdGVndmdubmFvaGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTY3NzEsImV4cCI6MjA3Nzk5Mjc3MX0.uCh8GEV2rplB6QUXEWCNoiPRY9-heNxldNAOJJzQdF8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZWdqZXBtdGVndmdubmFvaGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQxNjc3MSwiZXhwIjoyMDc3OTkyNzcxfQ.M7hhl-czTO2fn_dIDZvAX0JVJrJGeqAwEn1aoziMBRI
```

**Google Books API:**
```
GOOGLE_BOOKS_API_KEY=AIzaSyC1Wta0bn8IVqdYQlvrfntt3Q1x5tnaD6g
```

**Agora Video Calling:**
```
AGORA_APP_ID=efd1f72167634cbdaa8b3757510bc071
AGORA_APP_CERTIFICATE=a86f0cdd5f7b4db1a584614dc7dddfad
```

**Email Service (Gmail SMTP):**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=campuslives254@gmail.com
EMAIL_PASS=zeroeafivxxlzllp
EMAIL_FROM=Paltech Support Team <campuslives254@gmail.com>
ADMIN_EMAILS=campuslives254@gmail.com
```

**M-Pesa Payment System:**
```
MPESA_MODE=demo
MPESA_CONSUMER_KEY=JmTIKawu0Jvur2YA7iFnSmS2ZO15ObCJSGtXHNb1WSv6F83U
MPESA_CONSUMER_SECRET=ILRULsnEKAhzzZXBwmyJsM0FjiGeHjm1SP7BQKFTXAZSgK9bBcCnfCZTJKnblih4
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e78c6f69f7e1f4836f78f2e6c2c1f0
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=Safaricom@123
MPESA_SECURITY_CREDENTIAL=your_security_credential_here_if_available
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://somalux-backend.onrender.com/api/subscriptions/mpesa/callback
```

---

## 💾 DATABASE CONFIGURATION

### Supabase
- **Project**: wuwlnawtuhjoubfkdtgc (current active project)
- **Database**: PostgreSQL
- **Region**: Determined by Supabase
- **Connection Method**: supabase-js SDK

### Tables Setup
Ensure the following tables exist in Supabase:
- `users` - User profiles
- `books` - Book metadata
- `search_events` - Search analytics
- `reading_sessions` - User reading data
- `achievements` - User achievements
- `reading_goals` - User goals
- And other application-specific tables

### RLS (Row Level Security) Policies
All tables should have appropriate RLS policies:
- ✅ Policies enabled in Supabase dashboard
- ✅ Service role key for admin operations
- ✅ Anon key for user operations

---

## 🚀 DEPLOYMENT CHECKLIST

### ✅ Frontend (Completed)
- [x] Supabase credentials configured
- [x] Project built (npm run build)
- [x] Deployed to Render
- [x] Live at https://somalux.co.ke

### ⏳ Backend (In Progress)
- [x] PORT environment variable updated
- [x] render.yaml created
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Backend deployed to Render
- [ ] Environment variables added to Render
- [ ] API endpoints tested

### ⏳ Database (In Progress)
- [x] Supabase credentials verified
- [x] Backend configured to use Supabase
- [ ] Database tables verified
- [ ] RLS policies configured
- [ ] Connection tested from backend

### ⏳ Integration (Pending)
- [ ] Frontend API URL updated for Render
- [ ] Frontend rebuilt and redeployed
- [ ] End-to-end testing completed
- [ ] Error handling verified
- [ ] Logging monitored

---

## 🔗 CONNECTION FLOW

```
User → Render Backend (Frontend Served)
        ↓
        → Render Backend (API Server)
           ↓
           → Supabase Database (PostgreSQL)
```

### API Communication
1. Frontend calls: `https://somalux-backend.onrender.com/api/*`
2. Backend processes and returns JSON
3. Backend queries Supabase for data

### Authentication
- Supabase Auth on frontend
- JWT tokens passed in headers
- Backend verifies tokens with Supabase

---

## 📊 SERVICE CREDENTIALS

### Supabase Service Role
- Used for: Admin operations, scheduled jobs
- Permissions: Full database access
- Usage: Only on backend with confidential keys

---

## 🧪 LOCAL DEVELOPMENT

### Start Backend Locally
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Start Frontend Locally
```bash
npm install
npm start
# App runs on http://localhost:3000
```

### Environment Variables
- Frontend uses `REACT_APP_API_URL=http://localhost:5000`
- Backend loads from `backend/.env`

---

## 🔐 SECURITY NOTES

1. **Never commit .env files** - Already in .gitignore
2. **Use strong credentials** - All API keys should be strong
3. **Rotate keys periodically** - Update in all services
4. **Monitor access logs** - Check Supabase audit logs
5. **Enable CORS properly** - Only allow trusted origins
6. **Use HTTPS** - Render manages SSL certificates automatically

---

## 📞 SUPPORT & LINKS

- Render Dashboard: https://dashboard.render.com/
- Supabase Dashboard: https://app.supabase.com/
- Supabase Docs: https://supabase.com/docs

---

**Last Updated**: December 20, 2025
**Configuration Status**: 70% Complete
