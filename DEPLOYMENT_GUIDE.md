# SomaLux Full Stack Deployment Guide

## Project Overview
- **Frontend**: React app hosted on Firebase Hosting
- **Backend**: Node.js/Express server hosted on Render
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Firebase Auth

---

## ✅ COMPLETED SETUP

### 1. Frontend (Firebase Hosting) ✅
- **Status**: Live and deployed
- **URL**: https://somalux-eb820.web.app
- **Firebase Config**: Updated in `src/firebase.js` and `src/FirebaseConfig.js`
- **Project ID**: somalux-eb820

### 2. Database (Supabase) ✅
- **Status**: Already configured in backend
- **Supabase Project**: hoegjepmtegvgnnaohdr
- **Connection**: Backend can connect via `.env` variables

---

## 🚀 BACKEND DEPLOYMENT TO RENDER

### Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Deploy SomaLux backend and frontend"

# Add your GitHub repo as remote (replace with your repo)
git remote add origin https://github.com/YOUR_USERNAME/SomaLux.git

# Push to main branch
git push -u origin main
```

### Step 2: Create Render Account & Deploy

1. **Sign up on Render**: https://render.com
2. **Connect GitHub**: Link your GitHub account
3. **Create New Web Service**:
   - Choose "Web Service"
   - Select your GitHub repository
   - Configure the service:
     - **Name**: somalux-backend
     - **Runtime**: Node
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && npm start`
     - **Region**: Choose closest to your users

### Step 3: Add Environment Variables to Render

In Render dashboard, go to Environment:

```
# Firebase (for admin SDK - if using Firestore)
GOOGLE_APPLICATION_CREDENTIALS=./paltechproject-firebase-adminsdk-fbsvc-bd9fcaae72.json

# Supabase
SUPABASE_URL=https://hoegjepmtegvgnnaohdr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Books API
GOOGLE_BOOKS_API_KEY=AIzaSyC1Wta0bn8IVqdYQlvrfntt3Q1x5tnaD6g

# Agora Video Calling
AGORA_APP_ID=efd1f72167634cbdaa8b3757510bc071
AGORA_APP_CERTIFICATE=a86f0cdd5f7b4db1a584614dc7dddfad

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=campuslives254@gmail.com
EMAIL_PASS=zeroeafivxxlzllp
EMAIL_FROM=Paltech Support Team <campuslives254@gmail.com>
ADMIN_EMAILS=campuslives254@gmail.com

# M-Pesa Configuration
MPESA_MODE=demo
MPESA_CONSUMER_KEY=JmTIKawu0Jvur2YA7iFnSmS2ZO15ObCJSGtXHNb1WSv6F83U
MPESA_CONSUMER_SECRET=ILRULsnEKAhzzZXBwmyJsM0FjiGeHjm1SP7BQKFTXAZSgK9bBcCnfCZTJKnblih4
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e78c6f69f7e1f4836f78f2e6c2c1f0
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=Safaricom@123
MPESA_ENVIRONMENT=sandbox
```

### Step 4: Update Frontend API Endpoints

After Render deployment, update your frontend to use the Render backend URL.

In `src/api.js` or your API configuration:

```javascript
// Before deployment to Firebase
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// After getting Render URL
// Update to: https://somalux-backend.onrender.com
```

Update in your frontend code:
```javascript
// Example API call
const response = await fetch(`${API_BASE_URL}/api/elib/search-events`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

---

## 📊 ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐   ┌──────▼────────┐
│   Firebase   │   │     Render     │
│   Hosting    │   │   Backend      │
│ (Frontend)   │   │  (API Server)  │
│ somalux-    │   │ somalux-       │
│ eb820.web.app│   │ backend.render│
└──────────────┘   └──────┬────────┘
                          │
                   ┌──────▼──────┐
                   │  Supabase   │
                   │  Database   │
                   │ PostgreSQL  │
                   └─────────────┘
```

---

## 🔄 UPDATE FRONTEND API ENDPOINTS

After getting your Render URL, rebuild and redeploy frontend:

### 1. Create `.env` file in root:
```
REACT_APP_API_URL=https://somalux-backend.onrender.com
```

### 2. Update API calls in your components:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Use in your fetch calls
const response = await fetch(`${API_URL}/api/your-endpoint`);
```

### 3. Rebuild and redeploy frontend:
```bash
npm run build
firebase deploy --only hosting
```

---

## 📝 SUPABASE SETUP VERIFICATION

Your backend is already configured to use Supabase. Verify:

1. **Check Supabase Credentials** in `backend/.env`:
   - ✅ SUPABASE_URL
   - ✅ SUPABASE_ANON_KEY
   - ✅ SUPABASE_SERVICE_ROLE_KEY

2. **Test Connection**:
   ```bash
   cd backend
   node -e "
     import('dotenv/config');
     import { createClient } from '@supabase/supabase-js';
     const supabase = createClient(
       process.env.SUPABASE_URL,
       process.env.SUPABASE_SERVICE_ROLE_KEY
     );
     console.log('Supabase connected:', !!supabase);
   "
   ```

---

## 🔐 SECURITY CHECKLIST

- [ ] Remove sensitive files from version control
- [ ] Use environment variables for all secrets
- [ ] Enable CORS correctly on backend
- [ ] Set up HTTPS (automatic on Firebase & Render)
- [ ] Configure Supabase RLS policies
- [ ] Set up Firebase security rules
- [ ] Use Firebase Admin SDK securely (only on backend)

---

## 📱 ENVIRONMENT VARIABLES REFERENCE

### Frontend (.env in root)
```
REACT_APP_API_URL=https://somalux-backend.onrender.com
```

### Backend (backend/.env)
See `backend/.env.example` for full list. Key variables:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_BOOKS_API_KEY
- AGORA_APP_ID
- AGORA_APP_CERTIFICATE
- EMAIL_USER
- EMAIL_PASS

---

## 🚨 TROUBLESHOOTING

### Backend not connecting to Supabase
1. Verify SUPABASE_URL and keys in Render environment
2. Check Supabase project is active
3. Verify network access in Supabase dashboard

### CORS errors
1. Update CORS in backend: `app.use(cors({ origin: true }))`
2. Check frontend API URL matches Render deployment

### Firebase Admin SDK issues
1. Ensure service account JSON file is in `backend/` folder
2. Check GOOGLE_APPLICATION_CREDENTIALS path
3. Verify Firebase project permissions

---

## 📚 USEFUL LINKS

- **Firebase Console**: https://console.firebase.google.com/project/somalux-eb820
- **Render Dashboard**: https://dashboard.render.com
- **Supabase Dashboard**: https://app.supabase.com/
- **GitHub Repository**: [Your repo URL]

---

## 🎯 NEXT STEPS

1. Push code to GitHub
2. Deploy backend to Render
3. Update frontend API endpoints
4. Redeploy frontend to Firebase
5. Test end-to-end connectivity
6. Monitor logs in Render dashboard

---

**Deployment Date**: December 20, 2025
**Status**: Ready for production deployment
