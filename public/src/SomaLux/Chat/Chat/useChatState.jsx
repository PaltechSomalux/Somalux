// Full useChatState.js - Unchanged
import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  getDocs,
  writeBatch,
  doc,
  getDoc,
  arrayUnion,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

const CHAT_STORAGE_KEY = "whatsapp-clone-chat";
const WALLPAPER_STORAGE_KEY = "whatsapp-clone-wallpaper";

const getChatId = (idA, idB) => {
  if (!idA || !idB || typeof idA !== 'string' || typeof idB !== 'string') {
    console.error('useChatState.js: getChatId: Invalid inputs', { idA, idB, types: { idA: typeof idA, idB: typeof idB } });
    return null;
  }
  // Be tolerant of underscores in UIDs; just sort and join deterministically
  const sorted = [String(idA), String(idB)].sort();
  const chatId = sorted.join('_');
  console.log('useChatState.js: getChatId generated', { idA, idB, sorted, chatId });
  return chatId;
};

export const useChatState = ({
  initialMessages = [],
  currentUser,
  contact,
  initialWallpaper = "default",
}) => {
  const chatIdRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // FIXED: Ensure messages is always an array, even if initialMessages is not; sort on init (ascending)
  const [messages, setMessages] = useState(() => {
    const safeInit = Array.isArray(initialMessages) ? initialMessages : [];
    return [...safeInit].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));  // Ascending (oldest first) + copy
  });
  const [chatWallpaper, setChatWallpaper] = useState(initialWallpaper);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // 🔥 FIXED: Compute chatId with ref for persistence across re-renders/remounts
  useEffect(() => {
    const uidA = currentUser?.uid ?? currentUser?.id;
    const uidB = contact?.uid ?? contact?.id;

    // If either side is missing, avoid calling getChatId (prevents noisy errors)
    if (!uidA || !uidB) {
      if (chatIdRef.current !== null) {
        console.log('useChatState.js: Clearing chatIdRef because participant id missing', { uidA, uidB });
        chatIdRef.current = null;
        setMessages([]);
      }
      return;
    }

    // 🔥 FIXED: Use actual conversation ID if available (UUID from conversations table)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let computedChatId;
    if (contact?.id && uuidRegex.test(String(contact.id))) {
      console.log('[useChatState] Using actual conversation UUID from contact.id:', contact.id);
      computedChatId = contact.id;
    } else {
      console.log('[useChatState] Computing synthetic chat ID from user IDs (legacy):', { uidA, uidB });
      computedChatId = getChatId(uidA, uidB);
    }

    if (computedChatId && computedChatId !== chatIdRef.current) {
      console.log('useChatState.js: Chat ID changed, resetting messages', { oldId: chatIdRef.current, newId: computedChatId });
      setMessages([]);
      chatIdRef.current = computedChatId;
      isInitialLoadRef.current = true;
    }
  }, [currentUser?.uid, currentUser?.id, contact?.uid, contact?.id]);

  // 🔥 FIXED: Load initial messages from Firestore if localStorage empty or on initial load (ascending)
  useEffect(() => {
    if (!chatIdRef.current || !isInitialLoadRef.current) return;

    const loadFromFirestore = async () => {
      try {
        console.log('useChatState.js: Loading initial messages from Firestore for chatId', chatIdRef.current);
        const q = query(
          collection(db, 'chats', chatIdRef.current, 'messages'),
          orderBy('timestamp', 'asc'),  // FIXED: Ascending
          limit(100)
        );
        const snapshot = await getDocs(q);
        const loaded = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
        }));
        const sortedLoaded = [...loaded].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));  // Ascending + copy
        setMessages(sortedLoaded);
        console.log('useChatState.js: Loaded from Firestore', { count: sortedLoaded.length });
        isInitialLoadRef.current = false;
      } catch (err) {
        console.error('useChatState.js: Firestore load failed', err);
        setMessages([]);
        isInitialLoadRef.current = false;
      }
    };

    loadFromFirestore();
  }, [chatIdRef.current]);  // Run on chatId change

  // LocalStorage sync (FIXED: Serialize/deserialize with sorting/parsing, ascending)
  useEffect(() => {
    if (!contact?.uid && !chatIdRef.current) {
      console.error('useChatState.js: Missing contact UID or chatId for saving to localStorage', { contactUid: contact?.uid, chatId: chatIdRef.current });
      return;
    }
    try {
      const safeMsgs = Array.isArray(messages) ? messages : [];
      const sortedMsgs = [...safeMsgs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));  // FIXED: Ascending + copy
      localStorage.setItem(
        `${CHAT_STORAGE_KEY}-${chatIdRef.current || contact.uid}`,
        JSON.stringify(sortedMsgs.map(msg => ({ ...msg, timestamp: msg.timestamp?.toISOString ? msg.timestamp.toISOString() : new Date().toISOString() })))
      );
      localStorage.setItem(
        `${WALLPAPER_STORAGE_KEY}-${chatIdRef.current || contact.uid}`,
        chatWallpaper
      );
    } catch (err) {
      console.error("useChatState.js: Error saving chat to localStorage:", {
        error: err.message,
        contactUid: contact?.uid,
        chatId: chatIdRef.current,
      });
    }
  }, [messages, chatWallpaper, contact?.uid, chatIdRef.current]);

  // Load from localStorage on mount/chatId change (FIXED: Parse/sort, fallback to Firestore if empty, ascending)
  useEffect(() => {
    if (!contact?.uid && !chatIdRef.current) return;

    const loadFromLocalStorage = () => {
      try {
        const cached = localStorage.getItem(`${CHAT_STORAGE_KEY}-${chatIdRef.current || contact.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached).map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })).filter(msg => !isNaN(msg.timestamp.getTime()))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));  // FIXED: Ascending
          if (parsed.length > 0) {
            setMessages(parsed);
            console.log('useChatState.js: Loaded from localStorage', { count: parsed.length });
            isInitialLoadRef.current = false;
            return;
          }
        }
        console.log('useChatState.js: No valid localStorage cache, falling back to Firestore');
        // Trigger Firestore load if no cache
        isInitialLoadRef.current = true;
      } catch (err) {
        console.error("useChatState.js: Error loading from localStorage:", err);
        // Fallback to Firestore
        isInitialLoadRef.current = true;
      }
    };

    loadFromLocalStorage();
  }, [contact?.uid, chatIdRef.current]);

  // Batched markRead (1 write for many) - Now accepts sendJsonMessage for WS notification
  const markRead = useCallback(async (messageIds, sendJsonMessage = null) => {
    if (!messageIds || !Array.isArray(messageIds) || !messageIds.length || !currentUser?.uid || !contact?.uid) return;
    const chatId = getChatId(currentUser.uid, contact.uid);
    if (!chatId) return;

    try {
      const batch = writeBatch(db);
      messageIds.forEach((messageId) => {
        const messageRef = doc(db, "chats", chatId, "messages", messageId);
        batch.update(messageRef, { 
          status: "read",
          readBy: arrayUnion(currentUser.uid)
        });
      });
      await batch.commit(); // Single write op
      console.log(`📖 Batched read write for ${messageIds.length} messages`);
      
      // Send WS notification to sender
      if (sendJsonMessage && typeof sendJsonMessage === 'function') {
        sendJsonMessage({
          type: 'messages_read',
          chatId,
          userId: currentUser.uid,
          messageIds
        });
        console.log(`📖 Sent WS read receipt for ${messageIds.length} messages`);
      }
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  }, [currentUser?.uid, contact?.uid]);

  // FIXED: Wrap setMessages to ensure it always results in an array + auto-sort (ascending, with copies)
  const safeSetMessages = useCallback((updater) => {
    setMessages((prevMessages) => {
      let newMessages;
      if (typeof updater === 'function') {
        newMessages = updater(Array.isArray(prevMessages) ? [...prevMessages] : []);  // FIXED: Copy input array
      } else {
        newMessages = Array.isArray(updater) ? [...updater] : [];  // FIXED: Copy non-function updater
      }
      // FIXED: Always sort ascending (oldest first) + copy to avoid mutation
      const sorted = [...newMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      console.log('useChatState.js: safeSetMessages applied + sorted', { prevLength: (Array.isArray(prevMessages) ? prevMessages.length : 0), newLength: sorted.length });
      return sorted;
    });
  }, []);

  console.log('useChatState.js: Returning', {
    setMessages: typeof safeSetMessages === 'function' ? 'function (sorted ascending)' : 'undefined',
    messagesIsArray: Array.isArray(messages),
    chatId: chatIdRef.current,
  });
  return {
    messages,
    setMessages: safeSetMessages,
    newMessage,
    setNewMessage,
    isTyping,
    setIsTyping,
    replyingTo,
    setReplyingTo,
    chatWallpaper,
    setChatWallpaper,
    markRead,
  };
};