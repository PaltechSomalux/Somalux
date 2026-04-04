/**
 * useChat Hook - Supabase Version
 * Handles message state and operations using Supabase
 * Replaces Firebase Firestore listeners with Supabase real-time subscriptions
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { MessageService } from '../services/messageService';
import { useChatState } from './useChatState';
import { useChatActions } from './useChatActions_Supabase';

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
  const [notificationSettings, setNotificationSettings] = useState({
    muted: false,
    notifications: true
  });
  const [editingMessageId, setEditingMessageId] = useState(null);

  console.log('useChat.js: inputs:', { currentUser, contact });

  // Stabilize user and contact references
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

  // Ensure initialMessages is array
  const safeInitialMessages = Array.isArray(initialMessages) ? initialMessages : [];

  // Get state management
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

  // Get action handlers
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

  // Generate chat ID
  const chatId = useMemo(() => {
    if (!currentUser?.id || !contact?.id) return null;
    if (contact.id === currentUser.id) {
      return `yourself_${currentUser.id}`;
    }
    const sorted = [currentUser.id, contact.id].sort();
    return sorted.join('_');
  }, [currentUser?.id, contact?.id]);

  // Load initial messages from Supabase
  useEffect(() => {
    if (!chatId) return;

    const loadMessages = async () => {
      try {
        console.log('useChat: Loading initial messages for', chatId);
        const msgs = await MessageService.fetchMessages(chatId, { limit: 50 });
        setMessages(msgs);
      } catch (error) {
        console.error('useChat: Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [chatId, setMessages]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!chatId) return;

    console.log('useChat: Setting up real-time subscription for', chatId);

    const unsubscribe = MessageService.subscribeToMessages(
      chatId,
      (update) => {
        console.log('useChat: Received update:', update.type);

        switch (update.type) {
          case 'new_message':
            // Check if message already exists (avoid duplicates)
            setMessages(prev => {
              const exists = prev.some(m => m.id === update.message.id);
              if (exists) {
                console.log('useChat: Message already exists, skipping');
                return prev;
              }
              return [...prev, update.message];
            });
            onMessageCreated?.(update.message);
            break;

          case 'message_updated':
            setMessages(prev =>
              prev.map(m =>
                m.id === update.message.id ? update.message : m
              )
            );
            break;

          case 'message_deleted':
            setMessages(prev =>
              prev.filter(m => m.id !== update.messageId)
            );
            onMessageDeleted?.(update.messageId);
            break;

          default:
            console.log('useChat: Unknown update type:', update.type);
        }
      }
    );

    return unsubscribe;
  }, [chatId, setMessages, onMessageCreated, onMessageDeleted]);

  // Subscribe to typing indicators if enabled
  useEffect(() => {
    if (!chatId || !enableTypingIndicators) return;

    console.log('useChat: Setting up typing indicators for', chatId);

    const unsubscribe = MessageService.subscribeToTyping(
      chatId,
      (typing) => {
        console.log('useChat: Typing indicator:', typing);
        // Handle typing indicator updates here
      }
    );

    return unsubscribe;
  }, [chatId, enableTypingIndicators]);

  // Compute pinned messages
  const pinnedMessages = useMemo(() => {
    const safeMessages = Array.isArray(messages) ? messages : [];
    return safeMessages.filter(m => m.isPinned).slice(-3).reverse();
  }, [messages]);

  // Filter messages based on search
  const safeMessages = Array.isArray(messages) ? messages : [];
  const filteredMessages = searchQuery
    ? safeMessages.filter(message =>
        message.text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : safeMessages;

  // Voice message handlers
  const handleSendVoiceMessage = useCallback(() => {
    console.log('useChat: Voice messages not yet implemented');
  }, []);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    console.log('useChat: Started recording');
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingTime(0);
    console.log('useChat: Stopped recording');
  }, []);

  // Message click handler
  const handleMessageClick = useCallback((messageId) => {
    setSelectedMessage(messageId);
    setShowMessageActions(true);
  }, []);

  // Emoji reaction handler
  const handleReactToMessage = useCallback(async (messageId, emoji) => {
    try {
      await MessageService.addReaction(messageId, currentUser.id, emoji);
    } catch (error) {
      console.error('useChat: Failed to add reaction:', error);
    }
  }, [currentUser.id]);

  // Reply handler
  const handleReplyToMessage = useCallback((message) => {
    setReplyingTo({
      id: message.id,
      text: message.text || message.content,
      senderName: message.senderName || 'User',
      timestamp: message.timestamp,
    });
  }, [setReplyingTo]);

  // Delete message for recipient
  const handleDeleteMessageForEveryone = useCallback(async (messageId) => {
    try {
      await MessageService.deleteMessage(messageId, currentUser.id);
    } catch (error) {
      console.error('useChat: Failed to delete message:', error);
    }
  }, [currentUser.id]);

  // Toggle message expansion
  const toggleMessageExpand = useCallback((messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  }, []);

  // Toggle pin message
  const togglePinMessage = useCallback((messageId) => {
    handleTogglePin(messageId);
    onMessagePinned?.(messageId);
  }, [handleTogglePin, onMessagePinned]);

  // Report message
  const reportMessage = useCallback((messageId) => {
    setReportedMessages(prev => [...prev, messageId]);
    onMessageReported?.(messageId);
  }, [onMessageReported]);

  // Edit message handlers
  const handleEditSave = useCallback(async (messageId, newContent) => {
    try {
      await handleEditMessage(messageId, newContent);
    } catch (error) {
      console.error('useChat: Failed to edit message:', error);
    }
  }, [handleEditMessage]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  return {
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
    exportChat: clearChat,
    scrollToBottom,
    editingMessageId,
    setEditingMessageId,
    handleEditSave,
    handleCancelEdit,
    markRead,
  };
};
