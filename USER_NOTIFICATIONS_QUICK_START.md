# 📱 User Notifications - Quick Frontend Guide

## Quick Summary

When admin approves/rejects user files:
1. **Real-time notification** via WebSocket (if user is online)
2. **Email** sent to user (always)
3. **History API** available to fetch past notifications

---

## 🚀 Quick Start - 3 Steps

### Step 1: Connect WebSocket for Real-Time Notifications

```javascript
// In your app initialization
const ws = new WebSocket('wss://your-backend-url');

ws.onopen = () => {
  // Join user's personal notification channel
  ws.send(JSON.stringify({
    type: 'join_user',
    userId: currentUser.id
  }));
  console.log('Connected to notifications');
};

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  
  if (notification.type === 'submission_approved') {
    showSuccessNotification({
      title: notification.title,
      message: notification.message
    });
  } else if (notification.type === 'submission_rejected') {
    showErrorNotification({
      title: notification.title,
      message: notification.message,
      reason: notification.reason
    });
  }
};
```

### Step 2: Display Toast/Modal Notification

```javascript
function showSuccessNotification({ title, message }) {
  // Example: Using a toast library
  toast.success({
    title: '✅ ' + title,
    description: message,
    duration: 5000,
    action: {
      label: 'View',
      onClick: () => navigateToMyContent()
    }
  });
}

function showErrorNotification({ title, message, reason }) {
  // Example: Using a modal
  openModal({
    type: 'alert',
    title: '⚠️ ' + title,
    message: message,
    details: reason ? `Why: ${reason}` : null,
    buttons: [
      { label: 'Resubmit', onClick: () => navigateToUpload() },
      { label: 'OK', onClick: () => closeModal() }
    ]
  });
}
```

### Step 3: Fetch Notification History (Optional)

```javascript
async function loadNotificationHistory() {
  try {
    const response = await fetch('/api/user/notifications', {
      headers: {
        'x-user-id': currentUser.id
      }
    });
    
    const data = await response.json();
    
    if (data.ok) {
      displayNotifications(data.notifications);
    }
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
}

function displayNotifications(notifications) {
  return notifications.map(notif => ({
    id: notif.id,
    status: notif.status, // 'approved' or 'rejected'
    title: notif.title,
    message: notif.message,
    time: new Date(notif.timestamp).toLocaleString(),
    reason: notif.reason,
    icon: notif.status === 'approved' ? '✅' : '⚠️'
  }));
}
```

---

## 📦 Notification Object Structure

### Approval Notification
```javascript
{
  type: 'submission_approved',
  title: 'Submission Approved! 🎉',
  message: 'Your book "Title" has been approved and is now live!',
  submissionId: 'uuid-here',
  submissionType: 'books', // or 'past_papers'
  timestamp: '2026-01-20T10:30:00Z'
}
```

### Rejection Notification
```javascript
{
  type: 'submission_rejected',
  title: 'Submission Status Update',
  message: 'Your submission "Title" was not approved. Reason: Content needs revision',
  submissionId: 'uuid-here',
  submissionType: 'books',
  reason: 'Content needs revision', // null if no reason given
  timestamp: '2026-01-20T10:30:00Z'
}
```

### History API Response
```javascript
{
  ok: true,
  count: 3,
  notifications: [
    {
      id: 'submission-uuid',
      type: 'book', // 'book' or 'paper'
      title: 'Book Title',
      status: 'approved', // 'approved' or 'rejected'
      timestamp: '2026-01-20T10:30:00Z',
      reason: null,
      message: '...'
    }
  ]
}
```

---

## 🎯 Common Use Cases

### Show In-App Toast When File is Approved
```javascript
if (notification.type === 'submission_approved') {
  showToast({
    variant: 'success',
    title: '🎉 Great news!',
    description: 'Your submission has been approved',
    action: {
      label: 'View',
      onClick: () => window.location.href = `/my-content/${notification.submissionId}`
    }
  });
}
```

