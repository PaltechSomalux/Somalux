import React from 'react';
import "./NotificationsTab.css";
import { 
  FaBell, 
  FaShoppingCart, 
  FaTag, 
  FaStar, 
  FaComment, 
  FaStore, 
  FaCog,
  FaEllipsisH 
} from 'react-icons/fa';

export const NotificationsTab = ({
  notifications,
  handleMarkNotificationAsRead,
  setNotifications
}) => {
  return (
    <div className="notifications-tab">
      <div className="notifications-header">
        <h2>Notifications</h2>
        <div className="notification-actions">
          <button 
            className="mark-all-read"
            onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
          >
            Mark All as Read
          </button>
          <button className="notification-settings">
            <FaCog /> Settings
          </button>
        </div>
      </div>
      
      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? '' : 'unread'}`}
              onClick={() => handleMarkNotificationAsRead(notification.id)}
            >
              <div className="notification-icon">
                {notification.type === 'order' && <FaShoppingCart />}
                {notification.type === 'promo' && <FaTag />}
                {notification.type === 'review' && <FaStar />}
                {notification.type === 'message' && <FaComment />}
                {notification.type === 'seller' && <FaStore />}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.date).toLocaleDateString()}
                </span>
              </div>
              {!notification.read && <div className="unread-dot"></div>}
              <button className="notification-action">
                <FaEllipsisH />
              </button>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <FaBell size={48} />
            <p>You don't have any notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};