/**
 * Service Worker for Push Notifications
 * Handles incoming push messages and displays notifications
 */

// Listen for push events from the server
self.addEventListener('push', (event) => {
  console.log('✅ Push notification received:', event);

  let notificationData = {
    title: 'SomaLux Notification',
    body: 'You have a new message',
    icon: '/PaltechBlack192.png',
    badge: '/PaltechBlack192.png',
    tag: 'somalux-notification',
    requireInteraction: false,
  };

  // Parse the push event data if it exists
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
    } catch (error) {
      console.warn('Failed to parse push data as JSON:', error);
      // If not JSON, treat as plain text
      if (event.data) {
        notificationData.body = event.data.text();
      }
    }
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data || {},
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('✅ Notification clicked:', event);
  event.notification.close();

  // Focus or open the main window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('✅ Notification closed:', event);
});
