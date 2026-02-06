// Full useChatActions.js - Unchanged
import { useCallback, useRef } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  getDocs,
  writeBatch,
  doc,
  getDoc,
// } from "firebase/firestore";
// Firebase imports removed - using Supabase instead
import { db } from "../firebase";

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

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

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

    // 🔥 FIXED: Use actual conversation ID if available (UUID from conversations table)
    // Otherwise fall back to synthetic ID from user IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let chatId;
    
    if (contact?.id && uuidRegex.test(String(contact.id))) {
      // contact.id is already a proper UUID from conversations table - use it directly
      console.log('[useChatActions] Using actual conversation UUID from contact.id:', contact.id);
      chatId = contact.id;
    } else {
      // Fallback: Generate from user IDs (legacy behavior)
      chatId = getChatId(currentUser.id, contact.id);
    }
    
    if (!chatId) {
      console.error("useChatActions.js: handleSendMessage: Invalid chatId", { ...logContext, chatId });
      return;
    }

    isSending.current = true;
    let optimisticId = null;

    try {
      // Read disappearing setting for this chat
      let expiresAt = null;
      try {
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        const days = Number((chatSnap.data() || {}).disappearingDurationDays || 0);
        if (Number.isFinite(days) && days > 0) {
          expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
      } catch (e) {
        // ignore
      }

      console.log("useChatActions.js: handleSendMessage: Preparing message", {
        ...logContext,
        chatId,
        apiBase: API_BASE,
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
        sender: currentUser.id,
        receiver: contact.id,
        senderName: currentUser.name || currentUser.id,
        text: newMessage.trim(),
        timestamp: new Date(),  // FIXED: Use Date for consistency
        replyingTo: replyingTo ? (replyingTo.id || replyingTo.messageId || null) : null,
        ...(replyContext ? { replyContext } : {}),
        status: "sent",
        readBy: [],
        deletedBy: [],
        isPinned: false,
        ...(expiresAt ? { expiresAt } : {}),
      };

      console.log("useChatActions.js: handleSendMessage: Adding optimistic message to state", {
        ...logContext,
        optimisticMessage,
      });
      setMessages(prev => [...prev, optimisticMessage]);

      // Backend call
      const requestBody = {
        sender: currentUser.id,
        receiver: contact.id,
        text: newMessage.trim(),
        replyingTo: replyingTo ? (replyingTo.id || replyingTo.messageId || null) : null,
        ...(replyContext ? { replyContext } : {}),
        ...(expiresAt ? { expiresAt: expiresAt.toISOString() } : {}),
      };

      console.log("useChatActions.js: handleSendMessage: Sending request to backend", {
        ...logContext,
        url: `${API_BASE}/send`,
        requestBody,
      });

      const response = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

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

      const responseData = JSON.parse(responseText);
      console.log("useChatActions.js: handleSendMessage: Backend success", {
        ...logContext,
        responseData,
        firestorePath: `chats/${chatId}/messages/${responseData.messageId}`,
      });

      // FIXED: Update optimistic with real ID + server timestamp (from response if avail, else keep client)
      // Assume backend sends full data; here update minimally
      setMessages(prev => prev.map(m =>
        m.id === optimisticId
          ? { ...m, id: responseData.messageId, status: 'delivered', timestamp: new Date() }  // FIXED: Refresh timestamp
          : m
      ));
      console.log("useChatActions.js: handleSendMessage: Updated message state with real ID", {
        ...logContext,
        messageId: responseData.messageId,
      });

      // Persist reply context to Firestore so it survives reloads
      if (replyContext && responseData.messageId) {
        try {
          const messageRef = doc(db, 'chats', chatId, 'messages', responseData.messageId);
          await updateDoc(messageRef, {
            replyContext,
            ...(replyingTo ? { replyingTo: replyContext.id || null } : {}),
          });
          console.log('useChatActions.js: handleSendMessage: Persisted replyContext to Firestore', {
            ...logContext,
            messageId: responseData.messageId,
          });
        } catch (e) {
          console.warn('useChatActions.js: handleSendMessage: Failed to persist replyContext (non-fatal)', e);
        }
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

  const handleFileUpload = useCallback(async (file) => {
    const logContext = {
      function: "handleFileUpload",
      timestamp: new Date().toISOString(),
      currentUserId: currentUser?.id,
      contactId: contact?.id,
      fileName: file?.name,
      fileType: file?.type,
    };

    console.log("useChatActions.js: handleFileUpload: Starting", logContext);

    if (!file || !currentUser?.id || !contact?.id) {
      console.error("useChatActions.js: handleFileUpload: Missing file or IDs", logContext);
      return;
    }

    const chatId = getChatId(currentUser.id, contact.id);
    if (!chatId) {
      console.error("useChatActions.js: handleFileUpload: Invalid chatId", { ...logContext, chatId });
      return;
    }

    try {
      const tempURL = URL.createObjectURL(file);
      const message = {
        sender: currentUser.id,
        receiver: contact.id,
        fileName: file.name,
        fileType: file.type,
        fileURL: tempURL,
        timestamp: new Date(),  // FIXED: Client Date
        status: "sent",
        readBy: [],
        deletedBy: [],
        isPinned: false,
      };
      console.log("useChatActions.js: handleFileUpload: Preparing to save message", {
        ...logContext,
        message,
        firestorePath: `chats/${chatId}/messages`,
      });

      const ref = collection(db, "chats", chatId, "messages");
      const docRef = await addDoc(ref, { ...message, timestamp: serverTimestamp() });
      console.log("useChatActions.js: handleFileUpload: Message saved to Firestore", {
        ...logContext,
        messageId: docRef.id,
        firestorePath: `chats/${chatId}/messages/${docRef.id}`,
      });

      await updateDoc(docRef, { status: "delivered" });
      console.log("useChatActions.js: handleFileUpload: Updated message status to delivered", {
        ...logContext,
        messageId: docRef.id,
      });
    } catch (err) {
      console.error("useChatActions.js: handleFileUpload: Failed", {
        ...logContext,
        error: err.message,
        stack: err.stack,
      });
    }
  }, [currentUser?.id, contact?.id]);

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
    const chatId = getChatId(currentUser.id, contact.id);
    if (!chatId) {
      console.error("useChatActions.js: handleDeleteMessage: Invalid chatId", { ...logContext, chatId });
      return;
    }

    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      console.log("useChatActions.js: handleDeleteMessage: Fetching message", {
        ...logContext,
        firestorePath: `chats/${chatId}/messages/${messageId}`,
      });

      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) {
        console.error("useChatActions.js: handleDeleteMessage: Message does not exist", logContext);
        return;
      }

      const messageData = messageSnap.data();
      console.log("useChatActions.js: handleDeleteMessage: Message data", {
        ...logContext,
        messageData,
      });

      const updatedDeletedBy = [...(messageData.deletedBy || []), currentUser.id];
      await updateDoc(messageRef, { deletedBy: updatedDeletedBy });
      console.log("useChatActions.js: handleDeleteMessage: Updated deletedBy", {
        ...logContext,
        updatedDeletedBy,
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
    const chatId = getChatId(currentUser.id, contact.id);
    if (!chatId) {
      console.error("useChatActions.js: handleBatchDeleteMessages: Invalid chatId", { ...logContext, chatId });
      throw new Error("Invalid chatId");
    }

    try {
      const existingMessages = await Promise.all(
        messageIds.map(async (messageId) => {
          const messageRef = doc(db, "chats", chatId, "messages", messageId);
          const messageSnap = await getDoc(messageRef);
          return {
            messageId,
            exists: messageSnap.exists(),
            data: messageSnap.exists() ? messageSnap.data() : null,
          };
        })
      );
      console.log("useChatActions.js: handleBatchDeleteMessages: Message existence check", {
        ...logContext,
        existingMessages,
      });

      const validMessageIds = existingMessages
        .filter((msg) => msg.exists)
        .map((msg) => msg.messageId);
      console.log("useChatActions.js: handleBatchDeleteMessages: Valid messages", {
        ...logContext,
        validMessageIds,
        nonExistentIds: messageIds.filter((id) => !validMessageIds.includes(id)),
      });

      if (validMessageIds.length === 0) {
        console.log("useChatActions.js: handleBatchDeleteMessages: No valid messages to delete", logContext);
        return { deletedMessageIds: [] };
      }

      const batch = writeBatch(db);
      validMessageIds.forEach((messageId) => {
        const messageRef = doc(db, "chats", chatId, "messages", messageId);
        const messageData = existingMessages.find((m) => m.messageId === messageId)?.data;
        batch.update(messageRef, {
          deletedBy: [...(messageData?.deletedBy || []), currentUser.id],
        });
      });
      console.log("useChatActions.js: handleBatchDeleteMessages: Prepared batch", {
        ...logContext,
        batchSize: validMessageIds.length,
      });

      await batch.commit();
      console.log("useChatActions.js: handleBatchDeleteMessages: Committed batch", {
        ...logContext,
        deletedMessageIds: validMessageIds,
      });

      setMessages((prev) => prev.filter((m) => !validMessageIds.includes(m.id)));
      return { deletedMessageIds: validMessageIds };
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
    const chatId = getChatId(currentUser.id, contact.id);
    if (!chatId) {
      console.error("useChatActions.js: handleTogglePin: Invalid chatId", { ...logContext, chatId });
      return;
    }

    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) {
        console.error("useChatActions.js: handleTogglePin: Message does not exist", logContext);
        return;
      }
      const currentPinned = messageSnap.data().isPinned || false;
      console.log("useChatActions.js: handleTogglePin: Current pin status", {
        ...logContext,
        currentPinned,
      });

      await updateDoc(messageRef, { isPinned: !currentPinned });
      console.log("useChatActions.js: handleTogglePin: Updated pin status", {
        ...logContext,
        newPinnedStatus: !currentPinned,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinned: !currentPinned } : m)) 
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
    const chatId = getChatId(currentUser.id, contact.id);
    if (!chatId) {
      console.error("useChatActions.js: handleEditMessage: Invalid chatId", { ...logContext, chatId });
      return;
    }

    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists() || messageSnap.data().sender !== currentUser.id) {
        console.error("useChatActions.js: handleEditMessage: Message not found or not editable", logContext);
        return;
      }
      console.log("useChatActions.js: handleEditMessage: Message data", {
        ...logContext,
        messageData: messageSnap.data(),
      });

      await updateDoc(messageRef, {
        text: newText.trim(),
        edited: true,
        editedAt: serverTimestamp(),
      });
      console.log("useChatActions.js: handleEditMessage: Updated message in Firestore", logContext);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, text: newText.trim(), edited: true, editedAt: new Date() }  // FIXED: Client Date
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
      const messagesRef = collection(db, "chats", chatId, "messages");
      console.log("useChatActions.js: clearChat: Fetching messages", {
        ...logContext,
        firestorePath: `chats/${chatId}/messages`,
      });

      let snapshot = await getDocs(messagesRef);
      console.log("useChatActions.js: clearChat: Snapshot details", {
        ...logContext,
        size: snapshot.size,
        docs: snapshot.docs.map((d) => ({
          id: d.id,
          sender: d.data().sender,
          text: d.data().text,
          timestamp: d.data().timestamp?.toDate()?.toISOString(),
        })),
      });

      if (snapshot.empty) {
        console.log("useChatActions.js: clearChat: No messages to update", logContext);
        if (typeof setMessages === 'function') {
          setMessages([]);
        } else {
          console.error("useChatActions.js: clearChat: setMessages is not a function", { ...logContext, setMessages });
        }
        return;
      }

      let totalUpdated = 0;
      while (!snapshot.empty) {
        const batch = writeBatch(db);
        const batchDocs = snapshot.docs.slice(0, 500);
        batchDocs.forEach((d) => {
          // console.log("useChatActions.js: clearChat: Queuing update for message", {
          //   ...logContext,
          //   messageId: d.id,
          //   sender: d.data().sender,
          // });
          batch.update(d.ref, {
            deletedBy: [...(d.data().deletedBy || []), currentUser.id],
          });
        });
        try {
          // console.log("useChatActions.js: clearChat: Committing batch", {
          //   ...logContext,
          //   batchSize: batchDocs.length,
          // });
          await batch.commit();
          totalUpdated += batchDocs.length;
          // console.log("useChatActions.js: clearChat: Committed batch", {
          //   ...logContext,
          //   batchSize: batchDocs.length,
          //   totalUpdated,
          // });
        } catch (batchErr) {
          // console.error("useChatActions.js: clearChat: Batch commit failed", {
          //   ...logContext,
          //   error: batchErr.message,
          //   stack: batchErr.stack,
          // });
          throw batchErr;
        }
        snapshot = await getDocs(messagesRef);
        // console.log("useChatActions.js: clearChat: Remaining messages", {
        //   ...logContext,
        //   remainingSize: snapshot.size,
        // });
      }
      // console.log("useChatActions.js: clearChat: Completed updating", {
      //   ...logContext,
      //   totalUpdated,
      // });

      if (typeof setMessages === 'function') {
        setMessages([]);
      } else {
        // console.error("useChatActions.js: clearChat: setMessages is not a function", { ...logContext, setMessages });
      }
      setNewMessage && setNewMessage("");
      setReplyingTo && setReplyingTo(null);
    } catch (err) {
      // console.error("useChatActions.js: clearChat: Failed", {
      //   ...logContext,
      //   error: err.message,
      //   stack: err.stack,
      // });
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

    // console.log("useChatActions.js: testDeleteSingleMessage: Starting", logContext);

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
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      console.log("useChatActions.js: testDeleteSingleMessage: Fetching message", {
        ...logContext,
        firestorePath: `chats/${chatId}/messages/${messageId}`,
      });

      const messageSnap = await getDoc(messageRef);
      if (messageSnap.exists()) {
        console.log("useChatActions.js: testDeleteSingleMessage: Message data", {
          ...logContext,
          messageData: messageSnap.data(),
        });
        await updateDoc(messageRef, {
          deletedBy: [...(messageSnap.data().deletedBy || []), currentUser.id],
        });
        console.log("useChatActions.js: testDeleteSingleMessage: Updated message", {
          ...logContext,
          messageId,
        });
        if (typeof setMessages === 'function') {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        } else {
          console.error("useChatActions.js: testDeleteSingleMessage: setMessages is not a function", { ...logContext, setMessages });
        }
      } else {
        console.error("useChatActions.js: testDeleteSingleMessage: Message does not exist", { ...logContext, messageId });
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