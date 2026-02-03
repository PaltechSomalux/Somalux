// src/hooks/useFCMToken.js
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { supabase } from '../../../supabase';

export const useFCMToken = () => {
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const initPushNotifications = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
        try {
          // ✅ Get current user from auth
          const auth = getAuth();
          const currentUser = auth.currentUser;

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
            console.log('❌ Notification permission denied');
            return;
          }

          console.log('✅ Notification permission granted');

          // ✅ Register service worker for push notifications
          const registration = await navigator.serviceWorker.register('/push-notifications-sw.js');
          await navigator.serviceWorker.ready;
          console.log('✅ Service worker registered & ready:', registration);

          // Check if push messaging is supported
          if (!registration.pushManager) {
            console.log('❌ Push notifications not supported');
            return;
          }

          // Subscribe to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              'BA6kyv1g9mxzAXdS90p0edIAvUj2FRv6JRLWPuxepnYPjyheYt2Tg_zapwqhIZXRMdyaHiYP0N-9DtOWHehiu7I'
            ),
          });

          console.log('✅ Push subscription successful:', subscription);
          setToken(subscription.endpoint);

          // Note: Push subscription column not yet implemented in profiles table
          // Store subscription in Supabase when push_subscription column is added to profiles
          try {
            const { error } = await supabase
              .from('profiles')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', currentUser.uid);

            if (error) {
              console.error('❌ Error updating profile in Supabase:', error);
            } else {
              console.log('✅ Profile updated in Supabase for user:', currentUser.uid);
            }
          } catch (dbError) {
            console.error('❌ Error with Supabase update:', dbError);
          }
        } catch (error) {
          console.error('❌ Push Notification Error:', error);

          // Handle specific errors
          if (error.name === 'NotAllowedError') {
            console.log('❌ Push notifications blocked by user');
          } else if (error.name === 'TypeError') {
            console.log('❌ Push notifications not supported in this browser');
          }
        }
      } else {
        console.log('❌ Browser does not support push notifications');
      }
    };

    initPushNotifications();
  }, []); // ✅ Empty dependency array - runs once on mount

  return { token, isSupported };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
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
}