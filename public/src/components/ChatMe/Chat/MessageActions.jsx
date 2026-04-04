import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Inlined SVG Icon definitions to remove external dependency
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
  enableReporting = false,
  reportedMessages = [],
  onReport,
  onClose,
  enableCopy = true,
  enableDownload = true,
  onForwardSelected,
  users = [],
  onPin,
  onEdit,
  onDelete,
  onDeleteForEveryone,
  onStar,
  onInfo,
  setEditingMessageId,
  isSwiped = false,
}) => {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Filter users for the forward modal based on search query
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggles user selection in the forward modal
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Handles forwarding the message to selected users
  const handleForwardSelected = () => {
    if (selectedUsers.length > 0) {
      onForwardSelected?.(selectedUsers, message);
      setShowForwardModal(false);
      setSelectedUsers([]);
      setSearchQuery('');
      onClose();
    }
  };

  // Opens the forward modal
  const handleForward = () => {
    setShowForwardModal(true);
  };

  // Closes the forward modal and resets state
  const handleCloseForwardModal = () => {
    setShowForwardModal(false);
    setSelectedUsers([]);
    setSearchQuery('');
  };

  // Shows a "Copied" notification and then closes the main actions modal
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

  // Copies message text to the clipboard
  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text)
        .then(() => {
          setShowCopiedNotification(true);
        })
        .catch(err => {
          console.error('Failed to copy message:', err);
          onClose();
        });
    }
  };

  // Handles downloading a file attached to a message
  const handleDownload = () => {
    const file = message.file;
    if (file) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name || `file_${message.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onClose();
    }
  };

  // Action handlers that call parent functions and close the modal
  const handleReport = () => { onReport?.(message.id); onClose(); };
  const handlePin = () => { onPin?.(message.id); onClose(); };
  const handleEdit = () => { setEditingMessageId?.(message.id); onClose(); };
  const handleDelete = (forEveryone = false) => {
    if (forEveryone) {
      onDeleteForEveryone?.(message.id);
    } else {
      onDelete?.(message.id);
    }
    onClose();
  };
  const handleStar = () => { onStar?.(message.id); onClose(); };
  const handleInfo = () => { onInfo?.(message); onClose(); };

  // Determine permissions for actions
  const isReported = reportedMessages.includes(message.id);
  const hasDownloadableContent = message.file;
  const isCurrentUser = message.sender === currentUser.id;
  const canEdit = isCurrentUser && message.text;
  const canDelete = true;
  const canDeleteForEveryone = isCurrentUser;
  const canPin = true;
  const canStar = true;
  const canViewInfo = true;

  if (isSwiped) {
    return null;
  }

  return (
    <>
     <style>{`
      /* MODERN THEME FOR MESSAGE ACTIONS */
      :root {
        --bg-dark: #131313;
        --secondary-bg-dark: #1f1f1f;
        --header-bg-dark: #2a2a2a;
        --input-bg-dark: #2a2a2a;
        --text-color-dark: #e1e1e1;
        --text-secondary-dark: #8e8e8e;
        --accent-color: #007aff;
        --accent-color-hover: #0056b3;
        --border-color-dark: #3a3a3a;
        --hover-color-dark: #333333;
        --danger-color: #ff3b30;
        --danger-hover-color: #c70000;
        --warning-color: #ffcc00;
        --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }

      .message-actions-container-msgAct {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        font-family: var(--font-family);
      }

      .message-actions-backdrop-msgAct {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        pointer-events: auto;
        animation: fadeIn 0.3s ease;
      }

      .message-actions-modal-msgAct {
        position: relative;
        background-color: var(--secondary-bg-dark);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        pointer-events: auto;
        z-index: 1001;
        animation: zoomIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        width: fit-content;
        max-width: 90vw;
        min-width: 220px;
        border: 1px solid var(--border-color-dark);
      }

      .message-actions-grid-msgAct {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        padding: 12px;
      }

      .action-button-msgAct {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-color-dark);
        text-align: center;
        transition: transform 0.1s ease, background-color 0.2s ease;
        border-radius: 12px;
        aspect-ratio: 1 / 1;
        padding: 8px;
        min-width: 64px;
      }

      .action-button-msgAct:hover {
        background-color: var(--hover-color-dark);
      }

      .action-button-msgAct:active {
        transform: scale(0.92);
        background-color: var(--border-color-dark);
      }

      .action-icon-msgAct {
        width: 22px;
        height: 22px;
        margin-bottom: 6px;
        color: var(--text-secondary-dark);
      }

      .action-button-msgAct span {
        font-size: 11px;
        font-weight: 500;
        line-height: 1.2;
        white-space: nowrap;
      }

      .delete-button-alt-msgAct,
      .delete-button-msgAct {
        color: var(--danger-color);
      }
      .delete-button-alt-msgAct .action-icon-msgAct,
      .delete-button-msgAct .action-icon-msgAct {
        color: var(--danger-color);
      }
      .delete-button-alt-msgAct:hover,
      .delete-button-msgAct:hover {
        background-color: rgba(255, 59, 48, 0.15);
      }

      .starred-msgAct {
        color: var(--warning-color);
      }
      .starred-icon-msgAct {
        color: var(--warning-color);
        fill: var(--warning-color);
      }

      .reported-msgAct {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .delete-options-msgAct {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .delete-options-msgAct h4 {
        color: var(--text-color-dark);
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }
      .delete-options-msgAct .action-button-msgAct {
        flex-direction: row;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px;
        aspect-ratio: unset;
      }
      .delete-options-msgAct .action-icon-msgAct {
        margin-bottom: 0;
      }

      .copy-notification-msgAct {
        padding: 24px;
        color: var(--text-color-dark);
        text-align: center;
        font-size: 14px;
        font-weight: 500;
      }

      .forward-modal-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1002;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
      }

      .forward-modal-backdrop {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        pointer-events: auto;
        animation: fadeIn 0.3s ease;
      }

      .forward-modal {
        position: relative;
        background-color: var(--secondary-bg-dark);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        width: 90%;
        max-width: 420px;
        max-height: 75vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        pointer-events: auto;
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid var(--border-color-dark);
      }

      .forward-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color-dark);
        flex-shrink: 0;
      }

      .forward-modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-color-dark);
      }

      .forward-close-btn {
        background: var(--hover-color-dark);
        border: none;
        color: var(--text-secondary-dark);
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease, transform 0.2s ease;
      }
      .forward-close-btn:hover {
        background-color: var(--border-color-dark);
        transform: rotate(90deg);
      }

      .forward-search {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        border-bottom: 1px solid var(--border-color-dark);
        background-color: var(--bg-dark);
        flex-shrink: 0;
      }
      .search-icon {
        color: var(--text-secondary-dark);
        font-size: 18px;
        margin-right: 12px;
      }
      .search-input {
        flex: 1;
        border: none;
        background: transparent;
        color: var(--text-color-dark);
        font-size: 15px;
        outline: none;
        padding: 8px 0;
      }
      .search-input::placeholder {
        color: var(--text-secondary-dark);
      }

      .forward-users-list {
        flex-grow: 1;
        overflow-y: auto;
        padding: 8px;
      }

      .users-scrollable {
        display: flex;
        flex-direction: column;
      }

      .no-users {
        text-align: center;
        color: var(--text-secondary-dark);
        font-size: 14px;
        padding: 40px 16px;
      }

      .user-selection-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      .user-selection-item:hover {
        background-color: var(--hover-color-dark);
      }
      .user-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--accent-color);
        color: white;
        font-size: 18px;
        font-weight: 500;
        text-transform: uppercase;
      }
      .user-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
      .user-name-container {
        display: flex;
        flex-direction: column;
      }
      .user-name {
        font-size: 15px;
        font-weight: 500;
        color: var(--text-color-dark);
      }
      .user-subtitle {
        font-size: 12px;
        color: var(--text-secondary-dark);
      }

      .custom-checkbox {
        position: relative;
        width: 22px;
        height: 22px;
      }
      .custom-checkbox input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .checkmark {
        position: absolute;
        top: 0;
        left: 0;
        height: 22px;
        width: 22px;
        background-color: transparent;
        border: 2px solid var(--border-color-dark);
        border-radius: 50%;
        transition: all 0.2s ease;
      }
      .custom-checkbox input:checked ~ .checkmark {
        background-color: var(--accent-color);
        border-color: var(--accent-color);
      }
      .checkmark:after {
        content: "";
        position: absolute;
        display: none;
        left: 7px;
        top: 3px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
      .custom-checkbox input:checked ~ .checkmark:after {
        display: block;
      }

      .forward-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-top: 1px solid var(--border-color-dark);
        background-color: var(--bg-dark);
        flex-shrink: 0;
      }

      .selected-users-preview {
          font-size: 14px;
          color: var(--text-secondary-dark);
          font-weight: 500;
      }

      .forward-submit-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border-radius: 20px;
        border: none;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        transition: background-color 0.2s ease, transform 0.1s ease;
        background-color: var(--accent-color);
        color: white;
      }
      .forward-submit-btn:hover {
        background-color: var(--accent-color-hover);
      }
      .forward-submit-btn:active {
        transform: scale(0.95);
      }
      .forward-submit-btn:disabled {
        background-color: var(--hover-color-dark);
        color: var(--text-secondary-dark);
        cursor: not-allowed;
      }
      .forward-submit-btn:disabled:active {
          transform: none;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes zoomIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 480px) {
          .message-actions-grid-msgAct {
              grid-template-columns: repeat(3, 1fr);
          }
      }
    `}</style>
      <div className="message-actions-container-msgAct">
        <div className="message-actions-backdrop-msgAct" onClick={onClose} />
        <div className="message-actions-modal-msgAct">
          {showCopiedNotification ? (
            <div className="copy-notification-msgAct">
              <span>Copied to clipboard!</span>
            </div>
          ) : showDeleteOptions ? (
            <div className="delete-options-msgAct">
              <h4>Delete message?</h4>
              {canDeleteForEveryone && (
                <button
                  className="action-button-msgAct delete-button-msgAct"
                  onClick={() => handleDelete(true)}
                  aria-label="Delete for everyone"
                >
                  <Icon name="trash" className="action-icon-msgAct" />
                  <span>Delete for everyone</span>
                </button>
              )}
              <button
                className="action-button-msgAct delete-button-msgAct"
                onClick={() => handleDelete(false)}
                aria-label="Delete for me"
              >
                <Icon name="trash" className="action-icon-msgAct" />
                <span>Delete for me</span>
              </button>
            </div>
          ) : (
            <div className="message-actions-grid-msgAct">
              <button className="action-button-msgAct" onClick={handleForward} aria-label="Forward message">
                <Icon name="share" className="action-icon-msgAct" />
                <span>Forward</span>
              </button>

              {canPin && (
                <button className="action-button-msgAct" onClick={handlePin} aria-label={message.isPinned ? 'Unpin message' : 'Pin message'}>
                  <Icon name="bookmark" className="action-icon-msgAct" />
                  <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
                </button>
              )}

              {canEdit && (
                <button className="action-button-msgAct" onClick={handleEdit} aria-label="Edit message">
                  <Icon name="edit" className="action-icon-msgAct" />
                  <span>Edit</span>
                </button>
              )}

              {enableCopy && message.text && (
                <button className="action-button-msgAct" onClick={handleCopy} aria-label="Copy message">
                  <Icon name="copy" className="action-icon-msgAct" />
                  <span>Copy</span>
                </button>
              )}

              {enableDownload && hasDownloadableContent && (
                <button className="action-button-msgAct" onClick={handleDownload} aria-label="Download file">
                  <Icon name="download" className="action-icon-msgAct" />
                  <span>Download</span>
                </button>
              )}

              {enableReporting && !isCurrentUser && (
                <button
                  className={`action-button-msgAct ${isReported ? 'reported-msgAct' : ''}`}
                  onClick={handleReport}
                  aria-label={isReported ? 'Already reported' : 'Report message'}
                  disabled={isReported}
                >
                  <Icon name="flag" className="action-icon-msgAct" />
                  <span>{isReported ? 'Reported' : 'Report'}</span>
                </button>
              )}

              {canStar && (
                <button className={`action-button-msgAct ${message.isStarred ? 'starred-msgAct' : ''}`} onClick={handleStar} aria-label={message.isStarred ? 'Unstar message' : 'Star message'}>
                  <Icon name="star" className={`action-icon-msgAct ${message.isStarred ? 'starred-icon-msgAct' : ''}`} />
                  <span>{message.isStarred ? 'Unstar' : 'Star'}</span>
                </button>
              )}

              {canViewInfo && (
                <button className="action-button-msgAct" onClick={handleInfo} aria-label="View message info">
                  <Icon name="info" className="action-icon-msgAct" />
                  <span>Info</span>
                </button>
              )}

              {canDelete && (
                <button
                  className="action-button-msgAct delete-button-alt-msgAct"
                  onClick={() => setShowDeleteOptions(true)}
                  aria-label="Delete message"
                >
                  <Icon name="trash" className="action-icon-msgAct" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Forward Selection Modal */}
      {showForwardModal && (
        <div className="forward-modal-container">
          <div className="forward-modal-backdrop" onClick={handleCloseForwardModal} />
          <div className="forward-modal">
            <div className="forward-modal-header">
              <h3>Forward to...</h3>
              <button onClick={handleCloseForwardModal} className="forward-close-btn" aria-label="Close">
                <Icon name="x" />
              </button>
            </div>
            <div className="forward-search">
              <Icon name="search" className="search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="forward-users-list">
              <div className="users-scrollable">
                {filteredUsers.length === 0 ? (
                  <div className="no-users">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div key={user.uid} className="user-selection-item" onClick={() => toggleUserSelection(user.uid)}>
                      <div className="user-avatar">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.name} />
                        ) : (
                          user.name?.charAt(0) || '?'
                        )}
                      </div>
                      <div className="user-name-container">
                        <span className="user-name">{user.name}</span>
                        <span className="user-subtitle">{user.email || 'No email'}</span>
                      </div>
                      <div className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.uid)}
                          onChange={() => {}}
                          readOnly
                        />
                         <span className="checkmark"></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="forward-actions">
                <div className="selected-users-preview">
                    {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'Select users to forward'}
                </div>
              <button
                className="forward-submit-btn"
                onClick={handleForwardSelected}
                disabled={selectedUsers.length === 0}
              >
                <span>Forward</span>
                 <Icon name="share" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

MessageActions.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string,
    file: PropTypes.shape({
      url: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
    sender: PropTypes.string.isRequired,
    isPinned: PropTypes.bool,
    isStarred: PropTypes.bool,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  }).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    role: PropTypes.string,
  }).isRequired,
  enableReporting: PropTypes.bool,
  enableCopy: PropTypes.bool,
  enableDownload: PropTypes.bool,
  reportedMessages: PropTypes.arrayOf(PropTypes.string),
  onReport: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onForwardSelected: PropTypes.func,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      uid: PropTypes.string.isRequired,
      name: PropTypes.string,
      email: PropTypes.string,
      photoURL: PropTypes.string,
    })
  ),
  onPin: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onDeleteForEveryone: PropTypes.func,
  onStar: PropTypes.func,
  onInfo: PropTypes.func,
  isSwiped: PropTypes.bool,
  setEditingMessageId: PropTypes.func,
};

MessageActions.defaultProps = {
  enableReporting: false,
  enableCopy: true,
  enableDownload: true,
  reportedMessages: [],
  users: [],
  isSwiped: false,
};

export default MessageActions;

