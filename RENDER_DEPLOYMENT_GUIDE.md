# SomaLux Render Deployment Guide

## Overview
This guide provides step-by-step instructions to deploy both the frontend and backend of SomaLux to Render.com and configure the domain `somalux.co.ke`.

## Prerequisites
- GitHub account with the SomaLux repository
- Render.com account (free or paid)
- Domain `somalux.co.ke` with access to DNS settings
- All environment variables configured and secure

## Architecture
```
┌─────────────────────────────────────────────────────────┐
│                   somalux.co.ke                          │
│                    (CNAME/Alias)                         │
└────────┬────────────────────────────────────┬────────────┘
         │                                    │
         v                                    v
┌──────────────────────────┐    ┌──────────────────────────┐
│  somalux-frontend        │    │  somalux-backend         │
│  (Render Static Site)    │    │  (Render Node.js)        │
│  - React App (Build)     │    │  - Express Server        │
│  - Static Assets         │    │  - API Routes            │
│  - Build Output: /build  │    │  - Supabase Integration  │
└──────────────────────────┘    └──────────────────────────┘
         ↓                              ↓
   serve @               somalux-backend.onrender.com
   somalux-frontend              (Environment: Node)
   .onrender.com
```

## Deployment Steps

### Step 1: Prepare Your Repository

Ensure your GitHub repository contains:
```
SomaLux/
├── render.yaml              # Deployment configuration
├── package.json             # Frontend dependencies
├── src/                     # React source
├── build/                   # Production build (built locally)
├── backend/
│   ├── index.js            # Backend entry point
│   ├── package.json        # Backend dependencies
│   └── routes/             # API routes
├── public/                 # Public assets
└── .env                    # Local env (DO NOT COMMIT)
```

### Step 2: Create Services on Render

#### Option A: Using render.yaml (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Select the branch (main/master)
5. Confirm the render.yaml blueprint
6. Render will automatically create both services

#### Option B: Manual Service Creation

**Create Backend Service:**
1. Dashboard → "New" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - Name: `somalux-backend`
   - Runtime: Node
   - Build Command: `cd backend && npm install && cd ..`
   - Start Command: `node backend/index.js`
   - Plan: Free (or Starter)
4. Add Environment Variables (see Step 3)
5. Deploy

**Create Frontend Service:**
1. Dashboard → "New" → "Static Site"
2. Connect GitHub repository
3. Configure:
   - Name: `somalux-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`
4. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://somalux-backend.onrender.com
   REACT_APP_SUPABASE_URL=<your-supabase-url>
   REACT_APP_SUPABASE_ANON_KEY=<your-supabase-key>
   ```
5. Deploy

### Step 3: Set Environment Variables

**Backend Environment Variables:**
```
# Supabase
SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<your-key>

# Google Books API
GOOGLE_BOOKS_API_KEY=<your-key>

# Agora Video Calling
AGORA_APP_ID=<your-id>
AGORA_APP_CERTIFICATE=<your-cert>

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your-email>
EMAIL_PASS=<your-app-password>
EMAIL_FROM="Paltech Support Team <campuslives254@gmail.com>"
ADMIN_EMAILS=campuslives254@gmail.com

# M-Pesa Configuration
MPESA_MODE=demo (or production)
MPESA_CONSUMER_KEY=<your-key>
MPESA_CONSUMER_SECRET=<your-secret>
MPESA_BUSINESS_SHORTCODE=<your-code>
MPESA_PASSKEY=<your-key>
MPESA_INITIATOR_NAME=<name>
MPESA_INITIATOR_PASSWORD=<password>
MPESA_ENVIRONMENT=sandbox (or production)
```

**Frontend Environment Variables:**
```
REACT_APP_API_URL=https://somalux-backend.onrender.com
REACT_APP_SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your-key>
```

### Step 4: Configure Domain (somalux.co.ke)

1. **Get Render DNS Information:**
   - Go to Frontend Service Settings
   - Navigate to "Custom Domains"
   - Click "Add Custom Domain"
   - Enter: `somalux.co.ke`
   - Copy the CNAME value provided (usually `cname.onrender.com` or similar)

2. **Update Domain DNS Settings:**
   - Log in to your domain registrar (Safaricom, Jijenge, Afrihost, etc.)
   - Navigate to DNS Management
   - Add/Edit CNAME record:
     ```
     Type: CNAME
     Name: somalux (or @)
     Value: <render-cname-value>
     TTL: 3600 (or auto)
     ```
   - Also add A record for www subdomain (if needed):
     ```
     Type: CNAME
     Name: www
     Value: <render-cname-value>
     ```
   - Save changes

3. **Verify Domain Connection:**
   - In Render dashboard, click "Verify"
   - Wait 5-30 minutes for DNS propagation
   - Once verified, SSL certificate auto-renews

### Step 5: Deploy

**Automatic Deployment:**
- Push changes to GitHub main branch
- Render automatically builds and deploys

**Manual Deployment:**
1. Render Dashboard → Select Service
2. Click "Manual Deploy"
3. Select branch and deploy

### Step 6: Post-Deployment Checklist

- [ ] Frontend accessible at `https://somalux.co.ke`
- [ ] Backend API accessible at `https://somalux-backend.onrender.com/api/*`
- [ ] SSL certificate active (green lock icon)
- [ ] Environment variables properly loaded
- [ ] Database connections working
- [ ] Email notifications sending
- [ ] Payment processing (M-Pesa) functional
- [ ] File uploads/downloads working
- [ ] WebSocket connections stable

