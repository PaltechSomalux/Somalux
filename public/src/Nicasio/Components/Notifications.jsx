import React, { useState, useRef, useEffect } from 'react';
import moment from 'moment';

export const Notifications = ({ 
  notifications: initialNotifications = [], 
  onMarkAllRead,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    if (onNotificationClick) {
      onNotificationClick(id);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    if (onMarkAllRead) {
      onMarkAllRead();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-wrapper" ref={dropdownRef}>
      <button 
        className="notifications-btn"
        onClick={() => setIsDropdownVisible(!isDropdownVisible)}
      >
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
        🔔
      </button>

      {isDropdownVisible && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <strong>Notifications</strong>
            <button 
              className="link-btn" 
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>
          
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications
                .sort((a, b) => moment(b.date).unix() - moment(a.date).unix())
                .map(notification => (
                  <div 
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="notification-icon">
                      {notification.type === 'warning' ? '⚠' : 
                       notification.type === 'info' ? 'ℹ' : '🔔'}
                    </div>
                    <div className="notification-content">
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {moment(notification.date).fromNow()}
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="empty-notifications">
                No notifications
              </div>
            )}
          </div>
          
          <div className="notifications-footer">
            <button className="link-btn" onClick={() => alert('View all notifications')}>
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};