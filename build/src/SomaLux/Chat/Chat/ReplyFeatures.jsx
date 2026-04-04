import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiX } from 'react-icons/fi'; // Only import what's available in Feather Icons
import { FaReply } from 'react-icons/fa'; // Import reply icon from Font Awesome
import './ReplyFeatures.css';

export const ReplyFeatures = ({
  replyingTo,
  setReplyingTo,
  setNewMessage,
  scrollToBottom,
  currentUser,
  contact,
  isMobileView
}) => {
  const [showReplyPreview, setShowReplyPreview] = useState(false);

  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewMessage('');
    if (typeof scrollToBottom === 'function') {
      setTimeout(scrollToBottom, 100);
    }
    setShowReplyPreview(false);
  };

  const handleToggleReplyPreview = () => {
    setShowReplyPreview(!showReplyPreview);
  };

  const getReplyPreviewContent = () => {
    if (!replyingTo) return null;

    const { text = '', senderName = '', timestamp = '' } = replyingTo;
    const isCurrentUserReply = replyingTo.sender === currentUser.id;
    const isFromGroup = !!replyingTo.fromGroup && !!replyingTo.groupName;
    const senderDisplayName = isFromGroup
      ? `From Group(${replyingTo.groupName})`
      : (isCurrentUserReply ? 'You' : senderName || contact.name);

    return (
      <div className="reply-preview-content">
        <div className="reply-preview-header">
          <span className={`reply-sender ${isCurrentUserReply ? 'current-user' : ''}`}>
            {senderDisplayName}
          </span>
          {timestamp && (
            <span className="reply-timestamp">
              {new Date(timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>
        <div className="reply-preview-message">
          {text}
          {replyingTo.file && (
            <div className="reply-preview-file">
              📎 {replyingTo.file.name}
            </div>
          )}
          {replyingTo.audio && (
            <div className="reply-preview-audio">
              🎵 Voice message
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!replyingTo) return null;

  return (
    <div className={`reply-features-container ${isMobileView ? 'mobile' : 'desktop'}`}>
      {/* Compact Reply Indicator */}
      <div className="reply-indicator compact">
        <div className="reply-icon-container">
          <FaReply className="reply-icon" />
          <button
            className="cancel-reply-button compact"
            onClick={handleCancelReply}
            aria-label="Cancel reply"
          >
            <FiX className="cancel-icon" />
          </button>
        </div>
        <div className="compact-reply-text">
          {replyingTo.fromGroup && replyingTo.groupName
            ? `From Group(${replyingTo.groupName})`
            : `Replying to ${replyingTo.senderName || contact.name}`}
        </div>
      </div>

      {/* Expandable Reply Preview */}
      {showReplyPreview && (
        <div className="reply-preview expandable">
          <div className="reply-preview-wrapper">
            {getReplyPreviewContent()}
            <div className="reply-preview-actions">
              <button
                className="preview-action-button"
                onClick={handleToggleReplyPreview}
                aria-label="Collapse reply preview"
              >
                <FiX />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Button for Preview */}
      {!showReplyPreview && (
        <button
          className="show-preview-button"
          onClick={handleToggleReplyPreview}
          aria-label="Show reply preview"
        >
          <FaReply className="preview-toggle-icon" />
          Show preview
        </button>
      )}
    </div>
  );
};

ReplyFeatures.propTypes = {
  replyingTo: PropTypes.object,
  setReplyingTo: PropTypes.func,
  setNewMessage: PropTypes.func,
  scrollToBottom: PropTypes.func,
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }),
  contact: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }),
  isMobileView: PropTypes.bool
};

ReplyFeatures.defaultProps = {
  replyingTo: null,
  isMobileView: false
};