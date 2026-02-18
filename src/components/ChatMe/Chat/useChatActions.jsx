// Full useChatActions.js - Using Supabase only
import { useCallback, useRef } from "react";
import { supabase } from "../../../supabase";

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

/**
 * Normalize chat ID for Supabase queries
 * Converts 'yourself_<id>' format to a deterministic UUID
 * Regular chat IDs are converted to valid UUIDs as well
 */
const normalizeChatIdForSupabase = (chatId) => {
  if (!chatId) return null;
  
  // If starts with 'yourself_', extract the user ID and create deterministic UUID
  if (chatId.startsWith('yourself_')) {
    const userId = chatId.substring('yourself_'.length);
    return convertToValidUUID(userId);
  }
  
  // For regular chat IDs (id1_id2 format), try to convert to UUID
  // This handles test user IDs
  const normalized = convertToValidUUID(chatId);
  return normalized || chatId; // Fall back to original if conversion fails
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Helper: Convert test user IDs to deterministic UUIDs for development
// Once real Supabase Auth is set up, this won't be needed
// CRITICAL: Must be truly deterministic - same input always produces same output
function convertToValidUUID(userId) {
  if (!userId) return null;
  
  const userIdStr = String(userId);
  
  // If already a UUID, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdStr)) {
    return userIdStr;
  }
  
  // Convert string IDs to deterministic UUIDs using SHA-256 like hashing
  // This ensures same ID always produces same UUID consistently
  let hash = 0;
  for (let i = 0; i < userIdStr.length; i++) {
    const char = userIdStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Create a deterministic 32-character hex string from the hash
  // Use a second hash pass to fill remaining bits deterministically
  let secondHash = 0;
  for (let i = userIdStr.length - 1; i >= 0; i--) {
    const char = userIdStr.charCodeAt(i);
    secondHash = ((secondHash << 5) - secondHash) + char;
    secondHash = secondHash & secondHash;
  }
  
  // Combine hashes to create full UUID space (128 bits = 32 hex chars)
  const hashStr1 = Math.abs(hash).toString(16).padStart(16, '0');
  const hashStr2 = Math.abs(secondHash).toString(16).padStart(16, '0');
  const fullHex = (hashStr1 + hashStr2).slice(0, 32);
  
  // Format as valid UUID v4-like: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // The 4 in position 12 indicates version 4, and the y variant bits are fixed
  const variant = ((Math.abs(hash) >> 8) % 4 + 8).toString(16);
  
  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(13, 16)}-${variant}${fullHex.slice(17, 20)}-${fullHex.slice(20, 32)}`;
}

// Detect connection quality and adapt timeout accordingly
const getAdaptiveTimeout = () => {
  if (!navigator.connection) return 15000; // Default 15s
  
  const effectiveType = navigator.connection.effectiveType;
  // 4g: 8s, 3g: 15s, 2g/slow-2g: 30s
  const timeoutMap = {
    '4g': 8000,
    '3g': 15000,
    '2g': 30000,
    'slow-2g': 30000,
  };
  return timeoutMap[effectiveType] || 15000;
};

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

    // FIXED: Check for pending attachments from unified send
    let attachmentUrls = [];
    try {
      const pendingAttachments = sessionStorage.getItem('pendingAttachments');
      if (pendingAttachments) {
        const parsed = JSON.parse(pendingAttachments);
        attachmentUrls = parsed.map(att => att.url);
        sessionStorage.removeItem('pendingAttachments');
        console.log("useChatActions.js: handleSendMessage: Found pending attachments", { count: attachmentUrls.length });
      }
    } catch (e) {
      console.warn("useChatActions.js: handleSendMessage: Error parsing pending attachments:", e);
    }

    if (isSending.current) {
      console.warn("useChatActions.js: handleSendMessage: Already sending, aborting", logContext);
      return;
    }
    if (!newMessage?.trim() && attachmentUrls.length === 0) {
      console.warn("useChatActions.js: handleSendMessage: Empty message and no attachments, aborting", logContext);
      return;
    }
    if (!currentUser?.id || !contact?.id) {
      console.error("useChatActions.js: handleSendMessage: Missing IDs", logContext);
      return;
    }

    // CRITICAL FIX: Use actual conversation ID if available (from database)
    // Otherwise fall back to synthetic ID from user IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let chatIdForSend;
    let senderId = String(currentUser?.id || currentUser?.uid || '').trim();
    let receiverId = String(contact?.id || contact?.uid || '').trim();
    
    if (contact?.id && uuidRegex.test(String(contact.id))) {
      // contact.id is already a proper UUID from conversations table - use it directly
      console.log('[useChatActions] Using actual conversation UUID from contact.id:', contact.id);
      chatIdForSend = contact.id;
    } else {
      // Fallback: convert user IDs FIRST, before using them anywhere
      // This ensures optimistic message and backend send use same IDs throughout
      
      // Convert to valid UUIDs if needed (for test data like 'user1')
      // MUST happen before creating optimistic message so chatId is consistent
      senderId = convertToValidUUID(senderId);
      receiverId = convertToValidUUID(receiverId);
      
      console.log('DEBUG: User IDs converted early', {
        originalSender: currentUser?.id,
        originalReceiver: contact?.id,
        convertedSender: senderId,
        convertedReceiver: receiverId,
      });
      
      if (!senderId || !receiverId) {
        console.error("useChatActions.js: handleSendMessage: Invalid sender or receiver after conversion", {
          ...logContext,
          senderId,
          receiverId,
          currentUser,
          contact,
        });
        return;
      }

      // Calculate chatId using converted IDs (same as what backend will use)
      chatIdForSend = getChatId(senderId, receiverId);
    }
    
    if (!chatIdForSend) {
      console.error("useChatActions.js: handleSendMessage: Invalid chatId", { ...logContext, chatIdForSend });
      return;
    }

    isSending.current = true;
    let optimisticId = null;

    try {
      // REMOVED: Firebase disappearing message check - now using Supabase only
      let expiresAt = null;

      console.log("useChatActions.js: handleSendMessage: Preparing message", {
        ...logContext,
        chatIdForSend,
        apiBase: API_BASE,
        attachmentCount: attachmentUrls.length,
      });

      // FIXED: Optimistic timestamp as Date (matches parseTimestamp)
      optimisticId = Date.now().toString();
      const replyContext = replyingTo
        ? {
            id: replyingTo.id || replyingTo.messageId || null,
            text: replyingTo.text || '',
            groupId: replyingTo.groupId || null,
            groupName: replyingTo.groupName || null,
            fromGroup: !!replyingTo.fromGroup,
          }
        : null;
      const optimisticMessage = {
        id: optimisticId,
        sender: senderId,  // FIXED: Use converted UUID so it matches database
        receiver: receiverId,  // FIXED: Use converted UUID so it matches database
        sender_id: senderId,
        recipient_id: receiverId,
        senderName: currentUser.name || currentUser.id,
        text: newMessage.trim(),
        content: newMessage.trim(),
        timestamp: new Date(),  // FIXED: Use Date for consistency
        created_at: new Date().toISOString(),
        replyingTo: replyingTo ? (replyingTo.id || replyingTo.messageId || null) : null,
        ...(replyContext ? { replyContext } : {}),
        status: "sent",
        readBy: [],
        deletedBy: [],
        isPinned: false,
        ...(expiresAt ? { expiresAt } : {}),
        // FIXED: Include attachments in optimistic message for unified send
        ...(attachmentUrls.length > 0 ? { 
          attachment_urls: attachmentUrls,
          content_type: 'message_with_attachments',
          metadata: {
            attachmentCount: attachmentUrls.length,
            uploadedAt: new Date().toISOString(),
          }
        } : {}),
      };

      console.log("useChatActions.js: handleSendMessage: Adding optimistic message to state", {
        ...logContext,
        optimisticMessage,
        chatIdForSend,
      });
      setMessages(prev => [...prev, optimisticMessage]);

      const requestBody = {
        chatId: chatIdForSend,
        senderId: senderId,
        recipientId: receiverId,
        content: newMessage.trim(),
        contentType: attachmentUrls.length > 0 ? 'message_with_attachments' : 'text',
        replyToId: replyingTo ? (replyingTo.id || replyingTo.messageId || null) : null,
        // FIXED: Include attachment URLs in unified send
        ...(attachmentUrls.length > 0 ? { 
          attachmentUrls,
          metadata: {
            attachmentCount: attachmentUrls.length,
            uploadedAt: new Date().toISOString(),
          }
        } : {}),
        // Only include fields that exist in database schema
        // Note: replyContext and expiresAt are not in the messages table, so excluded
      };

      console.log("useChatActions.js: handleSendMessage: Sending request to backend", {
        ...logContext,
        url: `${API_BASE}/api/messages/send`,
        requestBody,
      });

      // Add timeout for mobile reliability - adaptive timeout with retry
      const sendMessageWithRetry = async (maxRetries = 3) => {
        const timeout = getAdaptiveTimeout();
        const retryDelays = [1000, 2000, 4000]; // Exponential backoff
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            console.log(`useChatActions.js: handleSendMessage: Attempt ${attempt}/${maxRetries}, timeout=${timeout}ms`);

            const response = await fetch(`${API_BASE}/api/messages/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Client-Timestamp': Date.now().toString(),
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
              keepalive: true, // Keep connection open on mobile
            });

            clearTimeout(timeoutId);
            return response;
          } catch (err) {
            const timeoutId = setTimeout(() => {}, 0);
            clearTimeout(timeoutId);
            
            const isTimeout = err.name === 'AbortError';
            const isNetworkError = err instanceof TypeError;
            
            console.warn(`useChatActions.js: handleSendMessage: Attempt ${attempt} failed`, {
              error: err.message,
              isTimeout,
              isNetworkError,
              willRetry: attempt < maxRetries,
            });
            
            if (attempt === maxRetries) {
              throw err;
            }
            
            // Wait before retry (exponential backoff)
            const delay = retryDelays[Math.min(attempt - 1, retryDelays.length - 1)];
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      const response = await sendMessageWithRetry(3); // Retry up to 3 times

      console.log("useChatActions.js: handleSendMessage: Received response", {
        ...logContext,
        status: response.status,
        headers: [...response.headers.entries()],
      });

      const responseText = await response.text();
      console.log("useChatActions.js: handleSendMessage: Response body", {
        ...logContext,
        responseText,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }
        console.error("useChatActions.js: handleSendMessage: Backend error", {
          ...logContext,
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(`Backend error ${response.status}: ${errorData.error || responseText}`);
      }

      let responseData;
      try {
        // Check if response is HTML (which indicates an error page)
        if (responseText.trim().startsWith('<') || responseText.trim().startsWith('<!DOCTYPE')) {
          console.error("useChatActions.js: handleSendMessage: Received HTML instead of JSON", {
            ...logContext,
            responseSample: responseText.substring(0, 100),
          });
          throw new Error("Server returned HTML instead of JSON - this usually indicates a server error or misconfiguration");
        }
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("useChatActions.js: handleSendMessage: Failed to parse response as JSON", {
          ...logContext,
          error: e.message,
          responseSample: responseText.substring(0, 200),
        });
        throw new Error(`Failed to parse server response: ${e.message}`);
      }
      
      // FIXED: Handle both messageId and message.id from backend response
      const messageId = responseData.messageId || responseData.message?.id || responseData.id;
      
      if (!messageId) {
        console.error("useChatActions.js: handleSendMessage: No messageId in response", {
          ...logContext,
          responseData,
        });
        throw new Error("Backend response missing messageId");
      }

      console.log("useChatActions.js: handleSendMessage: Backend success", {
        ...logContext,
        responseData,
        messageId,
      });

      // FIXED: Instead of updating optimistic, reload all messages from Supabase
      // This ensures the message persisted correctly and appears in the correct format
      try {
        // Add small delay to allow Supabase to index the message
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("useChatActions.js: About to reload from Supabase", {
          ...logContext,
          chatIdForSend,
          senderId,
          receiverId,
        });

        let { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', normalizeChatIdForSupabase(chatIdForSend))
          .order('created_at', { ascending: true })
          .limit(100);

        console.log("useChatActions.js: Reload from Supabase returned", {
          ...logContext,
          chatIdForSend,
          messageCount: messages?.length,
          error: error?.message,
        });

        if (error) {
          console.error("useChatActions.js: Supabase reload error", {
            ...logContext,
            error: error.message,
          });
          // If reload fails, keep the optimistic message and log warning
          console.warn("useChatActions.js: Failed to reload from Supabase, keeping optimistic message");
          return; // Exit early, keep the optimistic message in state
        }

        if (!messages || messages.length === 0) {
          console.warn("useChatActions.js: Supabase reload returned no messages", {
            ...logContext,
            chatIdForSend,
          });
          // If no messages found, keep optimistic and retry once
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResult = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', normalizeChatIdForSupabase(chatIdForSend))
            .order('created_at', { ascending: true })
            .limit(100);
          
          if (retryResult.error || !retryResult.data?.length) {
            console.warn("useChatActions.js: Retry also failed, keeping optimistic message");
            return;
          }
          messages = retryResult.data;
        }

        const loaded = (messages || []).map((doc) => ({
          id: doc.id,
          ...doc,
          timestamp: new Date(doc.created_at),
          sender: doc.sender_id,
          receiver: doc.recipient_id,
          text: doc.content,
          // FIXED: Include attachment_urls and metadata for unified message rendering
          attachment_urls: doc.attachment_urls || [],
          metadata: doc.metadata || {},
          content_type: doc.content_type || 'text',
        }));
        const sorted = [...loaded].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        console.log("useChatActions.js: Message mapping complete", {
          ...logContext,
          loadedCount: loaded.length,
          firstMessage: loaded[0] ? {
            id: loaded[0].id,
            sender: loaded[0].sender,
            receiver: loaded[0].receiver,
          } : null,
          lastMessage: loaded[loaded.length - 1] ? {
            id: loaded[loaded.length - 1].id,
            sender: loaded[loaded.length - 1].sender,
            receiver: loaded[loaded.length - 1].receiver,
          } : null,
        });
        
        setMessages(sorted);
        console.log("useChatActions.js: Reloaded messages from Supabase after send", { count: sorted.length });
      } catch (err) {
        console.error("useChatActions.js: Failed to reload from Supabase (exception)", {
          ...logContext,
          error: err.message,
          stack: err.stack,
        });
        // Keep the optimistic message if reload fails
        console.warn("useChatActions.js: Keeping optimistic message due to reload failure");
      }

      setNewMessage("");
      setReplyingTo(null);
      setTimeout(() => {
        console.log("useChatActions.js: handleSendMessage: Scrolling to bottom", logContext);
        messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("useChatActions.js: handleSendMessage: Failed", {
        ...logContext,
        error: err.message,
        stack: err.stack,
        optimisticId,
      });

      // Save failed message to queue for retry on mobile
      const isNetworkError = err.message.includes('timeout') || 
                              err.message.includes('Failed to fetch') ||
                              err.message.includes('NetworkError');
      
      if (isNetworkError && currentUser?.id && contact?.id) {
        try {
          const messageQueue = JSON.parse(localStorage.getItem('chatMessageQueue') || '{}');
          const queueKey = `${currentUser.id}_${contact.id}`;
          
          if (!messageQueue[queueKey]) {
            messageQueue[queueKey] = [];
          }
          
          messageQueue[queueKey].push({
            sender: currentUser.id,
            receiver: contact.id,
            text: newMessage.trim(),
            replyingTo: replyingTo ? (replyingTo.id || replyingTo.messageId || null) : null,
            timestamp: Date.now(),
            attempts: 0,
          });
          
          localStorage.setItem('chatMessageQueue', JSON.stringify(messageQueue));
          console.log('useChatActions.js: handleSendMessage: Queued message for retry', {
            ...logContext,
            queueKey,
            queueLength: messageQueue[queueKey].length,
          });
          
          // Show toast about queued message
          alert(`Message queued. Will send when connection is restored.`);
        } catch (e) {
          console.warn('Failed to queue message:', e);
        }
      }

      // Rollback optimistic update
      if (optimisticId) {
        console.log("useChatActions.js: handleSendMessage: Rolling back optimistic update", {
          ...logContext,
          optimisticId,
        });
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
      }

      alert(`Failed to send: ${err.message}`);
    } finally {
      isSending.current = false;
      console.log("useChatActions.js: handleSendMessage: Completed", logContext);
    }
  }, [newMessage, currentUser?.id, contact?.id, replyingTo, setNewMessage, setReplyingTo, messagesEndRef, setMessages]);

  const handleFileUpload = useCallback(async (file, options = {}) => {
    const { skipMessageCreation = false } = options;
    const logContext = {
      function: "handleFileUpload",
      timestamp: new Date().toISOString(),
      currentUserId: currentUser?.id,
      contactId: contact?.id,
      fileName: file?.name,
      fileType: file?.type,
      skipMessageCreation,
    };

    console.log("useChatActions.js: handleFileUpload: Starting", logContext);

    if (!file || !currentUser?.id || !contact?.id) {
      console.error("useChatActions.js: handleFileUpload: Missing file or IDs", logContext);
      throw new Error("Missing file or user IDs");
    }

    const chatId = getChatId(currentUser.id, contact.id);
    if (!chatId) {
      console.error("useChatActions.js: handleFileUpload: Invalid chatId", { ...logContext, chatId });
      throw new Error("Invalid chat ID");
    }

    try {
      // Step 1: Upload file to Supabase Storage
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 10);
      const storagePath = `chat-files/${chatId}/${timestamp}_${randomId}_${file.name}`;

      console.log("useChatActions.js: handleFileUpload: Uploading file to storage", {
        ...logContext,
        storagePath,
        fileSize: file.size,
      });

      const { data: storageData, error: storageError } = await supabase.storage
        .from('chat-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        });

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // Step 2: Get public URL from storage
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(storagePath);

      const fileURL = urlData?.publicUrl || `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/chat-files/${storagePath}`;

      console.log("useChatActions.js: handleFileUpload: File uploaded, getting URL", {
        ...logContext,
        fileURL,
      });

      // FIXED: If skipMessageCreation is true, just return the URL without creating a message
      // This is used when sending files together with text as a unified message
      if (skipMessageCreation) {
        console.log("useChatActions.js: handleFileUpload: Skipping message creation, returning URL only", logContext);
        return {
          fileURL: fileURL,
          filePath: storagePath,
        };
      }

      // Step 3: Determine if this is an image for inline display
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');

      // Step 4: Create message object with proper structure for both storage and display
      const message = {
        sender_id: currentUser.id,
        // If contact.id is from conversations table, use it directly. Otherwise use the normalized chat ID
        chat_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contact?.id || '')
          ? contact.id
          : normalizeChatIdForSupabase(chatId),
        content: `[File] ${file.name}`,
        content_type: isImage ? 'image' : (isVideo ? 'video' : (isAudio ? 'audio' : 'file')),
        attachment_urls: [fileURL],
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          filePath: storagePath,
          uploadedAt: new Date().toISOString(),
        },
        status: "sent",
      };

      console.log("useChatActions.js: handleFileUpload: Preparing to save message", {
        ...logContext,
        messageId: undefined,
        storagePath,
        contentType: message.content_type,
      });

      // Step 5: Save message to database
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select();

      if (error) {
        throw new Error(`Message insert failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned after message insert");
      }

      console.log("useChatActions.js: handleFileUpload: Message saved to Supabase", {
        ...logContext,
        messageId: data?.[0]?.id,
      });

      // Step 6: Add message to local state for immediate display
      if (typeof setMessages === 'function' && data?.[0]) {
        setMessages((prev) => [...prev, data[0]]);
        console.log("useChatActions.js: handleFileUpload: Message added to local state", {
          ...logContext,
          messageId: data?.[0]?.id,
        });
      }

      return {
        messageId: data?.[0]?.id,
        fileURL: fileURL,
        filePath: storagePath,
      };
    } catch (err) {
      console.error("useChatActions.js: handleFileUpload: Failed", {
        ...logContext,
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }, [currentUser?.id, contact?.id, setMessages]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    const logContext = {
      function: "handleDeleteMessage",
      timestamp: new Date().toISOString(),
      currentUserId: currentUser?.id,
      contactId: contact?.id,
      messageId,
    };

    console.log("useChatActions.js: handleDeleteMessage: Starting", logContext);

    if (!currentUser?.id || !contact?.id || !messageId) {
      console.error("useChatActions.js: handleDeleteMessage: Missing parameters", logContext);
      return;
    }
    if (typeof setMessages !== 'function') {
      console.error("useChatActions.js: handleDeleteMessage: setMessages is not a function", { ...logContext, setMessages });
      return;
    }

    try {
      console.log("useChatActions.js: handleDeleteMessage: Fetching message", {
        ...logContext,
        messageId,
      });

      // FIXED: Skip optimistic message IDs (timestamps) - only delete from DB if it's a valid UUID
      const validUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!validUuidRegex.test(String(messageId))) {
        console.log("useChatActions.js: handleDeleteMessage: Skipping optimistic message deletion (no DB entry)", {
          ...logContext,
          messageId,
        });
        // Still remove from state for UI
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return;
      }

      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError || !messageData) {
        console.error("useChatActions.js: handleDeleteMessage: Message does not exist", logContext);
        return;
      }

      console.log("useChatActions.js: handleDeleteMessage: Message data", {
        ...logContext,
        messageData,
      });

      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) {
        throw deleteError;
      }

      console.log("useChatActions.js: handleDeleteMessage: Permanently deleted message", {
        ...logContext,
      });

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      console.log("useChatActions.js: handleDeleteMessage: Removed message from state", logContext);
    } catch (err) {
      console.error("useChatActions.js: handleDeleteMessage: Failed", {
        ...logContext,
        error: err.message,
        stack: err.stack,
      });
    }
  }, [currentUser?.id, contact?.id, setMessages]);

  const handleBatchDeleteMessages = useCallback(async (messageIds) => {
    const logContext = {
      function: "handleBatchDeleteMessages",
      timestamp: new Date().toISOString(),
      currentUserId: currentUser?.id,
      contactId: contact?.id,
      messageIds,
    };

    console.log("useChatActions.js: handleBatchDeleteMessages: Starting", logContext);

    if (!currentUser?.id || !contact?.id || !messageIds?.length) {
      console.error("useChatActions.js: handleBatchDeleteMessages: Missing parameters", logContext);
      throw new Error("Missing user, contact, or message IDs");
    }

    try {
      // FIXED: Filter out optimistic message IDs (timestamps) and only keep valid UUIDs
      const validUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validMessageIds = messageIds.filter(id => validUuidRegex.test(String(id)));
      
      if (!validMessageIds.length) {
        console.log("useChatActions.js: handleBatchDeleteMessages: No valid UUID messages to delete (likely optimistic messages)", logContext);
        throw new Error("No valid messages to delete (all are optimistic/unsaved)");
      }

      const { data: existingMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id')
        .in('id', validMessageIds);

      if (fetchError) {
        throw fetchError;
      }

      const existingIds = new Set(existingMessages?.map(m => m.id) || []);
      const existingMessageIds = messageIds.filter(id => existingIds.has(id));
      const nonExistentIds = messageIds.filter(id => !existingIds.has(id));

      console.log("useChatActions.js: handleBatchDeleteMessages: Valid messages", {
        ...logContext,
        validMessageIds: existingMessageIds,
        nonExistentIds,
      });

      if (existingMessageIds.length === 0) {
        console.log("useChatActions.js: handleBatchDeleteMessages: No valid messages to delete", logContext);
        return { deletedMessageIds: [] };
      }

      const updatePromises = existingMessageIds.map(messageId => {
        return supabase
          .from('messages')
          .delete()
          .eq('id', messageId);
      });

      const results = await Promise.all(updatePromises);
      const hasErrors = results.some(r => r.error);

      if (hasErrors) {
        const firstError = results.find(r => r.error)?.error;
        throw firstError;
      }

      console.log("useChatActions.js: handleBatchDeleteMessages: Updated batch", {
        ...logContext,
        batchSize: existingMessageIds.length,
      });

      setMessages((prev) => prev.filter((m) => !existingMessageIds.includes(m.id)));
      return { deletedMessageIds: existingMessageIds };
    } catch (err) {
      console.error("useChatActions.js: handleBatchDeleteMessages: Failed", {
        ...logContext,
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }, [currentUser?.id, contact?.id, setMessages]);

  const handleTogglePin = useCallback(async (messageId) => {
    const logContext = {
      function: "handleTogglePin",
      timestamp: new Date().toISOString(),
      currentUserId: currentUser?.id,
      contactId: contact?.id,
      messageId,
    };

    console.log("useChatActions.js: handleTogglePin: Starting", logContext);

    if (!currentUser?.id || !contact?.id || !messageId) {
      console.error("useChatActions.js: handleTogglePin: Missing parameters", logContext);
      return;
    }

    try {
      // FIXED: Skip optimistic message IDs (timestamps) - only pin in DB if it's a valid UUID
      const validUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!validUuidRegex.test(String(messageId))) {
        console.log("useChatActions.js: handleTogglePin: Skipping optimistic message (no DB entry)", {
          ...logContext,
          messageId,
        });
        return;
      }

      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('is_pinned')
        .eq('id', messageId)
        .single();

      if (fetchError || !messageData) {
        console.error("useChatActions.js: handleTogglePin: Message does not exist", logContext);
        return;
      }

      const currentPinned = messageData.is_pinned || false;
      console.log("useChatActions.js: handleTogglePin: Current pin status", {
        ...logContext,
        currentPinned,
      });

      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_pinned: !currentPinned })
        .eq('id', messageId);

      if (updateError) {
        throw updateError;
      }

      console.log("useChatActions.js: handleTogglePin: Updated pin status", {
        ...logContext,
        newPinnedStatus: !currentPinned,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_pinned: !currentPinned } : m))
      );
      console.log("useChatActions.js: handleTogglePin: Updated message state", logContext);
    } catch (err) {
      console.error("useChatActions.js: handleTogglePin: Failed", {
        ...logContext,
        error: err.message,
        stack: err.stack,
      });
    }
  }, [currentUser?.id, contact?.id, setMessages]);

  const handleEditMessage = useCallback(async (messageId, newText) => {
    const logContext = {
      function: "handleEditMessage",
      timestamp: new Date().toISOString(),
      currentUserId: currentUser?.id,
      contactId: contact?.id,
      messageId,
      newText: newText?.trim(),
    };

    console.log("useChatActions.js: handleEditMessage: Starting", logContext);

    if (!currentUser?.id || !contact?.id || !messageId || !newText?.trim()) {
      console.error("useChatActions.js: handleEditMessage: Missing parameters", logContext);
      return;
    }

    try {
      // FIXED: Skip optimistic message IDs (timestamps) - only edit in DB if it's a valid UUID
      const validUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!validUuidRegex.test(String(messageId))) {
        console.log("useChatActions.js: handleEditMessage: Skipping optimistic message edit (no DB entry)", {
          ...logContext,
          messageId,
        });
        // Still update in state for UI
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, text: newText.trim(), edited: true, edited_at: new Date() }
              : m
          )
        );
        setEditingMessageId(null);
        return;
      }

      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError || !messageData) {
        console.error("useChatActions.js: handleEditMessage: Message not found or not editable", logContext);
        return;
      }

      if (messageData.sender_id !== currentUser.id) {
        console.error("useChatActions.js: handleEditMessage: User not message sender", logContext);
        return;
      }

      console.log("useChatActions.js: handleEditMessage: Message data", {
        ...logContext,
        messageData,
      });

      const { error: updateError } = await supabase
        .from('messages')
        .update({
          content: newText.trim(),
          edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (updateError) {
        throw updateError;
      }

      console.log("useChatActions.js: handleEditMessage: Updated message in Supabase", logContext);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: newText.trim(), edited: true, edited_at: new Date() }
            : m
        )
      );
      console.log("useChatActions.js: handleEditMessage: Updated message state", logContext);
      setEditingMessageId(null);
    } catch (err) {
      console.error("useChatActions.js: handleEditMessage: Failed", {
        ...logContext,
        error: err.message,
        stack: err.stack,
      });
    }
  }, [currentUser?.id, contact?.id, setMessages, setEditingMessageId]);

  const scrollToBottom = useCallback(() => {
    console.log("useChatActions.js: scrollToBottom: Invoked", {
      function: "scrollToBottom",
      timestamp: new Date().toISOString(),
    });
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

  const clearChat = useCallback(async () => {
    const logContext = {
      function: "clearChat",
      timestamp: new Date().toISOString(),
      currentUserId: currentUser?.id,
      contactId: contact?.id,
    };

    console.log("useChatActions.js: clearChat: Starting", logContext);

    if (!currentUser?.id || !contact?.id) {
      console.error("useChatActions.js: clearChat: Missing user or contact ID", logContext);
      throw new Error("Missing user or contact ID");
    }
    const chatId = getChatId(currentUser.id, contact.id);
    if (!chatId) {
      console.error("useChatActions.js: clearChat: Invalid chatId", { ...logContext, chatId });
      throw new Error("Invalid chatId");
    }

    try {
      console.log("useChatActions.js: clearChat: Fetching messages", {
        ...logContext,
        chatId,
      });

      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('chat_id', normalizeChatIdForSupabase(chatId));

      if (fetchError) {
        throw fetchError;
      }

      console.log("useChatActions.js: clearChat: Messages fetched", {
        ...logContext,
        count: messages?.length || 0,
      });

      if (!messages || messages.length === 0) {
        console.log("useChatActions.js: clearChat: No messages to update", logContext);
        if (typeof setMessages === 'function') {
          setMessages([]);
        }
        return;
      }

      const updatePromises = messages.map(msg => 
        supabase
          .from('messages')
          .delete()
          .eq('id', msg.id)
      );

      const results = await Promise.all(updatePromises);
      const hasErrors = results.some(r => r.error);

      if (hasErrors) {
        const firstError = results.find(r => r.error)?.error;
        throw firstError;
      }

      console.log("useChatActions.js: clearChat: Updated all messages", {
        ...logContext,
        totalUpdated: messages.length,
      });

      if (typeof setMessages === 'function') {
        setMessages([]);
      }
      setNewMessage && setNewMessage("");
      setReplyingTo && setReplyingTo(null);
    } catch (err) {
      console.error("useChatActions.js: clearChat: Failed", {
        ...logContext,
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }, [currentUser?.id, contact?.id, setMessages, setNewMessage, setReplyingTo]);

  const testDeleteSingleMessage = useCallback(async () => {
    const logContext = {
      function: "testDeleteSingleMessage",
      timestamp: new Date().toISOString(),
      currentUserId: currentUser?.id,
      contactId: contact?.id,
    };

    try {
      if (!currentUser?.id || !contact?.id) {
        console.error("useChatActions.js: testDeleteSingleMessage: Missing currentUser or contact", logContext);
        return;
      }
      const chatId = getChatId(currentUser.id, contact.id);
      if (!chatId) {
        console.error("useChatActions.js: testDeleteSingleMessage: Invalid chatId", { ...logContext, chatId });
        return;
      }
      const messageId = "0nTuoPOpmzCE0Wy8HJMD";
      console.log("useChatActions.js: testDeleteSingleMessage: Fetching message", {
        ...logContext,
        messageId,
      });

      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError || !messageData) {
        console.error("useChatActions.js: testDeleteSingleMessage: Message does not exist", { ...logContext, messageId });
        return;
      }

      console.log("useChatActions.js: testDeleteSingleMessage: Message data", {
        ...logContext,
        messageData,
      });

      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) {
        throw deleteError;
      }

      console.log("useChatActions.js: testDeleteSingleMessage: Permanently deleted message", {
        ...logContext,
        messageId,
      });

      if (typeof setMessages === 'function') {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } else {
        console.error("useChatActions.js: testDeleteSingleMessage: setMessages is not a function", { ...logContext, setMessages });
      }
    } catch (err) {
      console.error("useChatActions.js: testDeleteSingleMessage: Failed", {
        ...logContext,
        error: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }, [currentUser?.id, contact?.id, setMessages]);

  return {
    handleSendMessage,
    handleFileUpload,
    handleDeleteMessage,
    handleBatchDeleteMessages,
    scrollToBottom,
    clearChat,
    testDeleteSingleMessage,
    handleTogglePin,
    handleEditMessage,
  };
};