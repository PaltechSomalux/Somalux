// src/components/chat/hooks/useIncomingNotifications.js
import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import {
  collection,
  collectionGroup,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getChatId } from './chatUtils';

export const useIncomingNotifications = (currentUserUid, users, setUsers, showToast) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    if (!currentUserUid) return;

    let incomingUnsubscriber = null;

    const fetchIncomingNotifications = async () => {
      try {
        // First, get current contacts
        const userChatsQuery = query(collection(db, 'userChats', currentUserUid, 'chats'));
        const userChatsSnapshot = await getDocs(userChatsQuery);
        const contactUids = userChatsSnapshot.docs
          .filter((doc) => doc.id !== 'trigger' && !doc.data().isDeleted)
          .map((doc) => doc.id);

        // Query for incoming messages using collectionGroup
        const incomingQuery = query(
          collectionGroup(db, 'messages'),
          where('receiver', '==', currentUserUid),
          where('status', 'in', ['sent', 'delivered']),
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        incomingUnsubscriber = onSnapshot(incomingQuery, async (snap) => {
          const visible = snap.docs.filter(
            (d) => !(d.data().deletedBy || []).includes(currentUserUid)
          );

          const senders = {};
          visible.forEach((d) => {
            const senderUid = d.data().sender;
            if (!contactUids.includes(senderUid) && senderUid !== currentUserUid) {
              if (!senders[senderUid]) {
                senders[senderUid] = { uid: senderUid, count: 0, lastTimestamp: d.data().timestamp };
              }
              senders[senderUid].count++;
            }
          });

          const senderUids = Object.keys(senders);
          if (senderUids.length === 0) {
            setNotifications([]);
            setNotificationCount(0);
            return;
          }

          // Fetch user details for senders
          const userPromises = senderUids.map(async (uid) => {
            const userDocRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              return {
                uid,
                name: data.name || 'Unknown User',
                email: data.email || 'No email',
                photoURL: data.photoURL || 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
                count: senders[uid].count,
              };
            }
            return null;
          });

          const notifUsers = (await Promise.all(userPromises)).filter(Boolean);
          setNotifications(notifUsers);
          setNotificationCount(notifUsers.reduce((sum, n) => sum + n.count, 0));
        });
      } catch (error) {
        console.error('ChatList.jsx: Error fetching incoming notifications:', error);
        setNotifications([]);
        setNotificationCount(0);
      }
    };

    fetchIncomingNotifications();

    return () => {
      if (incomingUnsubscriber) incomingUnsubscriber();
    };
  }, [currentUserUid]);

  const addUserToChatList = async (user) => {
    if (!currentUserUid || !user.uid) {
      showToast('Cannot add user: invalid data', 'error');
      return;
    }

    // Check if already added (though we filter non-contacts)
    const existingChatRef = doc(db, 'userChats', currentUserUid, 'chats', user.uid);
    const existingSnap = await getDoc(existingChatRef);
    if (existingSnap.exists()) {
      showToast('User already in chatlist', 'info');
      // Remove from notifications
      setNotifications(prev => prev.filter(n => n.uid !== user.uid));
      setNotificationCount(prev => prev - user.count);
      return;
    }

    try {
      await setDoc(existingChatRef, {
        contactUid: user.uid,
        addedAt: serverTimestamp(),
        isPinned: false,
        isArchived: false,
        isMuted: false,
        isLocked: false,
        isDeleted: false,
      });

      // Refresh users list
      setUsers(prev => [
        ...prev,
        {
          id: user.uid,
          uid: user.uid,
          isCurrent: false,
          chatId: getChatId(currentUserUid, user.uid),
          name: user.name,
          photoURL: user.photoURL,
          email: user.email,
          bio: '',
          phone: '',
          links: [],
          media: [],
          followers: [],
          following: [],
          comments: [],
          isOnline: false,
          lastMessage: 'Say hi',
          lastMessageTimestamp: new Date(),
          lastMessageStatus: 'sent',
          lastMessageSenderUid: null,
          isPinned: false,
          isArchived: false,
          isMuted: false,
          isLocked: false,
          isTyping: false,
          unreadCount: user.count || 0,
          currentUserUid,
        },
      ]);

      // Remove from notifications
      setNotifications(prev => prev.filter(n => n.uid !== user.uid));
      setNotificationCount(prev => prev - user.count);

      showToast(`Added ${user.name} to chatlist`, 'success');
    } catch (error) {
      console.error('ChatList.jsx: Error adding user to chatlist:', error);
      showToast('Failed to add user', 'error');
    }
  };

  const markAsSeen = (user) => {
    setNotifications(prev => prev.filter(n => n.uid !== user.uid));
    setNotificationCount(prev => prev - user.count);
    showToast(`Marked ${user.name} as seen`, 'info');
  };

  return {
    notifications,
    notificationCount,
    showNotificationModal,
    setShowNotificationModal,
    addUserToChatList,
    markAsSeen,
  };
};