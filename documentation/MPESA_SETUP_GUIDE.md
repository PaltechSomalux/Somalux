# M-Pesa Integration Setup Guide

This guide explains how to set up Safaricom M-Pesa payment processing for your SomaLux application.

## Step 1: Get M-Pesa Daraja Credentials

To integrate M-Pesa into your application, you need to register on the M-Pesa Daraja platform:

1. Visit [https://developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create a developer account
3. Create an application for accessing M-Pesa APIs
4. From your application, get the following credentials:
   - **Consumer Key** - Your application's API consumer key
   - **Consumer Secret** - Your application's API consumer secret

## Step 2: Get M-Pesa Business Account Details

You need the following from your M-Pesa business account:

1. **Business Shortcode** - Your M-Pesa paybill number (usually 5-6 digits)
2. **Passkey** - Your M-Pesa API passkey (obtained from your M-Pesa account settings)
3. **Initiator Name** - The name of the initiator for STK push requests
4. **Initiator Password** - The password for the initiator account
5. **Security Credential** - Your M-Pesa security credential

**How to get these from your M-Pesa Business Account:**
- Log in to your M-Pesa Business Account portal
- Navigate to Online Tools/API section
- Generate your API credentials
- Note down all required information

## Step 3: Configure Environment Variables

Open `backend/.env` and update the following variables with your actual credentials:

```dotenv
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_actual_consumer_key_here
MPESA_CONSUMER_SECRET=your_actual_consumer_secret_here
MPESA_BUSINESS_SHORTCODE=your_business_shortcode_here
MPESA_PASSKEY=your_mpesa_passkey_here
MPESA_INITIATOR_NAME=your_initiator_name_here
MPESA_INITIATOR_PASSWORD=your_initiator_password_here
MPESA_SECURITY_CREDENTIAL=your_security_credential_here
MPESA_ENVIRONMENT=production

# Callback URL - where M-Pesa will send payment confirmations
MPESA_CALLBACK_URL=https://yourdomain.com/api/subscriptions/mpesa/callback
```

## Step 4: Test in Sandbox (Optional)

Before going live, you can test with sandbox credentials:

1. Use the sandbox credentials from Daraja
2. Set `MPESA_ENVIRONMENT=sandbox` in your `.env` file
3. Use test phone numbers provided by Safaricom
4. This allows you to test without making real payments

**To switch to production:**
- Change `MPESA_ENVIRONMENT=production`
- Ensure all credentials are production credentials
- Update callback URL to your production domain

## Step 5: Database Migration

Run the M-Pesa database migration to add the necessary columns:

```sql
-- Run this in your Supabase SQL editor
-- File: MIGRATE_TO_MPESA.sql
```

## Payment Flow

1. User enters their phone number in the subscription modal
2. User clicks "Pay with M-Pesa"
3. System sends an STK push request to M-Pesa
4. User receives a prompt on their phone to enter M-Pesa PIN
5. User enters PIN and completes payment
6. M-Pesa sends callback confirmation to your server
7. Subscription is automatically activated

## Troubleshooting

### "M-Pesa not configured on server" Error

**Solution:** Ensure all M-Pesa credentials are correctly set in the `.env` file. The credentials should NOT contain "your_" prefix.

### "Failed to authenticate with M-Pesa" Error

**Solution:** Check that:
- Consumer Key and Consumer Secret are correct
- They are from the same M-Pesa Daraja application
- Check the Daraja console for any API access restrictions

### "Invalid BusinessShortCode" Error

**Solution:** Ensure the Business Shortcode matches your actual M-Pesa paybill number

### "Invalid Amount" Error

**Solution:** The amount should be in KES. Ensure subscription plans have valid prices.

### Payment callback not being received

**Solution:** 
- Verify the callback URL is publicly accessible
- Ensure it matches the URL configured in M-Pesa Daraja portal
- Check server logs for incoming requests

## API Endpoints

### Initialize Payment
```
POST /api/subscriptions/mpesa/init
Headers:
  - Authorization: Bearer <supabase_auth_token>
  - Content-Type: application/json

Body:
{
  "product": "books",
  "planId": "1m",
  "phoneNumber": "254712345678"
}

Response:
{
  "ok": true,
  "checkoutRequestId": "...",
  "reference": "sub_books_userId_timestamp",
  "months": 1,
  "priceKes": 50
}
```

### Verify Payment
```
POST /api/subscriptions/mpesa/verify
Headers:
  - Authorization: Bearer <supabase_auth_token>
  - Content-Type: application/json

Body:
{
  "reference": "sub_books_userId_timestamp"
}

Response:
{
  "ok": true,
  "subscription": { ... }
}
```

### M-Pesa Callback (Automatic)
```
POST /api/subscriptions/mpesa/callback
```
This endpoint is called automatically by M-Pesa when a payment is completed.

## Security Considerations

1. **Never commit credentials** - Always use `.env` files and `.gitignore`
2. **Use HTTPS** - Ensure your callback URL uses HTTPS in production
3. **Validate requests** - The backend validates all incoming requests
4. **Log transactions** - All payment data is stored in the database for audit trail

## Contact Support

For M-Pesa API support:
- Safaricom Developer Support: [https://developer.safaricom.co.ke](https://developer.safaricom.co.ke)
- M-Pesa Business Account Support: Contact your Safaricom Business Account Manager

## Additional Resources

- [M-Pesa Daraja Documentation](https://developer.safaricom.co.ke/documentation)
- [STK Push API Reference](https://developer.safaricom.co.ke/Documentation)
- [M-Pesa API Integration Best Practices](https://developer.safaricom.co.ke/)