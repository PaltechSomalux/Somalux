# Advanced Email System Features - Implementation Guide

## Overview
Successfully implemented three major email system enhancements:
1. **Email Analytics & Tracking** - Track opens, clicks, and engagement metrics
2. **Scheduled Email Campaigns** - Send emails at specific times
3. **Bounce & Invalid Email Handling** - Detect and manage bounced emails

---

## Feature 1: Email Analytics & Tracking

### What It Does
- Tracks when recipients open emails (pixel-based tracking)
- Tracks link clicks within emails
- Captures device and email client information
- Calculates engagement metrics (open rate, click rate, click-through rate)
- Stores detailed analytics for each notification

### How It Works

#### Email Opens
1. When email is sent, a 1x1 tracking pixel is embedded:
   ```html
   <img src="http://localhost:5000/api/email/track/open/{trackingToken}" />
   ```
2. When recipient opens email, their email client loads the pixel
3. Backend records: open time, device type, email client, IP address
4. Analytics automatically calculated

#### Link Clicks
1. Links in emails are wrapped to go through tracker:
   ```html
   <a href="http://localhost:5000/api/email/track/click/{trackingToken}?url={encodedURL}">Link</a>
   ```
2. When clicked, system records: user, link, time, device
3. Then redirects to original URL
4. Click-through rate automatically updated

#### Analytics Metrics
- **Open Rate**: (Unique Opens / Total Sent) × 100%
- **Click Rate**: (Unique Clicks / Total Sent) × 100%
- **Click-Through Rate**: (Total Clicks / Total Opens) × 100%
- **Device Breakdown**: Mobile, Desktop, Tablet percentages
- **Email Client**: Gmail, Outlook, Apple Mail, etc.

### Database Tables Created
```
- email_open_tracking → Tracks pixel loads per email
- email_click_tracking → Tracks link clicks per email
- email_analytics_snapshot → Pre-calculated metrics for dashboard
```

### API Endpoints

#### Get Analytics for a Notification
```
GET /api/admin/notifications/:notificationId/analytics

Response:
{
  "success": true,
  "analytics": {
    "total_sent": 100,
    "unique_opens": 45,
    "open_rate": 45.00,
    "unique_clicks": 20,
    "click_rate": 20.00,
    "click_through_rate": 44.44,
    "opens_mobile": 30,
    "opens_desktop": 15,
    "opens_gmail": 25,
    "opens_outlook": 15,
    ...
  },
  "detailed": {
    "opens": [...],
    "clicks": [...],
    "totalOpens": 45,
    "uniqueOpeners": 42
  }
}
```

#### Tracking Endpoints (Used Internally)
```
GET /api/email/track/open/:token → Records open, returns 1x1 GIF
GET /api/email/track/click/:token?url=encoded → Records click, redirects to URL
```

### Usage in Email Sending

In your email.js or sendEmail function:
```javascript
import { createEmailTracking, createTrackedLink, createTrackingPixelHTML } 
  from './emailTracking.js';

// When sending email:
const trackingToken = await createEmailTracking(notificationId, logId, userEmail);

// Modify email HTML:
let emailHtml = notification.html_content;

// Add tracking pixel
emailHtml += createTrackingPixelHTML(trackingToken);

// Wrap links (if tracking enabled)
if (notification.track_clicks) {
  emailHtml = emailHtml.replace(/<a href="([^"]+)"/g, (match, url) => {
    return `<a href="${createTrackedLink(url, trackingToken, linkText)"`;
  });
}
```

---

## Feature 2: Scheduled Email Campaigns

