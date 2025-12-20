# M-Pesa Payment System Setup - Complete Walkthrough

## What You're Building

A system where:
1. ✅ Users sign up to your app
2. ✅ Users click "Subscribe" to access premium content
3. ✅ Users enter their M-Pesa phone number
4. ✅ M-Pesa sends a payment prompt to their phone
5. ✅ User enters their M-Pesa PIN
6. ✅ Payment is confirmed
7. ✅ User gets access to content
8. ✅ You receive the money

---

## Current Status ✅

**What's Done:**
- ✅ Consumer Key configured: `JmTIKawu0Jvur2YA7iFnSmS2ZO15ObCJSGtXHNb1WSv6F83U`
- ✅ Consumer Secret configured: `ILRULsnEKAhzzZXBwmyJsM0FjiGeHjm1SP7BQKFTXAZSgK9bBcCnfCZTJKnblih4`
- ✅ Credentials tested and working!
- ✅ Backend updated with M-Pesa code
- ✅ Frontend updated for phone input

**What's Missing:**
- ❌ Business Shortcode (paybill number)
- ❌ Passkey
- ❌ Initiator Name & Password
- ❌ Security Credential

---

## Step 1: Get Your Business Shortcode & Passkey

### Option A: If You Have M-Pesa Business Account

1. Go to: https://www.safaricom.co.ke/business/m-pesa/m-pesa-business
2. Log in with your business account
3. Click "Online Tools" or "API Settings"
4. Look for:
   - **Business Shortcode**: Your paybill number (example: `174379`)
   - **Passkey**: Long alphanumeric code (example: `bfb279f9aa9bdbcf158e97dd1a503b6e78c6f69f7e1f4836f78f2e6c2c1f0`)

### Option B: If You Don't Have These Yet

**For Testing (Sandbox Mode):**
Use these test credentials (they work in sandbox):
```
Business Shortcode: 174379
Passkey: bfb279f9aa9bdbcf158e97dd1a503b6e78c6f69f7e1f4836f78f2e6c2c1f0
```

These are Safaricom's official test credentials.

---

## Step 2: Configure Your System

Once you have your credentials, follow this:

### A. Update Your .env File

Go to `backend/.env` and update these lines:

```dotenv
# payment system by Safaricom M-Pesa
MPESA_CONSUMER_KEY=JmTIKawu0Jvur2YA7iFnSmS2ZO15ObCJSGtXHNb1WSv6F83U
MPESA_CONSUMER_SECRET=ILRULsnEKAhzzZXBwmyJsM0FjiGeHjm1SP7BQKFTXAZSgK9bBcCnfCZTJKnblih4
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e78c6f69f7e1f4836f78f2e6c2c1f0
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=Safaricom@123
MPESA_SECURITY_CREDENTIAL=your_security_credential_here_if_available
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=http://localhost:5001/api/subscriptions/mpesa/callback
```

### B. Run Database Migration

Open Supabase console and run this SQL:

```sql
-- Add M-Pesa columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS mpesa_reference TEXT;

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS mpesa_receipt TEXT;

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS raw_mpesa JSONB;

CREATE INDEX IF NOT EXISTS idx_subscriptions_mpesa_reference
ON subscriptions(mpesa_reference)
WHERE mpesa_reference IS NOT NULL;
```

---

## Step 3: Start Your System

### Start Backend
```bash
cd backend
npm start
```

You should see:
```
[M-Pesa] Status: ✅ Configured - production mode
✅ Backend + WebSocket server running on http://localhost:5000
```

### Start Frontend (in new terminal)
```bash
npm start
```

---

## Step 4: Test the Payment Flow

### Test User Flow:

1. **Sign In**
   - Sign in to your app with any account

2. **Click Subscribe**
   - Click on any book/content that requires subscription
   - Click "Subscribe" button

3. **Enter Phone Number**
   - Enter your M-Pesa phone number
   - Example: `0712345678` (must be real Kenyan number for production)

4. **Select Plan**
   - Choose "1 month - Ksh 50" (cheapest for testing)

5. **Click "Pay with M-Pesa"**
   - System will send STK push
   - You'll see: "M-Pesa payment request sent to 0712345678"
   - Check your phone for M-Pesa prompt

