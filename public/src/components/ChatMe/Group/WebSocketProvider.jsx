import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import useWebSocket from 'react-use-websocket';
import { useMobileDetection } from '../hooks/useMobileDetection';
import { showGlobalToast } from '../utils/toastBus';
import { supabase } from '../../../supabase';
import { subscribeToGroupTopic } from '../ChatList/utils/fcmTopics';
import { useFCMToken } from '../hooks/useFCMToken';
import { WEBSOCKET_URL } from '../config';

const WebSocketContext = createContext();

export const useSharedWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useSharedWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Typing management functions
export const useTypingManager = (groupId, currentUser) => {
  const { sendJsonMessage } = useSharedWebSocket();
  const typingTimeoutRef = useRef(null);

  const handleTyping = useCallback((text) => {
    if (!currentUser || !groupId) return;

    const userId = currentUser.id || currentUser.uid;

    // Send typing_start
    if (text.trim()) {
      sendJsonMessage({
        type: "typing_start",
        chatId: groupId,
        userId,
        userName: currentUser.name || currentUser.displayName,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        sendJsonMessage({
          type: "typing_stop",
          chatId: groupId,
          userId,
          userName: currentUser.name || currentUser.displayName,
        });
      }, 1500);
    } else {
      // Empty text - stop typing immediately
      sendJsonMessage({
        type: "typing_stop",
        chatId: groupId,
        userId,
        userName: currentUser.name || currentUser.displayName,
      });
    }
  }, [groupId, currentUser, sendJsonMessage]);

  return { handleTyping };
};

