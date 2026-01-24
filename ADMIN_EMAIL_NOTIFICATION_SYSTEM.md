# Admin Email Notification System - Complete Implementation Guide

## 🎯 Overview

A comprehensive email notification system that allows administrators to send targeted emails to users about system updates, new features, maintenance windows, congratulations, and general announcements. The system includes templates, delivery tracking, and email history.

## 📦 System Components

### 1. **Database Schema** (`sql/admin_notifications_system.sql`)

#### Tables Created:
- **admin_notifications** - Stores all notification campaigns
- **admin_notification_logs** - Tracks individual email delivery status
- **email_templates** - Pre-built and custom email templates

#### Key Features:
- Full Row Level Security (RLS) policies for admin-only access
- Indexed for fast queries and reporting
- Support for rich filtering and recipient targeting

### 2. **Backend API Routes** (`backend/routes/emailNotifications.js`)

#### Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **GET** | `/api/admin/notifications` | Fetch all notifications with filters |
| **GET** | `/api/admin/notifications/:id` | Get single notification with delivery logs |
| **POST** | `/api/admin/notifications/send` | Send email notifications to users |
| **GET** | `/api/admin/templates` | Fetch available email templates |
| **POST** | `/api/admin/templates` | Create new email template |
| **GET** | `/api/admin/notification-stats` | Get notification statistics |

#### Send Email Request Body:
```json
{
  "title": "Important Update",
  "message": "We have an important update...",
  "htmlContent": "<h1>Optional</h1>...",
  "notificationType": "update|new_feature|system_downtime|congratulation|general",
  "recipientType": "all_users|specific_users|by_role|by_tier",
  "recipientFilter": { "role": "admin", "tier": "premium" },
  "recipientsList": [{ "email": "user@example.com", "id": "uuid" }],
  "adminName": "John Admin",
  "adminEmail": "admin@somalux.com",
  "tags": ["maintenance", "urgent"],
  "isUrgent": true
}
```

### 3. **Frontend UI Component** (`src/SomaLux/Books/Admin/pages/SendEmails.jsx`)

#### Three Main Tabs:

**1. Compose Tab**
- Form to create and send new notifications
- Recipient targeting (all users, by role, by tier, specific emails)
- Message composition with variable support
- Urgent flag and tags

**2. Templates Tab**
- Pre-built templates for common scenarios:
  - System Updates
  - New Feature Announcements
  - Scheduled Downtime
  - Congratulations
- One-click template application

**3. History Tab**
- View all sent notifications
- Delivery statistics (sent, failed, bounced)
- Detailed delivery logs per notification
- Filter by status and type

### 4. **Styling** (`src/SomaLux/Books/Admin/pages/SendEmails.css`)
- Responsive design for mobile and desktop
- Material-UI integration
- Professional email preview styling

## 🚀 Setup Instructions

### Step 1: Deploy Database Schema

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Create a new query and paste contents from `sql/admin_notifications_system.sql`
4. Execute the migration

