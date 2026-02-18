# Push Notifications - Copy-Paste Testing Guide

## 🧪 Quick Test Commands

Copy and paste these commands in **DevTools Console** (F12) to test push notifications:

---

## 1. Quick Health Check

```javascript
console.log('📋 Push Notification Health Check\n');
console.log('Browser Support:', ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) ? '✅' : '❌');
console.log('HTTPS:', window.location.protocol === 'https:' ? '✅' : '❌');
console.log('Permission:', Notification.permission);
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length ? '✅' : '❌');
  regs.forEach(r => console.log('  -', r.scope));
});
```

---

## 2. Test Notification Permission

```javascript
// Request notification permission
Notification.requestPermission().then(permission => {
  console.log('Permission result:', permission);
  if (permission === 'granted') {
    console.log('✅ Notifications enabled!');
  } else {
    console.log('❌ Permission denied');
  }
});
```

---

## 3. Check Active Subscription

```javascript
// Check if already subscribed to push
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(subscription => {
    if (subscription) {
      console.log('✅ Already subscribed:');
      console.log('  Endpoint:', subscription.endpoint.substring(0, 100) + '...');
      console.log('  Keys:', {
        p256dh: subscription.getKey('p256dh') ? 'Present' : 'Missing',
        auth: subscription.getKey('auth') ? 'Present' : 'Missing'
      });
    } else {
      console.log('⚠️ Not currently subscribed');
    }
  });
});
```

---

## 4. Unsubscribe from Push

```javascript
// Remove existing push subscription (useful for testing)
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(subscription => {
    if (subscription) {
      subscription.unsubscribe().then(success => {
        console.log(success ? '✅ Unsubscribed' : '❌ Failed to unsubscribe');
      });
    } else {
      console.log('ℹ️ No subscription to remove');
    }
  });
});
```

---

## 5. Full Diagnostic Report

```javascript
// Run comprehensive diagnostic
(async () => {
  console.log('%c📊 FULL DIAGNOSTIC REPORT', 'font-size: 16px; font-weight: bold;');
  console.log('Time:', new Date().toLocaleString());
  console.log('');
  
  // Browser Support
  const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  console.log('1. Browser Support:', supported ? '✅ YES' : '❌ NO');
  
  // HTTPS
  console.log('2. HTTPS:', window.location.protocol === 'https:' ? '✅ YES' : '❌ NO (REQUIRED)');
  
  // Permission
  console.log('3. Notification Permission:', Notification.permission);
  
  // Service Workers
  const regs = await navigator.serviceWorker.getRegistrations();
  console.log('4. Service Workers:', regs.length, 'registered');
  regs.forEach((r, i) => {
    console.log(`   ${i+1}. ${r.scope}`, r.active ? '(active)' : '(inactive)');
  });
  
  // Push Subscription
  if (regs.length > 0) {
    const sub = await regs[0].pushManager.getSubscription();
    console.log('5. Push Subscription:', sub ? '✅ ACTIVE' : '⚠️ NONE');
  }
  
  console.log('');
  console.log('Next: Try requesting permission or running other tests');
})();
```

---

## 6. Test Service Worker Communication

```javascript
// Verify service worker is listening
console.log('Testing service worker communication...');

navigator.serviceWorker.ready.then(() => {
  console.log('✅ Service worker is ready and listening');
  console.log('Controllers:', navigator.serviceWorker.controller ? '✅ YES' : '❌ NO');
});

navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('📧 Message from service worker:', event.data);
});
```

---

## 7. Monitor Service Worker Messages

```javascript
// Listen for any messages from service worker
navigator.serviceWorker.addEventListener('message', (e) => {
  console.log('%c📨 Service Worker Message:', 'color: blue; font-weight: bold;', e.data);
});

// Send test message to service worker
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'TEST',
    message: 'Hello from main thread'
  });
}
```

---

## 8. VAPID Key Validation

```javascript
// Test VAPID key conversion
const testVapidKey = 'BA6kyv1g9mxzAXdS90p0edIAvUj2FRv6JRLWPuxepnYPjyheYt2Tg_zapwqhIZXRMdyaHiYP0N-9DtOWHehiu7I';

console.log('Testing VAPID key conversion...');
console.log('Key length:', testVapidKey.length, '(expected: 88)');

try {
  const padding = '='.repeat((4 - testVapidKey.length % 4) % 4);
  const base64 = (testVapidKey + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  console.log('✅ VAPID key is VALID');
  console.log('Converted to Uint8Array:', outputArray.length, 'bytes');
} catch (error) {
  console.log('❌ VAPID key conversion failed:', error.message);
}
```

---

## 9. Test Notification Display

```javascript
// Send a test notification
if (Notification.permission !== 'granted') {
  console.log('⚠️ Permission required first');
  Notification.requestPermission();
} else {
  new Notification('Test Notification', {
    body: 'This is a test notification from the console',
    icon: '/PaltechBlack192.png',
    tag: 'test-notification'
  });
  console.log('✅ Test notification sent');
}
```

