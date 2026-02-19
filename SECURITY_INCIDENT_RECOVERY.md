# 🚨 Security Incident Recovery - Exposed API Keys

**Critical Issue:** Google API key and email credentials were publicly exposed on GitHub.

## Immediate Actions Already Taken ✅

- ✅ Removed `AIzaSyC1Wta0bn8IVqdYQlvrfntt3Q1x5tnaD6g` from `backend/.env.example`
- ✅ Removed email credentials from `.env.example`
- ✅ Pushed fixes to GitHub

---

## Critical Actions You MUST Take

### 1. Regenerate Google API Key (URGENT)

**The exposed key:** `AIzaSyC1Wta0bn8IVqdYQlvrfntt3Q1x5tnaD6g`

Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **campuslife** (id: campuslife-1096b)
3. Navigate to **Credentials**
4. Find the exposed key
5. Click **Edit** → **Regenerate Key**
6. Copy the new key
7. Update your `.env` files:
   - `backend/.env`
   - `.env.development`
   - `.env.production`
   - `backend/.env.local` (if exists)

### 2. Secure Email Account

**Exposed email:** `campuslives254@gmail.com`

Steps:
1. Log in to Gmail at https://myaccount.google.com
2. Enable **2-Factor Authentication** (if not already)
3. Check **Recent security events** for unauthorized access
4. Generate new **App Passwords** if using bot/API:
   - Go to **Account Settings** → **Security** → **App passwords**
   - Create a new password for your application
5. Update backend `.env`:
   ```
   EMAIL_USER=campuslives254@gmail.com
   EMAIL_PASS=<new_app_password>
   ```

### 3. Rotate Supabase Keys

**Exposed keys found in documentation files**

Steps:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **wuwlnawtuhjoubfkdtgc**
3. Navigate to **Settings** → **API**
4. Click **Regenerate** on service role key:
   ```
   Old: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2xuYXd0dWhqb3ViZmtkdGdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQxMzk3MCwiZXhwIjoyMDgwOTg5OTcwfQ.4ijIcjDjtKrsAB8iaGKNhkWwffhXpPTZtJcssl3fqO0
   ```
5. Update `backend/.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=<new_key>
   ```

---

## Documentation Files with Exposed Data

The following documentation files contain sensitive information and should be reviewed/updated:

- `CONFIGURATION.md` - Contains actual API keys
- `DEPLOYMENT_GUIDE.md` - Contains credentials
- `FIXED_PORT_DEVELOPMENT_SETUP.md` - Contains Supabase keys

**Action:** Review and remove any actual credentials from these files.

---

## Best Practices Going Forward

### 1. **Never commit secrets to Git**
```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

### 2. **Use environment variables**
```javascript
// ❌ WRONG
const API_KEY = 'AIzaSyC1Wta0bn8IVqdYQlvrfntt3Q1x5tnaD6g';

// ✅ CORRECT
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
```

### 3. **Use .env.example as template**
```bash
# Good example file
GOOGLE_API_KEY=your_google_api_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

### 4. **Setup GitHub Secrets for CI/CD**
If using GitHub Actions:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `GOOGLE_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `EMAIL_PASSWORD`
3. Use in workflows:
   ```yaml
   env:
     GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
   ```

---

## Verification Checklist

- [ ] Regenerated Google API key
- [ ] Updated `backend/.env` with new key
- [ ] Updated `.env.development` with new key  
- [ ] Updated `.env.production` with new key
- [ ] Enabled 2FA on email account
- [ ] Generated new Gmail app password
- [ ] Updated email credentials in `.env`
- [ ] Rotated Supabase service role key
- [ ] Reviewed `CONFIGURATION.md` for exposed data
- [ ] Reviewed `DEPLOYMENT_GUIDE.md` for exposed data
- [ ] Tested application with new keys
- [ ] Committed and pushed all changes

---

## Testing After Updates

```bash
# Test backend can connect to APIs
curl -X GET "https://api.somalux.co.ke/api/status" \
  -H "Authorization: Bearer YOUR_NEW_KEY"

# Test Supabase connection
node -e "require('dotenv').config(); console.log('SUPABASE_URL:', process.env.SUPABASE_URL)"

# Test email sending
# Send a test email through admin panel
```

---

## If You Suspect Unauthorized Access

1. Check Google Cloud **Logs** for unusual API usage
2. Check email account for unauthorized access
3. Check Supabase **Realtime** for unexpected queries
4. Enable **Cloud Logging** alerts:
   - Go to Cloud Console
   - Set up alerts for unusual API usage
   - Monitor for charges (the exposed key could be abused)

---

## Support

If you need help:
1. Check Google Cloud documentation: https://cloud.google.com/docs/authentication
2. Check Supabase security: https://supabase.com/docs/guides/security
3. Report to Google: https://cloud.google.com/support

---

**Status:** 🚨 Wait for your responses before considering this resolved.
