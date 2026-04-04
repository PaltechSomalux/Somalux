// src/hooks/useFCMToken.js
import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging, db } from '../firebase';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useFCMToken = () => {
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initFCM = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Browser does not support FCM');
        setIsSupported(false);
        return;
      }

      setIsSupported(true);
      let retryCount = 0;

      const attemptTokenGeneration = async () => {
        try {
          // ✅ Get current user from auth
          const auth = getAuth();
          const currentUser = auth.currentUser;

          if (!currentUser) {
            console.log('useFCMToken: No user logged in, skipping token generation');
            return;
          }

          // ✅ Ensure notification permission BEFORE requesting token
          let permission = Notification.permission;

          if (permission === 'default') {
            permission = await Notification.requestPermission();
          }

          if (permission !== 'granted') {
            console.log('❌ Notification permission denied');
            setError('Notification permission denied by user');
            return;
          }

          console.log('✅ Notification permission granted');

          // ✅ Register service worker with error handling
          let registration;
          try {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('✅ Service worker registered:', registration.scope);
          } catch (swError) {
            console.error('❌ Service worker registration failed:', swError);
            setError(`Service worker registration failed: ${swError.message}`);
            
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`🔄 Retrying service worker registration (attempt ${retryCount}/${MAX_RETRIES})`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              return attemptTokenGeneration();
            }
            throw swError;
          }

          // Wait for service worker to be ready with timeout
          try {
            const readyPromise = navigator.serviceWorker.ready;
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Service worker ready timeout')), 10000)
            );
            
            await Promise.race([readyPromise, timeoutPromise]);
            console.log('✅ Service worker is ready');
          } catch (readyError) {
            console.error('❌ Service worker ready check failed:', readyError);
            setError(`Service worker not ready: ${readyError.message}`);
            throw readyError;
          }

          // Get FCM token with error handling
          let regToken;
          try {
            regToken = await getToken(messaging, {
              vapidKey: 'BA6kyv1g9mxzAXdS90p0edIAvUj2FRv6JRLWPuxepnYPjyheYt2Tg_zapwqhIZXRMdyaHiYP0N-9DtOWHehiu7I',
              serviceWorkerRegistration: registration,
            });
          } catch (tokenError) {
            console.error('❌ FCM Token generation failed:', tokenError);
            
            if (tokenError.code === 'messaging/permission-blocked') {
              console.log('❌ Notifications blocked by user');
              setError('Push notifications blocked');
            } else if (tokenError.code === 'messaging/unsupported-browser') {
              console.log('❌ FCM not supported in this browser');
              setError('FCM not supported in this browser');
            } else if (tokenError.message.includes('AbortError') || tokenError.name === 'AbortError') {
              console.error('Push service error - retrying...');
              setError('Push service temporarily unavailable');
              
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`🔄 Retrying token generation (attempt ${retryCount}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
                return attemptTokenGeneration();
              }
            }
            
            throw tokenError;
          }

          if (regToken) {
            console.log('✅ FCM Token generated:', regToken.substring(0, 20) + '...');
            setToken(regToken);
            setError(null);

            // Store token in Firestore for this user
            try {
              await setDoc(
                doc(db, 'users', currentUser.uid),
                { fcmToken: regToken, fcmTokenUpdated: new Date() },
                { merge: true }
              );
              console.log('✅ FCM Token stored in Firestore for user:', currentUser.uid);
            } catch (dbError) {
              console.error('❌ Error storing FCM token in Firestore:', dbError);
            }
          } else {
            console.log('❌ No registration token available');
            setError('Failed to generate FCM token');
          }
        } catch (error) {
          console.error('❌ FCM Error:', error);
          setError(error.message || 'Unknown FCM error');
        }
      };

      // Start the token generation attempt
      attemptTokenGeneration();
    };

    initFCM();
  }, []); // ✅ Empty dependency array - runs once on mount

  return { token, isSupported, error };
};