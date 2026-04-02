# Admin Email System - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Run Database Migration
```bash
# Copy and paste the SQL from:
sql/admin_notifications_system.sql

# Into your Supabase SQL Editor and execute
```

### 2. Verify Email Config
Check your `.env` has:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 3. Restart Backend
```bash
npm start  # in backend folder
```

### 4. Access the Feature
- Go to: **Admin Dashboard → SYSTEM → Send Emails**
- Start composing!

---

## 📧 Sending Your First Email

1. Click **Compose** tab
2. Enter:
   - **Type**: "System Update"
   - **Subject**: "Welcome Update"
   - **Message**: "Hello! We have an update for you"
   - **Recipients**: "All Users"
3. Click **Send Email**

Done! ✅

---

## 🎯 Quick Tips

### Recipient Targeting

**Send to everyone:**
```
Recipient Type → "All Users"
```

**Send to admins only:**
```
Recipient Type → "By Role"
Select Role → "Admin"
```

**Send to premium users:**
```
Recipient Type → "By Tier"
Select Tier → "Premium"
```

**Send to specific people:**
```
Recipient Type → "Specific Users"
Enter emails (one per line):
user1@example.com
user2@example.com
```

### Using Templates

1. Click **Templates** tab
2. Select template (Update, Feature, Downtime, Congratulations)
3. Click **Use Template**
4. Customize text and send

### Check Delivery Status

1. Click **History** tab
2. See all sent emails with status:
   - ✅ Sent
   - ❌ Failed
   - 📊 Statistics

---

## 🚨 Troubleshooting

**"Email credentials not configured"**
- Check `.env` file has EMAIL_USER and EMAIL_PASS
- Restart backend
- For Gmail, use App Password (not regular password)

**Emails not appearing in table**
- Refresh the page
- Check browser console (F12) for errors
- Check backend logs

**Database error**
- Re-run SQL migration
- Verify Supabase credentials
- Check if tables exist in Supabase

---

## 📚 Full Documentation

See: `ADMIN_EMAIL_NOTIFICATION_SYSTEM.md`

---

## 🎨 Notification Types

| Type | Best For |
|------|----------|
| 🔵 Update | System updates, patches |
| 🟢 New Feature | Feature announcements |
| 🔴 Downtime | Maintenance alerts |
| 🟠 Congratulation | User achievements |
| ⚪ General | Any other message |

---

## 💡 Pro Tips

1. **Test first** - Send to yourself before mass sending
2. **Use templates** - Saves time and ensures consistency
3. **Tag emails** - Add tags like "urgent", "feature" for organizing
4. **Track history** - Always review what was sent and delivery status
5. **Time it right** - Avoid sending very late at night

---

## 🔗 API Examples

### Send email via API

```javascript
const response = await fetch('/api/admin/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Hello!',
    message: 'This is a test email',
    notificationType: 'general',
    recipientType: 'all_users',
    adminName: 'Admin',
    adminEmail: 'admin@somalux.com'
  })
});

const data = await response.json();
console.log(data); // { success: true, notificationId: '...', recipientCount: 150 }
```

### Get notification history

```javascript
const response = await fetch('/api/admin/notifications?limit=10');
const data = await response.json();
console.log(data.data); // Array of sent notifications
```

---

Ready to send? Go to **Admin Dashboard → Send Emails** now! 🚀