Verify tables were created:
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_notifications', 'admin_notification_logs', 'email_templates');
```

### Step 2: Configure Environment Variables

Ensure your `.env` file has these email credentials:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@somalux.com
EMAIL_LOGO_URL=https://your-domain.com/logo.png

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the generated password in `EMAIL_PASS`

### Step 3: Backend Integration

The backend already has the route registered in `backend/index.js`:

```javascript
import emailNotificationsRouter from './routes/emailNotifications.js';
app.use('/api/admin', emailNotificationsRouter);
```

Test the endpoint:
```bash
curl -X GET http://localhost:5000/api/admin/notifications
```

### Step 4: Frontend Integration

The component is already integrated in `BooksAdmin.jsx`:

1. Import added: `const SendEmails = React.lazy(() => import('./pages/SendEmails'));`
2. Route added: `<Route path="send-emails" element={<SendEmails />} />`
3. Navigation link added in SYSTEM section

## 📋 Usage Guide

### For Admins

#### Sending a One-Off Email

1. Navigate to **Admin Dashboard → System → Send Emails**
2. Click **Compose** tab
3. Fill out:
   - **Notification Type**: Select from dropdown (Update, Feature, Downtime, etc.)
   - **Subject/Title**: Email subject line
   - **Message Body**: Main email content
   - **Who should receive**: Choose recipient type
4. Click **Preview Email** to check formatting
5. Click **Send Email** to dispatch

#### Using Templates

1. Click **Templates** tab
2. Find desired template
3. Click **Use Template**
4. System returns to Compose with template pre-filled
5. Customize as needed and send

#### Monitoring Delivery

1. Click **History** tab
2. View all sent notifications with:
   - Delivery status
   - Number of successful sends
   - Failure count
   - Detailed per-user logs

### Recipient Types Explained

| Type | Use Case | Example |
|------|----------|---------|
| **All Users** | Platform-wide announcements | "System maintenance tonight" |
| **By Role** | Admin/Editor/Viewer specific | "New admin features available" |
| **By Tier** | Subscription-specific | "Premium feature unlock" |
| **Specific Emails** | Individual targeting | "Congratulations on your achievement" |

### Variable Placeholders

Use these in message body for dynamic content:

```
{{username}} - Recipient's username
{{email}} - Recipient's email
{{date}} - Current date
{{tier}} - User's subscription tier
{{role}} - User's role
{{first_name}} - User's first name
{{update_details}} - (template-specific)
{{feature_description}} - (template-specific)
{{maintenance_date}} - (template-specific)
```

## 🔒 Security & Permissions

### Access Control

Only users with `admin` or `editor` role can:
- Send notifications
- View notification history
- Create/manage templates

### RLS Policies

- Administrators can fully manage notifications
- Editors can manage notifications
- Regular users cannot access notification system

### Email Verification

System verifies SMTP credentials on backend startup:

```bash
✅ [EMAIL CONFIG] Email server connection verified successfully!
```

If you see warnings, check your `.env` configuration.

## 📊 Database Queries

### Get Delivery Statistics

```sql
SELECT 
  notification_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM admin_notifications
GROUP BY notification_type;
```

### Find Failed Emails

```sql
SELECT 
  n.title,
  l.user_email,
  l.error_message,
  l.created_at
FROM admin_notification_logs l
JOIN admin_notifications n ON l.notification_id = n.id
WHERE l.status = 'failed'
ORDER BY l.created_at DESC;
```

### Email Delivery Rate

```sql
SELECT 
  notification_id,
  ROUND(100.0 * COUNT(CASE WHEN status = 'sent' THEN 1 END) / 
        COUNT(*), 2) as delivery_rate
FROM admin_notification_logs
GROUP BY notification_id;
```

## 🐛 Troubleshooting

### Emails Not Sending

**Problem**: Getting "Email credentials not configured" error

**Solution**:
1. Verify EMAIL_USER and EMAIL_PASS in `.env`
2. Restart backend server
3. Check email credentials are correct
4. For Gmail, ensure you generated an App Password

### Slow Email Delivery

**Problem**: Emails taking long time to send

**Solution**:
- System sends emails in background with 100ms delay between each
- For bulk sends (1000+ emails), this may take several minutes
- This is intentional to avoid rate limiting

**To speed up**:
Edit `backend/routes/emailNotifications.js` line ~175:
```javascript
await new Promise((resolve) => setTimeout(resolve, 50)); // Reduce from 100ms
```

### High Failure Rate

**Problem**: Many emails marked as failed

**Solution**:
1. Check logs: "Notification History" tab shows error messages
2. Verify recipient emails are valid
3. Check if your email domain is on spam blacklist
4. For Gmail accounts, enable "Less secure app access"

### Database Errors

**Problem**: "admin_notifications table not found"

**Solution**:
1. Re-run the SQL migration: `sql/admin_notifications_system.sql`
2. Verify you're using correct Supabase URL and key
3. Check RLS policies aren't blocking access

## 🎨 Customization

### Adding New Notification Types

1. Edit `SendEmails.jsx` line ~34:
```javascript
const NOTIFICATION_TYPES = [
  // ... existing types
  { value: 'custom_type', label: 'Custom Type', color: '#new_color' },
];
```

2. Add corresponding template in Templates tab

### Creating Custom Email Templates

**Via Database**:
```sql
INSERT INTO public.email_templates (
  created_by, name, category, subject, body, html_body, variables, is_public
) VALUES (
  'admin-user-id',
  'My Custom Template',
  'custom',
  'Custom Email Subject',
  'Email body text...',
  '<h1>HTML version</h1>',
  '{"{{custom_var}}": "Description"}',
  true
);
```

**Via UI** (coming soon):
- Admin panel to create templates without SQL

### Styling Email Template

Emails use branded HTML template from `backend/utils/email.js`

Customize:
- Logo URL: Set `EMAIL_LOGO_URL` env var
- Colors: Edit `buildBrandedEmailHtml()` function
- Header/Footer: Modify HTML in `email.js`

## 📈 Monitoring & Analytics

### View Notification Metrics

History tab displays:
- Total notifications sent
- Successful delivery count
- Failed delivery count
- Detailed per-recipient status

### Export Delivery Data

```sql
SELECT 
  notification_id,
  user_email,
  status,
  created_at,
  opened_at
