/**
 * useChatActions - Supabase Version
 * Handles all chat message actions (send, delete, edit, etc.)
 * Updated to use Supabase instead of Firebase
 */

import { useCallback, useRef } from "react";
import { MessageService } from "../Services/messageService";

const getChatId = (idA, idB) => {
  const logContext = {
    function: "getChatId",
    timestamp: new Date().toISOString(),
    idA,
    idB,
    types: { idA: typeof idA, idB: typeof idB },
  };

  if (!idA || !idB || typeof idA !== 'string' || typeof idB !== 'string') {
    console.error("useChatActions.js: getChatId: Invalid inputs", logContext);
    return null;
  }
  
  // Handle self-chat: if idA equals idB, use user-specific self-chat ID
  if (idA === idB) {
    const selfChatId = `yourself_${idA}`;
    console.log("useChatActions.js: getChatId: Self-chat detected", { ...logContext, chatId: selfChatId });
    return selfChatId;
  }
  
  if (idA.includes('_') || idB.includes('_')) {
    console.error("useChatActions.js: getChatId: UID contains '_', possible prior chatId misuse", logContext);
    return null;
  }
  
  const sorted = [String(idA), String(idB)].sort();
  const chatId = sorted.join('_');
  console.log("useChatActions.js: getChatId: Generated chatId", { ...logContext, sorted, chatId });
  return chatId;
};

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useChatActions = ({
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
}) => {
  const isSending = useRef(false);

  /**
   * Send a message via Supabase
   */
  const handleSendMessage = useCallback(async () => {
    const logContext = {
      function: "handleSendMessage",
      timestamp: new Date().toISOString(),
      currentUserId: currentUser?.id,
      contactId: contact?.id,
      newMessage: newMessage?.trim(),
      replyingToId: replyingTo ? replyingTo.id : null,
    };

    console.log("useChatActions.js: handleSendMessage: Starting", logContext);

    if (isSending.current) {
      console.warn("useChatActions.js: handleSendMessage: Already sending, aborting", logContext);
      return;
    }
    
    if (!newMessage?.trim()) {
      console.warn("useChatActions.js: handleSendMessage: Empty message, aborting", logContext);
      return;
    }
    
    if (!currentUser?.id || !contact?.id) {
      console.error("useChatActions.js: handleSendMessage: Missing IDs", logContext);
      return;
    }

    const chatId = getChatId(currentUser.id, contact.id);
    if (!chatId) {
      console.error("useChatActions.js: handleSendMessage: Invalid chatId", { ...logContext, chatId });
      return;
    }

    isSending.current = true;
    let optimisticId = null;

    try {
      // Create optimistic message for immediate UI feedback
      optimisticId = `temp_${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        chatId,
        senderId: currentUser.id,
        recipientId: contact.id,
        text: newMessage.trim(),
        content: newMessage.trim(),
        status: 'sending',
        isRead: false,
        timestamp: new Date(),
        replyToId: replyingTo?.id || null,
      };

      // Add optimistic message to UI
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      setReplyingTo(null);

      // Send via Supabase service
      const message = await MessageService.sendMessage(
        chatId,
        currentUser.id,
        contact.id,
        newMessage.trim(),
        {
          contentType: 'text',
          attachmentUrls: [],
          replyToId: replyingTo?.id || null
        }
      );

      console.log("useChatActions.js: handleSendMessage: Success", { ...logContext, messageId: message.id });

      // Replace optimistic message with real one
      setMessages(prev =>
        prev.map(m => m.id === optimisticId ? message : m)
      );

    } catch (error) {
      console.error("useChatActions.js: handleSendMessage: Error", { ...logContext, error: error.message });
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      
      // Show error to user if callback provided
      console.error("Failed to send message:", error.message);
    } finally {
      isSending.current = false;
    }
  }, [currentUser, contact, newMessage, replyingTo, setNewMessage, setReplyingTo, setMessages]);

  /**
   * Delete a message
   */
  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      console.log("useChatActions.js: handleDeleteMessage:", messageId);
      
      await MessageService.deleteMessage(messageId, currentUser.id);
      
      // Remove from UI
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      console.log("useChatActions.js: handleDeleteMessage: Success");
    } catch (error) {
      console.error("useChatActions.js: handleDeleteMessage: Error", error);
    }
  }, [currentUser.id, setMessages]);

  /**
   * Edit a message
   */
  const handleEditMessage = useCallback(async (messageId, newContent) => {
    try {
      console.log("useChatActions.js: handleEditMessage:", { messageId, newContent });
      
      const updated = await MessageService.editMessage(
        messageId,
        currentUser.id,
        newContent
      );
      
      setMessages(prev =>
        prev.map(m => m.id === messageId ? updated : m)
      );
      
      setEditingMessageId(null);
      console.log("useChatActions.js: handleEditMessage: Success");
    } catch (error) {
      console.error("useChatActions.js: handleEditMessage: Error", error);
    }
  }, [currentUser.id, setMessages, setEditingMessageId]);

  /**
   * Toggle pin message
   */
  const handleTogglePin = useCallback((messageId) => {
    try {
      console.log("useChatActions.js: handleTogglePin:", messageId);
      
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, isPinned: !m.isPinned }
            : m
        )
      );
    } catch (error) {
      console.error("useChatActions.js: handleTogglePin: Error", error);
    }
  }, [setMessages]);

  /**
   * Batch delete messages
   */
  const handleBatchDeleteMessages = useCallback(async (messageIds) => {
    try {
      console.log("useChatActions.js: handleBatchDeleteMessages:", messageIds);
      
      // Delete all selected messages
      await Promise.all(
        messageIds.map(id => MessageService.deleteMessage(id, currentUser.id))
      );
      
      // Remove from UI
      setMessages(prev =>
        prev.filter(m => !messageIds.includes(m.id))
      );
      
      console.log("useChatActions.js: handleBatchDeleteMessages: Success");
    } catch (error) {
      console.error("useChatActions.js: handleBatchDeleteMessages: Error", error);
    }
  }, [currentUser.id, setMessages]);

  /**
   * Scroll to bottom
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesEndRef]);

  /**
   * Clear entire chat
   */
  const clearChat = useCallback(async () => {
    try {
      console.log("useChatActions.js: clearChat: Clearing all messages");
      setMessages([]);
      console.log("useChatActions.js: clearChat: Success");
    } catch (error) {
      console.error("useChatActions.js: clearChat: Error", error);
    }
  }, [setMessages]);

  /**
   * Export chat as JSON
   */
  const exportChat = useCallback(() => {
    try {
      console.log("useChatActions.js: exportChat: Starting export");
      // Implementation can be added if needed
    } catch (error) {
      console.error("useChatActions.js: exportChat: Error", error);
    }
  }, []);

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(async (files) => {
    try {
      console.log("useChatActions.js: handleFileUpload: Uploading", files.length, "files");
      // File upload implementation
    } catch (error) {
      console.error("useChatActions.js: handleFileUpload: Error", error);
    }
  }, []);

  return {
    handleSendMessage,
    handleDeleteMessage,
    handleEditMessage,
    handleTogglePin,
    handleBatchDeleteMessages,
    scrollToBottom,
    clearChat,
    exportChat,
    handleFileUpload,
    testDeleteSingleMessage: handleDeleteMessage, // For backward compatibility
  };
};
