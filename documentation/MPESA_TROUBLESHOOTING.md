# "Failed to start subscription. Please try again." - Troubleshooting Guide

## Quick Fix

The error "Failed to start subscription. Please try again." usually means the backend couldn't process the payment request. Here's how to fix it:

### ✅ The Good News

Your system is now working in **demo mode**. This error is expected if:
- M-Pesa credentials are not configured (normal for development)
- Backend is showing: `[M-Pesa] Status: ❌ Not configured - using demo mode`

### ✅ What's Actually Happening

In demo mode, the system automatically creates demo subscriptions without real M-Pesa charges. The error you saw was likely during the first test attempt.

---

## Causes & Solutions

### 1. Backend Not Running

**Check:**
```bash
# Look for backend process
Get-Process node

# Or check logs
cd backend
npm start
```

**Solution:** Make sure backend is running on `http://localhost:5000`

**Expected Output in Logs:**
```
✅ Backend + WebSocket server running on http://localhost:5000
[M-Pesa] Status: ❌ Not configured - using demo mode
```

---

### 2. Phone Number Not Entered

**Error Message:** "Please enter your M-Pesa phone number."

**Solution:** 
- Enter a phone number before clicking "Pay with M-Pesa"
- Format: `0712345678` or `+254712345678` or `254712345678`

**Test Examples:**
```
✅ 0712345678
✅ 0701234567
✅ 0768901234
✅ +254712345678
✅ 254712345678

❌ 712345678 (missing country code)
❌ 255712345678 (wrong country code)
❌ abcdefghij (letters)
```

---

### 3. Invalid Phone Number Format

**Error Message:** "Please enter a valid Kenyan phone number..."

**Solution:** Phone number must:
- Start with `0`, `254`, or `+254`
- Be followed by valid Kenyan digits
- Typical patterns: `07XXXXXXXX` or `254712XXXXXX`

**Valid Examples:**
```
✅ 0712345678
✅ 0768901234  
✅ 0798765432
✅ +254712345678
✅ 254712345678
```

**Invalid Examples:**
```
❌ 712345678 (missing leading 0 or country code)
❌ 0812345678 (Kenya uses 07, not 08)
❌ 254812345678 (08 is not valid for Kenya)
❌ +256712345678 (Uganda code, not Kenya)
```

---

### 4. Authentication Failed

**Error Message:** "Session expired. Please sign in again."

**Solution:**
1. Sign out of the app
2. Sign in again
3. Try subscription again

**Verify:**
```javascript
// Check if you're logged in
supabase.auth.getSession()  // Should return valid token
```

---

### 5. Backend Not Responding

**Error Message:** "Failed to start subscription. Please try again."

**Solution:**
1. Check backend logs
2. Verify it's running: `http://localhost:5000`
3. Check for CORS errors
4. Try restarting backend:
```bash
cd backend
taskkill /F /IM node.exe  # Stop Node
npm start                   # Start backend
```

---

### 6. Subscription Plan Error

**Error Message:** "Invalid product or planId"

**Solution:** Ensure you have a valid plan selected.

**Valid Plans:**
```javascript
// Books subscription
1m   = 1 month, Ksh 50
2m   = 2 months, Ksh 100
3m   = 3 months, Ksh 150
6m   = 6 months, Ksh 300
12m  = 12 months, Ksh 600

// Same prices for past_papers and videos
```

---

## Testing Procedure (Step by Step)

### Step 1: Start Backend
```bash
cd C:\Magic\SomaLux\backend
npm start
```

**Expected Output:**
```
✅ Backend + WebSocket server running on http://localhost:5000
[M-Pesa] Status: ❌ Not configured - using demo mode
✅ [EMAIL CONFIG] Email server connection verified successfully!
```

### Step 2: Start Frontend
```bash
cd C:\Magic\SomaLux
npm start
```

**Expected:** App opens at `http://localhost:3000`

### Step 3: Test Subscription

1. Sign in to your account
2. Click on a book or content requiring subscription
3. Click "Subscribe"
4. Modal opens with subscription plans
5. **Enter phone number: `0712345678`**
6. Select plan: `1m` (1 month)
7. Click "Pay with M-Pesa"
8. You should see: "M-Pesa payment request sent..."
9. Click "I have completed payment – Verify"
10. ✅ Subscription should be created

---

## Checking Backend Logs

### In PowerShell Terminal

