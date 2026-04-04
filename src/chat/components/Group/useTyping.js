import { useCallback } from 'react';
// ❌ DISABLED: Firebase typing indicators - now using WebSocket only
// import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
// import { db } from '../firebase';

export const getChatId = (idA, idB) => {
  try {
    // ✅ FIXED: Safe string conversion with fallbacks
    if (!idA || !idB) {
      console.log('getChatId: Missing IDs', { idA, idB });
      return null;
    }

    // ✅ SAFE CONVERSION: Handle numbers, strings, or any type
    const safeString = (id) => {
      if (id == null) return '';
      if (typeof id === 'string') return id;
      if (typeof id === 'number') return id.toString();
      if (id.toString) return id.toString();
      return String(id);
    };

    const safeIdA = safeString(idA).toLowerCase().trim();
    const safeIdB = safeString(idB).toLowerCase().trim();

    if (!safeIdA || !safeIdB) {
      console.log('getChatId: Empty IDs after conversion', { safeIdA, safeIdB });
      return null;
    }

    // Keep chatId consistent by sorting lowercase IDs
    const chatId = [safeIdA, safeIdB].sort().join('_');
    // console.log('getChatId generated:', { idA, idB, safeIdA, safeIdB, chatId });
    return chatId;
  } catch (error) {
    console.error('getChatId error:', error);
    return null;
  }
};

/* ✅ Hook version - for use inside React components */
export const useTyping = (currentUser, contact) => {
  // ✅ FIXED: Safe self-chat detection
  const isSelfChat = useCallback(() => {
    try {
      const currentId = currentUser?.id;
      const contactId = contact?.id;
      
      if (!currentId || !contactId) return true;
      
      const safeCurrent = String(currentId).toLowerCase().trim();
      const safeContact = String(contactId).toLowerCase().trim();
      
      return safeCurrent === safeContact;
    } catch (error) {
      console.warn('isSelfChat error:', error);
      return true; // Default to self-chat if error
    }
  }, [currentUser?.id, contact?.id]);

  const chatId = getChatId(currentUser?.id, contact?.id);
  const selfChat = isSelfChat();

  // console.log('useTyping initialized:', { 
  //   currentUserId: currentUser?.id, 
  //   contactId: contact?.id, 
  //   chatId, 
  //   isSelfChat: selfChat 
  // });

  const sendTypingEvent = useCallback(
    async (isTyping) => {
      // ❌ DISABLED: Firebase typing indicators - now using WebSocket only
      // if (!chatId || !currentUser?.id || selfChat) {
      //   return;
      // }
      // try {
      //   const safeUserId = String(currentUser.id);
      //   const typingRef = doc(db, 'chats', chatId, 'presence', safeUserId);
      //   
      //   await setDoc(
      //     typingRef,
      //     {
      //       isTyping,
      //       updatedAt: serverTimestamp(),
      //     },
      //     { merge: true }
      //   );
      // } catch (error) {
      //   console.error('useTyping.js: Error sending typing event:', error);
      // }
      
      // Typing indicators now handled via WebSocket only
      return;
    },
    [chatId, currentUser?.id, contact?.id, selfChat]
  );

  const listenForTyping = useCallback(
    (callback) => {
      // ❌ DISABLED: Firebase typing listeners - now using WebSocket only
      // No need to listen to Firebase since we're not writing to it
      callback(false);
      return () => {};
    },
    [chatId, contact?.id, selfChat]
  );

  return { sendTypingEvent, listenForTyping };
};

/* ❌ DISABLED: Non-hook version - now using WebSocket only */
export const listenForTyping = (currentUid, otherUid, callback) => {
  // ❌ DISABLED: Firebase typing listeners - now using WebSocket only
  callback(false);
  return () => {};
};