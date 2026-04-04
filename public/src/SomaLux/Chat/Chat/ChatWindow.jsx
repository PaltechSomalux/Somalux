import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { parseTimestamp } from '../utils/parseTimestamp';  // Ensure this exists; if not, implement below
import PropTypes from 'prop-types';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { FiMessageSquare, FiX } from 'react-icons/fi';
import { ChatHeader } from './ChatHeader';
import { ChatFooter } from './ChatFooter';
import { MessageItem } from './MessageItem';
import { MessageActions } from './MessageActions';
import { SettingsPanel } from './SettingsPanel';
import { WallpaperUI } from './Wallpaper';
import { useChatActions } from './useChatActions';
import { useLongPress } from '../ChatList/Components/utils/useLongPress';
// Firebase imports removed - using Supabase instead
// import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './ChatWindow.css';
import { DisappearingMessagesModal } from './DisappearingMessagesModal';

// Utility function to generate chat ID
const getChatId = (idA, idB) => {
  if (!idA || !idB || typeof idA !== 'string' || typeof idB !== 'string') {
    // console.error('ChatWindow.jsx: getChatId: Invalid inputs', { idA, idB, types: { idA: typeof idA, idB: typeof idB } });
    return null;
  }
  // Handle self-chat: if idB equals idA, use user-specific self-chat ID
  if (idB === idA) {
    return `yourself_${idA}`;
  }
  if (idA.includes('_') || idB.includes('_')) {
    // console.error('ChatWindow.jsx: getChatId: UID contains "_", possible prior chatId misuse', { idA, idB });
    return null;
  }
  const sorted = [String(idA), String(idB)].sort();
  const chatId = sorted.join('_');
  return chatId;
};

// MessageWrapper component (unchanged, but with fixed props)
const MessageWrapper = ({
  message,
  currentUser,
  contact,
  messages,
  enableReadReceipts,
  enableReactions,
  expandedMessages,
  replyingTo,
  toggleMessageExpand,
  handlePreciseMessageClick,
  handleReplyToMessage,
  handleMessageClick,
  handleNavigateToMessage,
  handleLongPressMessage,
  handleSelectMessage,
  selectedMessageIds,
  isSelectionMode,
  editingMessageId,
  onEditSave,
  onCancelEdit,
}) => {
  // Always call hooks before any early returns
  const longPressHandlers = useLongPress(
    (event, { context }) => {
      // console.log('ChatWindow.jsx: Long press detected for message:', { messageId: context.id });
      handleLongPressMessage(context);
    },
    500,
    { context: message, selector: '.message-content' }
  );

  // Render system messages without the outer '.message' wrapper to avoid overlapping layout
  if (message?.type === 'system' || message?.sender === 'system') {
    return (
      <MessageItem
        message={message}
        currentUser={currentUser}
        contact={contact}
        messages={messages}
        enableReadReceipts={enableReadReceipts}
        enableReactions={enableReactions}
        expandedMessages={expandedMessages}
        replyingTo={replyingTo}
        editingMessageId={editingMessageId}
        onToggleExpand={toggleMessageExpand}
        onClick={() => {}}
        onEditSave={onEditSave}
        onCancelEdit={onCancelEdit}
        onReply={handleReplyToMessage}
        onNavigateToMessage={handleNavigateToMessage}
      />
    );
  }
  return (
    <div
      className={`message ${message.sender === currentUser.id ? 'sent' : 'received'} ${selectedMessageIds.includes(message.id) ? 'chatme-selected' : ''} ${isSelectionMode ? 'selection-mode' : ''}`}
      {...longPressHandlers}
    >
      <MessageItem
        message={message}
        currentUser={currentUser}
        contact={contact}
        messages={messages}
        enableReadReceipts={enableReadReceipts}
        enableReactions={enableReactions}
        expandedMessages={expandedMessages}
        replyingTo={replyingTo}
        editingMessageId={editingMessageId}
        onToggleExpand={toggleMessageExpand}
        onClick={(e, msg) => {
          e.stopPropagation();
          if (isSelectionMode) {
            handleSelectMessage(message.id);
          } else {
            handlePreciseMessageClick(e, msg);
          }
        }}
        onEditSave={onEditSave}
        onCancelEdit={onCancelEdit}
        onReply={handleReplyToMessage}
        onNavigateToMessage={handleNavigateToMessage}
      />
    </div>
  );
};

MessageWrapper.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sender: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    text: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  contact: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  messages: PropTypes.array.isRequired,
  enableReadReceipts: PropTypes.bool,
  enableReactions: PropTypes.bool,
  expandedMessages: PropTypes.object,
  replyingTo: PropTypes.object,
  toggleMessageExpand: PropTypes.func,
  handlePreciseMessageClick: PropTypes.func,
  handleReplyToMessage: PropTypes.func,
  handleMessageClick: PropTypes.func,
  handleNavigateToMessage: PropTypes.func,
  handleLongPressMessage: PropTypes.func,
  handleSelectMessage: PropTypes.func,
  selectedMessageIds: PropTypes.array,
  isSelectionMode: PropTypes.bool,
  editingMessageId: PropTypes.string,
  onEditSave: PropTypes.func,
  onCancelEdit: PropTypes.func,
};

