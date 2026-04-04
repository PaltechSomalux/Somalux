import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useFCMToken } from '../../hooks/useFCMToken';
import PropTypes from 'prop-types';
import { ChatWindow } from './ChatWindow';
import { useChat } from './useChat';
import { defaultWallpapers } from './defaultwallpapers';
import { supabase } from '../../../supabase';
import { parseTimestamp } from '../../utils/parseTimestamp';
import { SupabaseChatService } from '../../services/SupabaseChatService';
import "./Chat.css";
import OneToOneCall from '../Connect/Calls/OneToOneCall';
import {
  createCallRecord,
  writeSignalDirect,
  listenSignals,
  updateCallStatus,
  listenIncomingCallsFor
} from '../Connect/Calls/signaling';
import useWebSocket from 'react-use-websocket';

// Use environment variable for API URL instead of hardcoded localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper: Convert test user IDs to deterministic UUIDs for development
function convertToValidUUID(userId) {
  if (!userId) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(userId))) {
    return String(userId);
  }
  const str = String(userId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(16).padStart(32, '0');
  // Reverse iteration for second pass to ensure different UUIDs for similar strings
  let hash2 = 0;
  for (let i = str.length - 1; i >= 0; i--) {
    const char = str.charCodeAt(i);
    hash2 = ((hash2 << 5) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  const hashStr2 = Math.abs(hash2).toString(16).padStart(32, '0');
  // Combine both hashes for better distribution
  return `${hashStr.slice(0, 8)}-${hashStr.slice(8, 12)}-4${hashStr2.slice(13, 16)}-8${hashStr2.slice(17, 19)}-${hashStr.slice(20)}`;
}

export const Chat = ({
  initialMessages = [],
  contact = { id: 'contact1', name: 'Contact', avatar: '', status: 'online', lastSeen: new Date(), role: 'user' },
  theme = 'dark',
  enableFeatures = {},
  isMobileView = false,
  onBackClick,
  onForegroundToast = () => {},
  onStatusUpdate = () => {},
  currentUser: propCurrentUser = null,
}) => {
  // Normalize currentUser: ensure it has 'id' field (Supabase uses 'uid')
  const normalizedCurrentUser = propCurrentUser ? {
    ...propCurrentUser,
    id: propCurrentUser.id || propCurrentUser.uid,
  } : null;

  const [currentUser, setCurrentUser] = useState(normalizedCurrentUser);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(theme);

  // Sync prop changes to state
  useEffect(() => {
    if (propCurrentUser) {
      const normalized = {
        ...propCurrentUser,
        id: propCurrentUser.id || propCurrentUser.uid,
      };
      setCurrentUser(normalized);
      setLoading(false);
    }
  }, [propCurrentUser]);

  const [currentWallpaper, setCurrentWallpaper] = useState(() => {
    try {
      const savedWallpaper = localStorage.getItem('imo_current_wallpaper');
      return savedWallpaper ? JSON.parse(savedWallpaper) : defaultWallpapers[0];
    } catch (e) {
      return defaultWallpapers[0];
    }
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    showLastSeen: true,
    showProfilePhoto: true,
    showStatus: true
  });
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { token, isSupported } = useFCMToken();

  // Log props for debugging (only once to avoid StrictMode duplicates)
  const hasLoggedPropsRef = useRef(false);
  useEffect(() => {
    if (!hasLoggedPropsRef.current) {
      console.log('[Chat] Props received:', {
        currentUser: currentUser ? { id: currentUser.id, uid: currentUser.uid } : null,
        contact: contact ? { id: contact.id, uid: contact.uid, name: contact.name } : null,
        initialMessagesCount: initialMessages.length,
        isMobileView
      });
      hasLoggedPropsRef.current = true;
    }
  }, [currentUser, contact, initialMessages, isMobileView]);

  // Global WS states
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const typingTimerRef = useRef(null);
  const lastFetchTimestampRef = useRef(0);
  const [deviceError, setDeviceError] = useState(null);

  const chatId = useMemo(() => {
    if (!currentUser?.id || !contact?.id) return null;
    
    // If contact.id is a proper UUID (from conversations table), use it directly
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(String(contact.id))) {
      console.log('[Chat] Using conversation UUID from contact.id:', contact.id);
      return contact.id;
    }
    
    // Fallback: legacy synthetic ID generation
    if (contact.id === currentUser?.id) {
      return `yourself_${currentUser.id}`;
    }
    const sorted = [currentUser.id, contact.id].sort();
    return sorted.join('_');
  }, [currentUser?.id, contact?.id]);

  const {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    isTyping,
    searchQuery,
    showSearch,
    selectedMessage,
    showMessageActions,
    isRecording,
    isOnline,
    recordingTime,
    replyingTo,
    expandedMessages,
    reportedMessages,
    pinnedMessages,
    notificationSettings,
    filteredMessages,
    messagesEndRef,
    setSearchQuery,
    setShowSearch,
    setShowMessageActions,
    setReplyingTo,
    setChatWallpaper,
    handleSendMessage,
    handleSendVoiceMessage,
    startRecording,
    stopRecording,
    handleFileUpload,
    handleMessageClick,
    handleReactToMessage,
    handleReplyToMessage,
    handleDeleteMessage,
    handleDeleteMessageForEveryone,
    toggleMessageExpand,
    togglePinMessage,
    reportMessage,
    clearChat,
    testDeleteSingleMessage,
    handleBatchDeleteMessages,
    exportChat,
    scrollToBottom,
    editingMessageId,
    setEditingMessageId,
    handleEditSave,
    handleCancelEdit,
    markRead,
  } = useChat({
    initialMessages,
    currentUser,
    contact,
    enableVoiceMessages: enableFeatures.voiceMessages ?? true,
    enableTypingIndicators: enableFeatures.typingIndicators ?? true,
    onMessageCreated: enableFeatures.onMessageCreated,
    onReplyAdded: enableFeatures.onReplyAdded,
    onMessageDeleted: enableFeatures.onMessageDeleted,
    onMessagePinned: enableFeatures.onMessagePinned,
    onMessageReported: enableFeatures.onMessageReported
  });

  // Retry queued messages on connection restore
  useEffect(() => {
    const retryQueuedMessages = async () => {
      if (!currentUser?.id || !contact?.id) return;
      
      try {
        const messageQueue = JSON.parse(localStorage.getItem('chatMessageQueue') || '{}');
        const queueKey = `${currentUser.id}_${contact.id}`;
        const queued = messageQueue[queueKey] || [];
        
        if (queued.length === 0) return;
        
        console.log(`Retrying ${queued.length} queued messages for ${queueKey}`);
        
        for (let msg of queued) {
          msg.attempts = (msg.attempts || 0) + 1;
          if (msg.attempts > 3) {
            console.warn('Giving up on queued message after 3 attempts:', msg);
            continue;
          }
          
          try {
            // Convert IDs to valid UUIDs
            const convertedSenderId = convertToValidUUID(msg.sender);
            const convertedReceiverId = convertToValidUUID(msg.receiver);
            
            const response = await fetch(`${API_URL}/api/messages/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                chatId: `${convertedSenderId}_${convertedReceiverId}`.split('_').sort().join('_'),
                senderId: convertedSenderId,
                recipientId: convertedReceiverId,
                content: msg.text,
                replyToId: msg.replyingTo,
              }),
            });
            
            if (response.ok) {
              console.log('Successfully sent queued message:', msg);
              queued.splice(queued.indexOf(msg), 1);
            }
          } catch (err) {
            console.warn('Failed to retry queued message:', msg, err);
          }
        }
        
        // Update queue
        messageQueue[queueKey] = queued;
        localStorage.setItem('chatMessageQueue', JSON.stringify(messageQueue));
        
      } catch (e) {
        console.warn('Error processing message queue:', e);
      }
    };
    
    // Retry on online event
    const handleOnline = () => {
      console.log('Connection restored, retrying queued messages...');
      retryQueuedMessages();
    };
    
    window.addEventListener('online', handleOnline);
    // Also retry periodically (every 5 seconds) if there are queued messages
    const interval = setInterval(retryQueuedMessages, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [currentUser?.id, contact?.id]);

  // --------------------------------------------------------------
  // 1. ensureDevicesAvailable – **moved out of the effect**
  // --------------------------------------------------------------
  const ensureDevicesAvailable = useCallback(async (mode) => {
    try {
      const constraints = { audio: true, video: mode === 'video' };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (e) {
      const isVideo = mode === 'video';
      const base = isVideo ? 'Camera/Microphone not available' : 'Microphone not available';
      const hint = 'Please connect a device and allow browser access in site permissions.';
      setDeviceError(`${base}. ${hint}`);
      return false;
    }
  }, []);

  // --------------------------------------------------------------
  // WebSocket hook
  // --------------------------------------------------------------
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    chatId ? `ws://localhost:5000` : null,
    {
      onOpen: () => {
        if (chatId) {
          console.log(`WS connected for chat: ${chatId}`);
          sendJsonMessage({ type: "join", chatId, userId: currentUser?.id });
        }
      },
      onClose: () => console.log(`WS disconnected for chat: ${chatId}`),
      onError: (event) => {
        console.error('WS error for chat:', chatId, event);
      },
      shouldReconnect: () => true,
      reconnectAttempts: 50, // Increased from 10 for mobile resilience
      reconnectInterval: 2000, // Faster reconnection
      retryOnError: true,
    }
  );

  // FIXED: Refs to avoid dependency array issues and infinite loops
  const setMessagesRef = useRef(setMessages);
  useEffect(() => {
    setMessagesRef.current = setMessages;
  }, [setMessages]);

  const markReadRef = useRef(markRead);
  useEffect(() => {
    markReadRef.current = markRead;
  }, [markRead]);

  const onStatusUpdateRef = useRef(onStatusUpdate);
  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  // --------------------------------------------------------------
  // Initial load + WS message handling
  // --------------------------------------------------------------
  useEffect(() => {
    if (!chatId || !currentUser?.id || !contact?.id) return;

    // ---- Load queued messages from localStorage (for mobile reliability) ----
    // NOTE: useChat already loads initial messages from Supabase via useChatState,
    // so we don't refetch from HTTP. Just enhance with queued messages.
    try {
      const messageQueue = JSON.parse(localStorage.getItem('chatMessageQueue') || '{}');
      const queueKey = `${currentUser.id}_${contact.id}`;
      const queuedMsgs = messageQueue[queueKey] || [];
      
      if (queuedMsgs.length > 0) {
        console.log(`Loading ${queuedMsgs.length} queued messages from localStorage for ${queueKey}`);
        
        // Convert queued messages to the same format as DB messages
        const queuedFormatted = queuedMsgs.map(msg => ({
          id: `queued_${msg.timestamp}`,  // Temporary ID for queued messages
          sender: msg.sender,
          receiver: msg.receiver,
          text: msg.text,
          timestamp: new Date(msg.timestamp),
          status: 'pending',  // Mark as pending
          isQueued: true,  // Flag for UI to show retry hint
          replyingTo: msg.replyingTo,
        }));
        
        // Merge with existing messages from useChat
        setMessagesRef.current(prev => {
          if (!Array.isArray(prev)) prev = [];
          const allMsgs = [...prev, ...queuedFormatted];
          const dedupedMsgs = allMsgs.reduce((acc, msg) => {
            const exists = acc.some(m => m.id === msg.id);
            if (!exists) acc.push(msg);
            return acc;
          }, []);
          
          const sorted = dedupedMsgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          console.log(`Merged ${sorted.length} total messages (${prev.length} from Supabase, ${queuedFormatted.length} queued)`);
          return sorted;
        });
      }
    } catch (queueErr) {
      console.warn('Error loading queued messages:', queueErr);
    }

    // ---- WS incoming messages ----
    if (lastJsonMessage === null) return;

    const { type, data } = lastJsonMessage;

    switch (type) {
      case "new_message": {
        // FIXED: Ensure data has required fields
        if (!data || !data.timestamp) {
          console.warn("WS new message: Missing data or timestamp", { type, data });
          break;
        }

        const newMsg = { ...data, timestamp: parseTimestamp(data.timestamp) };

        const contentHash = `${newMsg.sender}-${newMsg.text || ''}-${Math.floor(newMsg.timestamp.getTime() / 60000)}`;

        setMessagesRef.current(prev => {
          const exists = prev.some(
            m =>
              m.id === newMsg.id ||
              (m.sender === newMsg.sender &&
                m.text === newMsg.text &&
                Math.abs((m.timestamp?.getTime() || 0) - (newMsg.timestamp?.getTime() || 0)) < 60000)
          );

          if (exists) {
            console.log(`WS new message: Deduped duplicate (hash: ${contentHash})`);
            return prev;
          }

          const updated = [...prev, newMsg].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          console.log(`WS new message: Added + sorted (hash: ${contentHash})`);
          return updated;
        });

        if (newMsg.sender !== currentUser.id && newMsg.status !== 'read') {
          markReadRef.current([newMsg.id], sendJsonMessage);
        }
        break;
      }

      case "recent_messages": {
        const parsedRecent = (Array.isArray(data) ? data : [])
          .filter(msg => msg && msg.timestamp)  // FIXED: Filter out invalid messages
          .map(msg => ({ ...msg, timestamp: parseTimestamp(msg.timestamp) }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setMessagesRef.current(prev => {
          const merged = [...new Set([...prev, ...parsedRecent])].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          return merged;
        });

        if (parsedRecent.length > 0) {
          lastFetchTimestampRef.current = new Date(
            parsedRecent[parsedRecent.length - 1].timestamp
          ).getTime();
        }
        break;
      }

      case "user_online":
        setOnlineUsers(prev => new Set([...prev, data.userId]));
        if (data.userId === contact.id) setIsOtherOnline(true);
        onStatusUpdateRef.current?.(data.userId, 'online', true);
        break;

      case "user_offline":
        setOnlineUsers(prev => {
          const n = new Set(prev);
          n.delete(data.userId);
          return n;
        });
        onStatusUpdateRef.current?.(data.userId, 'online', false);
        break;

      case "typing_start":
        if (data.userId === contact.id) setIsOtherTyping(true);
        setTypingUsers(prev => ({ ...prev, [data.userId]: true }));
        onStatusUpdateRef.current?.(data.userId, 'typing', true);
        break;

      case "typing_stop":
        if (data.userId === contact.id) setIsOtherTyping(false);
        setTypingUsers(prev => {
          const n = { ...prev };
          delete n[data.userId];
          return n;
        });
        onStatusUpdateRef.current?.(data.userId, 'typing', false);
        break;

      case "messages_read":
        if (data.userId === contact.id) {
          setMessagesRef.current(prev =>
            prev.map(m =>
              data.messageIds.includes(m.id) ? { ...m, status: "read" } : m
            )
          );
        }
        break;

      case "users_online":
        setOnlineUsers(prev => new Set([...prev, ...data]));
        data.forEach(uid => onStatusUpdateRef.current?.(uid, 'online', true));
        if (data.includes(contact.id)) setIsOtherOnline(true);
        break;

      case "system_notice":
        if (data?.chatId === chatId) {
          const sysMsg = {
            id: `sys-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: 'system',
            sender: 'system',
            text: data.text || 'System update',
            timestamp: new Date(data.timestamp || Date.now()),
          };
          setMessagesRef.current(prev => [...prev, sysMsg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        }
        break;

      default:
        console.warn(`Unknown WS type: ${type}`);
    }
  }, [
    chatId,
    currentUser?.id,
    contact.id,
    lastJsonMessage,
    sendJsonMessage,
  ]);

  // --------------------------------------------------------------
  // Auto-retry queued messages on page load (mobile resilience)
  // --------------------------------------------------------------
  useEffect(() => {
    if (!currentUser?.id || !contact?.id || !chatId) return;

    const autoRetryQueued = async () => {
      try {
        const messageQueue = JSON.parse(localStorage.getItem('chatMessageQueue') || '{}');
        const queueKey = `${currentUser.id}_${contact.id}`;
        const queued = messageQueue[queueKey] || [];

        if (queued.length === 0) return;

        console.log(`🔄 Auto-retrying ${queued.length} queued messages on page load`);

        const { handleSendMessage } = require('./useChatActions.jsx');
        
        // Retry each queued message
        for (let i = 0; i < queued.length; i++) {
          const msg = queued[i];
          
          // Wait a bit between retries to avoid flooding
          await new Promise(resolve => setTimeout(resolve, 500 + i * 200));
          
          try {
            console.log(`Retrying queued message ${i + 1}/${queued.length}:`, msg.text?.substring(0, 50));
            
            const response = await fetch(`${API_URL}/api/messages/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Client-Timestamp': Date.now().toString(),
              },
              body: JSON.stringify({
                chatId: chatId,
                senderId: currentUser.id,
                recipientId: contact.id,
                content: msg.text,
                replyToId: msg.replyingTo || null,
              }),
            });

            if (response.ok) {
              console.log(`✅ Successfully sent queued message: ${msg.text?.substring(0, 50)}`);
              queued.splice(i, 1);
              i--; // Adjust index after splice
            } else {
              console.warn(`⚠️ Failed to send queued message (${response.status}):`, msg.text?.substring(0, 50));
            }
          } catch (err) {
            console.warn(`❌ Network error retrying queued message:`, err.message);
            // Keep message in queue for next retry
          }
        }

        // Update localStorage with remaining queued messages
        messageQueue[queueKey] = queued;
        localStorage.setItem('chatMessageQueue', JSON.stringify(messageQueue));
        
        if (queued.length === 0) {
          console.log(`✅ All queued messages sent!`);
          delete messageQueue[queueKey];
          localStorage.setItem('chatMessageQueue', JSON.stringify(messageQueue));
        }
      } catch (e) {
        console.warn('Error auto-retrying queued messages:', e);
      }
    };

    // Delay auto-retry to allow initial load to complete
    const timer = setTimeout(autoRetryQueued, 1000);
    return () => clearTimeout(timer);
  }, [currentUser?.id, contact?.id, chatId]);
  const handleTyping = useCallback(() => {
    if (!newMessage?.trim()) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (sendJsonMessage && chatId) sendJsonMessage({ type: "typing_stop", chatId, userId: currentUser?.id });
      return;
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (sendJsonMessage && chatId) sendJsonMessage({ type: "typing_start", chatId, userId: currentUser?.id });
    }, 1000);
  }, [newMessage, chatId, currentUser?.id, sendJsonMessage]);

  useEffect(() => {
    handleTyping();
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [handleTyping]);

  // FCM notifications handled by service worker
  // No need for onMessage listener with Supabase push notifications

  // Auth state is already handled above in the first useEffect
  // No duplicate listener needed

  // --------------------------------------------------------------
  // Call handling
  // --------------------------------------------------------------
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const closeActiveCall = async () => {
    try {
      if (activeCall?.id) await updateCallStatus(activeCall.id, 'ended');
    } catch (e) {}
    setActiveCall(null);
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = listenIncomingCallsFor(currentUser.id, contact?.id, call => {
      if (!activeCall) setIncomingCall(call);
    });
    return () => unsub?.();
  }, [currentUser?.id, contact?.id, activeCall]);

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    await updateCallStatus(incomingCall.id, 'in_progress');
    await writeSignalDirect(incomingCall.id, 'accepted', { by: currentUser.id });
    setActiveCall({
      id: incomingCall.id,
      mode: incomingCall.mode || 'voice',
      role: 'callee',
      contact,
      initiator: incomingCall.initiator
    });
    setIncomingCall(null);
  };

  const declineIncomingCall = async () => {
    if (!incomingCall) return;
    await updateCallStatus(incomingCall.id, 'declined');
    await writeSignalDirect(incomingCall.id, 'hangup', { by: currentUser.id });
    setIncomingCall(null);
  };

  const startOneToOneCall = async (mode = 'voice') => {
    if (!currentUser || !contact) return;

    const ok = await ensureDevicesAvailable(mode);
    if (!ok) return;

    const payload = {
      initiator: { id: currentUser.id, name: currentUser.name },
      participants: [{ id: contact.id, name: contact.name }],
      mode,
    };
    const { id } = await createCallRecord(payload);
    await writeSignalDirect(id, 'invite', { from: currentUser.id, to: contact.id, mode });
    setActiveCall({ id, mode, role: 'caller', contact, initiator: currentUser });
  };

  // --------------------------------------------------------------
  // Theme & misc helpers
  // --------------------------------------------------------------
  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    localStorage.setItem('imo_chat_theme', newTheme);
  }, [currentTheme]);

  const toggleNotificationSetting = useCallback(setting => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('imo_chat_theme')) {
      localStorage.setItem('imo_chat_theme', 'dark');
    }
  }, []);

  const isSelfChat = contact.id === 'yourself';
  const chatFeatures = {
    enableVoiceMessages: enableFeatures.voiceMessages ?? true,
    enableReactions: enableFeatures.reactions ?? true,
    enableMessageSearch: enableFeatures.messageSearch ?? true,
    enableReadReceipts: isSelfChat ? false : (enableFeatures.readReceipts ?? true),
    enableTypingIndicators: isSelfChat ? false : (enableFeatures.typingIndicators ?? true),
    enableOnlineStatus: isSelfChat ? false : (enableFeatures.onlineStatus ?? true),
    enablePinning: enableFeatures.pinning ?? true,
    enablePrivateMessages: enableFeatures.privateMessages ?? true,
    enableReporting: isSelfChat ? false : (enableFeatures.reporting ?? true),
    enableThreading: enableFeatures.threading ?? true
  };

  const handleSendMessageOverride = useCallback(() => {
    if (editingMessageId) {
      handleEditSave(editingMessageId, newMessage);
      return;
    }
    handleSendMessage();
  }, [editingMessageId, newMessage, handleEditSave, handleSendMessage]);

  useEffect(() => {
    if (editingMessageId) {
      const msg = messages.find(m => m.id === editingMessageId);
      if (msg) setNewMessage(msg.text || '');
    }
  }, [editingMessageId, messages, setNewMessage]);

  const handleLongPressMessage = useCallback(message => {
    setIsSelectionMode(true);
    setSelectedMessageIds(prev => {
      if (prev.includes(message.id)) {
        return prev.filter(id => id !== message.id);
      }
      return [...prev, message.id];
    });
  }, []);

  const handleSelectMessage = useCallback(messageId => {
    setSelectedMessageIds(prev => {
      let updated;
      if (prev.includes(messageId)) {
        updated = prev.filter(id => id !== messageId);
      } else {
        updated = [...prev, messageId];
      }
      // Exit selection mode if no messages are selected
      if (updated.length === 0) {
        setIsSelectionMode(false);
      }
      return updated;
    });
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedMessageIds([]);
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (selectedMessageIds.length === 0) return;
    if (typeof handleBatchDeleteMessages !== 'function') {
      alert('Batch deletion is not available at this time.');
      return;
    }
    try {
      const { deletedMessageIds } = await handleBatchDeleteMessages(selectedMessageIds);
      setSelectedMessageIds([]);
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Batch delete error', err);
      alert(`Failed to delete messages: ${err.message}`);
    }
  }, [selectedMessageIds, handleBatchDeleteMessages]);
  // Handle delete user from chat list
  const handleDeleteUser = useCallback(async () => {
    console.log('🗑️ handleDeleteUser called!', { 
      contactId: contact?.id, 
      contactName: contact?.name,
      currentUserId: currentUser?.id,
      chatId: chatId
    });

    if (!contact?.id || !currentUser?.id) {
      console.error('Cannot delete user: missing contact or current user info');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${contact.name || 'this user'} from your chat list? This action cannot be undone.`
    );

    if (!confirmed) {
      console.log('🗑️ User cancelled deletion');
      return;
    }

    try {
      console.log('🗑️ Deleting user from chat:', { userId: contact.id, contactName: contact.name });
      
      // Generate the chat ID
      const chatIdToDelete = chatId;
      
      if (!chatIdToDelete) {
        throw new Error('Unable to determine chat ID');
      }

      console.log('🗑️ Calling SupabaseChatService.deleteChat with:', { 
        userId: currentUser.id, 
        chatId: chatIdToDelete 
      });

      // Delete the chat from the database
      const deleteResult = await SupabaseChatService.deleteChat(currentUser.id, chatIdToDelete);
      console.log('✅ Chat marked as deleted in database:', deleteResult);

      // Verify the delete worked
      if (deleteResult && deleteResult.is_deleted) {
        console.log('✅ Delete verified - is_deleted is true');
      } else {
        console.warn('⚠️ Delete result unclear, may not have worked:', deleteResult);
        alert('⚠️ Warning: Delete may not have persisted. Please refresh to verify.');
      }

      // Close the chat window and return to chat list
      if (onBackClick) {
        console.log('🔙 Navigating back to chat list');
        onBackClick();
      } else {
        console.warn('⚠️ onBackClick not available');
      }

      console.log('✅ User deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      alert(`Error deleting user: ${error.message || 'Unknown error'}`);
    }
  }, [contact?.id, contact?.name, currentUser?.id, chatId, onBackClick]);
  // --------------------------------------------------------------
  // Render
  // --------------------------------------------------------------
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <div>Please sign in to continue.</div>;
  if (!contact?.id || !contact?.name) return <div>Error: Invalid contact information.</div>;

  return (
    <>
      <ChatWindow
        key={`${contact.id}-${currentUser.id}`}
        messages={messages}
        setMessages={setMessages}
        newMessage={newMessage}
        isTyping={isTyping}
        searchQuery={searchQuery}
        showSearch={showSearch}
        selectedMessage={selectedMessage}
        showMessageActions={showMessageActions}
        isRecording={isRecording}
        isOnline={isOnline}
        recordingTime={recordingTime}
        replyingTo={replyingTo}
        expandedMessages={expandedMessages}
        reportedMessages={reportedMessages}
        pinnedMessages={pinnedMessages}
        notificationSettings={notificationSettings}
        filteredMessages={filteredMessages}
        currentTheme={currentTheme}
        currentWallpaper={currentWallpaper}
        securitySettings={securitySettings}
        messagesEndRef={messagesEndRef}
        setNewMessage={setNewMessage}
        setSearchQuery={setSearchQuery}
        setShowSearch={setShowSearch}
        setShowMessageActions={setShowMessageActions}
        setReplyingTo={setReplyingTo}
        setCurrentWallpaper={setCurrentWallpaper}
        setSecuritySettings={setSecuritySettings}
        handleSendMessage={handleSendMessageOverride}
        handleSendVoiceMessage={handleSendVoiceMessage}
        startRecording={startRecording}
        stopRecording={stopRecording}
        handleFileUpload={handleFileUpload}
        handleMessageClick={handleMessageClick}
        handleLongPressMessage={handleLongPressMessage}
        handleSelectMessage={handleSelectMessage}
        handleCancelSelection={handleCancelSelection}
        handleBatchDelete={handleBatchDelete}
        handleReactToMessage={handleReactToMessage}
        handleReplyToMessage={handleReplyToMessage}
        handleDeleteMessage={handleDeleteMessage}
        handleDeleteMessageForEveryone={handleDeleteMessageForEveryone}
        toggleMessageExpand={toggleMessageExpand}
        togglePinMessage={togglePinMessage}
        reportMessage={reportMessage}
        clearChat={clearChat}
        testDeleteSingleMessage={testDeleteSingleMessage}
        exportChat={exportChat}
        scrollToBottom={scrollToBottom}
        toggleTheme={toggleTheme}
        toggleNotificationSetting={toggleNotificationSetting}
        currentUser={currentUser}
        contact={contact}
        enableFeatures={chatFeatures}
        isMobileView={isMobileView}
        onBackClick={onBackClick}
        selectedMessageIds={selectedMessageIds}
        isSelectionMode={isSelectionMode}
        editingMessageId={editingMessageId}
        setEditingMessageId={setEditingMessageId}
        handleEditSave={handleEditSave}
        handleCancelEdit={handleCancelEdit}
        isOtherOnline={isOtherOnline}
        isOtherTyping={isOtherTyping}
        sendJsonMessage={sendJsonMessage}
        typingUsers={typingUsers}
        onlineUsers={onlineUsers}
        webSocketReadyState={readyState}
        startAudioCall={() => startOneToOneCall('voice')}
        startVideoCall={() => startOneToOneCall('video')}
      />

      {/* Incoming call modal */}
      {incomingCall && !activeCall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#1f2c34', color: '#fff', padding: 20, borderRadius: 12, width: 320, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            <h4 style={{ marginTop: 0, marginBottom: 8 }}>Incoming {incomingCall.mode === 'video' ? 'Video' : 'Voice'} Call</h4>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>From: {incomingCall?.initiator?.name || 'Unknown'}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={declineIncomingCall} style={{ background: '#b3261e', color: '#fff', border: 0, padding: '8px 12px', borderRadius: 8 }}>Decline</button>
              <button onClick={acceptIncomingCall} style={{ background: '#0b8457', color: '#fff', border: 0, padding: '8px 12px', borderRadius: 8 }}>Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* Device error modal */}
      {deviceError && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500 }}>
          <div style={{ background: '#1f2c34', color: '#fff', padding: 20, borderRadius: 12, width: 360, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            <h4 style={{ marginTop: 0, marginBottom: 8 }}>Device Error</h4>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>{deviceError}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeviceError(null)} style={{ background: '#0b8457', color: '#fff', border: 0, padding: '8px 12px', borderRadius: 8 }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Active call overlay */}
      {activeCall && (
        <OneToOneCall
          call={activeCall}
          mode={activeCall.mode}
          currentUser={currentUser}
          contact={contact}
          onClose={closeActiveCall}
        />
      )}
    </>
  );
};

Chat.propTypes = {
  initialMessages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      text: PropTypes.string,
      sender: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      senderName: PropTypes.string,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      isForwarded: PropTypes.bool,
      forwardedFrom: PropTypes.string
    })
  ),
  contact: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    avatar: PropTypes.string,
    status: PropTypes.string,
    lastSeen: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    role: PropTypes.string
  }),
  theme: PropTypes.oneOf(['light', 'dark']),
  enableFeatures: PropTypes.shape({
    voiceMessages: PropTypes.bool,
    reactions: PropTypes.bool,
    messageSearch: PropTypes.bool,
    readReceipts: PropTypes.bool,
    typingIndicators: PropTypes.bool,
    onlineStatus: PropTypes.bool,
    pinning: PropTypes.bool,
    privateMessages: PropTypes.bool,
    reporting: PropTypes.bool,
    threading: PropTypes.bool,
    onMessageCreated: PropTypes.func,
    onReplyAdded: PropTypes.func,
    onMessageDeleted: PropTypes.func,
    onMessagePinned: PropTypes.func,
    onMessageReported: PropTypes.func
  }),
  isMobileView: PropTypes.bool,
  onBackClick: PropTypes.func,
  onForegroundToast: PropTypes.func,
  onStatusUpdate: PropTypes.func,
};

export default Chat;
