import React, { useRef, useEffect, useState, useMemo } from 'react';
import { FiLock, FiVolumeX, FiVolume2, FiClock, FiTrash2 } from 'react-icons/fi';
import { BiPin, BiArchiveIn, BiArchiveOut, BiFile } from 'react-icons/bi';
import { FaUserCircle } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { MdImage, MdVideocam, MdAudioFile, MdDone, MdDoneAll } from 'react-icons/md';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { parseTimestamp } from '../../utils/parseTimestamp';
import PropTypes from 'prop-types';
import { useLongPress } from './utils/useLongPress';
import './ChatItem.css';
import { getMaskedProfilePhoto } from '../../utils/privacyVisibility';

export const Chat = ({
  chat,
  onClick,
  onAvatarClick,
  onOptionsClick,
  showOptions = false,
  onArchive,
  onUnarchive,
  onToggleMute,
  onTogglePin,
  onToggleLock,
  onDelete,
  onLongPress,
  onSelect,
  isActive = false,
  isSelected = false,
  isSelectionMode = false,
} = {}) => {
  const optionsRef = useRef(null);
  const optionsButtonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  const longPressHandlers = useLongPress(() => {
    onLongPress(chat.uid);
  }, 500);

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    onAvatarClick();
  };

  const handleClick = (e) => {
    if (isSelectionMode) {
      onSelect();
    } else {
      onClick();
    }
  };

  // Memoize timestamp formatting to prevent constant recalculation
  // Use ISO string for stable comparison to avoid floating-point date comparison issues
  const timestampString = useMemo(() => {
    if (!chat.lastMessageTimestamp) return null;
    if (typeof chat.lastMessageTimestamp === 'string') return chat.lastMessageTimestamp;
    if (chat.lastMessageTimestamp instanceof Date) return chat.lastMessageTimestamp.toISOString();
    return null;
  }, [chat.lastMessageTimestamp]);

  const formattedTimestamp = useMemo(() => {
    try {
      if (!timestampString) return '';
      const date = parseTimestamp(timestampString);
      if (isNaN(date.getTime())) {
        return '';
      }
      if (isToday(date)) {
        return format(date, 'h:mm a');
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else if (new Date().getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return format(date, 'EEEE');
      } else {
        return format(date, 'MM/dd/yy');
      }
    } catch (error) {
      return '';
    }
  }, [timestampString]);

  useEffect(() => {
    if (showOptions && optionsButtonRef.current) {
      const buttonRect = optionsButtonRef.current.getBoundingClientRect();
      const menuWidth = 200;
      const menuHeight = 260;
      let left = buttonRect.right - menuWidth;
      let top = buttonRect.bottom;
      if (left < 0) left = 0;
      if (top + menuHeight > window.innerHeight) {
        top = buttonRect.top - menuHeight;
      }
      setMenuPosition({ top, left });
    }
  }, [showOptions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        const isOptionsButton = event.target.closest('.chatme-chat-options-button');
        if (!isOptionsButton && showOptions) {
          if (typeof onOptionsClick === 'function') onOptionsClick();
          setShowDeleteConfirm(false);
        }
      }
    };
    if (showOptions && typeof onOptionsClick === 'function') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions, onOptionsClick]);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    console.log('🗑️ ChatItem: Delete button clicked', { chat });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    console.log('🗑️ ChatItem: handleConfirmDelete triggered');
    console.log('🗑️ ChatItem: Chat object being deleted:', { 
      id: chat.id, 
      chat_id: chat.chat_id,
      name: chat.name || chat.contact_name,
      full_chat: JSON.stringify(chat, null, 2)
    });
    
    // Determine which ID to use for deletion
    const chatIdToDelete = chat.id || chat.chat_id;
    console.log('🗑️ ChatItem: Will delete with chatId:', chatIdToDelete);
    
    if (!chatIdToDelete) {
      console.error('❌ ChatItem: Cannot delete - no valid chat ID found');
      alert('Error: Cannot determine chat ID. Please try again.');
      setShowDeleteConfirm(false);
      return;
    }
    
    setShowDeleteConfirm(false);
    
    // Call the onDelete handler with the determined chat ID
    if (typeof onDelete === 'function') {
      console.log('✅ ChatItem: Calling onDelete with:', chatIdToDelete);
      onDelete(chatIdToDelete);
    } else {
      console.error('❌ ChatItem: onDelete is not a function');
    }
    
    onOptionsClick();
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const renderMessageStatus = () => {
    // Don't show ticks if locked or typing
    if (chat.isLocked || chat.isTyping) {
      return null;
    }

    // Show blue ticks for self-chat (always read)
    if (chat.isCurrent && chat.lastMessageSenderId === chat.currentUserUid) {
      return (
        <span
          className="chatme-status-indicator chatme-status-read"
          aria-label="Message read"
        >
          <MdDoneAll size={14} />
        </span>
      );
    }

    // Only show ticks for outgoing messages (you sent it)
    if (chat.lastMessageSenderId === chat.currentUserUid) {
      const status = (chat.lastMessageStatus || 'delivered').toLowerCase();
      
      if (status === 'read') {
        return (
          <span
            className="chatme-status-indicator chatme-status-read"
            aria-label="Message read"
          >
            <MdDoneAll size={14} />
          </span>
        );
      } else if (status === 'delivered') {
        return (
          <span
            className="chatme-status-indicator chatme-status-delivered"
            aria-label="Message delivered"
          >
            <MdDoneAll size={14} />
          </span>
        );
      } else {
        // sent status
        return (
          <span
            className="chatme-status-indicator chatme-status-sent"
            aria-label="Message sent"
          >
            <MdDone size={14} />
          </span>
        );
      }
    }

    // Incoming messages - no ticks
    return null;
  };

  const renderMuteIcon = () => {
    if (
      chat.isLocked ||
      chat.isTyping ||
      chat.isCurrent ||
      (chat.lastMessageSenderUid && chat.lastMessageSenderUid !== chat.currentUserUid)
    ) {
      return null;
    }

    return chat.isMuted ? (
      <FiVolumeX className="chatme-muted-icon" />
    ) : (
      <FiVolume2 className="chatme-unmuted-icon" />
    );
  };

  const renderLastMessage = () => {
    if (!chat.lastMessage) {
      return <span className="chatme-message-text chatme-no-message">No messages yet</span>;
    }

    // Extract message text after emoji for media messages
    const extractMediaText = (msg) => {
      // Remove emoji prefix and return the rest (e.g., "🖼 Check this!" → "Check this!")
      return msg.replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/, '').trim();
    };

    // Check for media icons (Photo, Video, Audio, File)
    if (chat.lastMessage.includes('🖼') || chat.lastMessage.includes('Photo')) {
      const mediaText = extractMediaText(chat.lastMessage);
      return (
        <span className="chatme-message-text chatme-media-message">
          <MdImage className="chatme-media-icon-svg" title="Photo" />
          <span className="chatme-media-text">{mediaText || 'Photo'}</span>
        </span>
      );
    } else if (chat.lastMessage.includes('🎥') || chat.lastMessage.includes('Video')) {
      const mediaText = extractMediaText(chat.lastMessage);
      return (
        <span className="chatme-message-text chatme-media-message">
          <MdVideocam className="chatme-media-icon-svg" title="Video" />
          <span className="chatme-media-text">{mediaText || 'Video'}</span>
        </span>
      );
    } else if (chat.lastMessage.includes('🎵') || chat.lastMessage.includes('Audio')) {
      const mediaText = extractMediaText(chat.lastMessage);
      return (
        <span className="chatme-message-text chatme-media-message">
          <MdAudioFile className="chatme-media-icon-svg" title="Audio" />
          <span className="chatme-media-text">{mediaText || 'Audio'}</span>
        </span>
      );
    } else if (chat.lastMessage.includes('📎') || chat.lastMessage.includes('File')) {
      const mediaText = extractMediaText(chat.lastMessage);
      return (
        <span className="chatme-message-text chatme-media-message">
          <BiFile className="chatme-media-icon-svg" title="File" />
          <span className="chatme-media-text">{mediaText || 'File'}</span>
        </span>
      );
    }

    // If message starts with "You:", style it differently
    if (chat.lastMessage.startsWith('You:')) {
      const messageContent = chat.lastMessage.substring(5).trim(); // Remove "You: "
      return (
        <span className="chatme-message-text chatme-your-message">
          <span className="chatme-message-prefix">You:</span>
          <span>{messageContent}</span>
        </span>
      );
    }

    return <span className="chatme-message-text">{chat.lastMessage}</span>;
  };

  useEffect(() => {
    // Log when chat data changes (first 2 items only)
    const sampleCount = parseInt(chat.uid?.toString().charCodeAt(0) || 0) % 2;
    if (sampleCount === 0) {
      console.log(`📌 ChatItem: Render for ${chat.uid} (${chat.name}):`, {
        lastMessage: chat.lastMessage ? chat.lastMessage.substring(0, 50) : '(none)',
        lastMessageTimestamp: chat.lastMessageTimestamp?.toISOString?.() || chat.lastMessageTimestamp,
        formattedTimestamp,
        timestamp_type: typeof chat.lastMessageTimestamp,
        message_exists: !!chat.lastMessage
      });
    }
  }, [chat.uid, chat.name, chat.lastMessage, chat.lastMessageTimestamp, formattedTimestamp]);

  return (
    <div
      className={`chatme-chat-item 
        ${chat.isPinned ? 'chatme-pinned' : ''} 
        ${chat.isArchived ? 'chatme-archived' : ''} 
        ${isActive ? 'active-chat' : ''} 
        ${isSelected ? 'chatme-selected' : ''} 
        ${isSelectionMode ? 'selection-mode' : ''}`}
      {...longPressHandlers}
      onClick={handleClick}
    >
      {isSelectionMode && (
        <div className="chatme-checkbox-container">
          <input
            type="checkbox"
            className="chatme-checkbox"
            checked={isSelected}
            onChange={() => onSelect()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="chatme-chat-content">
        <div className="chatme-avatar-container">
          {(() => {
            const maskedPhoto = getMaskedProfilePhoto(
              chat.photoURL,
              chat.targetPrivacy || {},
              !!chat.isContact
            );
            const photoToUse = maskedPhoto || '';
            const isCurrent = chat.isCurrent;
            if (photoToUse && photoToUse !== 'https://cdn-icons-png.flaticon.com/512/847/847969.png') {
              return (
                <>
                  <div className="chatme-avatar-image-wrapper" onClick={handleAvatarClick}>
                    {!imageError && getMaskedProfilePhoto(chat.photoURL, chat.targetPrivacy || {}, !!chat.isContact) ? (
                      <img
                        src={getMaskedProfilePhoto(chat.photoURL, chat.targetPrivacy || {}, !!chat.isContact)}
                        alt={chat.name}
                        className={`chatme-avatar-image ${chat.isCurrent ? 'chatme-avatar-you' : ''}`}
                        onError={() => {
                          console.warn('ChatItem.jsx: Failed to load profile picture:', chat.photoURL);
                          setImageError(true);
                        }}
                      />
                    ) : (
                      <FaUserCircle className="chatme-avatar-fallback-icon" />
                    )}
                  </div>
                  {chat.isCurrent && (
                    <span className="chatme-avatar-plus">+</span>
                  )}
                  {!chat.isCurrent && chat.isOnline && (
                    <span className="chatme-online-dot"></span>
                  )}
                  {((chat.hasDisappearingActive) || (chat.disappearingDays > 0)) && (
                    <span className="chatme-disappearing-badge" title="Disappearing messages">
                      <FiClock size={10} />
                    </span>
                  )}
                </>
              );
            } else {
              return (
                <>
                  <div
                    className={`chatme-avatar-circle ${!chat.isCurrent && chat.isOnline ? 'chatme-online' : ''}`}
                    onClick={handleAvatarClick}
                  >
                    <span>{(chat.name || chat.contact_name || 'U').charAt(0).toUpperCase()}</span>
                  </div>
                  {chat.isCurrent && (
                    <span className="chatme-avatar-plus">+</span>
                  )}
                  {!chat.isCurrent && chat.isOnline && (
                    <span className="chatme-online-dot"></span>
                  )}
                  {((chat.hasDisappearingActive) || (chat.disappearingDays > 0)) && (
                    <span className="chatme-disappearing-badge" title="Disappearing messages">
                      <FiClock size={10} />
                    </span>
                  )}
                </>
              );
            }
          })()}
        </div>

        <div className="chatme-chat-info-container">
          <div className="chatme-chat-name-row">
            <span className="chatme-chat-name">
              {chat.name || chat.contact_name || 'Unknown User'}
              {chat.isLocked && <FiLock className="chatme-lock-icon" />}
              {chat.isPinned && <BiPin className="chatme-pin-icon" />}
            </span>
            {!chat.isLocked && (
              <span className="chatme-chat-time">
                {formattedTimestamp}
              </span>
            )}
          </div>

          <div className={`chatme-last-message-row ${chat.isLocked ? 'locked' : ''}`}>
            <div className="chatme-last-message">
              {chat.isTyping && !chat.isLocked ? (
                <span className="chatme-typing-indicator">
                  <span className="chatme-typing-dot"></span>
                  <span className="chatme-typing-dot"></span>
                  <span className="chatme-typing-dot"></span>
                  <span className="chatme-typing-text">typing...</span>
                </span>
              ) : (
                <>
                  {renderMessageStatus()}
                  {renderLastMessage()}
                </>
              )}
            </div>

            {chat.unreadCount > 0 && !chat.isCurrent && !chat.isLocked && (
              <span className="chatme-unread-count chatme-unread-count-lowercase">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isSelectionMode && typeof onOptionsClick === 'function' && (
        <div className="chatme-options-wrapper">
          <button
            ref={optionsButtonRef}
            className="chatme-chat-options-button"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onOptionsClick === 'function') onOptionsClick();
            }}
          >
            <BsThreeDotsVertical />
          </button>
          {showOptions && (
            <div
              className="chatme-chat-options-menu"
              ref={optionsRef}
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            >
              <button
                className="chatme-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute();
                  if (typeof onOptionsClick === 'function') onOptionsClick();
                }}
              >
                <div className="chatme-menu-icon-wrapper">
                  {chat.isMuted ? <FiVolume2 /> : <FiVolumeX />}
                </div>
                <div className="chatme-menu-text-wrapper">{chat.isMuted ? 'Unmute' : 'Mute'}</div>
              </button>
              <button
                className="chatme-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                  if (typeof onOptionsClick === 'function') onOptionsClick();
                }}
              >
                <div className="chatme-menu-icon-wrapper">
                  <BiPin />
                </div>
                <div className="chatme-menu-text-wrapper">{chat.isPinned ? 'Unpin' : 'Pin'}</div>
              </button>
              <button
                className="chatme-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock();
                }}
              >
                <div className="chatme-menu-icon-wrapper">
                  <FiLock />
                </div>
                <div className="chatme-menu-text-wrapper">{chat.isLocked ? 'Unlock' : 'Lock'}</div>
              </button>
              <button
                className="chatme-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  chat.isArchived ? onUnarchive() : onArchive();
                  if (typeof onOptionsClick === 'function') onOptionsClick();
                }}
              >
                <div className="chatme-menu-icon-wrapper">
                  {chat.isArchived ? <BiArchiveOut /> : <BiArchiveIn />}
                </div>
                <div className="chatme-menu-text-wrapper">{chat.isArchived ? 'Unarchive' : 'Archive'}</div>
              </button>
              {!chat.isCurrent && !chat.isLocked && (
                <button className="chatme-menu-button chatme-delete-button" onClick={handleDeleteClick}>
                  <div className="chatme-menu-icon-wrapper">
                    <FiTrash2 />
                  </div>
                  <div className="chatme-menu-text-wrapper">Delete User</div>
                </button>
              )}
              {showDeleteConfirm && !chat.isCurrent && !chat.isLocked && (
                <div className="chatme-delete-confirmation">
                  <div className="chatme-delete-confirm-content">
                    <FiTrash2 className="chatme-delete-confirm-icon" />
                    <h3>Delete User?</h3>
                    <p>
                      This action cannot be undone. Are you sure you want to delete
                      <strong> {chat.name || chat.contact_name || 'this user'}</strong> from your chat list?
                    </p>
                    <div className="chatme-delete-confirm-buttons">
                      <button className="chatme-confirm-cancel-btn" onClick={handleCancelDelete}>
                        Cancel
                      </button>
                      <button className="chatme-confirm-delete-btn" onClick={handleConfirmDelete}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

Chat.propTypes = {
  chat: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    photoURL: PropTypes.string,
    lastMessage: PropTypes.string,
    lastMessageTimestamp: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]),
    lastMessageStatus: PropTypes.oneOf(['sent', 'delivered', 'read']),
    lastMessageSenderUid: PropTypes.string,
    currentUserUid: PropTypes.string,
    isCurrent: PropTypes.bool,
    isPinned: PropTypes.bool,
    isArchived: PropTypes.bool,
    isMuted: PropTypes.bool,
    isLocked: PropTypes.bool,
    isOnline: PropTypes.bool,
    isTyping: PropTypes.bool,
    unreadCount: PropTypes.number,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  onAvatarClick: PropTypes.func.isRequired,
  onOptionsClick: PropTypes.func,
  showOptions: PropTypes.bool,
  onArchive: PropTypes.func,
  onUnarchive: PropTypes.func,
  onToggleMute: PropTypes.func,
  onTogglePin: PropTypes.func,
  onToggleLock: PropTypes.func,
  onDelete: PropTypes.func.isRequired,
  onLongPress: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  isActive: PropTypes.bool,
  isSelected: PropTypes.bool.isRequired,
  isSelectionMode: PropTypes.bool.isRequired,
};

// Memoize ChatItem to prevent unnecessary re-renders when props haven't changed
// Only re-render if chat data or event handlers actually change
export const ChatItem = React.memo(Chat);
export default ChatItem;