export const ChatWindow = ({
  messages = [],
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
  expandedMessages = {},
  reportedMessages = [],
  pinnedMessages = [],
  notificationSettings = {},
  filteredMessages,
  currentTheme = 'light',
  currentWallpaper,
  securitySettings = {},
  messagesEndRef,
  setNewMessage,
  setSearchQuery,
  setShowSearch,
  setShowMessageActions,
  setReplyingTo,
  setCurrentWallpaper,
  setSecuritySettings,
  handleSendMessage,
  handleSendVoiceMessage,
  startRecording,
  stopRecording,
  handleFileUpload,
  handleMessageClick,
  handleLongPressMessage,
  handleSelectMessage,
  handleCancelSelection,
  handleBatchDelete,
  handleReactToMessage,
  handleReplyToMessage,
  handleDeleteMessage,
  handleDeleteMessageForEveryone,
  toggleMessageExpand,
  togglePinMessage,
  reportMessage,
  clearChat,
  testDeleteSingleMessage,
  exportChat,
  scrollToBottom,
  toggleTheme,
  toggleNotificationSetting,
  currentUser,
  contact,
  enableFeatures = {},
  isMobileView,
  onBackClick,
  startAudioCall,
  startVideoCall,
  selectedMessageIds = [],
  isSelectionMode = false,
  editingMessageId,
  setEditingMessageId,
  handleEditSave,
  handleCancelEdit,
  isOtherTyping = false, // 🔥 For WS typing indicator
  isOtherOnline = false, // 🔥 For WS online status
  sendJsonMessage, // 🔥 For sending WS typing events
  typingUsers = {}, // 🔥 Global for list fallback
  onlineUsers = new Set(), // 🔥 Global for list fallback
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('notifications');
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [showFixedTyping, setShowFixedTyping] = useState(false);
  const [showDisappearing, setShowDisappearing] = useState(false);
  const [disappearingDays, setDisappearingDays] = useState(0);
  const [disappearingSetBy, setDisappearingSetBy] = useState(null);
  const [keepMessages, setKeepMessages] = useState(false);

  const settingsPanelRef = useRef(null);
  const wallpaperRef = useRef(null);
  const typingTimeoutRef = useRef(null); // FIXED: Add missing ref

  const isSelfChat = currentUser?.id === contact?.id;

  // Load target user's privacy settings for visibility (e.g., last seen, profile photo)
  const [targetPrivacy, setTargetPrivacy] = useState(null);
  useEffect(() => {
    if (!contact?.id) { setTargetPrivacy(null); return; }
    const ref = doc(db, 'users', contact.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data() || {};
        setTargetPrivacy({
          lastSeen: d.lastSeen ?? 'everyone',
          profilePhotoVisibility: d.profilePhotoVisibility ?? 'everyone',
          aboutVisibility: d.aboutVisibility ?? 'everyone',
          statusVisibility: d.statusVisibility ?? 'contacts',
        });
      } else {
        setTargetPrivacy(null);
      }
    }, () => setTargetPrivacy(null));
    return () => unsub();
  }, [contact?.id]);

  // Log initial props
  useEffect(() => {
    const computedChatId = getChatId(currentUser?.id, contact?.id);
    // console.log('ChatWindow.jsx: Component mounted with props:', {
    //   currentUserId: currentUser?.id,
    //   contactId: contact?.id,
    //   chatId: computedChatId,
    //   messagesCount: messages.length,
    //   enableFeatures,
    //   isOtherTyping,
    //   isOtherOnline,
    //   typingUsers: Object.keys(typingUsers),
    //   onlineUsers: Array.from(onlineUsers),
    // });
    if (!computedChatId) {
      // console.error('ChatWindow.jsx: Invalid chatId on mount', { currentUserId: currentUser?.id, contactId: contact?.id });
    }
  }, [currentUser, contact, messages, enableFeatures, isOtherTyping, isOtherOnline, typingUsers, onlineUsers]);

  const handleUserTyping = useCallback((isTyping) => {
    // console.log('ChatWindow.jsx: User typing status changed:', { isTyping });
    setIsUserTyping(isTyping);
  }, []);

  // Fetch all users/chats for current user (for forwarding)
  useEffect(() => {
    if (!currentUser?.id) {
      // console.warn('ChatWindow.jsx: No current user ID, skipping user fetch');
      setAllUsers([]);
      return;
    }

    const fetchUserChats = async () => {
      try {
        // console.log('ChatWindow.jsx: Fetching user chats for forwarding:', {
        //   currentUserId: currentUser.id,
        //   path: `/userChats/${currentUser.id}/chats`,
        //   timestamp: new Date().toISOString(),
        // });

        const userChatsQuery = query(collection(db, 'userChats', currentUser.id, 'chats'));
        const snapshot = await getDocs(userChatsQuery);

        const contactUids = snapshot.docs
          .filter((doc) => doc.id !== 'trigger' && !doc.data().isDeleted)
          .map((doc) => doc.id);

        // console.log('ChatWindow.jsx: Retrieved contact UIDs:', {
        //   contactUids,
        //   count: contactUids.length,
        // });

        if (contactUids.length === 0) {
          // console.log('ChatWindow.jsx: No contacts found for forwarding');
          setAllUsers([]);
          return;
        }

        const usersData = [];
        for (const uid of contactUids) {
          // console.log('ChatWindow.jsx: Processing contact UID:', { uid });
          const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
          const userSnap = await getDocs(userQuery);

          if (!userSnap.empty) {
            const data = userSnap.docs[0].data();
            const chatData = snapshot.docs.find((d) => d.id === uid)?.data() || {};
            const chatId = getChatId(currentUser.id, uid);
            if (!chatId) {
              // console.warn('ChatWindow.jsx: Skipping invalid chatId for uid', { uid });
              continue;
            }


            const userData = {
              uid,
              name: data.name || 'Unknown',
              email: data.email || '',
              bio: data.bio || '',
              photoURL: data.photoURL || 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
              chatId,
              isLocked: chatData.isLocked || false,
              isMuted: chatData.isMuted || false,
              isArchived: chatData.isArchived || false,
              isPinned: chatData.isPinned || false,
            };
            usersData.push(userData);
          } else {
            // console.warn('ChatWindow.jsx: No user document found for UID:', { uid });
          }
        }

        // Filter out current contact and self
        const filteredUsers = usersData.filter((u) => u.uid !== contact?.id && u.uid !== currentUser.id);
        setAllUsers(filteredUsers);
      } catch (error) {
        setAllUsers([]);
      }
    };

    fetchUserChats();
  }, [currentUser?.id, contact?.id]);

  // Load disappearing messages setting for this chat
  useEffect(() => {
    const chatId = getChatId(currentUser?.id, contact?.id);
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    const unsub = onSnapshot(chatRef, (snap) => {
      const d = snap.data() || {};
      const days = Number(d.disappearingDurationDays || 0);
      setDisappearingDays(Number.isFinite(days) ? days : 0);
      setDisappearingSetBy(d.disappearingSetBy || null);
      try {
        localStorage.setItem(`chat_disappear_days_${chatId}`, String(Number.isFinite(days) ? days : 0));
      } catch {}
    });
    return () => unsub();
  }, [currentUser?.id, contact?.id]);

  // Load per-user keepMessages override (cache-first)
  useEffect(() => {
    const chatKey = `${currentUser?.id}_${contact?.id}`;
    if (!currentUser?.id || !contact?.id) return;
    try {
      const cached = localStorage.getItem(`chat_keep_${chatKey}`);
      if (cached != null) setKeepMessages(cached === 'true');
    } catch {}
    // Best-effort fetch from userChats path
    (async () => {
      try {
        const keepRef = doc(db, 'userChats', currentUser.id, 'chats', contact.id);
        const snap = await getDoc(keepRef);
        if (snap.exists()) {
          const v = !!snap.data().keepMessages;
          setKeepMessages(v);
          try { localStorage.setItem(`chat_keep_${chatKey}`, String(v)); } catch {}
        }
      } catch {}
    })();
  }, [currentUser?.id, contact?.id]);

  // Periodic cleanup of expired messages (per-user via deletedBy)
  useEffect(() => {
    const chatId = getChatId(currentUser?.id, contact?.id);
    if (!chatId) return;
    const timer = setInterval(async () => {
      try {
        const now = Date.now();
        if (keepMessages) return; // this user keeps messages locally
        const expired = (messages || []).filter(m => m?.expiresAt && new Date(m.expiresAt).getTime() <= now && !(m.deletedBy || []).includes(currentUser.id));
        if (expired.length === 0) return;
        // Mark as deleted for this user only
        for (const m of expired) {
          try {
            await updateDoc(doc(db, 'chats', chatId, 'messages', m.id), {
              deletedBy: Array.from(new Set([...(m.deletedBy || []), currentUser.id]))
            });
          } catch (e) {
            // ignore update errors
          }
        }
        // Remove from UI for this user
        if (typeof setMessages === 'function') {
          setMessages(prev => prev.filter(m => !expired.some(x => x.id === m.id)));
        }
      } catch (e) {
        console.warn('Cleanup expired messages failed', e);
      }
    }, 60000); // every 60s
    return () => clearInterval(timer);
  }, [currentUser?.id, contact?.id, messages, setMessages, keepMessages]);

  // Log allUsers state changes
  useEffect(() => {
  }, [allUsers]);

  // Verify props
  useEffect(() => {

  }, [setMessages, selectedMessageIds, isSelectionMode, currentUser, contact, isOtherTyping, isOtherOnline, typingUsers, onlineUsers]);

  const { clearChat: directClearChat, testDeleteSingleMessage: directTestDeleteSingleMessage } = useChatActions({
    currentUser,
    contact,
    newMessage,
    setNewMessage,
    setMessages: typeof setMessages === 'function' ? setMessages : () => // console.error('ChatWindow.jsx: setMessages is not a function'),
      messagesEndRef,
    replyingTo,
    setReplyingTo,
  });

  // FIXED: Hoist useCallbacks outside useEffect to comply with React Hooks rules
  const checkScroll = useCallback(() => {
    const messagesContainer = messagesEndRef?.current?.parentElement;
    if (!messagesContainer || !isOtherTyping) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setShowFixedTyping(!atBottom);
    // console.log('ChatWindow.jsx: Scroll check - atBottom:', atBottom, 'showFixedTyping:', !atBottom, 'isOtherTyping:', isOtherTyping);
  }, [isOtherTyping, messagesEndRef]);

  const debouncedCheck = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(checkScroll, 100);
  }, [checkScroll]);

  // FIXED: Scroll listener for typing indicator position (debounced)
  useEffect(() => {
    const messagesContainer = messagesEndRef?.current?.parentElement;
    if (!messagesContainer || !isOtherTyping) return;

    messagesContainer.addEventListener('scroll', debouncedCheck, { passive: true });
    checkScroll();

    return () => {
      messagesContainer.removeEventListener('scroll', debouncedCheck);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isOtherTyping, messagesEndRef, checkScroll, debouncedCheck]);

  useEffect(() => {
    if (messages.length > 0 && typeof scrollToBottom === 'function') {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsPanelRef.current && !settingsPanelRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      if (wallpaperRef.current && !wallpaperRef.current.contains(event.target)) {
        setShowWallpaper(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const parseTimestamp = useCallback((ts) => {
    if (!ts) {
      // console.error('ChatWindow.jsx: No timestamp provided:', ts);
      return null;
    }

    if (
      ts &&
      typeof ts === 'object' &&
      (('seconds' in ts && 'nanoseconds' in ts) ||
        ('_seconds' in ts && '_nanoseconds' in ts))
    ) {
      const seconds = ts.seconds ?? ts._seconds;
      const nanoseconds = ts.nanoseconds ?? ts._nanoseconds;
      return new Date(seconds * 1000 + nanoseconds / 1000000);
    }

    if (ts instanceof Date) {
      return ts;
    }

    if (typeof ts === 'number') {
      return new Date(ts);
    }

    if (typeof ts === 'string') {
      let parsed = Date.parse(ts);
      if (!isNaN(parsed)) return new Date(parsed);

      let cleaned = ts
        .replace(/\s*\([^)]+\)/g, '')
        .replace(/GMT([+-]\d{4})/g, '$1')
        .trim();

      parsed = Date.parse(cleaned);
      if (!isNaN(parsed)) return new Date(parsed);

      const fixed = ts.replace(' at ', ' ');
      parsed = Date.parse(fixed);
      if (!isNaN(parsed)) return new Date(parsed);

      try {
        const isoDate = new Date(ts);
        if (!isNaN(isoDate.getTime())) return isoDate;
      } catch (e) { }

      // console.error('ChatWindow.jsx: Failed to parse string timestamp:', ts);
      return null;
    }

    // console.error('ChatWindow.jsx: Invalid timestamp format:', ts, typeof ts);
    return null;
  }, []);

  const handlePreciseMessageClick = useCallback(
    (e, message) => {
      if (!e.target.closest('.message-content') || e.defaultPrevented) {
        return;
      }
      if (e.target.closest('button, a, .expand-btn, .download-btn, .play-button, .whatsapp-reply-container')) {
        return;
      }
      if (handleMessageClick && typeof handleMessageClick === 'function') {
        e.stopPropagation();
        // console.log('ChatWindow.jsx: Message clicked:', { messageId: message.id, sender: message.sender });
        handleMessageClick(message, false);
        if (!isSelectionMode) {
          setShowMessageActions(true);
        }
      }
    },
    [handleMessageClick, setShowMessageActions, isSelectionMode]
  );

  const handleNavigateToMessage = useCallback(
    (message) => {
      if (handleMessageClick && typeof handleMessageClick === 'function') {
        handleMessageClick(message, true);
      }
    },
    [handleMessageClick]
  );

  const handleWallpaperSelect = useCallback(
    (wallpaper) => {
      if (setCurrentWallpaper) {
        setCurrentWallpaper(wallpaper);
        localStorage.setItem('imo_current_wallpaper', JSON.stringify(wallpaper));
        // console.log('ChatWindow.jsx: Wallpaper selected:', { wallpaper });
      }
      setShowWallpaper(false);
    },
    [setCurrentWallpaper]
  );

  // FIXED: renderDateSeparator with robust parseTimestamp
  const renderDateSeparator = useCallback((date) => {
    const parsedDate = parseTimestamp(date);
    if (!parsedDate || isNaN(parsedDate.getTime())) {  // Use getTime() for safety
      // console.error('ChatWindow.jsx: Invalid date for separator:', date);
      return '';
    }

    if (isToday(parsedDate)) return 'Today';
    if (isYesterday(parsedDate)) return 'Yesterday';

    try {
      return format(parsedDate, 'MMMM d, yyyy');
    } catch (error) {
      // console.error('ChatWindow.jsx: Invalid date format in message:', parsedDate, error);
      return '';
    }
  }, [parseTimestamp]);

  const handleForwardMessage = useCallback(
    (messageToForward) => {
      if (!messageToForward || !setNewMessage) return;
      const messageText = typeof messageToForward.text === 'string' ? `Forwarded: ${messageToForward.text}` : '';
      setNewMessage(messageText);
      // console.log('ChatWindow.jsx: Forwarding message:', { messageId: messageToForward.id, text: messageText });
      if (setShowMessageActions) setShowMessageActions(false);
      if (typeof scrollToBottom === 'function') {
        setTimeout(scrollToBottom, 100);
      }
    },
    [setNewMessage, setShowMessageActions, scrollToBottom]
  );

  const handleForwardSelected = useCallback(async (selectedUserIds, originalMessage) => {
    if (!selectedUserIds?.length || !currentUser?.id) {
      return;
    }


    for (const userId of selectedUserIds) {
      const chatId = getChatId(currentUser.id, userId);
      if (!chatId) {
        // console.warn('ChatWindow.jsx: Invalid chatId for user:', { userId });
        continue;
      }

      const forwardedContent = {};
      if (originalMessage.text && typeof originalMessage.text === 'string') {
        forwardedContent.text = originalMessage.text;
      }
      if (originalMessage.file && typeof originalMessage.file === 'object' && originalMessage.file.url) {
        forwardedContent.file = {
          url: originalMessage.file.url,
          name: originalMessage.file.name || '',
          type: originalMessage.file.type || '',
          size: originalMessage.file.size || 0,
        };
      }
      if (originalMessage.audio && typeof originalMessage.audio === 'object' && originalMessage.audio.url) {
        forwardedContent.audio = {
          url: originalMessage.audio.url,
          duration: originalMessage.audio.duration || 0,
        };
      }

      const forwardedMessage = {
        sender: currentUser.id,
        receiver: userId,
        timestamp: serverTimestamp(),
        status: 'sent',
        readBy: [],
        deletedBy: [],
        isPinned: false,
        isForwarded: true,
        forwardedFrom: originalMessage.senderName || 'Unknown',
        forwardedFromName: originalMessage.sender === currentUser.id ? 'You' : originalMessage.senderName || 'Unknown',
        originalTimestamp: originalMessage.timestamp,
        forwardedContent,
        ...(originalMessage.text && typeof originalMessage.text === 'string' ? { text: originalMessage.text } : {}),
        ...(originalMessage.file && typeof originalMessage.file === 'object' && originalMessage.file.url
          ? {
            file: {
              url: originalMessage.file.url,
              name: originalMessage.file.name || '',
              type: originalMessage.file.type || '',
              size: originalMessage.file.size || 0,
            }
          }
          : {}),
        ...(originalMessage.audio && typeof originalMessage.audio === 'object' && originalMessage.audio.url
          ? {
            audio: {
              url: originalMessage.audio.url,
              duration: originalMessage.audio.duration || 0,
            }
          }
          : {}),
      };

      try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const docRef = await addDoc(messagesRef, forwardedMessage);
        await updateDoc(docRef, { status: 'delivered' });

      } catch (err) {
      }
    }

    // console.log('ChatWindow.jsx: Forwarding completed for all selected users');
    setShowMessageActions(false);
  }, [currentUser?.id, setShowMessageActions]);

  const getChatBackgroundStyle = useCallback(() => {
    if (!currentWallpaper?.value) return {};
    if (currentWallpaper.value.startsWith('url(') || currentWallpaper.value.startsWith('data:image')) {
      return {
        backgroundImage: currentWallpaper.value.startsWith('url(')
          ? currentWallpaper.value
          : `url(${currentWallpaper.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      };
    } else if (currentWallpaper.value.startsWith('linear-gradient')) {
      return {
        background: currentWallpaper.value,
        backgroundAttachment: 'fixed',
      };
    } else {
      return {
        backgroundColor: currentWallpaper.value,
        backgroundAttachment: 'fixed',
      };
    }
  }, [currentWallpaper]);

  const handleScrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const chatMessages = messagesEndRef.current.parentElement;
      const footerHeight = 60;
      chatMessages.scrollTo({
        top: messagesEndRef.current.offsetTop - footerHeight,
        behavior: 'smooth',
      });
    }
  }, [messagesEndRef]);

  useEffect(() => {
    if (messages.length > 0) {
      handleScrollToBottom();
    }
  }, [messages, handleScrollToBottom]);

  // FIXED: Memoize messagesToRender: No sort needed (state is ascending), just filter + copy for safety
  const messagesToRender = useMemo(() => {
    const safe = Array.isArray(messages) ? [...messages] : [];  // Copy for safety
    const filtered = Array.isArray(filteredMessages) && filteredMessages.length > 0
      ? [...filteredMessages].filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))  // FIXED: No sort, copy + filter
      : safe.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase()));
    // console.log('ChatWindow.jsx: messagesToRender computed', { total: safe.length, filtered: filtered.length, searchQuery });
    return searchQuery ? filtered : safe;
  }, [messages, searchQuery, filteredMessages]);

  if (!currentUser || !contact) {
    // console.error('ChatWindow.jsx: Missing user or contact:', { currentUser, contact });
    return <div>Loading chat...</div>;
  }

  const computedChatId = getChatId(currentUser.id, contact.id);
  if (!computedChatId) {
    // console.error('ChatWindow.jsx: Invalid chatId, cannot render', { currentUserId: currentUser.id, contactId: contact.id });
    return <div>Invalid chat configuration</div>;
  }

  return (
    <div className={`whatsapp-chat-container ${currentTheme}-theme`} style={getChatBackgroundStyle()}>
      {isSelectionMode ? (
        <div className="chatme-selection-header">
          <span>{selectedMessageIds.length} selected</span> {/* Keep existing */}
          <div className="chatme-toolbar-actions">
            <button className="chatme-cancel-selection" onClick={handleCancelSelection}>
              <FiX size={18} /> Cancel
            </button>
            {/* FIXED: Add back button to selection header */}
            <button className="chatme-back-from-selection" onClick={onBackClick}>
              ← Back
            </button>
            <button className="chatme-delete-selection" onClick={handleBatchDelete}>
              <FiMessageSquare size={16} /> Delete
            </button>
          </div>
        </div>
      ) : (
        <ChatHeader
          contact={{ ...contact, targetPrivacy: targetPrivacy || contact?.targetPrivacy }}
          pinnedMessages={pinnedMessages}
          onPinClick={handleMessageClick}
          isTyping={isOtherTyping} // 🔥 WS typing
          isOnline={isOtherOnline || onlineUsers.has(contact.id)} // 🔥 WS online (global fallback)
          currentTheme={currentTheme}
          setCurrentTheme={toggleTheme}
          setShowSettings={setShowSettings}
          setShowClearChatConfirm={setShowClearChatConfirm}
          exportChat={exportChat}
          setShowWallpaper={setShowWallpaper}
            startAudioCall={startAudioCall}
            startVideoCall={startVideoCall}
          enableFeatures={{
            typingIndicators: enableFeatures.enableTypingIndicators,
            onlineStatus: enableFeatures.enableOnlineStatus,
            enableReadReceipts: enableFeatures.enableReadReceipts,
          }}
          isMobileView={isMobileView}
          onBackClick={(...args) => {
            console.log('🔙 ChatWindow: onBackClick prop called, forwarding to Chat');
            if (onBackClick) onBackClick(...args);  // Forward with args if any
          }}
          isSelfChat={isSelfChat}
          openDisappearingModal={() => setShowDisappearing(true)}
          hasDisappearingActive={disappearingDays > 0}
        />
      )}

      {showClearChatConfirm && (
        <div className="confirmation-dialog floating-panel">
          <h3>Clear Chat?</h3>
          <p>This will delete all messages in this chat. This action cannot be undone.</p>
          <div className="confirmation-buttons">
            <button className="cancel-button" onClick={() => setShowClearChatConfirm(false)}>
              Cancel
            </button>
            <button
              className="confirm-button danger"
              disabled={isClearingChat}
              onClick={async () => {
                setIsClearingChat(true);
                setShowClearChatConfirm(false);
                try {
                  await directClearChat();
                  // console.log('ChatWindow.jsx: directClearChat() resolved successfully');
                } catch (err) {
                  alert(`Failed to clear chat: ${err.message}`);
                } finally {
                  setIsClearingChat(false);
                }
              }}
            >
              {isClearingChat ? 'Clearing...' : 'Clear Chat'}
            </button>
          </div>
        </div>
      )}

      {showSearch && enableFeatures.enableMessageSearch && (
        <div className="search-bar floating-search">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            aria-label="Search messages"
          />
          <button
            className="icon-button"
            onClick={() => setShowSearch && setShowSearch(false)}
            aria-label="Close search"
          >
            <FiX />
          </button>
          {filteredMessages && filteredMessages.length === 0 && searchQuery && (
            <div className="no-results">No messages found</div>
          )}
        </div>
      )}

      <div className="chat-messages" role="main" aria-label="Chat messages">
        {messagesToRender.length === 0 ? (
          <div className="no-messages-placeholder">
            <FiMessageSquare className="no-messages-icon" />
            <h3>No messages yet</h3>
            <p>Start a conversation!</p>
          </div>
        ) : (
          messagesToRender.map((message, index) => {
            const parsedTimestamp = parseTimestamp(message.timestamp);
            const prevMessage = messagesToRender[index - 1];
            const prevTimestamp = prevMessage ? parseTimestamp(prevMessage.timestamp) : null;
            const showDateSeparator =
              index === 0 ||
              !isSameDay(parsedTimestamp, prevTimestamp);

            return (
              <React.Fragment key={message.id}>
                {showDateSeparator && parsedTimestamp && (
                  <div className="date-separator" role="separator">
                    <span>{renderDateSeparator(parsedTimestamp)}</span>
                  </div>
                )}
                <MessageWrapper
                  message={message}
                  currentUser={currentUser}
                  contact={contact}
                  messages={messagesToRender}
                  enableReadReceipts={enableFeatures.enableReadReceipts}
                  enableReactions={enableFeatures.enableReactions}
                  expandedMessages={expandedMessages}
                  replyingTo={replyingTo}
                  toggleMessageExpand={toggleMessageExpand}
                  handlePreciseMessageClick={handlePreciseMessageClick}
                  handleReplyToMessage={handleReplyToMessage}
                  handleMessageClick={handleMessageClick}
                  handleNavigateToMessage={handleNavigateToMessage}
                  handleLongPressMessage={handleLongPressMessage}
                  handleSelectMessage={handleSelectMessage}
                  selectedMessageIds={selectedMessageIds}
                  isSelectionMode={isSelectionMode}
                  editingMessageId={editingMessageId}
                  onEditSave={handleEditSave}
                  onCancelEdit={handleCancelEdit}
                />
              </React.Fragment>
            );
          })
        )}
        {/* Inline typing indicator (shown when at bottom) */}
        {enableFeatures.enableTypingIndicators && !isSelfChat && isOtherTyping && !showFixedTyping && (
          <div key={`typing-${contact.id}`} className="message received typing-indicator-container inline" aria-live="polite">
            <div className="message-content">
              <div className="typing-indicator" role="status" aria-label={`${contact.name} is typing`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed typing indicator (when scrolled up) */}
      {enableFeatures.enableTypingIndicators && !isSelfChat && isOtherTyping && showFixedTyping && (
        <div key={`typing-fixed-${contact.id}`} className="message received typing-indicator-container" aria-live="polite">
          <div className="message-content">
            <div className="typing-indicator" role="status" aria-label={`${contact.name} is typing`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      {showMessageActions && selectedMessage && !isSelectionMode && (
        <MessageActions
          message={selectedMessage}
          currentUser={currentUser}
          enableReporting={enableFeatures.enableReporting}
          reportedMessages={reportedMessages}
          onReport={reportMessage}
          onClose={() => {
            // console.log('ChatWindow.jsx: Closing MessageActions');
            setShowMessageActions(false);
          }}
          enableCopy={true}
          enableDownload={true}
          onForward={handleForwardMessage}
          onPin={togglePinMessage}
          onEdit={() => setEditingMessageId(selectedMessage.id)}
          onDelete={handleDeleteMessage}
          onDeleteForEveryone={isSelfChat ? null : handleDeleteMessageForEveryone}
          scrollToBottom={scrollToBottom}
          setEditingMessageId={setEditingMessageId}
          users={allUsers}
          onForwardSelected={handleForwardSelected}
        />
      )}

      <ChatFooter
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        currentUser={currentUser}
        contact={contact}
        onSendMessage={handleSendMessage}
        enableVoiceMessages={enableFeatures.enableVoiceMessages}
        onFileUpload={handleFileUpload}
        onSendVoiceMessage={handleSendVoiceMessage}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        recordingTime={recordingTime}
        onUserTyping={handleUserTyping}
        allUsers={allUsers}
        sendJsonMessage={sendJsonMessage} // 🔥 Pass for typing
        chatId={computedChatId} // 🔥 Pass for WS context
      />

      {showDisappearing && (
        <DisappearingMessagesModal
          currentDurationDays={disappearingDays}
          limitedMode={disappearingDays > 0 && disappearingSetBy && disappearingSetBy !== currentUser.id}
          keepDefault={keepMessages}
          onClose={() => setShowDisappearing(false)}
          onSelect={async (days) => {
            try {
              if (disappearingDays > 0 && disappearingSetBy && disappearingSetBy !== currentUser.id) {
                // Limited mode: user can only keep messages (per-user override)
                const keepRef = doc(db, 'userChats', currentUser.id, 'chats', contact.id);
                await setDoc(keepRef, { keepMessages: true }, { merge: true });
                setKeepMessages(true);
                try { localStorage.setItem(`chat_keep_${currentUser.id}_${contact.id}`, 'true'); } catch {}
                // Local-only system note (do not persist or WS)
                if (typeof setMessages === 'function') {
                  setMessages(prev => [...prev, { id: `local-keep-${Date.now()}`, type: 'system', sender: 'system', text: 'You chose to keep messages on your device.', timestamp: new Date() }]);
                }
              } else {
                // Full control: set disappearing for chat
                await setDoc(doc(db, 'chats', computedChatId), {
                  disappearingDurationDays: days,
                  disappearingSetAt: serverTimestamp(),
                  disappearingSetBy: currentUser.id,
                }, { merge: true });
                setDisappearingDays(days);
                try { localStorage.setItem(`chat_disappear_days_${computedChatId}`, String(days)); } catch {}

                // Insert system message
                const label = days === 0 ? 'off' : (days === 1 ? '24 hours' : days === 7 ? '7 days' : `${Math.round(days/30)} month${days >= 60 ? 's' : ''}`);
                const sysRef = await addDoc(collection(db, 'chats', computedChatId, 'messages'), {
                  type: 'system',
                  sender: 'system',
                  text: `${currentUser.name || 'Someone'} set disappearing messages to ${label}`,
                  timestamp: serverTimestamp(),
                });
                // Optimistic add to UI
                if (typeof setMessages === 'function') {
                  setMessages(prev => [...prev, { id: sysRef.id, type: 'system', sender: 'system', text: `${currentUser.name || 'Someone'} set disappearing messages to ${label}`, timestamp: new Date() }]);
                }

                // Notify via WebSocket for real-time on the other user's side
                try {
                  if (typeof sendJsonMessage === 'function') {
                    sendJsonMessage({
                      type: 'system_notice',
                      data: {
                        chatId: computedChatId,
                        text: `${currentUser.name || 'Someone'} set disappearing messages to ${label}`,
                        timestamp: Date.now(),
                      }
                    });
                  }
                } catch (e) {
                  // ignore WS failures
                }
              }
            } catch (e) {
              console.error('Failed to set disappearing messages:', e);
              alert('Failed to set disappearing messages');
            } finally {
              setShowDisappearing(false);
            }
          }}
        />
      )}

      <SettingsPanel
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        activeSettingsTab={activeSettingsTab}
        setActiveSettingsTab={setActiveSettingsTab}
        notificationSettings={notificationSettings}
        toggleNotificationSetting={toggleNotificationSetting}
        securitySettings={securitySettings}
        setSecuritySettings={setSecuritySettings}
        ref={settingsPanelRef}
      />

      {showWallpaper && (
        <WallpaperUI
          currentWallpaper={currentWallpaper}
          onClose={() => setShowWallpaper(false)}
          onSelect={handleWallpaperSelect}
          ref={wallpaperRef}
        />
      )}

      {!isOnline && !isSelfChat && (
        <div className="offline-notification floating-notification" role="alert">
          <i className="fas fa-wifi"></i> No internet connection
        </div>
      )}
    </div>
  );
};

ChatWindow.propTypes = {
  messages: PropTypes.array,
  setMessages: PropTypes.func,
  newMessage: PropTypes.string,
  isTyping: PropTypes.bool,
  searchQuery: PropTypes.string,
  showSearch: PropTypes.bool,
  selectedMessage: PropTypes.object,
  showMessageActions: PropTypes.bool,
  isRecording: PropTypes.bool,
  isOnline: PropTypes.bool,
  recordingTime: PropTypes.number,
  replyingTo: PropTypes.object,
  expandedMessages: PropTypes.object,
  reportedMessages: PropTypes.array,
  pinnedMessages: PropTypes.array,
  notificationSettings: PropTypes.object,
  filteredMessages: PropTypes.array,
  currentTheme: PropTypes.string,
  currentWallpaper: PropTypes.object,
  securitySettings: PropTypes.object,
  messagesEndRef: PropTypes.object,
  setNewMessage: PropTypes.func,
  setSearchQuery: PropTypes.func,
  setShowSearch: PropTypes.func,
  setShowMessageActions: PropTypes.func,
  setReplyingTo: PropTypes.func,
  setCurrentWallpaper: PropTypes.func,
  setSecuritySettings: PropTypes.func,
  handleSendMessage: PropTypes.func,
  handleSendVoiceMessage: PropTypes.func,
  startRecording: PropTypes.func,
  stopRecording: PropTypes.func,
  handleFileUpload: PropTypes.func,
  handleMessageClick: PropTypes.func,
  handleLongPressMessage: PropTypes.func,
  handleSelectMessage: PropTypes.func,
  handleCancelSelection: PropTypes.func,
  handleBatchDelete: PropTypes.func,
  handleReactToMessage: PropTypes.func,
  handleReplyToMessage: PropTypes.func,
  handleDeleteMessage: PropTypes.func,
  handleDeleteMessageForEveryone: PropTypes.func,
  toggleMessageExpand: PropTypes.func,
  togglePinMessage: PropTypes.func,
  reportMessage: PropTypes.func,
  clearChat: PropTypes.func,
  testDeleteSingleMessage: PropTypes.func,
  createTestMessage: PropTypes.func,
  exportChat: PropTypes.func,
  scrollToBottom: PropTypes.func,
  toggleTheme: PropTypes.func,
  toggleNotificationSetting: PropTypes.func,
  currentUser: PropTypes.object.isRequired,
  contact: PropTypes.object.isRequired,
  enableFeatures: PropTypes.object,
  isMobileView: PropTypes.bool,
  onBackClick: PropTypes.func,
  selectedMessageIds: PropTypes.array,
  isSelectionMode: PropTypes.bool,
  editingMessageId: PropTypes.string,
  setEditingMessageId: PropTypes.func,
  handleEditSave: PropTypes.func,
  handleCancelEdit: PropTypes.func,
  isOtherTyping: PropTypes.bool, // 🔥 WS typing
  isOtherOnline: PropTypes.bool, // 🔥 WS online
  sendJsonMessage: PropTypes.func, // 🔥 WS typing send
  typingUsers: PropTypes.object, // 🔥 Global
  onlineUsers: PropTypes.instanceOf(Set), // 🔥 Global
};

ChatWindow.defaultProps = {
  isOtherTyping: false,
  isOtherOnline: false,
  sendJsonMessage: () => { },
  typingUsers: {},
  onlineUsers: new Set(),
};

export default ChatWindow;