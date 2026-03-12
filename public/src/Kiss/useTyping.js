// import { useCallback } from 'react';
// import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
// import { db } from '../firebase';

// export const getChatId = (idA, idB) => {
//   if (!idA || !idB) {
//     console.log('getChatId: Missing IDs', { idA, idB });
//     return null;
//   }
//   // Keep chatId consistent by sorting lowercase IDs
//   const chatId = [idA, idB].sort().join('_');
//   // console.log('getChatId generated:', { idA, idB, chatId });
//   return chatId;
// };

// /* ✅ Hook version - for use inside React components */
// export const useTyping = (currentUser, contact) => {
//   const chatId = getChatId(currentUser?.id, contact?.id);
//   const isSelfChat = currentUser?.id?.toLowerCase() === contact?.id?.toLowerCase();

//   const sendTypingEvent = useCallback(
//     async (isTyping) => {
//       if (!chatId || !currentUser?.id || isSelfChat) {
//         console.log('sendTypingEvent skipped:', { 
//           chatId, 
//           userId: currentUser?.id, 
//           isSelfChat 
//         });
//         return;
//       }
//       try {
//         // ✅ Use original UID (currentUser.id) for presence document
//         const typingRef = doc(db, 'chats', chatId, 'presence', currentUser.id);
//         await setDoc(
//           typingRef,
//           {
//             isTyping,
//             updatedAt: serverTimestamp(),
//           },
//           { merge: true }
//         );
//       } catch (error) {
//         console.error('useTyping.js: Error sending typing event:', error);
//       }
//     },
//     [chatId, currentUser?.id, contact?.id, isSelfChat]
//   );

//   const listenForTyping = useCallback(
//     (callback) => {
//       if (!chatId || !contact?.id || isSelfChat) {
//         console.log('listenForTyping skipped:', { 
//           chatId, 
//           contactId: contact?.id, 
//           isSelfChat 
//         });
//         callback(false);
//         return () => {};
//       }
//       // ✅ Use original UID (contact.id) for listening
//       const typingRef = doc(db, 'chats', chatId, 'presence', contact.id);
//       console.log('Setting up onSnapshot:', { 
//         chatId, 
//         contactId: contact.id, 
//         path: `chats/${chatId}/presence/${contact.id}` 
//       });
//       const unsubscribe = onSnapshot(
//         typingRef,
//         (docSnap) => {
//           console.log('onSnapshot fired for:', { chatId, contactId: contact.id });
//           if (docSnap.exists()) {
//             const data = docSnap.data();
//             const isRecent = data.updatedAt && (Date.now() - data.updatedAt.toMillis()) < 10000;
//             console.log('Firestore typing update:', {
//               chatId,
//               contactId: contact.id,
//               isTyping: data.isTyping,
//               isRecent,
//               updatedAt: data.updatedAt ? data.updatedAt.toMillis() : null,
//               currentTime: Date.now()
//             });
//             callback(data.isTyping && isRecent);
//           } else {
//             // console.log('No typing doc exists for:', { chatId, contactId: contact.id });
//             callback(false);
//           }
//         },
//         (error) => {
//           console.error('useTyping.js: Error in onSnapshot:', error);
//           callback(false);
//         }
//       );
//       return unsubscribe;
//     },
//     [chatId, contact?.id, isSelfChat]
//   );

//   return { sendTypingEvent, listenForTyping };
// };

// /* ✅ Non-hook version - safe for use in lists, loops, etc. */
// export const listenForTyping = (currentUid, otherUid, callback) => {
//   if (!currentUid || !otherUid) {
//     console.log('listenForTyping (non-hook) skipped: Missing UIDs', { currentUid, otherUid });
//     return () => {};
//   }
//   const chatId = getChatId(currentUid, otherUid);
//   if (!chatId) {
//     console.log('listenForTyping (non-hook) skipped: No chatId');
//     return () => {};
//   }
//   // ✅ Use original UID (otherUid) for listening
//   const typingRef = doc(db, 'chats', chatId, 'presence', otherUid);
//   // console.log('Setting up non-hook onSnapshot:', { 
//   //   chatId, 
//   //   otherUid, 
//   //   path: `chats/${chatId}/presence/${otherUid}` 
//   // });
//   const unsubscribe = onSnapshot(
//     typingRef,
//     (docSnap) => {
//       // console.log('Non-hook onSnapshot fired for:', { chatId, otherUid });
//       if (docSnap.exists()) {
//         const data = docSnap.data();
//         const isRecent = data.updatedAt && (Date.now() - data.updatedAt.toMillis()) < 10000;
//         // console.log('Non-hook typing update:', {
//         //   chatId,
//         //   otherUid,
//         //   isTyping: data.isTyping,
//         //   isRecent,
//         //   updatedAt: data.updatedAt ? data.updatedAt.toMillis() : null
//         // });
//         callback(data.isTyping && isRecent);
//       } else {
//         // console.log('No typing doc exists for (non-hook):', { chatId, otherUid });
//         callback(false);
//       }
//     },
//     (error) => {
//       console.error('listenForTyping: Error in onSnapshot:', error);
//       callback(false);
//     }
//   );
//   return unsubscribe;
// };