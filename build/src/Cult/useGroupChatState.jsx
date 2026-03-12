import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  updateDoc,
  writeBatch,
  doc,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useSharedWebSocket } from '../Cult/WebSocketProvider';
import { useFCMToken } from '../hooks/useFCMToken';
import { subscribeToGroupTopic, unsubscribeFromGroupTopic } from '../KissMe/utils/fcmTopics';
import { loadMyPrivacy } from '../utils/privacy';
import { cacheUtils } from "./cacheUtils";

const BACKEND_URL = "http://localhost:5000";
const WS_URL = "ws://localhost:5000";

export const useGroupChatState = ({
  groupId,
  currentUser, // { uid, name }
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
            timestamp: new Date(msg.timestamp)
          }));
          const filtered = hydrated.filter(msg => !((msg.deletedBy || []).includes(currentUser?.uid)));
          console.log(`💾 Loaded ${hydrated.length} cached messages for group ${groupId}`);
          return filtered;
        }
      } catch (error) {
        console.error('Error loading cached messages:', error);
      }
    }
    
    const safeInit = Array.isArray(initialMessages) ? initialMessages : [];
    return [...safeInit].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
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
      const ref = doc(db, 'groups', groupId, 'messages', messageId);
      const unsub = onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
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
          userId: currentUser.uid,
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
            userId: currentUser.uid,
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
          userId: currentUser.uid,
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
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
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
    if (!groupId || !currentUser?.uid || hasJoinedRef.current) return;

    console.log(`🔌 Joining group ${groupId} as ${currentUser.name}`);
    joinGroup(groupId, currentUser.uid, currentUser.name);
    hasJoinedRef.current = true;

    return () => {
      console.log(`🔌 Leaving group ${groupId}`);
      leaveGroup(groupId, currentUser.uid);
      hasJoinedRef.current = false;
      isSubscribedRef.current = false;
      // Cleanup poll listeners
      try {
        pollUnsubsRef.current.forEach((unsub) => { try { unsub(); } catch {} });
      } finally {
        pollUnsubsRef.current.clear();
      }
    };
  }, [groupId, currentUser?.uid, currentUser?.name, joinGroup, leaveGroup]);

  // Subscribe to FCM topic when token becomes available and user has joined
  useEffect(() => {
    if (!groupId || !currentUser?.uid) return;
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
  }, [groupId, currentUser?.uid, fcmToken]);

  // Load initial messages from Firestore
  useEffect(() => {
    if (!groupId || !isInitialLoadRef.current) return;

    const loadFromFirestore = async () => {
      try {
        console.log(`📜 Loading group messages from Firestore for ${groupId}`);
        const q = query(
          collection(db, 'groups', groupId, 'messages'),
          orderBy('timestamp', 'asc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        const loaded = snapshot.docs.map((doc) => {
          const data = doc.data();
          const normalizedReply = data.replyTo || data.replyingTo || null;
          return {
            id: doc.id,
            ...data,
            replyTo: normalizedReply,
            timestamp: data.timestamp?.toDate() || new Date(),
          };
        }).filter(msg => !(msg.deletedBy || []).includes(currentUser.uid));

        // Determine initial status based on readBy and groupMemberCount
        const totalMembers = groupMemberCount || null;
        const loadedWithStatus = loaded.map(m => {
          const readBy = m.readBy || [];
          const otherReaders = readBy.filter(id => id !== m.sender).length;
          const allRead = totalMembers ? (readBy.length >= totalMembers) : false;
          const status = otherReaders > 0 ? (allRead ? 'read' : 'delivered') : 'sent';
          return { ...m, status };
        });

        if (loadedWithStatus.length > 0) {
          const pollCount = loaded.filter(m => m.poll).length;
          console.log(`📜 Loaded ${loaded.length} group messages from Firestore (${pollCount} polls)`);
          if (pollCount > 0) {
            console.log('📊 Poll messages loaded:', loaded.filter(m => m.poll).map(m => ({
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
          const liveQ = query(
            collection(db, 'groups', groupId, 'messages'),
            orderBy('timestamp', 'asc'),
            limit(200)
          );
          msgsUnsubRef.current = onSnapshot(liveQ, (snap) => {
            const changes = snap.docChanges();
            if (!changes || changes.length === 0) return;
            setMessages((prev) => {
              let next = [...prev];
              for (const change of changes) {
                const d = change.doc.data();
                const msg = {
                  id: change.doc.id,
                  ...d,
                  replyTo: d.replyTo || d.replyingTo || null,
                  timestamp: d.timestamp?.toDate() || new Date(),
                };
                const isHiddenForMe = (msg.deletedBy || []).includes(currentUser?.uid);
                if (change.type === 'removed') {
                  next = next.filter(m => m.id !== msg.id);
                  continue;
                }
                if (isHiddenForMe) {
                  // Respect per-user deletion
                  next = next.filter(m => m.id !== msg.id);
                  continue;
                }
                const idx = next.findIndex(m => m.id === msg.id);
                if (idx === -1) {
                  // Remove any optimistic temporary messages that likely correspond to this server message
                  const filtered = next.filter(m => {
                    if (!m.id || typeof m.id !== 'string' || !m.id.startsWith('temp-')) return true; // keep non-temp
                    // only consider temps from same sender
                    if (m.sender !== msg.sender) return true;

                    // match by exact trimmed text when present
                    if (m.text && msg.text) {
                      if (m.text.trim() === msg.text.trim()) return false; // drop the temp
                      return true;
                    }

                    // match by poll question
                    if (m.poll && msg.poll) {
                      if ((m.poll.question || '').trim() === (msg.poll?.question || '').trim()) return false;
                      return true;
                    }

                    // match by file name
                    if (m.file && msg.file) {
                      if ((m.file.name || '') === (msg.file?.name || '')) return false;
                      return true;
                    }

                    // fallback: compare timestamps proximity (within 30s)
                    try {
                      const t1 = new Date(m.timestamp).getTime();
                      const t2 = new Date(msg.timestamp).getTime();
                      if (Math.abs(t1 - t2) <= 30000) return false;
                    } catch (e) {
                      // keep temp if unable to compare
                    }
                    return true;
                  });

                  next = filtered;
                  next.push(msg);
                } else {
                  // Update existing
                  next[idx] = { ...next[idx], ...msg };
                }
              }
              // Keep sorted asc by timestamp
              next.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              return next;
            });
          });
        } catch (e) {
          console.warn('Failed to attach live messages listener', e);
        }
      } catch (error) {
        console.error('Error loading group messages:', error);
      }
    };

    loadFromFirestore();
    return () => {
      if (msgsUnsubRef.current) {
        try { msgsUnsubRef.current(); } catch {}
        msgsUnsubRef.current = null;
      }
    };
  }, [groupId, currentUser?.uid, readReceiptsEnabled, attachPollListener, groupMemberCount]);
  

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
            replyTo: data.replyTo || data.replyingTo || null,
            timestamp: new Date(data.timestamp),
            poll: data.poll || null, // Include poll data if present
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
            const updated = [...prev, newMsg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            console.log(`💬 WS new group message: Added + sorted ${newMsg.id} from ${newMsg.senderName}${data.isPoll ? ' [POLL]' : ''}`);
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
            replyTo: msg.replyTo || msg.replyingTo || null,
            timestamp: new Date(msg.timestamp),
          })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
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
            return merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          });
        }
        break;

      case "messages_read":
        // Update read status for messages (only if for this group)
        if (data.chatId === groupId || data.groupId === groupId) {
          setMessages(prev => prev.map(msg => {
            if (!data.messageIds.includes(msg.id)) return msg;

            const readBySet = new Set([...(msg.readBy || []), data.userId]);
            const readBy = Array.from(readBySet);

            // Count readers excluding the sender
            const otherReadersCount = readBy.filter(id => id !== msg.sender).length;
            const totalMembers = groupMemberCount || null;
            const allRead = totalMembers ? (readBy.length >= totalMembers) : false;

            // Determine status:
            // - If at least one other member has read -> 'delivered' (double gray ticks)
            // - If all members have read -> 'read' (double blue ticks)
            // - Otherwise keep existing status (likely 'sent')
            let status = msg.status || 'sent';
            if (otherReadersCount > 0) {
              status = allRead ? 'read' : 'delivered';
            }

            return { ...msg, readBy, status };
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
  }, [lastJsonMessage, currentUser?.uid, groupId, attachPollListener, groupMemberCount]);

  // Send message
  const sendMessage = useCallback(async (text, media = null) => {
    if (!text?.trim() && !media) return;

    // Build optimistic message
    const optimisticId = `temp-${Date.now()}`;
    const now = new Date();
    const replyData = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.text || '',
      senderName: replyingTo.senderName || 'Unknown',
      file: replyingTo.file || null,
      audio: replyingTo.audio || null,
    } : null;

    const optimisticMsg = {
      id: optimisticId,
      sender: currentUser.uid,
      senderName: currentUser.name,
      text: text?.trim() || '',
      timestamp: now,
      status: 'sent', // show single tick immediately
      readBy: [currentUser.uid],
      deletedBy: [],
      reactions: {},
      replyTo: replyData,
    };

    // Optimistically add to UI and clear input immediately
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    setReplyingTo(null);

    // Optimistically update last message in list
    try {
      updateGroupLastMessage?.(groupId, { text: optimisticMsg.text, senderName: optimisticMsg.senderName, timestamp: now });
    } catch {}

    try {
      const response = await fetch(`${BACKEND_URL}/send-group-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          sender: currentUser.uid,
          senderName: currentUser.name,
          text: optimisticMsg.text,
          replyTo: replyData,
          replyingTo: replyData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send group message');
      }

      const result = await response.json();
      // Replace optimistic message with real ID and keep 'sent' status (no readers yet).
      // If the real message was already added by the live listener/WS, remove the optimistic temp message to avoid duplicates.
      setMessages(prev => {
        const hasReal = prev.some(m => m.id === result.messageId);
        if (hasReal) {
          // remove optimistic temp message
          return prev.filter(m => m.id !== optimisticId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        // otherwise rename the optimistic id to the real id
        return prev.map(m => m.id === optimisticId ? { ...m, id: result.messageId, status: 'sent' } : m).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
      console.log(`✅ Group message sent:`, result);

      // Stop typing (shared WS handles auto-stop; keep debounce to be safe)
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
      // Save poll to Firestore
      const pollMessage = {
        sender: currentUser.uid,
        senderName: currentUser.name,
        text: '', // Empty text for poll messages
        poll: poll, // Attach the poll object
        timestamp: serverTimestamp(),
        readBy: [],
        deletedBy: [],
        reactions: {},
      };

      const docRef = await addDoc(
        collection(db, 'groups', groupId, 'messages'),
        pollMessage
      );

      console.log(`📊 Poll sent:`, { pollId: docRef.id, question: poll.question });

      // Get the created document to get the actual timestamp
      const createdDoc = await getDoc(docRef);
      const createdData = createdDoc.data();
      
      // Add poll message to local state immediately with the poll data
      const newPollMessage = {
        id: docRef.id,
        sender: currentUser.uid,
        senderName: currentUser.name,
        text: '',
        poll: poll,
        timestamp: createdData.timestamp?.toDate() || new Date(),
        readBy: [],
        deletedBy: [],
        reactions: {},
      };

      // Add to local messages
      setMessages(prev => {
        const exists = prev.some(m => m.id === docRef.id);
        if (exists) return prev;
        return [...prev, newPollMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });

      // Notify via WebSocket (with full poll data)
      sendJsonMessage({
        type: 'new_message',
        chatId: groupId,
        userId: currentUser.uid,
        userName: currentUser.name,
        text: `📊 Poll: ${poll.question}`,
        messageId: docRef.id,
        isPoll: true,
        poll: poll, // Include the full poll data
        sender: currentUser.uid,
        senderName: currentUser.name,
        timestamp: new Date().toISOString(),
        readBy: [],
        deletedBy: [],
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
      const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
      
      // Get the current message document
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) {
        console.error('Poll message not found');
        return;
      }

      const messageData = messageDoc.data();
      const currentPoll = messageData.poll;
      
      if (!currentPoll) {
        console.error('Poll data not found in message');
        return;
      }

      console.log(`🗳️ Vote submitted for poll ${pollId}:`, selectedOptions);

      // Update poll options with new votes
      const updatedOptions = currentPoll.options.map(opt => {
        if (selectedOptions.includes(opt.id)) {
          const votes = opt.votes || [];
          // Check if user already voted for this option
          if (!votes.includes(currentUser.uid)) {
            return {
              ...opt,
              votes: [...votes, currentUser.uid],
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

      // Update Firestore
      await updateDoc(messageRef, {
        poll: updatedPoll
      });

      console.log(`✅ Poll vote saved to Firestore for message ${messageId}`);

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
        userId: currentUser.uid,
        userName: currentUser.name,
        pollId: pollId,
        selectedOptions: selectedOptions,
        updatedPoll: updatedPoll
      });

    } catch (error) {
      console.error("Error voting on poll:", error);
    }
  }, [groupId, currentUser, sendJsonMessage]);

  // Mark messages as read
  const markRead = useCallback(async (messageIds) => {
    if (!messageIds || messageIds.length === 0) return;
    if (!readReceiptsEnabled) { console.log('ℹ️ readReceipts off: skipping client read call'); return; }

    try {
      const response = await fetch(`${BACKEND_URL}/group-messages/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          messageIds,
          userId: currentUser.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark group messages as read');
      }

      console.log(`📖 Marked ${messageIds.length} group messages as read`);
    } catch (error) {
      console.error("Error marking group messages as read:", error);
    }
  }, [groupId, currentUser?.uid]);

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