### What It Does
- Schedule emails to send at specific date/time
- Support for timezone-aware scheduling (e.g., 9 AM in user's local time)
- Queue management for scheduled sends
- Automatic processing when scheduled time arrives
- Ability to reschedule or cancel

### How It Works

1. **Schedule Email**: Admin sets notification status to "scheduled" with future date
2. **Queue Entry**: System creates entry in `scheduled_send_queue` table
3. **Processor Checks**: Backend processor runs every 60 seconds
4. **Send When Ready**: When scheduled time arrives, processor sends email
5. **Auto-Retry**: Failed sends retry automatically (max 3 attempts)

### Database Tables Created
```
scheduled_send_queue → Queue of emails waiting for scheduled time
```

### API Endpoints

#### Schedule an Email
```
POST /api/admin/notifications/schedule

Request:
{
  "notificationId": "uuid",
  "scheduledTime": "2025-02-20T09:30:00Z",
  "timezone": "America/New_York"  // Optional
}

Response:
{
  "success": true,
  "message": "Email scheduled successfully"
}
```

#### Get Scheduled Emails
```
GET /api/admin/notifications/scheduled?status=pending

Response:
{
  "success": true,
  "schedules": [
    {
      "id": "uuid",
      "notification_id": "uuid",
      "scheduled_time": "2025-02-20T09:30:00Z",
      "status": "pending",
      "attempt_count": 0
    },
    ...
  ]
}
```

#### Cancel a Scheduled Email
```
DELETE /api/admin/notifications/scheduled/:scheduleId

Response:
{
  "success": true,
  "message": "Schedule cancelled"
}
```

### Processor Details

The `startScheduledSendProcessor` runs automatically on backend startup:
- Checks every 60 seconds for due emails
- Processes due emails immediately
- Automatically retries failed sends (with 5-minute delays)
- Updates notification status as it progresses

```javascript
// Auto-starts in backend index.js
startScheduledSendProcessor(60000); // Check every 60 seconds
```

### Usage Flow

1. **Create Notification** with status: "draft"
2. **Schedule It**: POST `/api/admin/notifications/schedule`
3. **System Sets**: status → "scheduled", scheduled_status → "scheduled"
4. **Processor Runs**: Every 60 seconds checks for due emails
5. **Auto-Send**: When time arrives, email queued and sent normally
6. **Status Updates**: notification.status changes to "sending" → "sent"

---

## Feature 3: Bounce & Invalid Email Handling

### What It Does
- Detects bounced or invalid email addresses
- Distinguishes between hard bounces (permanent) and soft bounces (temporary)
- Automatically removes hard-bounced emails from future sends
- Tracks bounce reasons and SMTP error codes
- Maintains list of invalid emails for reporting

### How It Works

#### Bounce Types
- **Hard Bounce**: Permanent failure (user doesn't exist, invalid domain)
  - Action: Remove from future sends immediately
  - Examples: "550 No such user", "Invalid address"

- **Soft Bounce**: Temporary failure (mailbox full, server busy)
  - Action: Track but retry later
  - Examples: "421 Try again later", "452 Insufficient storage"

- **Complaint**: User marked as spam
  - Action: Remove immediately
  - Example: ISP reports abuse complaint

#### Bounce Detection
System extracts error type from SMTP error message:
```javascript
const bounceType = detectBounceType(errorMessage, errorCode);
// Returns: 'hard_bounce', 'soft_bounce', or 'complaint'
```

#### Filtering Before Send
Before sending to an email, system checks:
```javascript
const invalid = await isEmailInvalid(emailAddress);
if (invalid) {
  // Skip this email
  return;
}
```

### Database Tables Created
```
invalid_email_addresses → Tracks bounced/invalid emails
  Fields include:
  - bounce_type (hard_bounce, soft_bounce, complaint)
  - status (active, archived)
  - total_bounces (count)
  - smtp_error_code and smtp_error_message
  - first_bounce_at, last_bounce_at
```

### API Endpoints

#### Record a Bounce
```
POST /api/admin/notifications/bounce

Request:
{
  "emailAddress": "user@example.com",
  "userId": "uuid",
  "bounceType": "hard_bounce",
  "errorMessage": "550 No such user",
  "errorCode": "550",
  "notificationId": "uuid"
}

Response:
{
  "success": true,
  "action": "removed",  // or "tracked" for soft bounces
  "message": "Email removed"
}
```

#### Get Bounce Statistics
```
GET /api/admin/bounces/stats

Response:
{
  "success": true,
  "bounceStats": {
    "total": 145,
    "hardBounces": 45,
    "softBounces": 80,
    "complaints": 20,
    "active": 100,
    "archived": 45
  }
}
```

### Usage in Email Sending

In your email.js send function:
```javascript
import { shouldSkipSending, processBounce } from './bounceHandler.js';

// Before sending
if (await shouldSkipSending(recipient.email)) {
  console.log('Skipping ' + recipient.email + ' (previously bounced)');
  continue;
}

// After send failure
try {
  await transporter.sendMail({...});
} catch (error) {
  // Process bounce
  const action = await processBounce(
    recipient.email,
    recipient.userId,
    error.message,
    error.code,
    notificationId
  );
  // If hard bounce, email automatically marked as invalid
}
```

### Auto-Cleanup
System automatically marks emails as invalid after 3 hard bounces:
```javascript
// Runs via PostgreSQL function
mark_hard_bounced_emails_invalid()
```

### Restore an Email
If you want to restore a previously invalid email:
```javascript
import { restoreEmail } from './bounceHandler.js';

await restoreEmail('user@example.com');
// Status changes from 'archived' back to 'active'
```

---

## Integration Points

### In Email Sending Flow
1. **Before send**: Check if email is invalid via `shouldSkipSending()`
2. **During send**: Record tracking token via `createEmailTracking()`
3. **On success**: Add timestamp to bounce history for clearing
4. **On bounce error**: Call `processBounce()` to handle
5. **Track engagement**: Pixels/links automatically tracked

### In Notification Updates
When updating a notification's analytics:
```javascript
// This is called automatically on every open/click
const analytics = await calculateNotificationAnalytics(notificationId);
```

---

## Database Migration

Before using these features, run the SQL migration:

```bash
# In Supabase SQL Editor, run:
# sql/ADD_ANALYTICS_SCHEDULING_BOUNCE_TRACKING.sql
```

This creates:
- 6 new tables
- 12 indexes
- 2 PostgreSQL functions
- RLS policies for security

---

## Dashboard Integration (Next Steps)

The admin SendEmails.jsx component can be enhanced to show:

1. **Analytics Card**:
   - Open rate percentage
   - Click rate percentage
   - Device breakdown pie chart
   - Email client breakdown

2. **Scheduling**:
   - "Schedule Send" button/modal
   - Calendar picker for date/time
   - Timezone selector
   - List of scheduled emails

3. **Bounce Management**:
   - "Bounce Stats" card showing invalid emails
   - List of hard-bounced addresses
   - Option to restore emails
   - Export bounce report

---

## Performance Considerations

- **Email Opens**: Pixels tracked asynchronously, doesn't slow down email send
- **Click Tracking**: Happens on redirect, minimal overhead
- **Scheduled Processor**: Runs every 60 seconds, checks only due emails
- **Analytics Calculation**: Async after events, pre-aggregated for speed
- **Bounce Filtering**: O(1) lookup via email address index

---

## Testing

### Test Email Opens
1. Schedule an email
2. Open email in Gmail
3. Check admin dashboard - should show opened
4. GET `/api/admin/notifications/{id}/analytics` - should show open_count > 0

### Test Click Tracking
1. Send email with tracked link
2. Click link in email
3. Should redirect to original URL
4. Dashboard should show click recorded

### Test Bounce Handling
1. Try sending to invalid email (e.g., asdfjkl@invalid.fake)
2. Catch bounce error and call POST `/api/admin/notifications/bounce`
3. GET `/api/admin/bounces/stats` - should show hard_bounce count increased

### Test Scheduled Sends
1. Schedule email for 2 minutes from now
2. Wait for processor to trigger
3. Email should be queued and sent
4. Notification status should change to "sent"

---

## Files Created/Modified

**New Files:**
- `backend/utils/emailTracking.js` - Pixel and click tracking
- `backend/utils/bounceHandler.js` - Bounce detection and management
- `backend/utils/scheduledSendQueue.js` - Scheduled send processor
- `sql/ADD_ANALYTICS_SCHEDULING_BOUNCE_TRACKING.sql` - Database schema

**Modified Files:**
- `backend/routes/emailNotifications.js` - Added 8 new API endpoints
- `backend/index.js` - Added processor startup

---

## Next Steps

1. **Run SQL Migration** in Supabase
2. **Restart Backend** - will start scheduled processor
3. **Update SendEmails.jsx** - Add UI for scheduling and analytics
4. **Test Features** - Send test emails, check tracking
5. **Monitor Backend Logs** - Verify processor running every 60s

All systems are now in place and ready to use!
