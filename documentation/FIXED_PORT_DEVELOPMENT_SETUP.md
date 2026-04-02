# Fixed Port Development Setup Guide

## Problem
Every time you restart your development server, it may use a different port, requiring you to update Supabase redirect URIs for authentication to work with live previews.

## Solution
Run the development server on a **fixed port (3000)** and add it to Supabase's allowed redirect URIs once, permanently.

---

## Quick Start

### Option 1: Using npm script (Recommended)

```bash
npm run start:3000
```

This will always start the app on `http://localhost:3000`

### Option 2: Manual PORT environment variable

**Windows (PowerShell):**
```powershell
$env:PORT=3000; npm start
```

**Windows (Command Prompt):**
```cmd
set PORT=3000 && npm start
```

**Mac/Linux:**
```bash
PORT=3000 npm start
```

---

## Configure Supabase (One-time setup)

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in with your account
3. Select your project: **somalux-q2bw**

### Step 2: Configure Redirect URIs

1. Click **Authentication** in the left menu
2. Click **URL Configuration**
3. Under **Redirect URLs**, add these URLs:
   - `http://localhost:3000` (for development)
   - `http://localhost:3000/` (with trailing slash)
   - `http://localhost:3000/auth/callback` (if using callback routes)
   - Keep any existing production URLs

### Step 3: Save Changes

Click **Save** - you're done!

---

## Verify Setup

After starting with port 3000, test authentication:

1. Open `http://localhost:3000`
2. Try logging in
3. You should NOT see any "Invalid redirect URL" errors
4. Live preview features should work smoothly

---

## Backend Development

If you're also running the backend locally, update [backend/.env](backend/.env):

```env
PORT=5001
NODE_ENV=development
REACT_APP_API_URL=http://localhost:5001

# Existing Supabase credentials
SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Then start backend:
```bash
cd backend
npm start
```

---

## All Available npm Scripts

| Script | Purpose | Port |
|--------|---------|------|
| `npm start` | Default React start (random or default port) | varies |
| `npm run start:3000` | **Recommended**: Fixed port development | 3000 |
| `npm run start:5173` | Vite development (if migrating) | 5173 |
| `npm run build` | Production build | n/a |
| `npm test` | Run tests | varies |

---

## Troubleshooting

### Port 3000 Already in Use

**Find and kill the process:**

**Windows (PowerShell):**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000
# Kill it (replace <PID> with the number from above)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -i :3000
kill -9 <PID>
```

### Still Getting "Invalid Redirect URL"

1. **Verify Supabase URLs are saved:**
   - Go to Supabase dashboard → Authentication → URL Configuration
   - Make sure `http://localhost:3000` is listed

2. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` (or Cmd+Shift+Delete on Mac)
   - Clear cookies and cached data
   - Reload page

3. **Check `.env` file:**
   - Ensure `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are correct
   - These are in the root `.env` file

### Port Changes Not Taking Effect

1. Stop the current server (Ctrl+C in terminal)
2. Wait 2-3 seconds
3. Run the command again
4. Clear browser cache/hard reload (Ctrl+F5)

---

## Environment Variables

### Frontend (.env in root)
```env
# Supabase
REACT_APP_SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API
REACT_APP_API_URL=http://localhost:5001  # For local backend
# OR
REACT_APP_API_URL=https://somalux-q2bw.onrender.com  # For production

# Google & APIs
REACT_APP_GOOGLE_API_KEY=AIzaSyDmodUcRvFIC2hgUdWafoD16JTEGVRFvdk
REACT_APP_UNSPLASH_ACCESS_KEY=guysUy342yooH66U5lCRRR5IMoBTqGv4SXxsKHuRu0Y
```

---

## Production vs Development

### Development (localhost:3000)
- No rebuild required between changes
- Hot reload enabled
- Auth redirects to `http://localhost:3000`

### Production (somalux.co.ke or Render)
- Built files served from `/build` folder
- Auth redirects to `https://somalux.co.ke` or `https://your-render-url.onrender.com`
- Already configured in Supabase

---

## Docker Alternative (Advanced)

If port conflicts are frequent, use Docker:

```bash
docker run -p 3000:3000 -e PORT=3000 --env-file .env campuslife
```

This isolates the port usage.

---

## Summary

1. ✅ Update `npm start:3000` script (already added to package.json)
2. ✅ Run `npm run start:3000` every time
3. ✅ Add `http://localhost:3000` to Supabase redirect URLs (one-time)
4. ✅ Never worry about changing ports again!

This setup ensures consistent auth flows and live preview functionality during development.
