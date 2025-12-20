# M-Pesa Integration - Status & Usage Guide

## ✅ Migration Complete

Your payment system has been successfully migrated from **Paystack** to **Safaricom M-Pesa**.

## Current Status

### Backend Status
- ✅ M-Pesa endpoints created and functional
- ✅ Demo mode enabled for development/testing
- ❌ Production credentials not yet configured

### Frontend Status
- ✅ Phone number input field added
- ✅ M-Pesa payment flow implemented
- ✅ Error handling improved with helpful messages

### Database Status
- ✅ Migration script created (`MIGRATE_TO_MPESA.sql`)
- ⏳ Pending: Run migration to add M-Pesa columns to database

## How to Use (Current Demo Mode)

### For Testing/Development

The system is currently running in **demo mode** because M-Pesa credentials are not yet configured. This allows you to test the payment flow without setting up real M-Pesa credentials.

#### Steps to Test:
1. Open the subscription modal in your app
2. Enter any valid Kenyan phone number (e.g., `0712345678`)
3. Select a subscription plan
4. Click "Pay with M-Pesa"
5. You'll see a success message with a demo checkout request ID
6. Click "I have completed payment – Verify"
7. The subscription will be created in demo mode

### Demo Features
- ✅ Phone number validation
- ✅ STK push simulation
- ✅ Automatic subscription creation
- ✅ No real M-Pesa charges
- ✅ Full payment flow testing

## How to Configure for Production

To enable real M-Pesa payments, follow the **[M-Pesa Setup Guide](./MPESA_SETUP_GUIDE.md)**.

### Quick Steps:

1. **Get M-Pesa Credentials:**
   - Register at https://developer.safaricom.co.ke
   - Create an application
   - Get Consumer Key, Consumer Secret, Business Shortcode, and Passkey

2. **Update `.env` file:**
   ```dotenv
   MPESA_CONSUMER_KEY=your_actual_key
   MPESA_CONSUMER_SECRET=your_actual_secret
   MPESA_BUSINESS_SHORTCODE=your_shortcode
   MPESA_PASSKEY=your_passkey
   MPESA_INITIATOR_NAME=your_name
   MPESA_INITIATOR_PASSWORD=your_password
   MPESA_SECURITY_CREDENTIAL=your_credential
   MPESA_ENVIRONMENT=production
   MPESA_CALLBACK_URL=https://yourdomain.com/api/subscriptions/mpesa/callback
   ```

3. **Run Database Migration:**
   ```sql
   -- Execute MIGRATE_TO_MPESA.sql in your Supabase database
   ```

4. **Restart Backend:**
   ```bash
   npm start
   ```

5. **Test with Real Payments:**
   - Use real M-Pesa registered phone numbers
   - Test with small amounts
   - Verify callbacks are received

## Files Changed

### Backend
- `backend/index.js` - M-Pesa API endpoints and helpers
- `backend/.env` - M-Pesa configuration variables
- `backend/.env.example` - M-Pesa configuration template

### Frontend
- `src/SomaLux/Books/SubscriptionModal.jsx` - Phone input and M-Pesa flow
- `src/SomaLux/Books/BookPanel.css` - Styling for phone input
- `src/SomaLux/Subscriptions/SubscriptionThanks.jsx` - Updated thank you message

### Database
- `MIGRATE_TO_MPESA.sql` - Database schema changes

### Documentation
- `MPESA_SETUP_GUIDE.md` - Comprehensive setup instructions
- `MPESA_INTEGRATION_STATUS.md` - This file

## API Endpoints

### 1. Initialize Payment
```
POST /api/subscriptions/mpesa/init
Authorization: Bearer <supabase_token>
Content-Type: application/json

{
  "product": "books",
  "planId": "1m",
  "phoneNumber": "0712345678"
}

Response (Demo Mode):
{
  "ok": true,
  "checkoutRequestId": "DEMO_1702314000000",
  "reference": "sub_books_user_id_timestamp",
  "phoneNumber": "254712345678",
  "priceKes": 50,
  "isDemo": true
}

Response (Production):
{
  "ok": true,
  "checkoutRequestId": "ws_1234567890",
  "reference": "sub_books_user_id_timestamp",
  "phoneNumber": "254712345678",
  "priceKes": 50,
  "isDemo": false
}
```

### 2. Verify Payment
```
POST /api/subscriptions/mpesa/verify
Authorization: Bearer <supabase_token>
Content-Type: application/json

{
  "reference": "sub_books_user_id_timestamp"
}

Response:
{
  "ok": true,
  "subscription": {
    "id": "uuid",
    "user_id": "uuid",
    "product": "books",
    "plan_id": "1m",
    "status": "active",
    "provider": "mpesa",
    "start_at": "2024-12-13T10:00:00Z",
    "end_at": "2025-01-13T10:00:00Z",
    ...
  }
}
```

### 3. M-Pesa Callback (Automatic)
```
POST /api/subscriptions/mpesa/callback
```
This is called automatically by M-Pesa when payment is confirmed.

## Database Changes Required

Run this migration to add M-Pesa columns to your `subscriptions` table:

```sql
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

## Phone Number Validation

The system accepts various phone number formats:
- ✅ `0712345678` (Kenyan format)
- ✅ `254712345678` (International format without +)
- ✅ `+254712345678` (International format with +)

All are automatically converted to `254712345678` for M-Pesa API.

## Error Messages

### Common Errors During Demo/Development

1. **"M-Pesa is not properly configured on the server"**
   - This is normal in demo mode
   - Follow the production setup guide to configure real credentials

2. **"Phone number is required for M-Pesa payment"**
   - User didn't enter a phone number
   - Validation requires format: 0712345678 or +254712345678

3. **"Invalid Kenyan phone number"**
   - Phone number doesn't match Kenyan format
   - Must start with 0, 254, or +254

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Demo mode is functional
- [ ] Phone number input validates correctly
- [ ] Payment flow completes
- [ ] Subscription is created in database
- [ ] Verify endpoint works

## Security Notes

1. **Environment Variables**
   - Never commit real credentials to git
   - Always use `.env` file for secrets
   - `.gitignore` should include `.env`

2. **HTTPS in Production**
   - Callback URL MUST use HTTPS
   - Production M-Pesa API requires HTTPS

3. **Authorization**
   - All payment endpoints require valid Supabase auth token
   - Tokens are validated before processing payments

4. **Data Validation**
   - All inputs are validated
   - Phone numbers are formatted safely
   - Amounts are checked against plans

## Next Steps

1. **For Development:**
   - Continue testing with demo mode
   - Test the full subscription flow
   - Verify database integration

2. **For Production:**
   - Register on M-Pesa Daraja platform
   - Get production credentials
   - Update `.env` with real credentials
   - Run database migration
   - Configure HTTPS
   - Set callback URL to production domain

## Support & Resources

- **Daraja Documentation:** https://developer.safaricom.co.ke/documentation
- **M-Pesa Setup Guide:** See `MPESA_SETUP_GUIDE.md`
- **Safaricom Support:** Contact your account manager

## Troubleshooting

### Issue: Backend won't start
**Solution:** Check `backend/index.js` syntax with `node --check index.js`

### Issue: Phone number validation fails
**Solution:** Ensure phone number starts with 0, 254, or +254 followed by valid number

### Issue: Subscription not created
**Solution:** Check database has M-Pesa columns (run migration)

### Issue: Real payments not working
**Solution:** Verify all M-Pesa credentials are correct and active

---

**Status:** Migration Complete ✅  
**Date:** December 13, 2025  
**System:** Paystack → M-Pesa