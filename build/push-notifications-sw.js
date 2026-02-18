/**
 * Service Worker for Push Notifications
 * Handles incoming push messages and displays notifications with improved error handling
 */

// Listen for push events from the server
self.addEventListener('push', (event) => {
  try {
    console.log('✅ Push notification received');

    let notificationData = {
      title: 'SomaLux Notification',
      body: 'You have a new message',
      icon: '/PaltechBlack192.png',
      badge: '/PaltechBlack192.png',
      tag: 'somalux-notification',
      requireInteraction: false,
      data: {},
    };

    // Parse the push event data if it exists
    if (event.data) {
      try {
        const incomingData = event.data.json();
        notificationData = {
          ...notificationData,
          ...incomingData,
        };
        console.log('✅ Push data parsed as JSON:', incomingData.title || 'Notification');
      } catch (parseError) {
        console.warn('Push data not valid JSON, treating as plain text:', parseError.message);
        // If not JSON, treat as plain text
        if (event.data) {
          notificationData.body = event.data.text();
        }
      }
    }

    // Validate notification data
    if (!notificationData.title) {
      notificationData.title = 'SomaLux';
    }
    if (!notificationData.body) {
      notificationData.body = 'New notification';
    }

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon || '/PaltechBlack192.png',
        badge: notificationData.badge || '/PaltechBlack192.png',
        tag: notificationData.tag || 'somalux-notification',
        requireInteraction: notificationData.requireInteraction || false,
        data: notificationData.data || {},
      }).catch((error) => {
        console.error('❌ Failed to show notification:', error);
      })
    );
  } catch (error) {
    console.error('❌ Error in push event listener:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  try {
    console.log('✅ Notification clicked');
    event.notification.close();

    // Focus or open the main window
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            console.log('✅ Focused existing window');
            return client.focus();
          }
        }
        // If no window found, open a new one
        if (clients.openWindow) {
          console.log('✅ Opening new window');
          return clients.openWindow('/');
        }
      }).catch((error) => {
        console.error('❌ Error handling notification click:', error);
      })
    );
  } catch (error) {
    console.error('❌ Error in notification click handler:', error);
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('ℹ️ Notification closed by user');
});

// Handle errors and ensure service worker stays active
self.addEventListener('error', (event) => {
  console.error('❌ Service worker error:', event.error);
});

// Handle unhandled rejections in service worker
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled rejection in service worker:', event.reason);
});