FROM admin_notification_logs
WHERE notification_id = 'your-notification-id'
ORDER BY created_at DESC;
```

## 🔄 Scheduled Emails (Future Enhancement)

Current implementation:
- ✅ Sends immediately upon request
- ✅ Background processing to avoid blocking

Future plans:
- Schedule emails for future date/time
- Recurring newsletter setup
- Automated trigger-based emails

To implement scheduled emails:
1. Add `scheduled_for` field handling in backend
2. Create background job scheduler
3. Update UI to accept schedule date/time

## 📚 API Documentation

### Send Notification

**Request**:
```bash
POST /api/admin/notifications/send
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "Maintenance window 2-4 AM tonight",
  "notificationType": "system_downtime",
  "recipientType": "all_users",
  "adminName": "Admin User",
  "adminEmail": "admin@somalux.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email sending initiated. Notification ID: uuid",
  "notificationId": "uuid",
  "recipientCount": 5234
}
```

### Get Notifications

**Request**:
```bash
GET /api/admin/notifications?status=sent&limit=50&offset=0
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Update",
      "notification_type": "update",
      "status": "sent",
      "recipient_count": 1000,
      "sent_count": 998,
      "failed_count": 2,
      "created_at": "2024-01-24T10:00:00Z"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

## 🎯 Best Practices

### Email Content

1. **Keep subjects clear and concise** - under 60 characters
2. **Use friendly tone** - address users personally
3. **Include call-to-action** when applicable
4. **Test emails** before mass sending

### Recipient Targeting

1. **Start with small test group** - send to 10 users first
2. **Segment by role/tier** - relevant content increases engagement
3. **Avoid spam triggers** - don't use excessive capitalization
4. **Honor unsubscribe** - provide opt-out mechanism (future feature)

### Frequency

1. **Weekly maximum** - avoid email fatigue
2. **Stagger important updates** - don't send multiple same day
3. **Schedule off-peak hours** - send during business hours
4. **Monitor engagement** - track opens and clicks

## 📞 Support

For issues or feature requests:

1. Check **Troubleshooting** section above
2. Review backend logs: `backend/backend.log`
3. Check frontend console for errors: Press F12
4. Verify database RLS policies are correctly applied

## 📄 Files Summary

| File | Purpose |
|------|---------|
| `sql/admin_notifications_system.sql` | Database schema and RLS policies |
| `backend/routes/emailNotifications.js` | API endpoints and email logic |
| `backend/utils/email.js` | Email sending utility (pre-existing) |
| `src/SomaLux/Books/Admin/pages/SendEmails.jsx` | React admin UI component |
| `src/SomaLux/Books/Admin/pages/SendEmails.css` | Component styling |
| `src/SomaLux/Books/Admin/BooksAdmin.jsx` | Route integration (modified) |
| `backend/index.js` | Route registration (modified) |

---

**Version**: 1.0.0  
**Last Updated**: January 24, 2026  
**Status**: Production Ready
