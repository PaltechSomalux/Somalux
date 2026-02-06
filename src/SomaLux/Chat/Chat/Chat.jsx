// Full Chat.jsx - Fixed ESLint errors
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useFCMToken } from '../hooks/useFCMToken';
import PropTypes from 'prop-types';
import { ChatWindow } from './ChatWindow';
import { useChat } from './useChat';
import { defaultWallpapers } from './defaultwallpapers';
import { auth } from '../firebase';
import { parseTimestamp } from '../utils/parseTimestamp';
import "./Chat.css";
import OneToOneCall from '../Connect/Calls/OneToOneCall';
import {
  createCallRecord,
  writeSignalDirect,
  listenSignals,
  updateCallStatus,
  listenIncomingCallsFor
} from '../Connect/Calls/signaling';

// Firebase imports removed - using Supabase instead
// import { onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';
import useWebSocket from 'react-use-websocket';

export const Chat = ({
  initialMessages = [],
  contact = { id: 'contact1', name: 'Contact', avatar: '', status: 'online', lastSeen: new Date(), role: 'user' },
  theme = 'dark',
  enableFeatures = {},
  isMobileView = false,
  onBackClick,
  onForegroundToast,
  onStatusUpdate,
}) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(theme);
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
    // Special case: if contact.id equals currentUser.id, it's a self-chat
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
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  );

  // --------------------------------------------------------------
  // Initial load + WS message handling
  // --------------------------------------------------------------
  useEffect(() => {
    if (!chatId) return;

    // ---- HTTP initial load ----
    fetch(`http://localhost:5000/chat/${chatId}/messages?since=${lastFetchTimestampRef.current || 0}`)
      .then(res => res.json())
      .then(msgs => {
        const parsedMsgs = msgs
          .map(msg => ({ ...msg, timestamp: parseTimestamp(msg.timestamp) }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setMessages(parsedMsgs);
        if (parsedMsgs.length > 0) {
          const lastTs = new Date(parsedMsgs[parsedMsgs.length - 1].timestamp).getTime();
          lastFetchTimestampRef.current = lastTs;
        }
      })
      .catch(err => console.error("Initial load error:", err));

    // ---- WS incoming messages ----
    if (lastJsonMessage === null) return;

    const { type, data } = lastJsonMessage;

    switch (type) {
      case "new_message": {
        const newMsg = { ...data, timestamp: parseTimestamp(data.timestamp) };

        const contentHash = `${newMsg.sender}-${newMsg.text || ''}-${Math.floor(newMsg.timestamp.getTime() / 60000)}`;

        setMessages(prev => {
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
          markRead([newMsg.id], sendJsonMessage);
        }
        break;
      }

      case "recent_messages": {
        const parsedRecent = data
          .map(msg => ({ ...msg, timestamp: parseTimestamp(msg.timestamp) }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setMessages(prev => {
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
        onStatusUpdate?.(data.userId, 'online', true);
        break;

      case "user_offline":
        setOnlineUsers(prev => {
          const n = new Set(prev);
          n.delete(data.userId);
          return n;
        });
        onStatusUpdate?.(data.userId, 'online', false);
        break;

      case "typing_start":
        if (data.userId === contact.id) setIsOtherTyping(true);
        setTypingUsers(prev => ({ ...prev, [data.userId]: true }));
        onStatusUpdate?.(data.userId, 'typing', true);
        break;

      case "typing_stop":
        if (data.userId === contact.id) setIsOtherTyping(false);
        setTypingUsers(prev => {
          const n = { ...prev };
          delete n[data.userId];
          return n;
        });
        onStatusUpdate?.(data.userId, 'typing', false);
        break;

      case "messages_read":
        if (data.userId === contact.id) {
          setMessages(prev =>
            prev.map(m =>
              data.messageIds.includes(m.id) ? { ...m, status: "read" } : m
            )
          );
        }
        break;

      case "users_online":
        setOnlineUsers(prev => new Set([...prev, ...data]));
        data.forEach(uid => onStatusUpdate?.(uid, 'online', true));
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
          setMessages(prev => [...prev, sysMsg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
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
    setMessages,
    setIsOtherOnline,
    setIsOtherTyping,
    setTypingUsers,
    setOnlineUsers,
    markRead,
    onStatusUpdate,
  ]);

  // --------------------------------------------------------------
  // Typing debounce
  // --------------------------------------------------------------
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

  // --------------------------------------------------------------
  // FCM foreground notifications
  // --------------------------------------------------------------
  useEffect(() => {
    if (!isSupported) return;

    const unsubscribe = onMessage(messaging, payload => {
      console.log('Foreground notification received:', payload);

      if (payload.data?.foreground) {
        try {
          const fg = JSON.parse(payload.data.foreground);
          if (fg.enabled) {
            onForegroundToast(fg);
            return;
          }
        } catch (e) {
          console.error('Failed to parse foreground data:', e);
        }
      }

      const senderName = payload.data?.senderName ||
        payload.notification?.title?.replace("New message from ", "") ||
        "Unknown Sender";

      const messageText = payload.data?.message ||
        payload.notification?.body ||
        "New message received";

      if (Notification.permission === 'granted') {
        new Notification(senderName, {
          body: messageText,
          icon: '/icon.png',
          badge: '/icon.png',
          vibrate: [200, 100, 200],
          data: payload.data,
          tag: 'chat-message',
        });
      }
    });

    return () => unsubscribe();
  }, [isSupported, onForegroundToast]);

  // --------------------------------------------------------------
  // Auth listener
  // --------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const userData = {
          id: user.uid,
          name: user.displayName || 'You',
          avatar: user.photoURL || '',
          status: 'online',
          role: 'user'
        };
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    setSelectedMessageIds(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
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

Chat.defaultProps = {
  initialMessages: [],
  theme: 'dark',
  isMobileView: false,
  onForegroundToast: () => {},
  onStatusUpdate: () => {},
};

export default Chat;