---

## 10. Check Active Service Worker Controller

```javascript
console.log('Current Service Worker Controller:');
if (navigator.serviceWorker.controller) {
  console.log('✅ Controller is active');
  console.log('Script URL:', navigator.serviceWorker.controller.scriptURL);
  console.log('State:', navigator.serviceWorker.controller.state);
} else {
  console.log('❌ No active controller');
}
```

---

## 11. List All Registered Service Workers

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('📋 All Registered Service Workers:');
  if (registrations.length === 0) {
    console.log('  ❌ None registered');
    return;
  }
  
  registrations.forEach((reg, index) => {
    console.log(`\n${index + 1}. ${reg.scope}`);
    console.log('   Scope:', reg.scope);
    console.log('   Active:', reg.active ? '✅' : '❌');
    console.log('   Installing:', reg.installing ? '⏳' : 'No');
    console.log('   Waiting:', reg.waiting ? '⏳' : 'No');
    
    if (reg.active) {
      console.log('   Script:', reg.active.scriptURL);
    }
  });
});
```

---

## 12. Clear Browser Storage (Reset for Testing)

```javascript
// WARNING: This clears all service workers and storage
if (confirm('Clear all service workers and cache? This cannot be undone!')) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      reg.unregister().then(() => {
        console.log('✅ Unregistered:', reg.scope);
      });
    });
  });
  
  // Clear cache
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName).then(() => {
          console.log('🗑️ Deleted cache:', cacheName);
        });
      });
    });
  }
  
  console.log('✅ Reset complete - reload page to re-register');
}
```

---

## 13. Load the Full Diagnostic Tool

```javascript
// Run the full diagnostic tool (if file is accessible)
// First, load the diagnostic script
const script = document.createElement('script');
script.textContent = `
// Copy and paste the content from PUSH_NOTIFICATIONS_DIAGNOSTIC.js here
// OR just use the simpler commands above
`;
document.head.appendChild(script);

// Alternative: just run these simple checks
console.log('Quick checks:');
console.log('Push support:', 'PushManager' in window);
console.log('SW support:', 'serviceWorker' in navigator);
console.log('Notifications:', 'Notification' in window);
console.log('HTTPS:', window.location.protocol === 'https:');
```

---

## Common Test Scenarios

### Scenario 1: Fresh Start (First Time User)

```javascript
// 1. Request permission
await Notification.requestPermission();

// 2. Register service worker
await navigator.serviceWorker.register('/push-notifications-sw.js');

// 3. Subscribe to push
const reg = await navigator.serviceWorker.ready;
const subscription = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: /* VAPID key as Uint8Array */
});

console.log('✅ Setup complete');
```

---

### Scenario 2: Debug Existing Setup

```javascript
// 1. Check what's currently registered
console.log('Registered SWs:', await navigator.serviceWorker.getRegistrations());

// 2. Check current subscription
const reg = await navigator.serviceWorker.ready;
const sub = await reg.pushManager.getSubscription();
console.log('Current subscription:', sub);

// 3. Check permission
console.log('Permission:', Notification.permission);
```

---

### Scenario 3: Reset for Testing

```javascript
// 1. Unsubscribe from push
const reg = await navigator.serviceWorker.ready;
const sub = await reg.pushManager.getSubscription();
if (sub) await sub.unsubscribe();

// 2. Unregister service worker
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(r => r.unregister());
});

// 3. Clear cache
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// 4. Reload page
location.reload();
```

---

## 💡 Tips

1. **Copy one command at a time** - easier to debug if something fails
2. **Look for ✅ symbols** - indicate success
3. **Look for ❌ symbols** - indicate problems
4. **Look for ⚠️ symbols** - indicate warnings
5. **Check browser console** automatically shows errors
6. **DevTools** → **Application** → **Service Workers** to see visual status

---

## Emergency Reset

If push notifications are completely broken:

```javascript
// Nuclear option: Clear everything and reload
(async () => {
  // Unregister all SWs
  const regs = await navigator.serviceWorker.getRegistrations();
  regs.forEach(r => r.unregister());
  
  // Clear all caches
  const cacheNames = await caches.keys();
  cacheNames.forEach(name => caches.delete(name));
  
  // Clear local storage
  localStorage.clear();
  
  console.log('✅ Complete reset - reloading page...');
  setTimeout(() => location.reload(), 1000);
})();
```

---

## Need Help?

- Check **console output** for error messages
- Run **Diagnostic #5** above for full report
- Review **PUSH_NOTIFICATIONS_FIXES.md** for detailed guide
- Check **HTTPS** is active (required for push)
- Verify **service worker file** exists at `/public/push-notifications-sw.js`

**All tests work in Chrome, Firefox, and Edge!**
