// Full useChatState.js - Using Supabase only
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../supabase";

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
    return [...safeInit]
      .filter(msg => msg && msg.timestamp)  // FIXED: Filter out messages without timestamp
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));  // Ascending (oldest first) + copy
  });
  const [chatWallpaper, setChatWallpaper] = useState(initialWallpaper);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // Log inputs for debugging (only once per unique combination)
  const hasLoggedRef = useRef(false);
  useEffect(() => {
    if (!hasLoggedRef.current) {
      console.log('[useChatState] Inputs:', {
        currentUser: currentUser ? { id: currentUser.id, uid: currentUser.uid } : null,
        contact: contact ? { id: contact.id, uid: contact.uid, conversationId: contact?.id } : null,
        initialMessagesCount: initialMessages.length
      });
      hasLoggedRef.current = true;
    }
  }, [currentUser, contact, initialMessages]);

  // 🔥 FIXED: Use actual conversation ID if available, otherwise compute from user IDs
  const computedChatId = (() => {
    // If contact has an 'id' field that looks like a proper UUID (from conversations table), use it
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (contact?.id && uuidRegex.test(String(contact.id))) {
      console.log('[useChatState] Using actual conversation UUID from contact.id:', contact.id);
      return contact.id;
    }
    
    // Fallback: compute from user IDs (legacy behavior)
    const uidA = currentUser?.uid ?? currentUser?.id;
    const uidB = contact?.uid ?? contact?.id;
    if (!uidA || !uidB) return null;
    console.log('[useChatState] Computing synthetic chat ID from user IDs (legacy):', { uidA, uidB });
    return getChatId(uidA, uidB);
  })();

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

    if (computedChatId && computedChatId !== chatIdRef.current) {
      console.log('useChatState.js: Chat ID changed, resetting messages', { oldId: chatIdRef.current, newId: computedChatId });
      setMessages([]);
      chatIdRef.current = computedChatId;
      isInitialLoadRef.current = true;
    }
  }, [computedChatId]);

  // 🔥 FIXED: Load initial messages from Supabase (now using Supabase for new messages)
  useEffect(() => {
    if (!chatIdRef.current || !isInitialLoadRef.current) return;

    const loadFromSupabase = async () => {
      try {
        console.log('[useChatState] Starting Supabase load', { 
          chatId: chatIdRef.current,
          currentUserId: currentUser?.id || currentUser?.uid,
          contactId: contact?.id || contact?.uid,
          isInitialLoad: isInitialLoadRef.current
        });
        
        const { data: messages, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender_profile:sender_id(id, display_name, email, avatar_url)
          `)
          .eq('chat_id', chatIdRef.current)
          .not('is_deleted', 'is', true)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) {
          console.error('[useChatState] Supabase query error:', error);
          setMessages([]);
          isInitialLoadRef.current = false;
          return;
        }

        console.log('[useChatState] Supabase query completed, found:', messages?.length || 0, 'messages');
        
        if (!messages || messages.length === 0) {
          console.log('✅ [useChatState] CONFIRMED: No messages found (all deleted or none exist)');
          setMessages([]);
          isInitialLoadRef.current = false;
          return;
        }

        const loaded = (messages || []).map((doc) => ({
          id: doc.id,
          ...doc,
          timestamp: new Date(doc.created_at),
          // Map Supabase fields to expected format
          sender: doc.sender_id,
          receiver: doc.recipient_id,
          text: doc.content,
          senderName: doc.sender_profile?.display_name || doc.sender_profile?.email?.split('@')[0] || 'Unknown',
          senderImage: doc.sender_profile?.avatar_url,
        }));
        
        const sortedLoaded = [...loaded].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(sortedLoaded);
        console.log('[useChatState] Messages set in state:', sortedLoaded.length);
        isInitialLoadRef.current = false;
      } catch (err) {
        console.error('[useChatState] Supabase load exception:', err);
        setMessages([]);
        isInitialLoadRef.current = false;
      }
    };

    loadFromSupabase();
  }, [computedChatId]);

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
        console.log('📦 [useChatState] Checking localStorage for cache:', { 
          key: `${CHAT_STORAGE_KEY}-${chatIdRef.current || contact.uid}`, 
          hasCached: !!cached,
          cachedLength: cached ? JSON.parse(cached).length : 0
        });
        
        if (cached) {
          const parsed = JSON.parse(cached).map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })).filter(msg => !isNaN(msg.timestamp.getTime()))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));  // FIXED: Ascending
          if (parsed.length > 0) {
            console.log('⚠️ [useChatState] LOADED FROM CACHE - REPLACING Supabase data!', { count: parsed.length });
            setMessages(parsed);
            console.log('useChatState.js: Loaded from localStorage', { count: parsed.length });
            isInitialLoadRef.current = false;
            return;
          }
        }
        console.log('useChatState.js: No valid localStorage cache, will use Supabase data');
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

  // Batched markRead (1 write for many) - Now uses Supabase instead of Firebase
  const markRead = useCallback(async (messageIds, sendJsonMessage = null) => {
    if (!messageIds || !Array.isArray(messageIds) || !messageIds.length || !currentUser?.uid || !contact?.uid) return;
    const chatId = getChatId(currentUser.uid, contact.uid);
    if (!chatId) return;

    try {
      // FIXED: Filter out optimistic message IDs (timestamps) and only keep valid UUIDs
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const validUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validMessageIds = messageIds.filter(id => validUuidRegex.test(String(id)));
      
      // Only update Supabase if there are valid UUIDs (skip optimistic message IDs like timestamps)
      if (!validMessageIds.length) {
        console.log("💬 No valid UUID messages to mark as read (likely optimistic messages)");
        return;
      }

      console.log(`📖 Marking ${validMessageIds.length} messages as read (filtered from ${messageIds.length} total)`);

      // FIXED: Update Supabase instead of Firebase
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', validMessageIds);
      
      if (error) {
        console.error("Mark read Supabase error:", error);
        return;
      }
      
      console.log(`📖 Marked ${validMessageIds.length} messages as read in Supabase`);
      
      // Send WS notification to sender
      if (sendJsonMessage && typeof sendJsonMessage === 'function') {
        sendJsonMessage({
          type: 'messages_read',
          chatId,
          userId: currentUser.uid,
          messageIds: validMessageIds
        });
        console.log(`📖 Sent WS read receipt for ${validMessageIds.length} messages`);
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
      // FIXED: Always sort ascending (oldest first) + copy to avoid mutation + filter out undefined timestamps
      const sorted = [...newMessages]
        .filter(msg => msg && msg.timestamp)  // FIXED: Filter out messages without timestamp
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
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