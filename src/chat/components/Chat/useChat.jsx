// Full useChat.js - Unchanged from provided
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useChatState } from './useChatState';
import { useChatActions } from './useChatActions';

export const useChat = ({
  initialMessages = [],
  currentUser,
  contact,
  enableVoiceMessages = true,
  enableTypingIndicators = true,
  onMessageCreated,
  onReplyAdded,
  onMessageDeleted,
  onMessagePinned,
  onMessageReported
}) => {
  const messagesEndRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [reportedMessages, setReportedMessages] = useState([]);
  // 🔥 REMOVED: pinnedMessages state to avoid potential update loops; compute with useMemo instead
  const [notificationSettings, setNotificationSettings] = useState({
    muted: false,
    notifications: true
  });
  const [editingMessageId, setEditingMessageId] = useState(null);

  console.log('useChat.js: inputs:', { currentUser, contact });

  // 🔥 FIXED: Use useMemo to stabilize object references and prevent unnecessary re-renders
  const stateCurrentUser = useMemo(() => {
    if (!currentUser) return null;
    return {
      uid: currentUser.id,
      ...currentUser
    };
  }, [currentUser]);

  const stateContact = useMemo(() => {
    if (!contact) return null;
    return {
      uid: contact.id || contact.uid,
      ...contact
    };
  }, [contact]);

  // 🔥 FIXED: Ensure initialMessages is always an array
  const safeInitialMessages = Array.isArray(initialMessages) ? initialMessages : [];

  const {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    isTyping,
    setIsTyping,
    replyingTo,
    setReplyingTo,
    chatWallpaper,
    setChatWallpaper,
    markRead,
  } = useChatState({
    initialMessages: safeInitialMessages,
    currentUser: stateCurrentUser,
    contact: stateContact,
    initialWallpaper: 'default'
  });

  // Prefill reply footer from DM intent if present and matches this contact
  useEffect(() => {
    if (!stateContact?.uid) return;
    let raw;
    try { raw = localStorage.getItem('chat_dm_intent'); } catch (_) {}
    if (!raw) return;
    let intent = null;
    try { intent = JSON.parse(raw); } catch (_) {}
    if (!intent?.contactUid || intent.contactUid !== stateContact.uid) return;
    if (intent.quote) {
      setReplyingTo({
        id: intent.quote.id || intent.quote.messageId,
        text: intent.quote.text || '',
        senderName: intent.quote.senderName || '',
        timestamp: intent.quote.timestamp || Date.now(),
        groupId: intent.quote.groupId,
        groupName: intent.quote.groupName,
        fromGroup: true,
      });
    }
    try { localStorage.removeItem('chat_dm_intent'); } catch (_) {}
  }, [stateContact?.uid, setReplyingTo]);

  // 🔥 FIXED: Compute pinnedMessages with useMemo instead of useState + useEffect to derive from messages without state updates
  const pinnedMessages = useMemo(() => {
    const safeMessages = Array.isArray(messages) ? messages : [];
    return safeMessages.filter(m => m.isPinned).slice(-3).reverse();
  }, [messages]);

  const {
    handleSendMessage,
    handleFileUpload,
    handleDeleteMessage,
    handleBatchDeleteMessages,
    scrollToBottom,
    clearChat,
    testDeleteSingleMessage,
    handleTogglePin,
    handleEditMessage,
  } = useChatActions({
    currentUser,
    contact,
    newMessage,
    setNewMessage,
    setMessages,
    messagesEndRef,
    replyingTo,
    setReplyingTo,
    editingMessageId,
    setEditingMessageId,
  });

  // 🔥 REMOVED: useEffect for logging returning functions (debug only, can cause unnecessary runs if deps unstable)

  // 🔥 UPDATED: Guard against non-array messages
  const safeMessages = Array.isArray(messages) ? messages : [];
  const filteredMessages = searchQuery
    ? safeMessages.filter((message) =>
        message.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : safeMessages;

  const handleSendVoiceMessage = useCallback(() => {
   console.log('useChat.js: handleSendVoiceMessage: Not implemented');
  }, []);

  const startRecording = useCallback(() => {
    setIsRecording(true);
   console.log('useChat.js: startRecording: Started');
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingTime(0);
   console.log('useChat.js: stopRecording: Stopped');
  }, []);

  const handleMessageClick = useCallback((message, isNavigation = false) => {
    if (isNavigation) {
      const el = document.getElementById(`message-${message.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-message');
        setTimeout(() => el.classList.remove('highlight-message'), 2000);
      }
     console.log('useChat.js: Navigated to message:', { messageId: message.id });
      return;
    }
    setSelectedMessage(message);
   console.log('useChat.js: handleMessageClick:', { messageId: message.id });
  }, []);

  const handleReactToMessage = useCallback((messageId, reaction) => {
   console.log('useChat.js: handleReactToMessage:', { messageId, reaction });
  }, []);

  const handleReplyToMessage = useCallback(
    (message) => {
      setReplyingTo(message);
      scrollToBottom();
     console.log('useChat.js: handleReplyToMessage:', { messageId: message.id });
    },
    [scrollToBottom, setReplyingTo]
  );

  const handleDeleteMessageForEveryone = useCallback(
    (messageId) => {
     console.log('useChat.js: handleDeleteMessageForEveryone:', { messageId });
      handleDeleteMessage(messageId);
    },
    [handleDeleteMessage]
  );

  const toggleMessageExpand = useCallback((messageId) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
   console.log('useChat.js: toggleMessageExpand:', { messageId });
  }, []);

  const togglePinMessage = useCallback((messageId) => {
    handleTogglePin(messageId);
   console.log('useChat.js: togglePinMessage:', { messageId });
  }, [handleTogglePin]);

  const handleEditSave = useCallback((messageId, newText) => {
    handleEditMessage(messageId, newText);
    setNewMessage(''); 
  }, [handleEditMessage, setNewMessage]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setNewMessage(''); 
  }, [setEditingMessageId, setNewMessage]);

  const reportMessage = useCallback((messageId) => {
    setReportedMessages((prev) => [...prev, messageId]);
   console.log('useChat.js: reportMessage:', { messageId });
  }, []);

  const exportChat = useCallback(() => {
   console.log('useChat.js: exportChat: Not implemented');
  }, []);

  // Mark visible messages as read (batched, on scroll/view) - triggers API for WS
  useEffect(() => {
    const safeMessages = Array.isArray(messages) ? messages : [];
    const visibleIds = safeMessages.filter(m => m.status !== 'read' && m.sender !== currentUser?.id).map(m => m.id);
    if (visibleIds.length > 0) {
      markRead(visibleIds);
    }
  }, [messages, currentUser?.id, markRead]);

  if (!currentUser || !contact) {
    console.log('useChat.js: Early return - missing currentUser or contact');
    return {
      messages: [],
      setMessages: () => {},
      newMessage: '',
      setNewMessage: () => {},
      isTyping: false,
      searchQuery,
      showSearch,
      selectedMessage: null,
      showMessageActions: false,
      isRecording: false,
      isOnline: true,
      recordingTime: 0,
      replyingTo: null,
      expandedMessages: {},
      reportedMessages: [],
      pinnedMessages: [],  // 🔥 Computed as empty during loading
      notificationSettings,
      filteredMessages: [],  // 🔥 Ensure array
      editingMessageId: null,
      messagesEndRef,
      setSearchQuery,
      setShowSearch: () => {},
      setShowMessageActions: () => {},
      setReplyingTo: () => {},
      setEditingMessageId: () => {},
      setChatWallpaper: () => {},
      handleSendMessage: () => {},
      handleSendVoiceMessage,
      startRecording,
      stopRecording,
      handleFileUpload: () => {},
      handleMessageClick: () => {},
      handleReactToMessage: () => {},
      handleReplyToMessage: () => {},
      handleDeleteMessage: () => {},
      handleDeleteMessageForEveryone: () => {},
      toggleMessageExpand,
      togglePinMessage: () => {},
      reportMessage: () => {},
      clearChat: () => {},
      testDeleteSingleMessage: () => {},
      handleBatchDeleteMessages: () => {},
      exportChat,
      scrollToBottom: () => {},
      markRead: () => {},
    };
  }

  return {
    messages,
    setMessages,
    newMessage,
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
    pinnedMessages,  // 🔥 Now computed via useMemo
    notificationSettings,
    filteredMessages,
    editingMessageId,
    messagesEndRef,
    setNewMessage,
    setSearchQuery,
    setShowSearch,
    setShowMessageActions,
    setReplyingTo,
    setEditingMessageId,
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
    handleEditSave,
    handleCancelEdit,
    reportMessage,
    clearChat,
    testDeleteSingleMessage,
    handleBatchDeleteMessages,
    exportChat,
    scrollToBottom,
    markRead,
  };
};