### Show Modal When File is Rejected
```javascript
if (notification.type === 'submission_rejected') {
  showModal({
    variant: 'warning',
    title: 'Submission Not Approved',
    description: notification.message,
    reason: notification.reason ? `Why: ${notification.reason}` : null,
    actions: [
      { label: 'Resubmit', onClick: () => goToUploadPage() },
      { label: 'Dismiss', onClick: () => closeModal() }
    ]
  });
}
```

### Create Notification Badge
```javascript
async function getUnreadNotificationCount() {
  const response = await fetch('/api/user/notifications', {
    headers: { 'x-user-id': currentUser.id }
  });
  const data = await response.json();
  return data.count; // Show as badge number
}
```

### Display Notification History Page
```javascript
async function showNotificationHistory() {
  const response = await fetch('/api/user/notifications', {
    headers: { 'x-user-id': currentUser.id }
  });
  const data = await response.json();
  
  const html = data.notifications.map(n => `
    <div class="notification-item">
      <div class="icon">${n.status === 'approved' ? '✅' : '⚠️'}</div>
      <div class="content">
        <h4>${n.title}</h4>
        <p>${n.message}</p>
        <small>${new Date(n.timestamp).toLocaleString()}</small>
      </div>
    </div>
  `).join('');
  
  document.getElementById('notifications-list').innerHTML = html;
}
```

---

## 🔗 API Reference

### Fetch Notification History
```
GET /api/user/notifications

Headers:
  x-user-id: {user-id}

Response:
  {
    ok: true,
    count: number,
    notifications: [...]
  }
```

### WebSocket Connection
```
URL: wss://your-backend-url

Join user channel:
  {
    type: 'join_user',
    userId: 'user-id'
  }

Listen for:
  - submission_approved
  - submission_rejected
```

---

## 💡 Best Practices

### Do ✅
- Show toast/alert immediately when notification received
- Let user dismiss notification easily
- Provide action buttons (View, Resubmit, etc.)
- Use emoji/icons for quick visual scanning
- Store unread count for badge display
- Fetch history on app load for offline users

### Don't ❌
- Show too many notifications at once
- Force user to click if unimportant
- Use only email (app is faster)
- Forget to handle connection loss
- Show old notifications as new

---

## 🧪 Quick Test

```javascript
// In browser console
const ws = new WebSocket('wss://your-backend-url');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'join_user',
    userId: 'test-user-id'
  }));
  console.log('Listening for notifications...');
};
ws.onmessage = (e) => {
  console.log('📲 NOTIFICATION:', JSON.parse(e.data));
};
```

Then have admin approve/reject a submission from that user, and you should see the notification appear in console immediately!

---

## 📱 UI Component Examples

### Minimal Toast
```jsx
<Toast>
  <Toast.Title>✅ Approved!</Toast.Title>
  <Toast.Description>Your book has been published</Toast.Description>
</Toast>
```

### Detailed Modal
```jsx
<Modal>
  <Modal.Header>
    <Modal.Title>⚠️ Submission Not Approved</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <p>Your submission was not approved.</p>
    <p className="reason">Why: {notification.reason}</p>
  </Modal.Body>
  <Modal.Footer>
    <Button onClick={resubmit}>Try Again</Button>
    <Button variant="secondary" onClick={dismiss}>Dismiss</Button>
  </Modal.Footer>
</Modal>
```

### Notification List
```jsx
<NotificationList>
  {notifications.map(n => (
    <NotificationItem key={n.id}>
      <Icon>{n.status === 'approved' ? '✅' : '⚠️'}</Icon>
      <Content>
        <Title>{n.title}</Title>
        <Message>{n.message}</Message>
        <Time>{formatDate(n.timestamp)}</Time>
      </Content>
    </NotificationItem>
  ))}
</NotificationList>
```

---

## ❓ FAQ

**Q: Will user see notification if they're offline?**  
A: No, but they'll get the email. They can fetch history when they come back online.

**Q: Can I customize notification message?**  
A: Yes, the message is sent from backend in notification object.

**Q: How do I test this locally?**  
A: Run backend, connect WebSocket from frontend, have admin approve in dashboard.

**Q: What if email fails?**  
A: WebSocket notification still works. Email is just backup.

**Q: Can users turn off notifications?**  
A: Currently no, but can add email preference settings.

