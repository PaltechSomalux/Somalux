// src/components/chat/LoadingSkeleton.jsx
import React from 'react';
import PropTypes from 'prop-types';

export const LoadingSkeleton = ({ showArchived }) => {
  return (
    <div className="chatme-chats-container">
      <div className="chatme-header">
        <h1>Vibes</h1>
        <div className="chatme-header-search">
          <input type="text" placeholder="Search Vibes..." className="chatme-search-input" disabled />
        </div>
      </div>
      <div className="chatme-chats-list">
        <div className="chatme-all-chats-section">
          <div className="chatme-section-header">
            <span>{showArchived ? 'Archived Users' : 'All Users'}</span>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="chatme-chat-item skeleton">
              <div className="chatme-avatar-container">
                <div className="chatme-avatar-circle skeleton-avatar"></div>
              </div>
              <div className="chatme-chat-info-container">
                <div className="chatme-chat-name-row">
                  <span className="chatme-chat-name skeleton-text"></span>
                  <span className="chatme-chat-time skeleton-text"></span>
                </div>
                <div className="chatme-last-message-row">
                  <span className="chatme-message-text skeleton-text"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

LoadingSkeleton.propTypes = {
  showArchived: PropTypes.bool.isRequired,
};