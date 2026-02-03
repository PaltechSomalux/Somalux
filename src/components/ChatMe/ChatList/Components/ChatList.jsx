// ChatList.jsx - Refactored to be a pure presentational component
// All data fetching is done by ChatMe.jsx, ChatList just receives and displays
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiX, FiTrash2, FiLock, FiBell, FiWifiOff } from 'react-icons/fi';
import { BiArchiveIn, BiArchiveOut } from 'react-icons/bi';
import { ChatItem } from './ChatItem';
import { supabase } from '../../../../supabase';
import { useChatLock } from './utils/ChatLockProvider';
import './ChatList.css';

const getChatId = (uidA, uidB) => {
  if (!uidA || !uidB || typeof uidA !== 'string' || typeof uidB !== 'string') {
    console.error('ChatList.jsx: getChatId: Invalid inputs', { uidA, uidB });
    return null;
  }
  // Handle self-chat: if uidA equals uidB, use user-specific self-chat ID
  if (uidA === uidB) {
    return `yourself_${uidA}`;
  }
  if (uidA.includes('_') || uidB.includes('_')) {
    console.error('ChatList.jsx: getChatId: UID contains "_"', { uidA, uidB });
    return null;
  }
  return [String(uidA), String(uidB)].sort().join('_');
};

export const ChatList = ({
  chats = [],  // Receive chats from ChatMe (already has WS updates, last messages, unread counts)
  currentUser,  // Receive currentUser for filtering
  searchQuery,
  setSearchQuery,
  showArchived,
  setShowArchived,
  onChatClick,
  onAvatarClick,
  onArchive,
  onUnarchive,
  onToggleMute,
  onTogglePin,
  onDelete,
  selectedChat,
  typingUsers = {},  // Real-time from WebSocket
  onlineUsers = new Set(),  // Real-time from WebSocket
  isLoading = false,
  onShowFolders,
  hasFolders = false,
  hasArchivedChats = false,
  onShowAll,
  activeTab,
  activeFolderName,
  onAddToFolders,
}) => {
  const [showChatOptions, setShowChatOptions] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isAuthenticated, openSetPinModal, openUnlockModal, openConfirmLockModal, showToast, pinExists } = useChatLock();
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  const currentUserUid = currentUser?.uid;

  const archivedUsersCount = useMemo(() => {
    return chats.filter((chat) => chat.isArchived).length;
  }, [chats]);

  // Apply real-time updates from WebSocket to chats
  const enrichedChats = useMemo(() => {
    // console.log('ChatList: Enriching chats with typing/online status', {
    //   chatsCount: chats.length,
    //   typingUsers: Object.keys(typingUsers),
    //   onlineUsers: Array.from(onlineUsers)
    // });
    return chats.map(chat => {
      const isTyping = !!typingUsers[chat.uid];
      const isOnline = onlineUsers.has(chat.uid) || chat.isOnline;
      if (isTyping) {
        console.log(`ChatList: User ${chat.uid} (${chat.name}) is typing`);
      }
      return {
        ...chat,
        isTyping,
        isOnline,
      };
    });
  }, [chats, typingUsers, onlineUsers]);

  // Sorted chats with real-time updates applied
  const sortedChats = useMemo(() => {
    return [...enrichedChats].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (a.isTyping !== b.isTyping) return a.isTyping ? -1 : 1;
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
    });
  }, [enrichedChats]);

  // Update self presence (online/offline, lastSeen) using Supabase
  useEffect(() => {
    if (!currentUserUid) return;

    const setOnlineStatus = async (online) => {
      try {
        // Supabase users table upsert - disabled pending backend setup
        // await supabase
        //   .from('users')
        //   .upsert({
        //     id: currentUserUid,
        //     isOnline: online,
        //     lastSeen: new Date().toISOString(),
        //   }, { onConflict: 'id' });
        console.log('User online status:', { userId: currentUserUid, online });
      } catch (error) {
        console.error('ChatList.jsx: Failed to update presence:', error);
      }
    };

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        setOnlineStatus(true);
      } else {
        setOnlineStatus(false);
      }
    };

    const onlineHandler = () => {
      setOnlineStatus(true);
      setIsOnline(true);
      showToast('You are back online', 'success');
    };

    const offlineHandler = () => {
      setOnlineStatus(false);
      setIsOnline(false);
      showToast('You are offline', 'error');
    };

    setOnlineStatus(true);

    window.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    return () => {
      window.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
      setOnlineStatus(false);
    };
  }, [currentUserUid, showToast]);

  // Listen for incoming messages from non-contacts - DISABLED (no Firebase)
  useEffect(() => {
    if (!currentUserUid) return;
    // This feature requires Firebase/Supabase setup for incoming message tracking
    return () => {};
  }, [currentUserUid]);

  // Filtered chats (archived/search)
  const filteredChats = useMemo(() => {
    let filtered = sortedChats;

    // Filter by archived status
    if (showArchived) {
      filtered = filtered.filter(chat => chat.isArchived);
    } else {
      filtered = filtered.filter(chat => !chat.isArchived);
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(chat =>
        chat.name?.toLowerCase().includes(lowerQuery) ||
        chat.lastMessage?.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }, [sortedChats, showArchived, searchQuery]);

  // Dynamic search placeholder per active context
  const searchPlaceholder = useMemo(() => {
    if (activeTab === 'folders') {
      if (activeFolderName && activeFolderName.trim()) {
        return `Search ${activeFolderName} ...`;
      }
      return 'Search folders ...';
    }
    if (showArchived) return 'Search archived ...';
    return 'Search chat ...';
  }, [activeTab, showArchived, activeFolderName]);

  // Handle chat options
  const handleOptionsClick = (chatId) => {
    setShowChatOptions(showChatOptions === chatId ? null : chatId);
  };

  // Handle long press for selection mode
  const handleLongPress = (chatId) => {
    setIsSelectionMode(true);
    setSelectedUserIds([chatId]);
  };

  // Handle chat selection
  const handleSelect = (chatId) => {
    setSelectedUserIds(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleChatItemClick = (chat) => {
    if (isSelectionMode) return;
    if (chat.isLocked) {
      openUnlockModal(() => onChatClick(chat));
      return;
    }
    onChatClick(chat);
  };

  // Cancel selection mode
  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedUserIds([]);
  };

  return (
    <div className="chatme-chat-list-container">
      {/* Header matching Groups layout */}
      <div className="chatme-header">
        {isSelectionMode && selectedUserIds.length > 0 ? (
          <div className="chatme-bulk-bar">
            <div className="bulk-count">
              <input type="checkbox" className="bulk-count-checkbox" checked disabled />
              <span>{selectedUserIds.length}</span>
            </div>
            <div className="bulk-actions">
              <button className="bulk-btn" title="Add to Folder" onClick={() => onAddToFolders && onAddToFolders(selectedUserIds)}>Add to Folder</button>
              <button className="bulk-btn" title="Archive" onClick={() => {
                selectedUserIds.forEach(uid => onArchive(uid));
                setIsSelectionMode(false);
                setSelectedUserIds([]);
              }}>Archive</button>
              <button className="bulk-btn danger" title="Delete" onClick={() => setShowBatchDeleteConfirm(true)}>Delete</button>
              <button className="bulk-btn" title="Cancel" onClick={cancelSelection}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="chatme-header-top">
              <h2>ChatMe</h2>
              {notificationCount > 0 && (
                <button
                  className="chatme-notification-btn"
                  onClick={() => setShowNotificationModal(true)}
                >
                  <FiBell />
                  <span className="notification-badge">{notificationCount}</span>
                </button>
              )}
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="chatme-search-input"
              />
            </div>
            <div className="chatme-header-buttons">
              <button
                className="chatme-all-btn"
                onClick={() => {
                  setShowArchived(false);
                  if (typeof onShowAll === 'function') onShowAll();
                }}
                style={{
                  borderBottom: (!showArchived && activeTab === 'all') ? '2px solid var(--accent, #00a884)' : '2px solid transparent',
                  fontWeight: (!showArchived && activeTab === 'all') ? 600 : 500,
                  color: (!showArchived && activeTab === 'all') ? 'var(--accent, #00a884)' : '#ffffff',
                }}
              >
                All
              </button>
              {hasFolders && (
                <button
                  className="chatme-archive-btn"
                  onClick={() => onShowFolders && onShowFolders()}
                  title="Folders"
                  style={{
                    borderBottom: (activeTab === 'folders') ? '2px solid var(--accent, #00a884)' : '2px solid transparent',
                    fontWeight: (activeTab === 'folders') ? 600 : 500,
                    color: (activeTab === 'folders') ? 'var(--accent, #00a884)' : '#ffffff',
                  }}
                >
                  {activeFolderName && activeFolderName.trim() ? activeFolderName : 'Folders'}
                </button>
              )}
              {hasArchivedChats && (
                <button
                  className="chatme-archive-btn"
                  onClick={() => setShowArchived(!showArchived)}
                  style={{
                    borderBottom: (showArchived && activeTab === 'all') ? '2px solid var(--accent, #00a884)' : '2px solid transparent',
                    fontWeight: (showArchived && activeTab === 'all') ? 600 : 500,
                    color: (showArchived && activeTab === 'all') ? 'var(--accent, #00a884)' : '#ffffff',
                  }}
                >
                  {showArchived ? 'Archived' : 'Archived'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="chatme-offline-banner">
          <FiWifiOff />
          <span>You are offline</span>
        </div>
      )}

      {/* Chat List */}
      <div className="chatme-chat-list-items">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="chatme-chat-item skeleton">
              <div className="chatme-avatar-container">
                <div className="skeleton-avatar"></div>
              </div>
              <div className="chatme-chat-content">
                <div className="chatme-chat-header">
                  <div className="skeleton-text name"></div>
                  <div className="skeleton-text time"></div>
                </div>
                <div className="skeleton-text preview"></div>
              </div>
              <button className="chatme-menu-btn" style={{ visibility: 'hidden' }}></button>
            </div>
          ))
        ) : filteredChats.length === 0 ? (
          showArchived ? (
            <div className="chatme-empty-state" style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{ fontSize: 48, opacity: 0.6, marginBottom: 8 }}>
                <BiArchiveOut />
              </div>
              <h3 style={{ margin: 0 }}>Archive is empty</h3>
              <p style={{ opacity: 0.8, marginTop: 6 }}>Chats you archive will appear here.</p>
            </div>
          ) : (
            <div className="chatme-empty-state">
              <p>{searchQuery ? 'No chats found' : 'No chats yet'}</p>
            </div>
          )
        ) : (
          filteredChats.map((chat) => (
            <ChatItem
              key={chat.uid}
              chat={chat}
              onClick={() => handleChatItemClick(chat)}
              onAvatarClick={() => onAvatarClick(chat)}
              onOptionsClick={() => handleOptionsClick(chat.uid)}
              showOptions={showChatOptions === chat.uid}
              onArchive={() => onArchive(chat.uid)}
              onUnarchive={() => onUnarchive(chat.uid)}
              onToggleMute={() => onToggleMute(chat.uid)}
              onTogglePin={() => onTogglePin(chat.uid)}
              onToggleLock={() => {
                if (chat.isLocked) {
                  openUnlockModal(chat.uid);
                } else {
                  openConfirmLockModal(async () => {
                    // Lock functionality disabled (no Firebase)
                    showToast('Chat locking requires backend setup', 'info');
                  });
                }
              }}
              onDelete={() => onDelete(chat.uid)}
              onLongPress={() => handleLongPress(chat.uid)}
              onSelect={() => handleSelect(chat.uid)}
              isActive={selectedChat?.uid === chat.uid}
              isSelected={selectedUserIds.includes(chat.uid)}
              isSelectionMode={isSelectionMode}
            />
          ))
        )}
      </div>

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="confirm-modal-overlay" onClick={() => setShowBatchDeleteConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p>Delete {selectedUserIds.length} chat{selectedUserIds.length > 1 ? 's' : ''}?</p>
            <div className="confirm-buttons">
              <button onClick={() => setShowBatchDeleteConfirm(false)}>Cancel</button>
              <button onClick={() => {
                selectedUserIds.forEach(uid => onDelete(uid));
                setShowBatchDeleteConfirm(false);
                setIsSelectionMode(false);
                setSelectedUserIds([]);
              }} className="delete-btn">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="chatme-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="chatme-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chatme-modal-header">
              <h5>New Message</h5>
              <button className="chatme-modal-close" onClick={() => setShowNotificationModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="chatme-modal-content">

              {notifications.length === 0 ? (
                <div className="empty-state">
                  <p>No new messages </p>
                </div>
              ) : (
                notifications.map((user) => (
                  <div key={user.uid} className="notification-user-item">
                    <img className="notification-avatar" src={user.photoURL} alt={user.name} />
                    <div className="notification-info">
                      <h4>{user.name}</h4>
                      <span className="unread-count">{user.count} new message{user.count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="notification-actions">
                      <button className="add-btn" onClick={() => showToast('Feature requires backend', 'info')}>Add</button>
                      <button className="seen-btn" onClick={() => showToast('Feature requires backend', 'info')}>Mark as Seen</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ChatList.propTypes = {
  chats: PropTypes.array,
  currentUser: PropTypes.object,
  searchQuery: PropTypes.string,
  setSearchQuery: PropTypes.func,
  showArchived: PropTypes.bool,
  setShowArchived: PropTypes.func,
  onChatClick: PropTypes.func,
  onAvatarClick: PropTypes.func,
  onArchive: PropTypes.func,
  onUnarchive: PropTypes.func,
  onToggleMute: PropTypes.func,
  onTogglePin: PropTypes.func,
  onDelete: PropTypes.func,
  selectedChat: PropTypes.object,
  typingUsers: PropTypes.object,
  onlineUsers: PropTypes.instanceOf(Set),
  isLoading: PropTypes.bool,
  onShowFolders: PropTypes.func,
  hasFolders: PropTypes.bool,
  hasArchivedChats: PropTypes.bool,
  activeFolderName: PropTypes.string,
  onAddToFolders: PropTypes.func,
};