export const WebSocketProvider = ({ children }) => {
  const [typingUsers, setTypingUsers] = useState({}); // Global typing state
  const [unreadCounts, setUnreadCounts] = useState({}); // Global unread counts
  const [lastMessages, setLastMessages] = useState({}); // Global last messages { [groupId]: { text, senderName, timestamp } }
  const joinedGroupsRef = useRef(new Set());
  const pendingGroupsRef = useRef(new Set()); // Groups waiting to join when WS connects
  const currentUserRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const groupsListenerRef = useRef(null);
  const knownMemberGroupIdsRef = useRef(new Set());
  const { token: fcmToken } = useFCMToken();
  
  // Mobile detection for optimized connection handling
  const { isMobile, isSmallScreen } = useMobileDetection();

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WEBSOCKET_URL, {
    share: true, // Share connection across components
    shouldReconnect: (closeEvent) => {
      // More aggressive reconnection for mobile/small screens
      const maxAttempts = isMobile ? maxReconnectAttempts * 2 : maxReconnectAttempts;
      if (reconnectAttemptsRef.current < maxAttempts) {
        reconnectAttemptsRef.current++;
        console.log(`🔌 WebSocket reconnecting... attempt ${reconnectAttemptsRef.current}/${maxAttempts} (mobile: ${isMobile})`);
        return true;
      }
      console.log('🔌 WebSocket max reconnection attempts reached');
      return false;
    },
    reconnectAttempts: isMobile ? maxReconnectAttempts * 2 : maxReconnectAttempts,
    reconnectInterval: (attemptNumber) => {
      // Shorter intervals for mobile devices
      const baseInterval = isMobile ? 500 : 1000;
      const maxInterval = isMobile ? 5000 : 10000;
      const interval = Math.min(baseInterval * Math.pow(1.5, attemptNumber), maxInterval);
      console.log(`🔌 WebSocket reconnect interval: ${interval}ms (mobile: ${isMobile})`);
      return interval;
    },
    onOpen: () => {
      console.log('🔌 WebSocket connected successfully');
      reconnectAttemptsRef.current = 0;
      // Join per-user channel for global notifications
      const userId = currentUserRef.current?.id || currentUserRef.current?.uid;
      if (userId) {
        try {
          sendJsonMessage({ type: 'join_user', userId });
          // console.log(`👤 Joined user channel for ${userId}`);
        } catch {}
      }
    },
    onClose: (event) => {
      // console.log('🔌 WebSocket disconnected:', event.code, event.reason);
    },
    onError: (error) => {
      // console.error('🔌 WebSocket error:', error);
    },
  });

  // Handle visibility changes for mobile (background/foreground)
  useEffect(() => {
    if (!isMobile) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // console.log('📱 App went to background, maintaining WebSocket connection');
      } else {
        // console.log('📱 App came to foreground, ensuring WebSocket is connected');
        // Force reconnection if needed
        if (readyState !== 1) {
          // console.log('📱 WebSocket not connected, will reconnect automatically');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMobile, readyState]);

  // Heartbeat mechanism for mobile devices
  useEffect(() => {
    if (!isMobile || readyState !== 1) return;

    const heartbeatInterval = setInterval(() => {
      if (readyState === 1 && sendJsonMessage) {
        sendJsonMessage({ type: 'ping' });
        console.log('📱 WebSocket heartbeat sent');
      }
    }, 30000); // Send ping every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [isMobile, readyState, sendJsonMessage]);

  // Set current user
  const setCurrentUser = useCallback((user) => {
    currentUserRef.current = user;
    // If socket is open, immediately join the per-user channel
    try {
      if ((user?.id || user?.uid) && readyState === 1) {
        const userId = user.id || user.uid;
        sendJsonMessage({ type: 'join_user', userId });
        console.log(`👤 Joined user channel (setCurrentUser) for ${userId}`);
      }
    } catch {}
  }, [readyState, sendJsonMessage]);

  // Listen for group membership changes for current user to trigger notifications/toasts
  useEffect(() => {
    // Cleanup previous listener
    if (groupsListenerRef.current) {
      try { groupsListenerRef.current(); } catch {}
      groupsListenerRef.current = null;
    }
    knownMemberGroupIdsRef.current.clear();

    const userId = currentUserRef.current?.id || currentUserRef.current?.uid;
    if (!userId) return;

    let initialized = false;

    const setupGroupsListener = async () => {
      try {
        // Subscribe to group_members table for membership changes
        groupsListenerRef.current = supabase
          .channel(`user_groups_${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'group_members',
              filter: `user_id=eq.${userId}`
            },
            async (payload) => {
              try {
                // Get the group details
                const { data: groupData } = await supabase
                  .from('groups')
                  .select('id, name')
                  .eq('id', payload.new?.group_id || payload.old?.group_id)
                  .single();

                const gid = payload.new?.group_id || payload.old?.group_id;
                const groupName = groupData?.name || 'Group';

                // Handle INSERT (newly added to group)
                if (payload.eventType === 'INSERT') {
                  if (!knownMemberGroupIdsRef.current.has(gid)) {
                    // Show in-app toast
                    try {
                      showGlobalToast({
                        message: `Added to ${groupName}`,
                        subtext: 'You can now chat with members',
                        chatId: gid,
                        groupName,
                        type: 'added_to_group'
                      });
                    } catch {}

                    // Web Notification (if permission granted)
                    try {
                      if ('Notification' in window) {
                        if (Notification.permission === 'granted') {
                          new Notification('Group invite', { body: `You were added to ${groupName}` });
                        } else if (Notification.permission !== 'denied') {
                          // Request once; do not block
                          Notification.requestPermission().then((perm) => {
                            if (perm === 'granted') new Notification('Group invite', { body: `You were added to ${groupName}` });
                          }).catch(() => {});
                        }
                      }
                    } catch {}

                    // Subscribe to FCM topic for background push notifications
                    try {
                      if (fcmToken) {
                        const res = await subscribeToGroupTopic(gid, fcmToken);
                        if (!res?.ok) console.warn('FCM subscribe failed for group', gid, res?.error);
                      } else {
                        console.warn('FCM token not available; skipping topic subscribe for', gid);
                      }
                    } catch (e) {
                      console.warn('FCM subscribe failed for group', gid, e);
                    }

                    knownMemberGroupIdsRef.current.add(gid);
                  }
                } else if (payload.eventType === 'DELETE') {
                  // Remove from known groups if removed from group
                  knownMemberGroupIdsRef.current.delete(gid);
                }
              } catch (e) {
                console.warn('Error processing group membership change:', e);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              // Load initial groups on first subscribe
              if (!initialized) {
                supabase
                  .from('group_members')
                  .select('group_id')
                  .eq('user_id', userId)
                  .then(({ data: members }) => {
                    if (members) {
                      members.forEach(m => knownMemberGroupIdsRef.current.add(m.group_id));
                    }
                    initialized = true;
                  })
                  .catch(e => console.warn('Failed to load initial groups:', e));
              }
            }
          });
      } catch (e) {
        console.warn('Failed to attach groups membership listener', e);
      }
    };

    setupGroupsListener();

    return () => {
      if (groupsListenerRef.current) {
        try { groupsListenerRef.current(); } catch {}
        groupsListenerRef.current = null;
      }
    };
  }, [readyState, fcmToken]);

  // Join a group
  const joinGroup = useCallback((groupId, userId, userName) => {
    if (!currentUserRef.current) return;
    
    // If WebSocket not ready, queue the join for later
    if (readyState !== 1) {
      pendingGroupsRef.current.add(JSON.stringify({ chatId: groupId, userId, userName, isGroup: true }));
      console.log(`🔌 Shared WS: Queued join for ${groupId} (WS not ready, state: ${readyState})`);
      return;
    }
    
    // WebSocket is ready, join immediately
    if (!joinedGroupsRef.current.has(groupId)) {
      sendJsonMessage({
        type: 'join',
        chatId: groupId,
        userId,
        userName,
        isGroup: true
      });
      joinedGroupsRef.current.add(groupId);
      console.log(`🔌 Shared WS: Joined group ${groupId} as ${userName}`);
    }
  }, [readyState, sendJsonMessage]);

  // Join a 1-on-1 chat room
  const joinChat = useCallback((chatId, userId, userName) => {
    if (!currentUserRef.current) return;
    if (readyState !== 1) {
      pendingGroupsRef.current.add(JSON.stringify({ chatId, userId, userName, isGroup: false }));
      console.log(`🔌 Shared WS: Queued join for chat ${chatId} (WS not ready, state: ${readyState})`);
      return;
    }
    if (!joinedGroupsRef.current.has(chatId)) {
      sendJsonMessage({
        type: 'join',
        chatId,
        userId,
        userName
      });
      joinedGroupsRef.current.add(chatId);
      console.log(`🔌 Shared WS: Joined chat ${chatId} as ${userName}`);
    }
  }, [readyState, sendJsonMessage]);

  // Leave a group
  const leaveGroup = useCallback((groupId, userId) => {
    if (readyState !== 1) return;
    if (joinedGroupsRef.current.has(groupId)) {
      sendJsonMessage({
        type: 'leave',
        chatId: groupId,
        userId
      });
      joinedGroupsRef.current.delete(groupId);
      console.log(`🔌 Shared WS: Left group ${groupId}`);
    }
  }, [readyState, sendJsonMessage]);

  // Process pending group joins when WebSocket connects
  useEffect(() => {
    if (readyState === 1 && pendingGroupsRef.current.size > 0) {
      console.log(`🔌 Shared WS: Connection opened! Processing ${pendingGroupsRef.current.size} pending joins...`);
      const pending = Array.from(pendingGroupsRef.current);
      pendingGroupsRef.current.clear();
      
      pending.forEach(jsonStr => {
        try {
          const { chatId, groupId, userId, userName, isGroup } = JSON.parse(jsonStr);
          const id = chatId || groupId;
          if (!id) return;
          if (!joinedGroupsRef.current.has(id)) {
            sendJsonMessage({
              type: 'join',
              chatId: id,
              userId,
              userName,
              isGroup: !!isGroup
            });
            joinedGroupsRef.current.add(id);
            console.log(`🔌 Shared WS: Joined queued ${isGroup ? 'group' : 'chat'} ${id} as ${userName}`);
          }
        } catch (e) {
          console.error('Error processing pending join:', e);
        }
      });
    }
  }, [readyState, sendJsonMessage]);

  // Join all groups for typing indicators (useful for group list)
  const joinAllGroups = useCallback((groups) => {
    if (!currentUserRef.current || readyState !== 1) return;
    
    const userId = currentUserRef.current.id || currentUserRef.current.uid;
    const userName = currentUserRef.current.name || currentUserRef.current.displayName || 'User';
    
    console.log(`🔌 Joining ${groups.length} groups for typing indicators`);
    
    groups.forEach(group => {
      if (!joinedGroupsRef.current.has(group.id)) {
        sendJsonMessage({
          type: 'join',
          chatId: group.id,
          userId,
          userName,
          isGroup: true
        });
        joinedGroupsRef.current.add(group.id);
        console.log(`🔌 Shared WS: Joined group ${group.id} for typing indicators`);
      } else {
        console.log(`🔌 Shared WS: Already joined group ${group.id}`);
      }
    });
  }, [readyState, sendJsonMessage]);

  // Force rejoin all groups (useful for navigation fixes)
  const forceRejoinAllGroups = useCallback((groups) => {
    if (!currentUserRef.current || readyState !== 1) return;
    
    const userId = currentUserRef.current.id || currentUserRef.current.uid;
    const userName = currentUserRef.current.name || currentUserRef.current.displayName || 'User';
    
    console.log(`🔌 Force rejoining ${groups.length} groups`);
    
    // Clear existing joined groups
    joinedGroupsRef.current.clear();
    
    // Rejoin all groups
    groups.forEach(group => {
      sendJsonMessage({
        type: 'join',
        chatId: group.id,
        userId,
        userName,
        isGroup: true
      });
      joinedGroupsRef.current.add(group.id);
      console.log(`🔌 Shared WS: Force rejoined group ${group.id}`);
    });
  }, [readyState, sendJsonMessage]);

  // Clear all typing indicators (useful for cleanup)
  const clearAllTyping = useCallback(() => {
    setTypingUsers({});
    console.log('🔌 Shared WS: Cleared all typing indicators');
  }, []);

  // Get typing status for a specific group
  const getGroupTypingStatus = useCallback((groupId) => {
    try {
      const groupTyping = typingUsers[groupId] || {};
      const typingNames = Object.values(groupTyping).filter(name => typeof name === 'string');
      return {
        isTyping: typingNames.length > 0,
        typingUsers: groupTyping,
        typingNames,
        typingText: typingNames.length === 0 ? null : 
          typingNames.length === 1 ? `${typingNames[0]} is typing...` :
          typingNames.length === 2 ? `${typingNames[0]} and ${typingNames[1]} are typing...` :
          `${typingNames.length} people are typing...`
      };
    } catch (error) {
      console.error('Error getting group typing status:', error);
      return {
        isTyping: false,
        typingUsers: {},
        typingNames: [],
        typingText: null
      };
    }
  }, [typingUsers]);

  // Fallback typing indicator system for when WebSocket fails
  const [fallbackTyping, setFallbackTyping] = useState({});
  
  const addFallbackTyping = useCallback((groupId, userId, userName) => {
    setFallbackTyping(prev => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || {}),
        [userId]: userName
      }
    }));
    
    // Auto-clear after 3 seconds
    setTimeout(() => {
      setFallbackTyping(prev => {
        const next = { ...prev };
        if (next[groupId]) {
          const map = { ...next[groupId] };
          delete map[userId];
          if (Object.keys(map).length === 0) {
            delete next[groupId];
          } else {
            next[groupId] = map;
          }
        }
        return next;
      });
    }, 3000);
  }, []);

  // Enhanced typing status that includes fallback
  const getEnhancedTypingStatus = useCallback((groupId) => {
    const wsStatus = getGroupTypingStatus(groupId);
    const fallbackStatus = fallbackTyping[groupId] || {};
    
    // If WebSocket is down, use fallback
    if (readyState !== 1 && Object.keys(fallbackStatus).length > 0) {
      const fallbackNames = Object.values(fallbackStatus).filter(name => typeof name === 'string');
      return {
        ...wsStatus,
        isTyping: fallbackNames.length > 0,
        typingUsers: fallbackStatus,
        typingNames: fallbackNames,
        typingText: fallbackNames.length === 0 ? null : 
          fallbackNames.length === 1 ? `${fallbackNames[0]} is typing...` :
          fallbackNames.length === 2 ? `${fallbackNames[0]} and ${fallbackNames[1]} are typing...` :
          `${fallbackNames.length} people are typing...`,
        isFallback: true
      };
    }
    
    return wsStatus;
  }, [getGroupTypingStatus, fallbackTyping, readyState]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastJsonMessage) return;
    
    console.log('🔌 Shared WS: Raw event:', lastJsonMessage);
    const { type, data } = lastJsonMessage;
    if (!data) return;
    
    const gid = data.chatId || data.groupId || data.roomId || data.room || data.channelId;
    if (!gid) return;

    switch (type) {
      case 'typing_start':
        if (data.userId !== (currentUserRef.current?.id || currentUserRef.current?.uid)) {
          setTypingUsers(prev => {
            const newState = {
              ...prev,
              [gid]: {
                ...(prev[gid] || {}),
                [data.userId]: data.userName || 'Unknown User'
              }
            };
            console.log(`🔌 Shared WS: ${data.userName || 'Unknown User'} started typing in group ${gid}`, newState[gid]);
            return newState;
          });
          
          // Auto-clear typing indicator after 5 seconds as fallback
          setTimeout(() => {
            setTypingUsers(prev => {
              if (prev[gid] && prev[gid][data.userId]) {
                const next = { ...prev };
                if (next[gid]) {
                  const map = { ...next[gid] };
                  delete map[data.userId];
                  if (Object.keys(map).length === 0) {
                    delete next[gid];
                  } else {
                    next[gid] = map;
                  }
                }
                console.log(`🔌 Shared WS: Auto-cleared typing for ${data.userName} in group ${gid}`);
                return next;
              }
              return prev;
            });
          }, 5000);
        }
        break;

      case 'typing_stop':
        if (data.userId !== (currentUserRef.current?.id || currentUserRef.current?.uid)) {
          setTypingUsers(prev => {
            const next = { ...prev };
            if (next[gid]) {
              const map = { ...next[gid] };
              delete map[data.userId];
              // Delete the group key entirely if empty instead of setting to null
              if (Object.keys(map).length === 0) {
                delete next[gid];
              } else {
                next[gid] = map;
              }
            }
            console.log(`🔌 Shared WS: ${data.userName} stopped typing in group ${gid}`);
            return next;
          });
        }
        break;

      case 'new_message':
        // Update unread count for group list
        setUnreadCounts(prev => ({
          ...prev,
          [gid]: (prev[gid] || 0) + 1
        }));
        
        // Update last message for group list
        if (data.text && data.senderName) {
          setLastMessages(prev => ({
            ...prev,
            [gid]: {
              text: data.text,
              senderName: data.senderName,
              timestamp: new Date(data.timestamp || Date.now())
            }
          }));
          console.log(`🔌 Shared WS: Updated last message for group ${gid}: "${data.senderName}: ${data.text}"`);
        }
        
        // Fire a global toast immediately (works anywhere in the app)
        try {
          // Avoid self-toasts: backend may use different field names for the sender id
          const senderId = data.sender || data.senderId || data.userId || data.from || data.author || null;
          const currentUid = currentUserRef.current?.uid || currentUserRef.current?.id || null;
          if (senderId && currentUid && String(senderId) === String(currentUid)) {
            // Don't show a toast for messages originating from the current user
            break;
          }

          const isGroup = Boolean(data.groupId) || data.isGroup === true;
          // Show "New Friend" if sender name is not available (unknown contact)
          const senderName = data.senderName || data.userName || 'New Friend';
          const textSnippet = data.text ? (data.text.length > 80 ? data.text.slice(0, 80) + '…' : data.text) : '';
          showGlobalToast({
            message: isGroup ? `${senderName} in group` : `Message from ${senderName}`,
            subtext: textSnippet,
            text: data.text,
            chatId: gid,
            senderId: senderId,
            senderName,
            groupName: data.groupName || null,
            messageId: data.id || data.messageId || null,
            timestamp: data.timestamp || Date.now(),
            isGroup,
            type: isGroup ? 'new_group_message' : 'new_message'
          });
        } catch (toastErr) {
          console.warn('Toast trigger failed:', toastErr);
        }

        console.log(`🔌 Shared WS: New message in group ${gid}, incremented unread count`);
        break;

      case 'messages_read':
        if (data.userId === (currentUserRef.current?.id || currentUserRef.current?.uid)) {
          setUnreadCounts(prev => ({
            ...prev,
            [gid]: 0
          }));
          console.log(`🔌 Shared WS: Marked group ${gid} messages as read`);
        }
        break;

      default:
        break;
    }
  }, [lastJsonMessage]);

  // Allow optimistic update of a group's last message from the client
  const updateGroupLastMessage = useCallback((groupId, { text, senderName, timestamp }) => {
    if (!groupId || !text) return;
    setLastMessages(prev => ({
      ...prev,
      [groupId]: {
        text,
        senderName: senderName || currentUserRef.current?.name || 'You',
        timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp || Date.now())
      }
    }));
    console.log(`🔌 Shared WS: Optimistic last message set for group ${groupId}: "${senderName || 'You'}: ${text}"`);
  }, []);

  const value = {
    sendJsonMessage,
    lastJsonMessage,
    readyState,
    typingUsers,
    unreadCounts,
    lastMessages,
    updateGroupLastMessage,
    setCurrentUser,
    joinGroup,
    leaveGroup,
    joinAllGroups,
    forceRejoinAllGroups,
    clearAllTyping,
    getGroupTypingStatus,
    getEnhancedTypingStatus,
    addFallbackTyping,
    isMobile,
    isSmallScreen,
    setUnreadCounts,
    joinChat
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
