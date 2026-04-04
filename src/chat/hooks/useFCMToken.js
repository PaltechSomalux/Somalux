// src/hooks/useFCMToken.js
import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

// Helper function to convert VAPID key - moved to top for better error handling
function urlBase64ToUint8Array(base64String) {
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (error) {
    console.error('❌ Error converting VAPID key:', error);
    throw new Error('Invalid VAPID key format');
  }
}

const VAPID_KEY = 'BA6kyv1g9mxzAXdS90p0edIAvUj2FRv6JRLWPuxepnYPjyheYt2Tg_zapwqhIZXRMdyaHiYP0N-9DtOWHehiu7I';
const SERVICE_WORKER_PATH = '/push-notifications-sw.js';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useFCMToken = () => {
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initPushNotifications = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Browser does not support push notifications');
        setIsSupported(false);
        return;
      }

      setIsSupported(true);
      let retryCount = 0;

      const attemptSubscription = async () => {
        try {
          // ✅ Get current user from Supabase auth
          const { data: { user } } = await supabase.auth.getUser();
          const currentUser = user;

          if (!currentUser) {
            console.log('useFCMToken: No user logged in, skipping push setup');
            return;
          }

          // ✅ Ensure notification permission BEFORE registering
          let permission = Notification.permission;

          if (permission === 'default') {
            permission = await Notification.requestPermission();
          }

          if (permission !== 'granted') {
            console.log('❌ Notification permission denied by user');
            setError('Notifications permission denied');
            return;
          }

          console.log('✅ Notification permission granted');

          // ✅ Register service worker with error handling
          let registration;
          try {
            registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
            console.log('✅ Service worker registered:', registration.scope);
          } catch (swError) {
            console.error('❌ Service worker registration failed:', swError);
            setError(`Service worker registration failed: ${swError.message}`);
            
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`🔄 Retrying service worker registration (attempt ${retryCount}/${MAX_RETRIES})`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              return attemptSubscription();
            }
            throw new Error(`Service worker registration failed after ${MAX_RETRIES} attempts: ${swError.message}`);
          }

          // Wait for service worker to be ready with timeout
          try {
            const readyPromise = navigator.serviceWorker.ready;
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Service worker ready timeout')), 10000)
            );
            
            registration = await Promise.race([readyPromise, timeoutPromise]);
            console.log('✅ Service worker is ready');
          } catch (readyError) {
            console.error('❌ Service worker ready check failed:', readyError);
            setError(`Service worker not ready: ${readyError.message}`);
            throw readyError;
          }

          // Verify the actual registration object has pushManager
          const activeRegistration = registration && registration.active 
            ? registration 
            : (await navigator.serviceWorker.getRegistrations())[0];

          if (!activeRegistration) {
            throw new Error('No active service worker registration found');
          }

          // Check if push messaging is supported
          if (!activeRegistration.pushManager) {
            console.log('❌ Push notifications not supported by this browser');
            setError('Push notifications not supported');
            return;
          }

          console.log('✅ Push manager available');

          // Convert VAPID key with error handling
          let vapidKey;
          try {
            vapidKey = urlBase64ToUint8Array(VAPID_KEY);
            console.log('✅ VAPID key converted successfully');
          } catch (vapidError) {
            console.error('❌ VAPID key conversion failed:', vapidError);
            setError(`Invalid VAPID key: ${vapidError.message}`);
            throw vapidError;
          }

          // Subscribe to push notifications with detailed error handling
          let subscription;
          try {
            subscription = await activeRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidKey,
            });
            
            console.log('✅ Push subscription successful');
          } catch (subError) {
            console.error('❌ Push subscription failed:', subError.name, subError.message);
            
            // Handle specific subscription errors
            if (subError.name === 'NotAllowedError') {
              console.error('Push notifications blocked - user denied or browser blocked');
              setError('Push notifications blocked by browser');
            } else if (subError.name === 'AbortError') {
              console.error('Push subscription aborted - service might be unavailable');
              setError('Push service temporarily unavailable');
              
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`🔄 Retrying push subscription (attempt ${retryCount}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
                return attemptSubscription();
              }
            } else if (subError.name === 'SecurityError') {
              console.error('Push subscription blocked due to security policy');
              setError('Security policy prevents push notifications');
            } else if (subError.name === 'TypeError') {
              console.error('Push notifications not supported or invalid parameters');
              setError('Push notifications not properly configured');
            }
            
            throw subError;
          }

          console.log('✅ Push subscription successful:', subscription);
          setToken(subscription.endpoint);
          setError(null); // Clear any previous errors

          // Note: Push subscription column not yet implemented in profiles table
          // Store subscription in Supabase when push_subscription column is added to profiles
          try {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', currentUser.id);

            if (updateError) {
              console.error('❌ Error updating profile in Supabase:', updateError);
            } else {
              console.log('✅ Profile updated in Supabase for user:', currentUser.id);
            }
          } catch (dbError) {
            console.error('❌ Error with Supabase update:', dbError);
          }
        } catch (error) {
          console.error('❌ Push Notification Error:', error);
          setError(error.message || 'Unknown push notification error');
        }
      };

      // Start the subscription attempt
      attemptSubscription();
    };

    initPushNotifications();
  }, []); // ✅ Empty dependency array - runs once on mount

  return { token, isSupported, error };
};