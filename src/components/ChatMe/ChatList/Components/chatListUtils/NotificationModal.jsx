// src/components/chat/NotificationModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FiX } from 'react-icons/fi';

export const NotificationModal = ({ show, onClose, notifications, addUserToChatList, markAsSeen }) => {
  if (!show) return null;

  return (
    <div className="chatme-modal-overlay" onClick={onClose}>
      <div className="chatme-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chatme-modal-header">
          <h3>New Messages from Unknown Users</h3>
          <button className="chatme-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="chatme-modal-content">
          <p className="directive-text">
            You have new messages from users not in your chatlist. You can also manually add these users in New Chats.
          </p>
          {notifications.length > 0 ? (
            notifications.map((notif, index) => (
              <div
                key={notif.uid}
                className="notification-user-item"
                style={{ '--stagger-delay': `${index * 0.1}s` }}
              >
                <img
                  src={notif.photoURL}
                  alt={notif.name}
                  className="notification-avatar"
                  onError={(e) => (e.target.src = 'https://cdn-icons-png.flaticon.com/512/847/847969.png')}
                />
                <div className="notification-info">
                  <h4>{notif.name}</h4>
                  <p>{notif.email}</p>
                  <span className="unread-count">
                    {notif.count} new message{notif.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="notification-actions">
                  <button
                    className="add-btn"
                    onClick={() => {
                      addUserToChatList(notif);
                      onClose();
                    }}
                  >
                    Add
                  </button>
                  <button className="seen-btn" onClick={() => markAsSeen(notif)}>
                    Seen
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No new notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

NotificationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  notifications: PropTypes.array.isRequired,
  addUserToChatList: PropTypes.func.isRequired,
  markAsSeen: PropTypes.func.isRequired,
};