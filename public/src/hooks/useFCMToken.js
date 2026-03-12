// src/hooks/useFCMToken.js
import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging, db } from '../firebase';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const useFCMToken = () => {
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const initFCM = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
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
            return;
          }

          console.log('✅ Notification permission granted');

          // ✅ Register service worker
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;
          console.log(' Service worker registered & ready:', registration);


          // Get FCM token
          const regToken = await getToken(messaging, {
            vapidKey: 'BA6kyv1g9mxzAXdS90p0edIAvUj2FRv6JRLWPuxepnYPjyheYt2Tg_zapwqhIZXRMdyaHiYP0N-9DtOWHehiu7I',
            serviceWorkerRegistration: registration,
          });

          if (regToken) {
            console.log(' FCM Token generated:', regToken.substring(0, 20) + '...');
            setToken(regToken);

            // Store token in Firestore for this user
            // ✅ Store token in Firestore for this user
            await setDoc(
              doc(db, 'users', currentUser.uid),
              { fcmToken: regToken },
              { merge: true }
            );
            console.log('✅ FCM Token stored in Firestore for user:', currentUser.uid);
          } else {
            console.log('❌ No registration token available');
          }
        } catch (error) {
          console.error('❌ FCM Token Error:', error);

          // Handle specific errors
          if (error.code === 'messaging/permission-blocked') {
            console.log('❌ Notifications blocked by user');
          } else if (error.code === 'messaging/unsupported-browser') {
            console.log('❌ FCM not supported in this browser');
          }
        }
      } else {
        console.log('❌ Browser does not support FCM');
      }
    };

    initFCM();
  }, []); // ✅ Empty dependency array - runs once on mount

  return { token, isSupported };
};