## Common Issues & Solutions

### Frontend Build Fails
**Error:** `npm: not found`
**Solution:** 
- Ensure `package.json` is in root directory
- Check Node version in build environment
- Verify all dependencies are installed

### Backend Service Won't Start
**Error:** `Module not found`
**Solution:**
- Run `cd backend && npm install` locally to test
- Update `render.yaml` build command
- Check all backend dependencies in `backend/package.json`

### CORS Errors
**Error:** `Access to XMLHttpRequest blocked by CORS`
**Solution:**
- Backend: Ensure `cors` is properly configured:
  ```javascript
  app.use(cors({ 
    origin: true, 
    credentials: true 
  }));
  ```
- Update `REACT_APP_API_URL` to production URL

### SSL Certificate Issues
**Error:** `Mixed content` or certificate warnings
**Solution:**
- Ensure all API calls use `https://`
- Update environment variables to use https URLs
- Verify domain CNAME is properly set
- Wait for SSL auto-renewal (up to 24 hours)

### Environment Variables Not Loading
**Error:** `undefined` values in app
**Solution:**
- Verify variable names match exactly (case-sensitive)
- Check variables are set in Render dashboard
- For React apps, prefix with `REACT_APP_`
- Restart service after changing variables

## Performance Optimization

### Frontend
- Build output: ~873KB (gzipped)
- Code splitting enabled
- Lazy loading components
- Production build ready

### Backend
- Node.js runtime optimized
- Connection pooling configured
- Caching enabled
- Static file serving ready

## Monitoring & Logs

**View Logs:**
1. Render Dashboard → Select Service
2. "Logs" tab shows real-time output
3. Filter by date/time for debugging

**Performance Metrics:**
- Dashboard shows CPU, Memory usage
- Response times tracked
- Error rates monitored

## SSL/HTTPS

- Render automatically provides SSL certificates
- HTTPS enabled by default
- Auto-renewal every 90 days
- No manual configuration needed

## Backup & Recovery

**Database Backups:**
- Supabase handles automatic backups
- Check Supabase dashboard for backup settings

**Repository Backups:**
- GitHub is your backup
- Always maintain clean commit history
- Tag releases for easy rollback

## Database Connection

Backend connects to Supabase:
```javascript
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in backend env variables.

## Cost Estimation (Free Plan)

| Service | Type | Cost |
|---------|------|------|
| Frontend | Static Site (free tier) | $0 |
| Backend | Web Service (free tier) | $0 |
| Domain | somalux.co.ke | Varies by registrar |
| **Total Monthly** | | **Registrar cost only** |

**Upgrade to Paid when:**
- Exceeding 750 hours/month free tier
- Need guaranteed uptime (SLA)
- Require performance optimizations

## Next Steps

1. Ensure all environment variables are configured
2. Test API endpoints after deployment
3. Monitor logs for any errors
4. Set up health checks if needed
5. Configure custom domain properly
6. Test from multiple devices/locations
7. Set up alerts/notifications in Render

## Useful Links

- [Render Documentation](https://render.com/docs)
- [Render Status Page](https://render-status.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Documentation](https://expressjs.com)
- [React Documentation](https://react.dev)

## Support & Troubleshooting

**Still having issues?**
1. Check Render status page
2. Review deployment logs
3. Test API endpoints with Postman
4. Verify environment variables
5. Check GitHub Actions/workflows
6. Contact Render support (paid plan only)

---

**Last Updated:** December 29, 2025
**Status:** Ready for Production Deployment