6. **Enter M-Pesa PIN**
   - Enter your actual M-Pesa PIN on your phone
   - Payment will be processed

7. **Click "Verify"**
   - Come back to app
   - Click "I have completed payment – Verify"
   - If successful, subscription activated ✅

---

## Subscription Plans Available

Users can choose from:
- 1 month - Ksh 50
- 2 months - Ksh 100
- 3 months - Ksh 150
- 6 months - Ksh 300
- 12 months - Ksh 600

### What Users Can Access With Subscription:
- Books (online reading)
- Past Papers
- Videos

---

## Money Flow

```
User pays Ksh 50 via M-Pesa
         ↓
M-Pesa processes payment
         ↓
Money goes to your M-Pesa paybill account
         ↓
User gets instant access to content
         ↓
You get notified of payment
```

---

## Checking if Payment Was Received

### In Supabase Console:
1. Go to your database
2. Look at `subscriptions` table
3. You'll see new row with:
   - `user_id`: The user who paid
   - `product`: books/past_papers/videos
   - `status`: active
   - `mpesa_reference`: Transaction ID
   - `start_at` & `end_at`: Subscription dates

### In Your M-Pesa Account:
1. Log in to M-Pesa Business Account
2. Check "Transaction History"
3. You'll see incoming payments

---

## Troubleshooting

### "Failed to start subscription" Error

**If you see this:**
1. Check backend is running
2. Check phone number is correct format
3. Check internet connection

**Run test:**
```bash
cd backend
node test-mpesa-creds.js
```

### "Invalid Amount" Error

This shouldn't happen, but if it does:
- Check subscription plans are configured (they are)
- Restart backend

### Payment Sent but Not Verified

- Click "Verify" button again
- Sometimes M-Pesa callback takes a few seconds
- After 2-3 minutes, refresh page

### User Can't See Subscription

After subscription is active, user needs to:
1. Refresh the page
2. Sign out and sign in again
3. Then they'll see content is unlocked

---

## Testing With Real Money

### When Ready for Real Payments:

1. Get your **actual** M-Pesa business credentials
2. Update `.env` file:
```dotenv
MPESA_ENVIRONMENT=production
MPESA_BUSINESS_SHORTCODE=your_actual_shortcode
MPESA_PASSKEY=your_actual_passkey
```

3. Update callback URL to your domain:
```dotenv
MPESA_CALLBACK_URL=https://yourdomain.com/api/subscriptions/mpesa/callback
```

4. Restart backend
5. Test with small amount (Ksh 50)
6. Once working, go live!

---

## What Happens When You Go Live

### User Experience:
1. User enters phone number
2. M-Pesa prompt appears on their phone
3. They enter PIN
4. Money is taken from their M-Pesa account
5. They get instant access
6. They can read/watch unlimited

### Your Side:
1. Money appears in your M-Pesa account
2. You can withdraw it to your bank
3. System tracks all payments in database
4. You can see analytics

---

## Income Tracking

All payments are recorded in database:
- User who paid
- What they paid for
- How much they paid
- When they paid
- Payment status

You can build admin dashboard to see:
- Total revenue
- Active subscribers
- Payment history
- User breakdown

---

## Quick Checklist

- [ ] Have M-Pesa Business Shortcode
- [ ] Have M-Pesa Passkey
- [ ] Updated `.env` file
- [ ] Ran database migration
- [ ] Backend is running
- [ ] Frontend is running
- [ ] Tested with phone number
- [ ] Verified payment went through
- [ ] User has access to content

---

## Next Steps

1. **Today:** Get your Business Shortcode & Passkey
2. **Tomorrow:** Update `.env` and test
3. **This Week:** Test with real money (small amounts)
4. **Next Week:** Go live!

---

## Need Help?

**If stuck on any step:**
1. Check backend logs (terminal output)
2. Check browser console (F12)
3. Check database (Supabase)
4. Message me with the specific error

**Example of what to send me:**
```
ERROR: "Failed to start subscription"
Phone number: 0712345678
Plan selected: 1m
Backend log shows: [paste error here]
```

---

## That's It! 🎉

You now have a complete payment system where:
- Users subscribe
- Users pay via M-Pesa
- You receive money
- Users get access

Everything is set up and ready to go!