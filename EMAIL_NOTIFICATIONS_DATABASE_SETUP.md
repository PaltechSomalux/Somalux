# Email Notifications Database Setup Guide

## ❌ Current Status
The email notification tables are **missing** from your Supabase database:
- ❌ `admin_notifications` - Does NOT exist
- ❌ `admin_notification_logs` - Does NOT exist  
- ❌ `email_templates` - Does NOT exist

## ✅ Solution: Run SQL Migration

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/
2. Sign in with your account
3. Select your project: **wuwlnawtuhjoubfkdtgc**

### Step 2: Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New query** button

### Step 3: Copy the SQL
Copy the entire SQL script from:
```
c:\Intel\Magic\SomaLux\sql\admin_notifications_system.sql
```

### Step 4: Paste & Execute
1. Paste the SQL into the Supabase SQL Editor
2. Click the **Play** button (▶️) to execute
3. Wait for success message

### Step 5: Verify Tables Created
Run this query to confirm:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('admin_notifications', 'admin_notification_logs', 'email_templates');
```

Should return 3 rows showing all three tables exist.

## 📋 What Gets Created

### admin_notifications
Stores all email notifications sent by admins to users:
- `id` - Unique notification ID
- `admin_name` - Who sent it
- `title` - Email subject
- `message` - Email body
- `notification_type` - Type: update, new_feature, system_downtime, congratulation, general
- `recipient_type` - Target: all_users, specific_users, by_role, by_tier
- `status` - Sending status: draft, scheduled, sending, sent, failed
- `sent_count`, `failed_count` - Delivery metrics

### admin_notification_logs
Tracks individual email delivery for each recipient:
- `notification_id` - Links to admin_notifications
- `user_email` - Recipient email
- `status` - Per-email status: pending, sent, failed, bounced, opened, clicked
- `sent_at` - Timestamp when sent
- `error_message` - Error details if failed

### email_templates
Pre-made templates for quick reuse:
- `name` - Template name (must be unique)
- `category` - Type: updates, features, downtime, congratulation, custom
- `subject` - Email subject template
- `body` - Email body template
- `variables` - Template variables like {{username}}, {{date}}

## 🔐 Security
All tables have RLS (Row Level Security) policies that:
- Only allow admins to send emails
- Track who sent what
- Audit all operations
- Protect user data

## 🚀 After Migration
1. Run this to verify tables are working:
   ```
   cd backend
   node check-email-tables.js
   ```
   Should show all 3 tables with ✅

2. Restart backend:
   ```
   npm start
   ```

3. Try sending an email from Admin → Send Emails

## ⚠️ Important Notes

### Service Role Key
The email system uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for admin operations.
- ✅ Already configured in `.env`
- ✅ Only admins can access the send-emails page
- ✅ Database policies enforce additional security

### Email Configuration
Make sure these are set in `.env`:
```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

See Gmail setup guide if you need app password.

## 🆘 Troubleshooting

### Still getting 500 error after migration?
1. Check backend logs for specific error message
2. Verify all 3 tables were created:
   ```
   node check-email-tables.js
   ```
3. Restart backend: `npm start`
4. Check `.env` has `SUPABASE_SERVICE_ROLE_KEY`

### Can't run SQL in Supabase Dashboard?
Try the alternative via Supabase CLI:
```powershell
# Install if not already installed
npm install -g supabase

# Login to your project
supabase link --project-ref wuwlnawtuhjoubfkdtgc

# Run migration
supabase db push --file sql/admin_notifications_system.sql
```

### Still not working?
Check the `send` endpoint is returning the exact error in backend logs.
