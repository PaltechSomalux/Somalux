# Supabase Redirect URI Configuration Checklist

## Current Project
- **Project Name**: somalux-q2bw
- **Project URL**: https://wuwlnawtuhjoubfkdtgc.supabase.co
- **Development Port**: 3000

---

## Required Redirect URIs

### Development
- [ ] `http://localhost:3000`
- [ ] `http://localhost:3000/`
- [ ] `http://localhost:3000/auth/callback`

### Production
- [ ] `https://somalux.co.ke`
- [ ] `https://somalux.co.ke/`
- [ ] `https://somalux.co.ke/auth/callback`

### Staging/Render
- [ ] `https://somalux-q2bw.onrender.com`
- [ ] `https://somalux-q2bw.onrender.com/`
- [ ] `https://somalux-q2bw.onrender.com/auth/callback`

---

## How to Add URLs to Supabase

### Step 1: Access Dashboard
1. Visit https://supabase.com
2. Sign in with your credentials
3. Select project **somalux-q2bw**

### Step 2: Navigate to Configuration
1. In left sidebar, click **Authentication**
2. Click **URL Configuration**
3. You should see "Redirect URLs" section

### Step 3: Add URLs
1. Enter each URL in the text field
2. Click the **+** button or press Enter
3. URL appears in the list below

### Step 4: Save
- Click **Save** button at bottom
- Wait for confirmation message
- URLs are now active

---

## Verify Configuration

### Option 1: In Supabase Dashboard
1. Go to Authentication → URL Configuration
2. Verify all URLs appear in the list
3. No error messages should show

### Option 2: Test in Your App
1. Run `npm run start:3000`
2. Try logging in
3. Look for these signs of success:
   - Login form loads without errors
   - No "Invalid redirect URL" messages
   - Redirects work after login
   - User session persists

---

## Common Issues & Solutions

### Issue: "Invalid Redirect URL"
**Solution**: 
- Verify URL is spelled correctly (case-sensitive)
- Remove any trailing parameters
- Ensure URL is in the list with ✓ checkmark
- Hard refresh: Ctrl+F5

### Issue: Auth works on localhost but not production
**Solution**:
- Add production URL to Supabase
- Ensure REACT_APP_API_URL environment variable matches

### Issue: Can't find URL Configuration
**Solution**:
- Make sure you're in the right project
- In left menu: Authentication → URL Configuration
- If menu is different, your Supabase UI might be outdated

---

## Environment Variables Reference

### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_API_URL=http://localhost:5001  # or production URL
```

### Backend (.env)
```env
SUPABASE_URL=https://wuwlnawtuhjoubfkdtgc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Testing Checklist

After adding URLs, test these flows:

- [ ] Login works on http://localhost:3000
- [ ] Signup creates new account
- [ ] Password reset email sends
- [ ] Session persists after page reload
- [ ] Logout clears session
- [ ] Protected routes redirect unauthenticated users
- [ ] User profile loads after login

---

## Helpful Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Redirect URLs Guide](https://supabase.com/docs/guides/auth/social-auth)
- Project Settings: https://supabase.com/dashboard/project/somalux-q2bw/settings

---

## Quick Reference Card

| Environment | Port | URL | Status |
|---|---|---|---|
| Local Dev | 3000 | `http://localhost:3000` | ✓ Add to Supabase |
| Local Backend | 5001 | `http://localhost:5001` | ✓ Backend only |
| Production | 443 | `https://somalux.co.ke` | ✓ Add to Supabase |
| Staging | 443 | `https://somalux-q2bw.onrender.com` | ✓ Add to Supabase |

---

## After Adding URLs

**You're done!** 🎉

No need to change Supabase configuration again. Just run:
```bash
npm run start:3000
```

And everything will work smoothly.

---

**Last Updated**: January 10, 2026  
**Project**: SomaLux Development  
**Status**: Ready for production
