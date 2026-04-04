import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, isToday, isYesterday, differenceInMinutes, isSameDay } from 'date-fns';
import { MessageActions } from './MessageActions';
import { parseFormattedText, parseFormattedTextWithMembers } from './TextFormatter';
import "./Message.css";
import "./TextFormatter.css";

export const Message = ({
  message = {},
  currentUser = {},
  group = {}, // Add group for admin check
  senderInfo = null,
  isSelectionMode = false,
  isSelected = false,
  onSelectToggle = () => {},
  showOptionsFor,
  onOptionsToggle = () => {},
  onReply = () => {},
  onForward = () => {},
  onDirectMessage = () => {},
  onEdit = () => {},
  onPinToggle = () => {},
  onStarToggle = () => {},
  onDelete = () => {},
  onDeleteForEveryone = () => {},
  onReactionAdd = () => {},
  showInfoFor,
  infoDetails,
  renderContent,
  isLastMessage,
  scrollToBottom,
  previousMessage,
  nextMessage,
  onSenderClick = () => {},
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const messageRef = useRef(null);
  const longPressTimer = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const [reactionDetails, setReactionDetails] = useState(null); // { emoji }
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Check if message is from current user (compare with uid or id)
  const isCurrentUser = message?.sender === currentUser?.uid || message?.sender === currentUser?.id;
  const isSystem = message?.type === 'system' || message?.sender === 'system';

  // Helper to safely convert various timestamp shapes to JS Date
  const toSafeDate = (ts) => {
    if (!ts) return null;
    if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate();
    if (typeof ts === 'number') return new Date(ts);
    return new Date(ts);
  };

  const getSystemDateLabel = (ts) => {
    const d = toSafeDate(ts);
    if (!d || isNaN(d.getTime())) return '';
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d, h:mm a');
  };

  // WhatsApp-style consecutive message detection
  const isConsecutiveOutgoing = previousMessage &&
    isCurrentUser &&
    previousMessage.sender === currentUser.id &&
    differenceInMinutes(new Date(message.timestamp), new Date(previousMessage.timestamp)) < 2 &&
    isSameDay(new Date(message.timestamp), new Date(previousMessage.timestamp));

  const isConsecutiveIncoming = previousMessage &&
    !isCurrentUser &&
    previousMessage.sender === message.sender &&
    differenceInMinutes(new Date(message.timestamp), new Date(previousMessage.timestamp)) < 2 &&
    isSameDay(new Date(message.timestamp), new Date(previousMessage.timestamp));

  // Show avatar ONLY for non-consecutive incoming messages
  const showAvatar = !isSystem && !isCurrentUser && !isConsecutiveIncoming;

  // Show sender name only on day change or first message of sender for incoming messages
  const showSenderName = !isCurrentUser && (
    !previousMessage ||
    previousMessage.sender !== message.sender ||
    !isSameDay(new Date(message.timestamp), new Date(previousMessage.timestamp))
  );

  const formatTime = (date) => {
    return format(new Date(date), 'h:mm a');
  };

  const formatDate = (date) => {
    if (isToday(new Date(date))) return 'Today';
    if (isYesterday(new Date(date))) return 'Yesterday';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Handle desktop right-click
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!isSelectionMode && message?.id) {
      setShowActions(true);
    }
  };

  // Handle mobile touch for both long-press AND swipe-to-reply
  const handleTouchStart = (e) => {
    if (isSelectionMode) return;
    const touch = e.touches[0];
    swipeStartX.current = touch.clientX;
    swipeStartY.current = touch.clientY;
    setTouchStart({ x: touch.clientX, y: touch.clientY, time: Date.now() });
    
    // Long press timer for actions
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
      setIsSwiping(false);
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStartX.current;
    const deltaY = Math.abs(touch.clientY - swipeStartY.current);
    
    // If vertical movement > horizontal, it's scrolling, not swiping
    if (deltaY > 20) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }
    
    // Horizontal swipe detected
    if (Math.abs(deltaX) > 10) {
      // Cancel long press
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      
      // Only allow right swipe (positive deltaX) up to 80px
      if (deltaX > 0 && deltaX <= 80) {
        setIsSwiping(true);
        setSwipeOffset(deltaX);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // If swiped more than 60px, trigger reply
    if (swipeOffset > 60) {
      onReply(message);
      // Vibrate for feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }
    
    // Reset swipe
    setIsSwiping(false);
    setSwipeOffset(0);
    setTouchStart(null);
  };

  // Handle desktop click (double-click for actions)
  const handleDoubleClick = (e) => {
    if (!isSelectionMode && message?.id) {
      setShowActions(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleSenderClick = (e) => {
    e.stopPropagation();
    if (!isCurrentUser && message?.sender) {
      onSenderClick(message.sender, message.senderName);
    }
  };

  const handleReaction = (emoji) => {
    if (message?.id) {
      onReactionAdd(message.id, emoji);
      onOptionsToggle(null);
    }
  };

  const handleDelete = () => {
    if (message?.id) {
      onDelete(message.id);
      setShowDeleteConfirm(false);
    }
  };

  const statusIndicator = () => {
    if (!isCurrentUser || isConsecutiveOutgoing) return null;

    const status = message?.status;
    if (status === 'sent') return <span className="status-sent">✓</span>;
    if (status === 'delivered') return <span className="status-delivered">✓✓</span>;
    if (status === 'read') return <span className="status-read">✓✓</span>;
    return null;
  };

  // Generate consistent color based on name
  const getAvatarColor = (name) => {
    if (!name) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    ];
    
    // Generate hash from name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (!message || !message.id) {
    return null;
  }

  // Render system messages as a distinct full-width banner (not a sent/received bubble)
  if (isSystem) {
    return (
      <div className="system-message-row">
        <div className="system-message">
          <div className="system-message-text">{message?.text}</div>
          {message?.timestamp && (
            <div className="system-message-date">{getSystemDateLabel(message.timestamp)}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      id={`message-${message.id}`}
      className={`message-row ${isCurrentUser ? 'outgoing-row' : 'incoming-row'} ${isSwiping ? 'swiping' : ''}`}
      style={{
        transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : 'translateX(0)',
        transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Selection checkbox - WhatsApp style */}
      {isSelectionMode && (
        <div
          className="message-selector"
          onClick={(e) => {
            e.stopPropagation();
            if (message?.id) onSelectToggle(message.id);
          }}
        >
          <div className={`selector-circle ${isSelected ? 'selected' : ''}`}>
            {isSelected && <span>✓</span>}
          </div>
        </div>
      )}

      {/* Avatar - Only for non-consecutive incoming messages */}
      {showAvatar && (
        <div
          className="message-avatar"
          onClick={handleSenderClick}
          title={`Click to view ${message?.senderName || 'sender'} profile`}
        >
          <div className="avatar clickable">
            { (message?.senderImage || (senderInfo && senderInfo.photoURL)) && !avatarFailed ? (
              <img
                src={message.senderImage || senderInfo.photoURL}
                alt={message.senderName || 'User'}
                className="avatar-image"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span 
                className="avatar-initial"
                style={{ background: getAvatarColor(message.senderName || (senderInfo && (senderInfo.display_name || senderInfo.displayName)) || 'User') }}
                title={message.senderName || (senderInfo && (senderInfo.display_name || senderInfo.displayName || senderInfo.email)) || 'User'}
              >
                {(message.senderName || (senderInfo && (senderInfo.display_name || senderInfo.displayName || senderInfo.email)) || 'U').charAt(0).toUpperCase()}
              </span>
            )}

        {/* Reaction details modal */}
        {reactionDetails && createPortal(
          (
            <div
              className="reaction-details-overlay"
              onClick={(e) => {
                if (e.target.classList.contains('reaction-details-overlay')) {
                  setReactionDetails(null);
                }
              }}
              onKeyDown={(e) => { if (e.key === 'Escape') setReactionDetails(null); }}
              tabIndex={-1}
            >
              <div className="reaction-details-modal">
                <div className="reaction-details-header">
                  <span>Reactions {reactionDetails.emoji}</span>
                  <button className="reaction-details-close" onClick={() => setReactionDetails(null)}>✕</button>
                </div>
                <div className="reaction-details-list">
                  {(() => {
                    const map = message.reactions || {};
                    const emoji = reactionDetails.emoji;
                    const users = Object.entries(map)
                      .filter(([, em]) => em === emoji)
                      .map(([uid]) => {
                        if (uid === (currentUser?.uid || currentUser?.id)) {
                          return { uid, name: 'You', isSelf: true };
                        }
                        const member = group?.members?.find(m => m.uid === uid);
                        return { uid, name: member?.name || uid, isSelf: false };
                      });
                    // current user first
                    users.sort((a, b) => (a.isSelf === b.isSelf) ? a.name.localeCompare(b.name) : (a.isSelf ? -1 : 1));
                    return users.map(u => (
                      <div key={u.uid} className="reaction-details-item">
                        <span className="reaction-details-name">{u.name}</span>
                        <div className="reaction-details-right">
                          <span className="reaction-details-emoji">{emoji}</span>
                          {u.isSelf && (
                            <button
                              className="reaction-remove-self"
                              title="Remove your reaction"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReactionAdd(message.id, emoji); // toggles off
                                setReactionDetails(null);
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ),
          document.body
        )}
          </div>
        </div>
      )}

      {/* Spacer for consecutive incoming messages */}
      {!showAvatar && !isCurrentUser && (
        <div className="message-avatar-spacer"></div>
      )}

      {/* Main content wrapper */}
      <div
        ref={messageRef}
        className={`message-content-wrapper 
          ${isCurrentUser ? 'outgoing' : 'incoming'} 
          ${isSelected ? 'selected' : ''} 
          ${isConsecutiveOutgoing || isConsecutiveIncoming ? 'consecutive' : ''}`}
        onClick={() => isSelectionMode && message?.id ? onSelectToggle(message.id) : null}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        data-message-id={message?.id}
      >
        {/* Pinned indicator */}
        {message?.pinned && !isSystem && (
          <div className="message-pin-indicator">
            📌
          </div>
        )}

        {/* Sender name */}
        {showSenderName && !isCurrentUser && !isSystem && (
          <div className="message-sender-name">
            {message?.senderName || (senderInfo && (senderInfo.display_name || senderInfo.displayName || senderInfo.email?.split('@')[0])) || message?.sender}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`message-bubble 
            ${message?.type === 'system' ? 'system' : ''} 
            ${isConsecutiveOutgoing || isConsecutiveIncoming ? 'compact' : ''}
            ${message?.edited ? 'edited' : ''}`}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          onClick={(e) => {
            const target = e.target.closest('.formatted-mention');
            if (target) {
              e.stopPropagation();
              const name = target.getAttribute('data-mention-name');
              if (!name || name.toLowerCase() === 'all') return;
              const members = Array.isArray(group?.members) ? group.members : [];
              const match = members.find(m => {
                const nm = m.name || m.displayName || (m.email ? m.email.split('@')[0] : '');
                return nm && nm.toString().toLowerCase() === name.toLowerCase();
              });
              if (match) {
                const id = match.uid || match.id;
                const nm = match.name || match.displayName || name;
                if (id) onSenderClick(id, nm);
              }
            }
          }}
        >
          {/* Forwarded indicator inside bubble */}
          {message?.forwarded && !isSystem && (
            <div className="message-forwarded-label" title="Forwarded">Forwarded</div>
          )}

          {/* Reply preview inside bubble */}
          {message?.replyTo && !isSystem && (
            <div
              className="message-reply-preview"
              role="button"
              tabIndex={0}
              title="Go to replied message"
              onClick={() => {
                const targetId = message.replyTo?.id;
                if (!targetId) return;
                const el = document.getElementById(`message-${targetId}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.classList.add('pinned-highlight');
                  setTimeout(() => {
                    el.classList.remove('pinned-highlight');
                  }, 2000);
                }
              }}
            >
              <div className="reply-line"></div>
              <div className="reply-header">
                <span className="reply-avatar">
                  {message.replyTo.senderName ? message.replyTo.senderName.charAt(0).toUpperCase() : '?'}
                </span>
                {message.replyTo.senderName || 'Unknown'}
              </div>
              <div className="reply-content">
                {message.replyTo.text?.substring(0, 50) ||
                  (message.replyTo.file ? `📎 ${message.replyTo.file.name}` : '') ||
                  (message.replyTo.audio ? '🎤 Voice message' : '')}
                {message.replyTo.text && message.replyTo.text.length > 50 && '...'}
              </div>
            </div>
          )}

          {renderContent ? renderContent(message) : (
            <>
              {/* System message renders as plain centered text */}
              {isSystem ? (
                <div className="message-text formatted-text-container">
                  {message?.text}
                </div>
              ) : null}
              {/* Text message with formatting */}
              {!isSystem && message?.text && (
                <div className="message-text formatted-text-container">
                  {parseFormattedTextWithMembers(message.text, group?.members || [])}
                  {message?.edited && <span className="edited-indicator"> • Edited</span>}
                </div>
              )}

              {/* File attachment */}
              {!isSystem && message?.file && (
                <div className="message-file">
                  {message.file.type.startsWith('image/') ? (
                    <div className="image-preview">
                      <img
                        src={message.file.url || message.file.preview}
                        alt={message.file.name}
                        onClick={() => window.open(message.file.url, '_blank')}
                      />
                      <div className="image-overlay">
                        <span className="file-name">{message.file.name}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="file-icon">📎</div>
                      <div className="file-info">
                        <div className="file-name">{message.file.name}</div>
                        <div className="file-size">
                          {Math.round(message.file.size / 1024)} KB
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Audio message */}
              {!isSystem && message?.audio && (
                <div className="message-audio">
                  <div className="audio-player">
                    <button className="play-button">▶️</button>
                    <div className="audio-progress">
                      <div className="progress-bar"></div>
                    </div>
                    <div className="audio-duration">{message.audio.duration}s</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Message meta */}
          {!isSystem && (
            <div className="message-meta">
              <span className="message-time">
                {message?.timestamp ? formatTime(message.timestamp) : ''}
              </span>
              {statusIndicator()}
            </div>
          )}

          {/* Reactions */}
          {!isSystem && (message?.reactionsCounts && Object.keys(message.reactionsCounts).length > 0) && (
            <div className="message-reactions">
              {Object.entries(message.reactionsCounts)
                .sort(([a], [b]) => ['❤️','👍','😂','😲','😢','🙏'].indexOf(a) - ['❤️','👍','😂','😲','😢','🙏'].indexOf(b))
                .map(([emoji, count]) => (
                  <button
                    key={emoji}
                    type="button"
                    className="reaction-bubble"
                    onClick={(e) => { e.preventDefault(); setReactionDetails({ emoji }); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setReactionDetails({ emoji }); } }}
                    aria-label={`View who reacted with ${emoji}`}
                    title="View who reacted"
                  >
                    {emoji}
                    {count > 0 && <span className="reaction-count">{count}</span>}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Modern Message Actions */}
        {showActions && (
          <MessageActions
            message={message}
            currentUser={currentUser}
            group={group}
            onClose={() => setShowActions(false)}
            onReact={(emoji) => handleReaction(emoji)}
            onReply={(msg) => {
              onReply(msg);
              setShowActions(false);
            }}
            onForward={(msg) => {
              onForward(msg);
              setShowActions(false);
            }}
            onDirectMessage={(msg) => {
              onDirectMessage(msg);
              setShowActions(false);
            }}
            onPin={(msgId) => {
              onPinToggle(msgId);
              setShowActions(false);
            }}
            onEdit={(msg) => {
              onEdit(msg);
              setShowActions(false);
            }}
            onDelete={(msgId) => {
              onDelete(msgId);
              setShowActions(false);
            }}
            onDeleteForEveryone={(msgId) => {
              onDeleteForEveryone(msgId);
              setShowActions(false);
            }}
            onStar={(msgId) => {
              onStarToggle(msgId);
              setShowActions(false);
            }}
            onInfo={(msg) => {
              // Show info logic
              setShowActions(false);
            }}
          />
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="delete-confirmation">
          <div className="confirmation-dialog">
            <div className="dialog-header">
              <span>🗑️</span>
              <h4>Delete message?</h4>
            </div>
            <div className="dialog-body">
              <p>Delete this message for everyone?</p>
            </div>
            <div className="dialog-actions">
              <button
                className="cancel-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message info panel */}
      {showInfoFor === message?.id && infoDetails && (
        <div className="message-info-panel">
          <div className="info-header">
            <h4>Message info</h4>
            <button
              className="close-btn"
              onClick={() => onOptionsToggle(null)}
            >
              ✕
            </button>
          </div>

          <div className="info-timestamp">
            {message?.timestamp ? `${formatDate(message.timestamp)} ${formatTime(message.timestamp)}` : ''}
            {message?.edited && <span className="edited-note"> (edited)</span>}
          </div>

          <div className="info-status">
            <span className={`status-icon ${message?.status}`}>{statusIndicator()}</span>
            <span>{message?.status?.charAt(0).toUpperCase() + message?.status?.slice(1)}</span>
          </div>

          {infoDetails.readBy?.length > 0 && (
            <div className="read-receipts">
              <h5>Read by</h5>
              <div className="receipt-list">
                {infoDetails.readBy.map(user => (
                  <div key={user.id} className="receipt-item">
                    <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                      <div className="user-name">{user.name}</div>
                      <div className="read-time">{formatTime(user.readAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Swipe-to-Reply Icon */}
      {isSwiping && swipeOffset > 20 && (
        <div 
          className="swipe-reply-icon"
          style={{
            opacity: Math.min(swipeOffset / 60, 1),
            left: isCurrentUser ? 'auto' : '10px',
            right: isCurrentUser ? '10px' : 'auto'
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
          </svg>
        </div>
      )}

      {isLastMessage && <div ref={scrollToBottom} />}
    </div>
  );
};