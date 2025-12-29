# 🚀 SomaLux Deployment - Quick Reference Card

## Deployment in 3 Steps

### Step 1: Deploy to Render (5 minutes)
```
1. Visit: https://dashboard.render.com
2. Click: "New" → "Blueprint"
3. Connect: GitHub (Magic/SomaLux repo)
4. Deploy: Confirm render.yaml
```

### Step 2: Configure Environment Variables (5 minutes)
```
Backend Service (somalux-backend):
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_BOOKS_API_KEY, AGORA_APP_ID, AGORA_APP_CERTIFICATE
- EMAIL_*, MPESA_* credentials

Frontend Service (somalux-frontend):
- REACT_APP_API_URL=https://somalux-backend.onrender.com
- REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY
```

### Step 3: Connect Domain (5 minutes)
```
1. Render: Frontend Settings → Custom Domains → Add somalux.co.ke
2. DNS: Add CNAME record pointing to Render
3. Wait: 5-30 minutes for propagation
4. Verify: Click "Verify" in Render dashboard
```

---

## Service URLs After Deployment

| Service | URL |
|---------|-----|
| **Frontend** | https://somalux.co.ke |
| **Backend** | https://somalux-backend.onrender.com |
| **API** | https://somalux-backend.onrender.com/api/* |
| **WebSocket** | wss://somalux-backend.onrender.com |

---

## Critical Environment Variables

### Backend
```env
SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
SUPABASE_ANON_KEY=eyJ... (from .env)
SUPABASE_SERVICE_ROLE_KEY=... (from Supabase dashboard)

GOOGLE_BOOKS_API_KEY=AIzaSy... (from .env)
AGORA_APP_ID=efd... (from .env)
AGORA_APP_CERTIFICATE=a86... (from .env)

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=campuslives254@gmail.com
EMAIL_PASS=... (Gmail app password)

MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_BUSINESS_SHORTCODE=...
MPESA_PASSKEY=...
```

### Frontend
```env
REACT_APP_API_URL=https://somalux-backend.onrender.com
REACT_APP_SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ... (from .env)
```

---

## DNS Configuration

**Provider:** Your domain registrar (Safaricom, Jijenge, etc.)

```
Type:  CNAME
Name:  @ or somalux
Value: <render-cname-value> (get from Render dashboard)
TTL:   3600 (standard)
```

---

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| Build fails | Check Node version in render.yaml |
| API 404 | Verify backend is running + CORS enabled |
| CORS errors | Frontend must use HTTPS + correct API URL |
| Domain not found | Wait 30 mins + verify DNS CNAME |
| SSL errors | Check "Mixed Content" - all HTTPS URLs |
| Env vars undefined | Verify var names (case-sensitive) + restart |

---

## After Deployment - Test These

```bash
# 1. Homepage loads
curl https://somalux.co.ke

# 2. API responds
curl https://somalux-backend.onrender.com/api/books

# 3. Authentication works
- Sign up with Google
- Create account
- Login

# 4. Book operations
- Search books
- View details
- Download

# 5. Payments
- Initiate payment
- Check M-Pesa
```

---

## Monitoring & Logs

**View Live Logs:**
```
Render Dashboard → Service → "Logs" tab
Real-time output + error tracking
```

**Monitor Performance:**
```
- CPU usage
- Memory usage  
- Request times
- Error rates
```

---

## Key Files

| File | Purpose |
|------|---------|
| `render.yaml` | Deployment blueprint |
| `RENDER_DEPLOYMENT_GUIDE.md` | Full guide (detailed) |
| `DEPLOYMENT_LAUNCH_SUMMARY.md` | Full summary |
| `build/` | Frontend production |
| `backend/` | Node.js backend |
| `.env` | Local config (don't commit) |

---

## Free Tier Limits

- **Hours/month:** 750 per service
- **CPU:** Shared
- **RAM:** 512 MB
- **Storage:** Supabase limits apply
- **Bandwidth:** Unlimited
- **SSL:** Free, auto-renewal

---

## Support Contacts

- **Render Support:** render.com/support
- **Supabase Support:** supabase.com/support  
- **GitHub Issues:** Check repo

---

## Success Indicators ✅

After deployment, you should see:
- [ ] Green "Running" status on both services
- [ ] HTTPS lock icon on somalux.co.ke
- [ ] All pages loading without errors
- [ ] API endpoints responding with data
- [ ] Login/signup working
- [ ] Payments processing
- [ ] Emails sending
- [ ] No errors in logs

---

## One-Click Deployment Checklist

```
☑ GitHub repo updated
☑ All code committed
☑ render.yaml present
☑ .env credentials ready
☑ Backend starts locally
☑ Frontend builds locally
☑ Environment vars documented
☑ Domain DNS prepared
☑ Ready to click "Deploy"
```

---

**Status:** 🟢 READY FOR DEPLOYMENT
**Last Updated:** December 29, 2025
**Estimated Deployment Time:** 15-20 minutes
