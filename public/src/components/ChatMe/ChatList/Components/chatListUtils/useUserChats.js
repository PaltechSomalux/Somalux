// src/components/chat/hooks/useUserChats.js
import { useState, useEffect, useRef } from 'react';
import { db } from '../../../firebase';
import {
  collection,
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
// } from 'firebase/firestore';
// Firebase imports removed - using Supabase instead
// ❌ DISABLED: Firebase typing indicators - now using WebSocket only
// import { listenForTyping } from '../../../Kiss/useTyping';
import { getChatId } from './chatUtils'; // Assume utils file for shared functions

export const useUserChats = (currentUserUid, showToast, setIsLoading, createdSelfChat) => {
  const [users, setUsers] = useState([]);
  const [typingStatus, setTypingStatus] = useState({});

  useEffect(() => {
    let typingUnsubscribers = [];
    let messageUnsubscribers = [];
    let unreadUnsubscribers = [];
    let userChatsUnsubscriber = null;

    const fetchUserChats = async () => {
      try {
        if (!currentUserUid) {
          console.warn('ChatList.jsx: No currentUserUid, skipping fetch');
          setUsers([]);
          setIsLoading(false);
          return;
        }

        // console.log('ChatList.jsx: Fetching user chats for UID:', currentUserUid);
        const userChatsQuery = query(
          collection(db, 'userChats', currentUserUid, 'chats')
        );

        userChatsUnsubscriber = onSnapshot(
          userChatsQuery,
          async (userChatsSnapshot) => {
            const contactUids = userChatsSnapshot.docs
              .filter((doc) => doc.id !== 'trigger' && !doc.data().isDeleted)
              .map((doc) => doc.id);
            // console.log('ChatList.jsx: Snapshot received', { contactUids });

            if (!contactUids.includes(currentUserUid) && !createdSelfChat.current) {
              createdSelfChat.current = true;
              console.log('ChatList.jsx: Creating self-chat document');
              try {
                await setDoc(doc(db, 'userChats', currentUserUid, 'chats', currentUserUid), {
                  contactUid: currentUserUid,
                  addedAt: serverTimestamp(),
                  isPinned: false,
                  isArchived: false,
                  isMuted: false,
                  isLocked: false,
                  isDeleted: false,
                });
                console.log('ChatList.jsx: Self-chat document created');
                contactUids.push(currentUserUid);
              } catch (error) {
                console.error('ChatList.jsx: Error creating self-chat:', error);
              }
            }

            if (contactUids.length === 0) {
              console.log('ChatList.jsx: No contacts found');
              setUsers([]);
              setIsLoading(false);
              return;
            }

            const userPromises = contactUids.map(async (contactUid) => {
              try {
                const userDocRef = doc(db, 'users', contactUid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                  return { ...userSnap.data(), uid: contactUid };
                } else {
                  console.warn('ChatList.jsx: User doc not found by ID, falling back to where', { contactUid });
                  const fallbackQuery = query(collection(db, 'users'), where('uid', '==', contactUid));
                  const fallbackDocs = await getDocs(fallbackQuery);
                  return fallbackDocs.empty ? null : fallbackDocs.docs[0].data();
                }
              } catch (error) {
                console.error('ChatList.jsx: Error fetching user:', { contactUid, error });
                return null;
              }
            });

            const userDatas = (await Promise.all(userPromises)).filter(Boolean);
            // console.log('ChatList.jsx: Fetched users in parallel', { count: userDatas.length });

            const usersData = [];
            for (const data of userDatas) {
              const contactUid = data.uid;
              const chatData = userChatsSnapshot.docs.find(
                (doc) => doc.id === contactUid
              )?.data();
              if (!chatData) continue;

              const isCurrent = contactUid === currentUserUid;
              const chatId = getChatId(currentUserUid, contactUid);

              const userData = {
                id: contactUid,
                uid: contactUid,
                isCurrent,
                chatId,
                name: isCurrent ? `${data.name} (You)` : data.name || 'Unknown',
                photoURL: data.photoURL || 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
                email: data.email || 'No email',
                bio: data.bio || '',
                phone: data.phone || '',
                links: data.links || [],
                media: data.media || [],
                followers: data.followers || [],
                following: data.following || [],
                comments: data.comments || [],
                isOnline: data.isOnline || false,
                lastMessage: chatData.isLocked ? ' Locked Chat' : 'Say hi ',
                lastMessageTimestamp: data.lastLogin?.toDate?.() || new Date(),
                lastMessageStatus: 'sent',
                lastMessageSenderUid: null,
                isPinned: chatData.isPinned || false,
                isArchived: chatData.isArchived || false,
                isMuted: chatData.isMuted || false,
                isLocked: chatData.isLocked || false,
                isTyping: false,
                unreadCount: 0,
                currentUserUid,
              };
              usersData.push(userData);
            }

            setUsers(usersData);
            setIsLoading(false);

            typingUnsubscribers.forEach((u) => typeof u === 'function' && u());
            messageUnsubscribers.forEach((u) => typeof u === 'function' && u());
            unreadUnsubscribers.forEach((u) => typeof u === 'function' && u());
            typingUnsubscribers = [];
            messageUnsubscribers = [];
            unreadUnsubscribers = [];

            // ❌ DISABLED: Firebase typing listeners - now using WebSocket only
            // typingUnsubscribers = usersData
            //   .filter((u) => !u.isCurrent && u.chatId)
            //   .map((u) => listenForTyping(currentUserUid, u.uid, (isTyping) => {
            //     setTypingStatus((prev) => ({ ...prev, [u.chatId]: isTyping }));
            //     setUsers((prevUsers) =>
            //       prevUsers.map((pu) =>
            //         pu.uid === u.uid
            //           ? { ...pu, isTyping, lastMessageTimestamp: isTyping ? new Date() : pu.lastMessageTimestamp }
            //           : pu
            //       )
            //     );
            //   }));
            typingUnsubscribers = []; // No Firebase typing listeners

            messageUnsubscribers = usersData
              .filter((u) => u.chatId)
              .map((u) => {
                const messagesQuery = query(
                  collection(db, 'chats', u.chatId, 'messages'),
                  orderBy('timestamp', 'desc'),
                  limit(10)
                );

                return onSnapshot(messagesQuery, (snap) => {
                  const visibleDocs = snap.docs.filter(
                    (doc) => !(doc.data().deletedBy || []).includes(currentUserUid)
                  );

                  let lastMessage = u.isLocked ? ' Locked Chat' : 'Say hi ';
                  let lastMessageTimestamp = u.lastMessageTimestamp;
                  let lastMessageStatus = u.isCurrent ? 'read' : (u.lastMessageStatus || 'sent');
                  let lastMessageSenderUid = null;

                  if (visibleDocs.length > 0 && !u.isLocked) {
                    const messageData = visibleDocs[0].data();
                    lastMessage = messageData.text || (messageData.file ? 'File' : 'Media');
                    lastMessageTimestamp = messageData.timestamp?.toDate?.() || new Date();
                    lastMessageStatus = u.isCurrent ? 'read' : (messageData.status || 'sent');
                    lastMessageSenderUid = messageData.sender || null;
                  }

                  setUsers((prevUsers) =>
                    prevUsers.map((pu) =>
                      pu.uid === u.uid
                        ? { ...pu, lastMessage, lastMessageTimestamp, lastMessageStatus, lastMessageSenderUid }
                        : pu
                    )
                  );
                }, (error) => {
                  console.error('ChatList.jsx: Error in messages snapshot:', {
                    chatId: u.chatId,
                    userId: u.uid,
                    error: error.message,
                  });
                });
              });

            unreadUnsubscribers = usersData
              .filter((u) => !u.isCurrent && u.chatId)
              .map((u) => {
                const unreadQuery = query(
                  collection(db, 'chats', u.chatId, 'messages'),
                  where('receiver', '==', currentUserUid),
                  where('status', 'in', ['sent', 'delivered'])
                );

                return onSnapshot(unreadQuery, (snap) => {
                  const visible = snap.docs.filter(
                    (doc) => !(doc.data().deletedBy || []).includes(currentUserUid)
                  );

                  const unreadCount = visible.length;

                  setUsers((prevUsers) =>
                    prevUsers.map((pu) =>
                      pu.uid === u.uid ? { ...pu, unreadCount: pu.isCurrent ? 0 : unreadCount } : pu
                    )
                  );
                }, (error) => {
                  console.error('ChatList.jsx: Error in unread snapshot:', {
                    chatId: u.chatId,
                    userId: u.uid,
                    error: error.message,
                  });
                });
              });
          },
          (error) => {
            console.error('ChatList.jsx: Error in userChats snapshot:', error);
            setUsers([]);
            setIsLoading(false);
            showToast('Failed to fetch chats', 'error');
          }
        );
      } catch (error) {
        console.error('ChatList.jsx: Error fetching user chats:', error);
        setUsers([]);
        setIsLoading(false);
        showToast('Failed to fetch chats', 'error');
      }
    };

    fetchUserChats();

    return () => {
      if (userChatsUnsubscriber) userChatsUnsubscriber();
      [typingUnsubscribers, messageUnsubscribers, unreadUnsubscribers].forEach((arr) =>
        arr.forEach((u) => typeof u === 'function' && u())
      );
    };
  }, [currentUserUid, showToast, setIsLoading, createdSelfChat]);

  return { users, typingStatus, setUsers, setTypingStatus };
};