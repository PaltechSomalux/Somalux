/**
 * Push Notifications Diagnostic Script
 * Copy and run this in browser DevTools Console to diagnose push notification issues
 */

window.pushDiagnostics = {
  /**
   * Run all diagnostics
   */
  runAll: async function() {
    console.log('🔍 Starting Push Notifications Diagnostic...\n');
    
    this.checkBrowserSupport();
    this.checkNotificationPermission();
    await this.checkServiceWorker();
    await this.checkVapidKey();
    await this.checkPushSubscription();
    this.checkHttpsConnection();
    
    console.log('\n✅ Diagnostic complete!');
  },

  /**
   * Check browser support for push notifications
   */
  checkBrowserSupport: function() {
    console.log('1️⃣ Checking Browser Support...');
    
    const notificationAPI = 'Notification' in window;
    const serviceWorkerAPI = 'serviceWorker' in navigator;
    const pushManagerAPI = 'PushManager' in window;
    
    console.log('  Notification API:', notificationAPI ? '✅ Available' : '❌ Missing');
    console.log('  Service Worker API:', serviceWorkerAPI ? '✅ Available' : '❌ Missing');
    console.log('  Push Manager API:', pushManagerAPI ? '✅ Available' : '❌ Missing');
    
    const supported = notificationAPI && serviceWorkerAPI && pushManagerAPI;
    console.log(supported ? '\n  ✅ Browser SUPPORTS push notifications\n' : '\n  ❌ Browser DOES NOT support push notifications\n');
    
    return supported;
  },

  /**
   * Check notification permission status
   */
  checkNotificationPermission: function() {
    console.log('2️⃣ Checking Notification Permission...');
    
    const permission = Notification.permission;
    console.log('  Current permission:', permission);
    
    if (permission === 'granted') {
      console.log('  ✅ Push notifications are ALLOWED\n');
    } else if (permission === 'denied') {
      console.log('  ❌ Push notifications are BLOCKED by user');
      console.log('  💡 Tip: Reset site permissions in browser settings\n');
    } else {
      console.log('  ⚠️ User has not responded to permission prompt\n');
    }
    
    return permission;
  },

  /**
   * Check service worker registration
   */
  checkServiceWorker: async function() {
    console.log('3️⃣ Checking Service Worker...');
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        console.log('  ❌ No service workers registered\n');
        return false;
      }
      
      console.log(`  Found ${registrations.length} service worker(s):`);
      
      for (const reg of registrations) {
        console.log(`  - Scope: ${reg.scope}`);
        console.log(`    Active: ${reg.active ? '✅ Yes' : '❌ No'}`);
        
        // Check for push-notifications-sw.js
        if (reg.scope.includes('/')) {
          if (reg.active) {
            console.log('    ✅ Service worker is ACTIVE');
          } else {
            console.log('    ⚠️ Service worker is NOT active (may be installing)');
          }
        }
      }
      
      console.log('');
      return registrations.length > 0;
    } catch (error) {
      console.log('  ❌ Error checking service workers:', error.message, '\n');
      return false;
    }
  },

  /**
   * Check VAPID key validity
   */
  checkVapidKey: async function() {
    console.log('4️⃣ Checking VAPID Key...');
    
    const expectedVapidKey = 'BA6kyv1g9mxzAXdS90p0edIAvUj2FRv6JRLWPuxepnYPjyheYt2Tg_zapwqhIZXRMdyaHiYP0N-9DtOWHehiu7I';
    
    console.log('  Expected VAPID key length: 88 characters');
    console.log('  Actual VAPID key length:', expectedVapidKey.length, 'characters');
    
    if (expectedVapidKey.length === 88) {
      console.log('  ✅ VAPID key length is CORRECT');
    } else {
      console.log('  ❌ VAPID key length is INCORRECT');
    }
    
    // Try to convert VAPID key
    try {
      const padding = '='.repeat((4 - expectedVapidKey.length % 4) % 4);
      const base64 = (expectedVapidKey + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
      
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      console.log('  ✅ VAPID key converts to Uint8Array successfully');
      console.log('  Uint8Array length:', outputArray.length, 'bytes\n');
      return true;
    } catch (error) {
      console.log('  ❌ VAPID key conversion failed:', error.message, '\n');
      return false;
    }
  },

  /**
   * Check push subscription status
   */
  checkPushSubscription: async function() {
    console.log('5️⃣ Checking Push Subscription...');
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        console.log('  ⚠️ No service workers registered, cannot check subscription\n');
        return null;
      }
      
      const reg = registrations[0];
      const subscription = await reg.pushManager.getSubscription();
      
      if (subscription) {
        console.log('  ✅ Push subscription is ACTIVE');
        console.log('  Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
        console.log('  Keys:');
        console.log('    - p256dh:', subscription.getKey('p256dh') ? 'Present' : 'Missing');
        console.log('    - auth:', subscription.getKey('auth') ? 'Present' : 'Missing');
        console.log('');
        return subscription;
      } else {
        console.log('  ⚠️ No active push subscription');
        console.log('  💡 This is normal on first visit - permission may be needed\n');
        return null;
      }
    } catch (error) {
      console.log('  ❌ Error checking push subscription:', error.message, '\n');
      return null;
    }
  },

  /**
   * Check HTTPS connection
   */
  checkHttpsConnection: function() {
    console.log('6️⃣ Checking HTTPS Connection...');
    
    const isHttps = window.location.protocol === 'https:';
    
    if (isHttps) {
      console.log('  ✅ Using HTTPS (required for push notifications)\n');
    } else {
      console.log('  ❌ Using HTTP (push notifications require HTTPS)');
      console.log('  💡 Switch to HTTPS to enable push notifications\n');
    }
    
    return isHttps;
  },

  /**
   * Attempt to subscribe to push notifications
   */
  testSubscribe: async function() {
    console.log('🧪 Testing Push Subscription...\n');
    
    try {
      // Check permission first
      let permission = Notification.permission;
      
      if (permission === 'default') {
        console.log('Requesting notification permission...');
        permission = await Notification.requestPermission();
      }
      
      if (permission !== 'granted') {
        console.log('❌ Notification permission denied\n');
        return false;
      }
      
      console.log('✅ Permission granted');
      
      // Get service worker registration
      const reg = await navigator.serviceWorker.getRegistrations();
      if (reg.length === 0) {
        console.log('❌ No service worker registered\n');
        return false;
      }
      
      const registration = reg[0];
      console.log('✅ Service worker found');
      
      // Try to subscribe
      const vapidKey = 'BA6kyv1g9mxzAXdS90p0edIAvUj2FRv6JRLWPuxepnYPjyheYt2Tg_zapwqhIZXRMdyaHiYP0N-9DtOWHehiu7I';
      
      const padding = '='.repeat((4 - vapidKey.length % 4) % 4);
      const base64 = (vapidKey + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
      
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      console.log('Subscribing to push...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray,
      });
      
      console.log('✅ Successfully subscribed to push notifications!');
      console.log('Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...\n');
      return true;
    } catch (error) {
      console.log('❌ Subscription failed:', error.name, '-', error.message);
      console.log('Error type:', error.constructor.name, '\n');
      return false;
    }
  },

  /**
   * Clear push subscription (for testing reset)
   */
  clearSubscription: async function() {
    console.log('🗑️ Clearing push subscription...\n');
    
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      
      for (const reg of regs) {
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log('✅ Push subscription cleared\n');
          return true;
        }
      }
      
      console.log('ℹ️ No subscription found to clear\n');
      return true;
    } catch (error) {
      console.log('❌ Error clearing subscription:', error.message, '\n');
      return false;
    }
  },

  /**
   * Print a summary report
   */
  report: async function() {
    console.clear();
    console.log('%c📋 Push Notifications Diagnostic Report', 'font-size: 18px; font-weight: bold;');
    console.log('%cGenerated:', 'font-weight: bold;', new Date().toLocaleString());
    console.log('');
    
    const browserSupported = this.checkBrowserSupport();
    const permissionStatus = this.checkNotificationPermission();
    const swAvailable = await this.checkServiceWorker();
    const vapidValid = await this.checkVapidKey();
    const subscription = await this.checkPushSubscription();
    const httpsStatus = this.checkHttpsConnection();
    
    console.log('%c📊 Summary:', 'font-size: 14px; font-weight: bold;');
    console.log('Browser Support:', browserSupported ? '✅' : '❌');
    console.log('Permission:', permissionStatus === 'granted' ? '✅' : '❌');
    console.log('Service Worker:', swAvailable ? '✅' : '❌');
    console.log('VAPID Key:', vapidValid ? '✅' : '❌');
    console.log('HTTPS:', httpsStatus ? '✅' : '❌');
    console.log('Push Subscription:', subscription ? '✅' : '⚠️');
  }
};

// Run diagnostics
pushDiagnostics.report();

console.log('\n%c💡 Available Commands:', 'font-weight: bold;');
console.log('pushDiagnostics.runAll()        - Run all diagnostics');
console.log('pushDiagnostics.testSubscribe() - Test push subscription');
console.log('pushDiagnostics.clearSubscription() - Clear subscription for testing');
console.log('pushDiagnostics.report()        - Print summary report');