If backend is running, you should see logs like:
```
[M-Pesa] Init - Getting access token...
[M-Pesa] Init - Sending STK push...
M-Pesa response: { ok: true, ... }
Demo subscription created: {subscription-id}
```

### Common Log Messages

**Good Sign:**
```
[M-Pesa] Status: ❌ Not configured - using demo mode
```
This is normal! Means demo mode is active.

**Problem Sign:**
```
Supabase admin not configured
Failed to get M-Pesa access token
Database connection error
```

---

## Verify Database Migration

If subscriptions aren't being saved:

```sql
-- Check if M-Pesa columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
AND column_name LIKE '%mpesa%';

-- If empty, run migration:
-- Execute content of MIGRATE_TO_MPESA.sql
```

---

## Browser Console Debugging

Open Developer Tools (F12) and check Console tab:

**Look for:**
1. Network errors (red)
2. CORS issues
3. Response from `/api/subscriptions/mpesa/init`

**Expected Response:**
```javascript
{
  "ok": true,
  "checkoutRequestId": "DEMO_...",
  "reference": "sub_...",
  "phoneNumber": "254712345678",
  "priceKes": 50,
  "isDemo": true
}
```

---

## Full Testing Checklist

- [ ] Backend running (`npm start` in backend/)
- [ ] Frontend running (`npm start` in root)
- [ ] Logged in to account
- [ ] Phone number entered: `0712345678`
- [ ] Plan selected: `1m`
- [ ] Product selected: `books`/`past_papers`/`videos`
- [ ] Click "Pay with M-Pesa"
- [ ] See success message
- [ ] Click "Verify" button
- [ ] Check browser console for errors
- [ ] Check backend logs for success message
- [ ] Verify subscription in database

---

## Common Issues & Quick Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Failed to start subscription" | Backend down | `npm start` in backend/ |
| "Phone number required" | No input | Enter phone number |
| "Invalid phone number" | Wrong format | Use 0712345678 format |
| "Session expired" | Auth issue | Sign in again |
| "Subscription not created" | DB issue | Run migration SQL |
| CORS error | Backend CORS | Check backend config |
| Network error | Connection issue | Check localhost:5000 |

---

## Getting More Details

### To See Exact Error:

**Frontend Console (F12):**
```javascript
// Look for error details in console.error messages
```

**Backend Logs:**
```
// Look for full error messages in terminal
```

**Network Tab (F12):**
```
// Check response from /api/subscriptions/mpesa/init
```

---

## Success Indicators

### ✅ When It Works

1. **Modal appears** - Subscription modal opens with plans
2. **Phone input shows** - Phone number field is visible
3. **Submit works** - "Pay with M-Pesa" button responds
4. **Success message** - "M-Pesa payment request sent to..."
5. **Verify button** - "I have completed payment – Verify" appears
6. **Subscription created** - Database shows new subscription entry
7. **Access granted** - User can now access content

### Backend Log (Success)
```
[M-Pesa] Status: ❌ Not configured - using demo mode  ← Normal!
M-Pesa Init - Demo mode detected
Demo subscription created: [ID]
```

---

## Need More Help?

### Check These Files
1. **MPESA_QUICK_REFERENCE.md** - Quick overview
2. **MPESA_INTEGRATION_STATUS.md** - Detailed status  
3. **MPESA_SETUP_GUIDE.md** - Full setup instructions
4. **MPESA_MIGRATION_COMPLETE.md** - Complete summary

### Check Backend
```bash
# Verify backend runs without errors
node --check backend/index.js

# Check environment variables
type backend\.env | findstr MPESA
```

### Check Frontend
```javascript
// In browser console
fetch('http://localhost:5000/api/subscriptions/mpesa/init', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    product: 'books',
    planId: '1m',
    phoneNumber: '0712345678'
  })
}).then(r => r.json()).then(console.log)
```

---

## Success Example

After following these steps, you should see:

**In Modal:**
```
✓ Phone number: 0712345678
✓ Plan: 1 month - Ksh 50
✓ Product: books
✓ Status: Active subscription
```

**In Database:**
```
user_id: [your-id]
product: books
plan_id: 1m
status: active
provider: mpesa
mpesa_reference: sub_books_user_timestamp
```

**In Browser:**
```
✓ No errors in console
✓ Network request successful (200 OK)
✓ Response contains checkoutRequestId
```

---

**Status:** Demo Mode is Working ✅  
**Next Step:** Configure real M-Pesa credentials for production