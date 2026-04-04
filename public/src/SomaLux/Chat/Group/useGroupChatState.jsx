import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, groupService } from "../../../supabase";
import { useSharedWebSocket } from '../Group/WebSocketProvider';
import { useFCMToken } from '../hooks/useFCMToken';
import { subscribeToGroupTopic, unsubscribeFromGroupTopic } from '../ChatList/utils/fcmTopics';
import { loadMyPrivacy } from '../utils/privacy';
import { cacheUtils } from "./cacheUtils";
import { API_URL } from '../../../config';

// Derive WebSocket URL from API_URL
const getWebSocketURL = () => {
  const isSecure = API_URL.startsWith('https');
  const domain = API_URL.replace(/^https?:\/\//, '');
  return `${isSecure ? 'wss' : 'ws'}://${domain}`;
};

const BACKEND_URL = API_URL;
const WS_URL = getWebSocketURL();

export const useGroupChatState = ({
  groupId,
  currentUser, // { id, name }
  initialMessages = [],
  groupMemberCount = null,
}) => {
  const [messages, setMessages] = useState(() => {
    // Try to load from localStorage first for instant display
    if (groupId) {
      try {
        const cached = localStorage.getItem(cacheUtils.getMessagesKey(groupId));
        if (cached) {
          const parsed = JSON.parse(cached);
          const hydrated = parsed.map(msg => ({
            ...msg,
            created_at: new Date(msg.created_at)
          }));
          const filtered = hydrated.filter(msg => !((msg.deleted_by || []).includes(currentUser?.id)));
          console.log(`💾 Loaded ${hydrated.length} cached messages for group ${groupId}`);
          return filtered;
        }
      } catch (error) {
        console.error('Error loading cached messages:', error);
      }
    }
    
    const safeInit = Array.isArray(initialMessages) ? initialMessages : [];
    return [...safeInit].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  });
  
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const typingTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const hasJoinedRef = useRef(false);
  const isSubscribedRef = useRef(false);
  const pollUnsubsRef = useRef(new Map()); // messageId -> unsubscribe
  const msgsUnsubRef = useRef(null);

  const attachPollListener = useCallback((messageId) => {
    if (!groupId || !messageId) return;
    if (pollUnsubsRef.current.has(messageId)) return; // already listening
    try {
      const unsub = groupService.subscribeToMessage(groupId, messageId, (payload) => {
        if (!payload?.new) return;
        const data = payload.new;
        if (!data?.poll) return;
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, poll: data.poll } : m));
      });
      pollUnsubsRef.current.set(messageId, unsub);
    } catch (e) {
      console.warn('Failed to attach poll listener', messageId, e);
    }
  }, [groupId]);

  // Use shared WebSocket
  const { 
    sendJsonMessage, 
    lastJsonMessage, 
    readyState,
    typingUsers,
    setCurrentUser,
    joinGroup,
    leaveGroup,
    updateGroupLastMessage
  } = useSharedWebSocket();

  // Typing handling via shared WebSocket with debounce
  const handleTyping = useCallback((text) => {
    setNewMessage(text);
    if (!groupId || !currentUser) return;
    // Send typing_start when text present
    if (text && text.trim()) {
      // Inform others typing started
      try {
        sendJsonMessage({
          type: 'typing_start',
          chatId: groupId,
          userId: currentUser.id,
          userName: currentUser.name,
          isGroup: true,
        });
      } catch {}
      // Reset debounce timer to send stop later
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        try {
          sendJsonMessage({
            type: 'typing_stop',
            chatId: groupId,
            userId: currentUser.id,
            userName: currentUser.name,
            isGroup: true,
          });
        } catch {}
      }, 1500);
    } else {
      // Immediate stop when text cleared
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      try {
        sendJsonMessage({
          type: 'typing_stop',
          chatId: groupId,
          userId: currentUser.id,
          userName: currentUser.name,
          isGroup: true,
        });
      } catch {}
    }
  }, [groupId, currentUser, sendJsonMessage]);

  // Device FCM token for topic subscription
  const { token: fcmToken } = useFCMToken();

  // Read receipts flag from my privacy settings
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const me = await loadMyPrivacy();
        if (me && typeof me.readReceipts === 'boolean') setReadReceiptsEnabled(!!me.readReceipts);
      } catch (e) { /* ignore */ }
    })();
    const onPriv = (e) => {
      const all = e?.detail?.all;
      if (all && typeof all.readReceipts === 'boolean') setReadReceiptsEnabled(!!all.readReceipts);
    };
    window.addEventListener('privacy:updated', onPriv);
    return () => window.removeEventListener('privacy:updated', onPriv);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (groupId && messages.length > 0) {
      try {
        const serialized = messages.map(msg => ({
          ...msg,
          created_at: msg.created_at instanceof Date ? msg.created_at.toISOString() : msg.created_at
        }));
        localStorage.setItem(cacheUtils.getMessagesKey(groupId), JSON.stringify(serialized));
        console.log(`💾 Cached ${messages.length} messages for group ${groupId}`);
      } catch (error) {
        console.error('Error caching messages:', error);
        // If quota exceeded, clear expired caches
        if (error.name === 'QuotaExceededError') {
          cacheUtils.clearExpiredCaches();
        }
      }
    }
  }, [groupId, messages]);

  // Set current user and join group
  useEffect(() => {
    if (currentUser) {
      setCurrentUser(currentUser);
    }
  }, [currentUser, setCurrentUser]);

  // Join group on mount/when group changes; on cleanup leave
  useEffect(() => {
    if (!groupId || !currentUser?.id || hasJoinedRef.current) return;

    console.log(`🔌 Joining group ${groupId} as ${currentUser.name}`);
    joinGroup(groupId, currentUser.id, currentUser.name);
    hasJoinedRef.current = true;

    return () => {
      console.log(`🔌 Leaving group ${groupId}`);
      leaveGroup(groupId, currentUser.id);
      hasJoinedRef.current = false;
      isSubscribedRef.current = false;
      // Cleanup poll listeners
      try {
        pollUnsubsRef.current.forEach((unsub) => { try { unsub(); } catch {} });
      } finally {
        pollUnsubsRef.current.clear();
      }
    };
  }, [groupId, currentUser?.id, currentUser?.name, joinGroup, leaveGroup]);

  // Subscribe to FCM topic when token becomes available and user has joined
  useEffect(() => {
    if (!groupId || !currentUser?.id) return;
    if (!fcmToken) return; // wait for token
    if (!hasJoinedRef.current) return; // only subscribe if joined
    if (isSubscribedRef.current) return; // avoid duplicate

    (async () => {
      try {
        const res = await subscribeToGroupTopic(groupId, fcmToken);
        if (!res.ok) {
          console.warn('FCM topic subscribe failed:', res.error);
        } else {
          isSubscribedRef.current = true;
          console.log(`✅ Subscribed to FCM topic group_${groupId}`);
        }
      } catch (e) {
        console.warn('FCM topic subscribe error', e);
      }
    })();

    return () => {
      // best-effort unsubscribe when token/group changes while joined
      if (!isSubscribedRef.current) return;
      (async () => {
        try {
          const res = await unsubscribeFromGroupTopic(groupId, fcmToken);
          if (!res.ok) console.warn('FCM topic unsubscribe failed:', res.error);
        } catch (e) {
          console.warn('FCM topic unsubscribe error', e);
        } finally {
          isSubscribedRef.current = false;
        }
      })();
    };
  }, [groupId, currentUser?.id, fcmToken]);

  // Load initial messages from Supabase
  useEffect(() => {
    if (!groupId || !isInitialLoadRef.current) return;

    const loadFromSupabase = async () => {
      try {
        console.log(`📜 Loading group messages from Supabase for ${groupId}`);
        const loaded = await groupService.getMessages(groupId, 100);
        const mapped = loaded.map((data) => {
          const normalizedReply = data.reply_to || data.replyingTo || null;
          return {
            id: data.id,
            ...data,
            replyTo: normalizedReply,
            created_at: new Date(data.created_at),
          };
        }).filter(msg => !(msg.deleted_by || []).includes(currentUser.id));

        // Determine initial status based on read_by and groupMemberCount
        const totalMembers = groupMemberCount || null;
        const loadedWithStatus = mapped.map(m => {
          const readBy = m.read_by || [];
          const otherReaders = readBy.filter(id => id !== m.sender_id).length;
          const allRead = totalMembers ? (readBy.length >= totalMembers) : false;
          const status = otherReaders > 0 ? (allRead ? 'read' : 'delivered') : 'sent';
          return { ...m, status };
        });

        if (loadedWithStatus.length > 0) {
          const pollCount = mapped.filter(m => m.poll).length;
          console.log(`📜 Loaded ${mapped.length} group messages from Supabase (${pollCount} polls)`);
          if (pollCount > 0) {
            console.log('📊 Poll messages loaded:', mapped.filter(m => m.poll).map(m => ({
              id: m.id,
              question: m.poll?.question,
              options: m.poll?.options?.length
            })));
          }
          setMessages(loadedWithStatus);
          // Attach lightweight listeners for poll messages for real-time votes
          loadedWithStatus.filter(m => m.poll).forEach(m => attachPollListener(m.id));
        }
        isInitialLoadRef.current = false;

        // After initial load, attach a real-time listener for new/changed/removed messages
        try {
          msgsUnsubRef.current = groupService.subscribeToGroupMessages(groupId, (payload) => {
            const msg = {
              id: payload.new?.id || payload.old?.id,
              ...payload.new,
              replyTo: payload.new?.reply_to || payload.new?.replyingTo || null,
              created_at: new Date(payload.new?.created_at) || new Date(),
            };
            const isHiddenForMe = (msg.deleted_by || []).includes(currentUser?.id);
            
            if (payload.eventType === 'DELETE') {
              setMessages(prev => prev.filter(m => m.id !== msg.id));
              return;
            }
            
            if (isHiddenForMe) {
              setMessages(prev => prev.filter(m => m.id !== msg.id));
              return;
            }
            
            setMessages((prev) => {
              const idx = prev.findIndex(m => m.id === msg.id);
              if (idx === -1) {
                const filtered = prev.filter(m => {
                  if (!m.id || typeof m.id !== 'string' || !m.id.startsWith('temp-')) return true;
                  if (m.sender_id !== msg.sender_id) return true;
                  if (m.text && msg.text && m.text.trim() === msg.text.trim()) return false;
                  if (m.poll && msg.poll && (m.poll.question || '').trim() === (msg.poll?.question || '').trim()) return false;
                  if (m.file && msg.file && (m.file.name || '') === (msg.file?.name || '')) return false;
                  try {
                    const t1 = new Date(m.created_at).getTime();
                    const t2 = new Date(msg.created_at).getTime();
                    if (Math.abs(t1 - t2) <= 30000) return false;
                  } catch (e) {}
                  return true;
                });
                return [...filtered, msg].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              } else {
                prev[idx] = { ...prev[idx], ...msg };
                return [...prev];
              }
            });
          });
        } catch (e) {
          console.warn('Failed to attach live messages listener', e);
        }
      } catch (error) {
        console.error('Error loading group messages:', error);
      }
    };

    loadFromSupabase();
    return () => {
      if (msgsUnsubRef.current) {
        try { msgsUnsubRef.current(); } catch {}
        msgsUnsubRef.current = null;
      }
    };
  }, [groupId, currentUser?.id, readReceiptsEnabled, attachPollListener, groupMemberCount]);
  

  // Optimistic local reaction update to avoid extra reads and show immediately
  const reactToMessage = useCallback((messageId, userId, emoji) => {
    if (!messageId || !userId) return;
    setMessages(prev => {
      const next = prev.map(m => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        if (emoji) {
          // toggle if same emoji, otherwise set new
          if (reactions[userId] === emoji) {
            delete reactions[userId];
          } else {
            reactions[userId] = emoji;
          }
        } else {
          // Clear user's reaction
          delete reactions[userId];
        }
        const counts = {};
        Object.values(reactions).forEach(em => {
          counts[em] = (counts[em] || 0) + 1;
        });
        return { ...m, reactions, reactionsCounts: counts };
      });
      return next;
    });
  }, []);

  // Optimistically edit a message text locally (for current user's messages)
  const editMessageLocal = useCallback((messageId, newText) => {
    if (!messageId) return;
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText, edited: true } : m));
  }, []);

  // Optimistically mark messages deleted for current user
  const deleteForMeLocal = useCallback((messageIds, userId) => {
    if (!Array.isArray(messageIds) || messageIds.length === 0) return;
    setMessages(prev => prev.map(m => messageIds.includes(m.id)
      ? { ...m, deletedBy: Array.from(new Set([...(m.deletedBy || []), userId])) }
      : m
    ));
  }, []);

  // Optimistically remove messages locally for everyone (hard delete from local list)
  const deleteForEveryoneLocal = useCallback((messageIds) => {
    if (!Array.isArray(messageIds) || messageIds.length === 0) return;
    setMessages(prev => prev.filter(m => !messageIds.includes(m.id)));
  }, []);

  // Handle WebSocket messages (only for chat-specific messages)
  useEffect(() => {
    if (!lastJsonMessage) return;

    const { type, data } = lastJsonMessage;
    console.log(`📨 Group WS message: ${type}`, data);

    switch (type) {
      case "new_message":
        // Only process if it's for this group
        if (data.chatId === groupId || data.groupId === groupId) {
          const newMsg = {
            ...data,
            replyTo: data.reply_to || data.replyingTo || null,
            created_at: new Date(data.created_at),
            poll: data.poll || null,
          };
          
          if (data.isPoll || data.poll) {
            console.log(`📊 WS received poll message:`, { 
              id: newMsg.id, 
              question: data.poll?.question,
              hasFullPollData: !!data.poll
            });
            // Ensure we listen for subsequent vote updates
            attachPollListener(newMsg.id);
          }
          
          // Dedupe and add
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) {
              console.log(`💬 WS new group message: Deduped duplicate ${newMsg.id}`);
              return prev;
            }
            const updated = [...prev, newMsg].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            console.log(`💬 WS new group message: Added + sorted ${newMsg.id} from ${newMsg.sender_name}${data.isPoll ? ' [POLL]' : ''}`);
            return updated;
          });
        }
        break;

      case "recent_messages":
        // Only process if it's for this group
        if (data.chatId === groupId || data.groupId === groupId) {
          // CRITICAL FIX: Don't overwrite with empty array!
          if (!data || data.length === 0) {
            console.log(`📜 WS recent group messages: Empty, keeping existing ${messages.length} messages`);
            break;
          }
          
          const parsedRecent = data.map(msg => ({
            ...msg,
            reply_to: msg.reply_to || msg.replyingTo || null,
            created_at: new Date(msg.created_at),
          })).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          
          console.log(`📜 WS recent group messages loaded: ${parsedRecent.length}`);
          
          // Merge with existing messages (dedupe by ID)
          setMessages(prev => {
            const merged = [...prev];
            parsedRecent.forEach(newMsg => {
              const exists = merged.some(m => m.id === newMsg.id);
              if (!exists) {
                merged.push(newMsg);
              }
            });
            return merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          });
        }
        break;

      case "messages_read":
        // Update read status for messages (only if for this group)
        if (data.chatId === groupId || data.groupId === groupId) {
          setMessages(prev => prev.map(msg => {
            if (!data.messageIds.includes(msg.id)) return msg;

            const readBySet = new Set([...(msg.read_by || []), data.userId]);
            const read_by = Array.from(readBySet);

            // Count readers excluding the sender
            const otherReadersCount = read_by.filter(id => id !== msg.sender_id).length;
            const totalMembers = groupMemberCount || null;
            const allRead = totalMembers ? (read_by.length >= totalMembers) : false;

            // Determine status:
            // - If at least one other member has read -> 'delivered' (double gray ticks)
            // - If all members have read -> 'read' (double blue ticks)
            // - Otherwise keep existing status (likely 'sent')
            let status = msg.status || 'sent';
            if (otherReadersCount > 0) {
              status = allRead ? 'read' : 'delivered';
            }

            return { ...msg, read_by, status };
          }));
          console.log(`📖 WS group read receipts from ${data.userId}`);
        }
        break;

      case "poll_voted":
        // Real-time poll vote updates
        if (data.chatId === groupId || data.groupId === groupId) {
          console.log(`🗳️ WS poll vote update from ${data.userName}:`, {
            messageId: data.messageId,
            options: data.selectedOptions
          });
          
          setMessages(prev => prev.map(msg => {
            if (msg.id === data.messageId && data.updatedPoll) {
              return { ...msg, poll: data.updatedPoll };
            }
            return msg;
          }));
        }
        break;

      default:
        break;
    }
  }, [lastJsonMessage, currentUser?.id, groupId, attachPollListener, groupMemberCount]);

  // Send message
  const sendMessage = useCallback(async (text, media = null) => {
    if (!text?.trim() && !media) return;

    // Build optimistic message
    const optimisticId = `temp-${Date.now()}`;
    const now = new Date();
    const replyData = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.text || '',
      sender_name: replyingTo.sender_name || 'Unknown',
      file: replyingTo.file || null,
      media_urls: replyingTo.media_urls || null,
    } : null;

    const optimisticMsg = {
      id: optimisticId,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      text: text?.trim() || '',
      created_at: now,
      status: 'sent',
      read_by: [currentUser.id],
      deleted_by: [],
      reactions: {},
      reply_to: replyData,
    };

    // Optimistically add to UI and clear input immediately
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    setReplyingTo(null);

    // Optimistically update last message in list
    try {
      updateGroupLastMessage?.(groupId, { text: optimisticMsg.text, sender_name: optimisticMsg.sender_name, created_at: now });
    } catch {}

    try {
      await groupService.sendMessage(groupId, currentUser.id, optimisticMsg.text, media, {
        reply_to: replyData,
      });

      // Message will be added by real-time listener, so just remove optimistic temp
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      console.log(`✅ Group message sent`);

      // Stop typing
      typingTimeoutRef.current = setTimeout(() => {}, 1500);
    } catch (error) {
      console.error("Error sending group message:", error);
      // Mark optimistic message as failed
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, status: 'failed' } : m));
    }
  }, [groupId, currentUser, replyingTo, updateGroupLastMessage]);

  // Send poll
  const sendPoll = useCallback(async (poll) => {
    if (!poll) return;

    try {
      await groupService.sendMessage(groupId, currentUser.id, `📊 Poll: ${poll.question}`, null, {
        poll: poll,
        isPoll: true,
      });

      console.log(`📊 Poll sent:`, { question: poll.question });

      // Message will be added by real-time listener

      // Notify via WebSocket (with full poll data)
      sendJsonMessage({
        type: 'new_message',
        chatId: groupId,
        userId: currentUser.id,
        userName: currentUser.name,
        text: `📊 Poll: ${poll.question}`,
        isPoll: true,
        poll: poll,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        created_at: new Date().toISOString(),
        read_by: [],
        deleted_by: [],
        reactions: {}
      });

    } catch (error) {
      console.error("Error sending poll:", error);
    }
  }, [groupId, currentUser, sendJsonMessage]);

  // Vote on poll
  const votePoll = useCallback(async (messageId, pollId, selectedOptions) => {
    if (!messageId || !selectedOptions || selectedOptions.length === 0) return;

    try {
      // Get the current message
      const msg = messages.find(m => m.id === messageId);
      if (!msg || !msg.poll) {
        console.error('Poll message not found');
        return;
      }

      const currentPoll = msg.poll;

      console.log(`🗳️ Vote submitted for poll ${pollId}:`, selectedOptions);

      // Update poll options with new votes
      const updatedOptions = currentPoll.options.map(opt => {
        if (selectedOptions.includes(opt.id)) {
          const votes = opt.votes || [];
          // Check if user already voted for this option
          if (!votes.includes(currentUser.id)) {
            return {
              ...opt,
              votes: [...votes, currentUser.id],
              count: votes.length + 1
            };
          }
        }
        return opt;
      });

      // Calculate total votes
      const totalVotes = updatedOptions.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

      const updatedPoll = {
        ...currentPoll,
        options: updatedOptions,
        totalVotes: totalVotes
      };

      // Update via groupService
      await groupService.updateMessage(messageId, {
        poll: updatedPoll
      });

      console.log(`✅ Poll vote saved for message ${messageId}`);

      // Update local state optimistically
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, poll: updatedPoll };
        }
        return msg;
      }));

      // Notify via WebSocket for real-time updates
      sendJsonMessage({
        type: 'poll_voted',
        chatId: groupId,
        messageId: messageId,
        userId: currentUser.id,
        userName: currentUser.name,
        pollId: pollId,
        selectedOptions: selectedOptions,
        updatedPoll: updatedPoll
      });

    } catch (error) {
      console.error("Error voting on poll:", error);
    }
  }, [groupId, currentUser, sendJsonMessage, messages]);

  // Mark messages as read
  const markRead = useCallback(async (messageIds) => {
    if (!messageIds || messageIds.length === 0) return;
    if (!readReceiptsEnabled) { console.log('ℹ️ readReceipts off: skipping client read call'); return; }

    try {
      for (const messageId of messageIds) {
        await groupService.markMessageAsRead(messageId, currentUser.id);
      }

      console.log(`📖 Marked ${messageIds.length} group messages as read`);
    } catch (error) {
      console.error("Error marking group messages as read:", error);
    }
  }, [groupId, currentUser?.id]);

  return {
    messages,
    newMessage,
    setNewMessage,
    typingUsers, // { userId: userName }
    replyingTo,
    setReplyingTo,
    sendMessage,
    sendPoll,
    votePoll,
    handleTyping,
    markRead,
    reactToMessage,
    editMessageLocal,
    deleteForMeLocal,
    deleteForEveryoneLocal,
    wsReady: readyState === 1, // WebSocket.OPEN
  };
};
