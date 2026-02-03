import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

// Inlined SVG Icon definitions
const icons = {
  share: <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></>,
  edit: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>,
  trash: <><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></>,
  bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></>,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>,
  info: <><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></>,
  search: <><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>,
  reply: <><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></>,
  message: <><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><polyline points="3 7 12 13 21 7"></polyline></>,
};

const Icon = ({ name, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {icons[name]}
  </svg>
);

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(icons)).isRequired,
  className: PropTypes.string,
};

export const MessageActions = ({
  message,
  currentUser,
  group, // Group info for admin check
  onClose,
  onForward,
  onReply,
  onDirectMessage,
  onPin,
  onEdit,
  onDelete,
  onDeleteForEveryone,
  onStar,
  onReact,
  onInfo,
  onCopy,
}) => {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Check if current user is admin
  const isAdmin = group?.createdBy === currentUser?.uid || 
                  group?.admins?.includes(currentUser?.uid) ||
                  false;

  // Check permissions
  const isCurrentUser = message.sender === currentUser?.uid;
  const canEdit = isCurrentUser && message.text && !message.file;
  const canDelete = true;
  const canDeleteForEveryone = isCurrentUser || isAdmin;
  const canPin = isAdmin; // Only admins can pin
  const canReply = true;
  // Disable forwarding for poll messages
  const canForward = !message?.poll;
  const canCopy = Boolean(message.text);
  const canStar = true;
  const canViewInfo = true;
  const canDM = !isCurrentUser; // Only allow DM for messages not sent by me

  // Show copied notification
  useEffect(() => {
    let timer;
    if (showCopiedNotification) {
      timer = setTimeout(() => {
        setShowCopiedNotification(false);
        onClose();
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [showCopiedNotification, onClose]);

  // Copy message text
  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text)
        .then(() => {
          setShowCopiedNotification(true);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          onClose();
        });
    }
  };

  // Action handlers
  const handleReply = () => { onReply?.(message); onClose(); };
  const handleForward = () => { onForward?.(message); onClose(); };
  const handleDirectMessage = () => { onDirectMessage?.(message); onClose(); };
  const handlePin = () => { onPin?.(message.id); onClose(); };
  const handleEdit = () => { onEdit?.(message); onClose(); };
  const handleDelete = (forEveryone = false) => {
    if (forEveryone) {
      onDeleteForEveryone?.(message.id);
    } else {
      onDelete?.(message.id);
    }
    setShowDeleteOptions(false);
    onClose();
  };
  const handleStar = () => { setShowEmojiPicker(true); };
  const handleReact = (emoji) => {
    if (!emoji) return;
    onReact?.(emoji);
    setShowEmojiPicker(false);
    onClose();
  };
  const handleInfo = () => { onInfo?.(message); onClose(); };

  const modal = (
    <>
      <style>{`
        /* GROUP MESSAGE ACTIONS - WHATSAPP STYLE */
        :root {
          --bg-dark: #0b1216;
          --secondary-bg-dark: #1a242c;
          --text-color-dark: #e9edef;
          --text-secondary-dark: #8696a0;
          --accent-color: #00a884;
          --accent-hover: #008f6f;
          --border-color-dark: #2a3942;
          --hover-color-dark: #374850;
          --danger-color: #ff6b6b;
          --warning-color: #ffcc00;
        }

        .group-message-actions-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999999; /* Ensure above all chat content */
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: auto;
        }

        .group-message-actions-backdrop {
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          pointer-events: auto;
          animation: fadeIn 0.2s ease;
          z-index: 999998;
        }

        .group-message-actions-modal {
          position: relative;
          background-color: var(--secondary-bg-dark);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          pointer-events: auto;
          z-index: 1000000;
          animation: slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          width: fit-content;
          max-width: 90vw;
          min-width: 240px;
          border: 1px solid var(--border-color-dark);
        }

        .group-message-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
          gap: 4px;
          padding: 8px;
        }

        .group-action-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-color-dark);
          transition: all 0.2s ease;
          border-radius: 8px;
          padding: 12px 8px;
          min-height: 72px;
        }

        .group-action-button:hover {
          background-color: var(--hover-color-dark);
        }

        .group-action-button:active {
          transform: scale(0.95);
        }

        .group-action-icon {
          width: 24px;
          height: 24px;
          margin-bottom: 6px;
          color: var(--text-secondary-dark);
        }

        .group-action-button span {
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          line-height: 1.2;
        }

        .delete-button-group {
          color: var(--danger-color);
        }
        .delete-button-group .group-action-icon {
          color: var(--danger-color);
        }
        .delete-button-group:hover {
          background-color: rgba(255, 107, 107, 0.15);
        }

        .starred-group {
          color: var(--warning-color);
        }
        .starred-icon-group {
          color: var(--warning-color);
          fill: var(--warning-color);
        }

        .admin-only-badge {
          font-size: 9px;
          background: var(--accent-color);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          margin-top: 2px;
        }

        .delete-options-group {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .delete-options-group h4 {
          color: var(--text-color-dark);
          text-align: center;
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        .delete-options-group .group-action-button {
          flex-direction: row;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          min-height: auto;
        }
        .delete-options-group .group-action-icon {
          margin-bottom: 0;
        }

        .copy-notification-group {
          padding: 20px 32px;
          color: var(--text-color-dark);
          text-align: center;
          font-size: 14px;
          font-weight: 500;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 480px) {
          .group-message-actions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .group-action-button {
            min-height: 68px;
            padding: 10px 6px;
          }
        }
      `}</style>

      <div className="group-message-actionsChatmeGroups-container">
        <div className="group-message-actionsChatmeGroups-backdrop" onClick={onClose} />
        <div className="group-message-actionsChatmeGroups-modal">
          {showCopiedNotification ? (
            <div className="copy-notification-group">
              <span>✓ Copied to clipboard</span>
            </div>
          ) : showEmojiPicker ? (
            <div className="delete-options-group">
              <h4>Quick reactions</h4>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['❤️','👍','😂','😲','😢','🙏'].map(e => (
                  <button key={e} className="group-actionChatmeGroups-button" onClick={() => handleReact(e)}>
                    <span style={{ fontSize: 22 }}>{e}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : showDeleteOptions ? (
            <div className="delete-options-group">
              <h4>Delete message?</h4>
              {canDeleteForEveryone && (
                <button
                  className="group-actionChatmeGroups-button delete-buttonChatmeGroups-group"
                  onClick={() => handleDelete(true)}
                >
                  <Icon name="trash" className="group-actionChatmeGroups-icon" />
                  <span>Delete for everyone</span>
                </button>
              )}
              <button
                className="group-actionChatmeGroups-button delete-buttonChatmeGroups-group"
                onClick={() => handleDelete(false)}
              >
                <Icon name="trash" className="group-actionChatmeGroups-icon" />
                <span>Delete for me</span>
              </button>
            </div>
          ) : (
            <div className="group-message-actionsChatmeGroups-grid">
              {canReply && (
                <button className="group-actionChatmeGroups-button" onClick={handleReply}>
                  <Icon name="reply" className="group-actionChatmeGroups-icon" />
                  <span>Reply</span>
                </button>
              )}

              {canDM && (
                <button className="group-actionChatmeGroups-button" onClick={handleDirectMessage}>
                  <Icon name="message" className="group-actionChatmeGroups-icon" />
                  <span>DM</span>
                </button>
              )}

              {canForward && (
                <button className="group-actionChatmeGroups-button" onClick={handleForward}>
                  <Icon name="share" className="group-actionChatmeGroups-icon" />
                  <span>Forward</span>
                </button>
              )}

              {canPin && (
                <button className="group-actionChatmeGroups-button" onClick={handlePin}>
                  <Icon name="bookmark" className="group-actionChatmeGroups-icon" />
                  <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
                  {isAdmin && <span className="admin-only-badge">ADMIN</span>}
                </button>
              )}

              {canEdit && (
                <button className="group-actionChatmeGroups-button" onClick={handleEdit}>
                  <Icon name="edit" className="group-actionChatmeGroups-icon" />
                  <span>Edit</span>
                </button>
              )}

              {canCopy && (
                <button className="group-actionChatmeGroups-button" onClick={handleCopy}>
                  <Icon name="copy" className="group-actionChatmeGroups-icon" />
                  <span>Copy</span>
                </button>
              )}

              {canStar && (
                <button 
                  className={`group-actionChatmeGroups-button ${message.isStarred ? 'starredChatmeGroups-group' : ''}`}
                  onClick={handleStar}
                >
                  <Icon name="star" className={`group-actionChatmeGroups-icon ${message.isStarred ? 'starredChatmeGroups-icon-group' : ''}`} />
                  <span>React</span>
                </button>
              )}

              {canViewInfo && (
                <button className="group-actionChatmeGroups-button" onClick={handleInfo}>
                  <Icon name="info" className="group-actionChatmeGroups-icon" />
                  <span>Info</span>
                </button>
              )}

              {canDelete && (
                <button
                  className="group-actionChatmeGroups-button delete-buttonChatmeGroups-group"
                  onClick={() => setShowDeleteOptions(true)}
                >
                  <Icon name="trash" className="group-actionChatmeGroups-icon" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};

MessageActions.propTypes = {
  message: PropTypes.object.isRequired,
  currentUser: PropTypes.object.isRequired,
  group: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onForward: PropTypes.func,
  onReply: PropTypes.func,
  onPin: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onDeleteForEveryone: PropTypes.func,
  onStar: PropTypes.func,
  onReact: PropTypes.func,
  onInfo: PropTypes.func,
  onCopy: PropTypes.func,
};

export default MessageActions;
