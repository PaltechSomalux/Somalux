# 🚀 QUICK START - RENDER DEPLOYMENT

## 📋 Copy-Paste Commands

### Step 1: Prepare Git (Run these in PowerShell)
```powershell
cd d:\Magic\SomaLux
git init
git add .
git commit -m "SomaLux: Firebase frontend + Render backend + Supabase DB"
git remote add origin https://github.com/YOUR_USERNAME/SomaLux.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Account & Service
1. Open https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your SomaLux repository
5. Fill in details:
   - **Name**: somalux-backend
   - **Runtime**: Node
   - **Build**: `cd backend && npm install`
   - **Start**: `cd backend && npm start`

### Step 3: Add Environment Variables to Render
Copy-paste each into Render dashboard (Environment section):

```
SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZWdqZXBtdGVndmdubmFvaGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTY3NzEsImV4cCI6MjA3Nzk5Mjc3MX0.uCh8GEV2rplB6QUXEWCNoiPRY9-heNxldNAOJJzQdF8

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZWdqZXBtdGVndmdubmFvaGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQxNjc3MSwiZXhwIjoyMDc3OTkyNzcxfQ.M7hhl-czTO2fn_dIDZvAX0JVJrJGeqAwEn1aoziMBRI

GOOGLE_BOOKS_API_KEY=AIzaSyC1Wta0bn8IVqdYQlvrfntt3Q1x5tnaD6g

AGORA_APP_ID=efd1f72167634cbdaa8b3757510bc071

AGORA_APP_CERTIFICATE=a86f0cdd5f7b4db1a584614dc7dddfad

EMAIL_HOST=smtp.gmail.com

EMAIL_PORT=587

EMAIL_USER=campuslives254@gmail.com

EMAIL_PASS=zeroeafivxxlzllp

EMAIL_FROM=Paltech Support Team <campuslives254@gmail.com>

ADMIN_EMAILS=campuslives254@gmail.com

MPESA_MODE=demo

MPESA_CONSUMER_KEY=JmTIKawu0Jvur2YA7iFnSmS2ZO15ObCJSGtXHNb1WSv6F83U

MPESA_CONSUMER_SECRET=ILRULsnEKAhzzZXBwmyJsM0FjiGeHjm1SP7BQKFTXAZSgK9bBcCnfCZTJKnblih4

MPESA_BUSINESS_SHORTCODE=174379

MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e78c6f69f7e1f4836f78f2e6c2c1f0

MPESA_INITIATOR_NAME=testapi

MPESA_INITIATOR_PASSWORD=Safaricom@123

MPESA_ENVIRONMENT=sandbox
```

### Step 4: Deploy
Click "Create Web Service" in Render and wait for deployment

### Step 5: Get Your Backend URL
After deployment, Render will show you: `https://somalux-backend.onrender.com`

### Step 6: Update Frontend (Optional)
Create `.env` in root folder:
```
REACT_APP_API_URL=https://somalux-backend.onrender.com
```

Then:
```bash
npm run build
firebase deploy --only hosting
```

---

## ✅ VERIFICATION CHECKLIST

After deployment:

- [ ] Render shows "Live" status
- [ ] Backend logs show no errors
- [ ] Can access https://somalux-backend.onrender.com/api/test/check-dir?dirPath=/tmp
- [ ] Logs show "🔐 Supabase service-role client initialized"
- [ ] Frontend can reach backend API
- [ ] No CORS errors in browser console

---

## 🔍 MONITORING

### Check Backend Logs
1. Go to Render dashboard
2. Select somalux-backend service
3. Click "Logs" tab
4. Look for:
   - ✅ "Backend + WebSocket server running"
   - ✅ "Supabase service-role client initialized"

### Test API Endpoint
```powershell
# In PowerShell
$url = "https://somalux-backend.onrender.com/api/test/check-dir?dirPath=/tmp"
Invoke-WebRequest -Uri $url | ConvertTo-Json
```

---

## 🆘 COMMON ISSUES & FIXES

| Issue | Fix |
|-------|-----|
| Build fails | Check build logs, ensure `backend/package.json` exists |
| Supabase error | Verify environment variables in Render |
| CORS error | Check backend has `cors({ origin: true })` |
| 404 errors | Verify API routes exist in backend/index.js |
| Timeout | Check if too many dependencies, may need Starter plan |

---

## 📞 SUPPORT

- **Render Support**: https://render.com/docs
- **Supabase Support**: https://supabase.com/docs
- **Backend Docs**: See `DEPLOYMENT_GUIDE.md`
- **Configuration**: See `CONFIGURATION.md`

---

## 🎯 TIMELINE

1. **Push to GitHub**: 2 minutes
2. **Create Render Service**: 5 minutes
3. **Add Environment Variables**: 3 minutes
4. **Deploy**: 5-10 minutes (first time)
5. **Verify & Test**: 5 minutes

**Total**: ~20-25 minutes

---

**Status**: ✅ Frontend Live | ⏳ Backend Ready for Deployment

**Next Action**: Push to GitHub and deploy on Render!
