import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { FiBell, FiEye, FiEyeOff, IoMdNotifications, IoMdNotificationsOff } from 'react-icons/fi';
import "./ContactInfoPanel.css";
export const ContactInfoPanel = ({
  contact,
  notificationSettings,
  toggleNotificationSetting,
  onClose
}) => {
  return (
    <div className="contact-info-panel floating-panel">
      <div className="contact-info-header">
        <h2>{contact.name}</h2>
        <p>{contact.status === 'online' ? 'Online' : `Last seen ${format(contact.lastSeen, 'h:mm a, MMMM d')}`}</p>
      </div>
      
      <div className="contact-info-actions">
        <button className="action-button">
          <i className="fas fa-phone"></i> Voice Call
        </button>
        <button className="action-button">
          <i className="fas fa-video"></i> Video Call
        </button>
      </div>
      
      <div className="contact-info-details">
        <h3>About</h3>
        <p>{contact.about || "Into the future"}</p>
      </div>
      
      <div className="notification-settings">
        <h3>Notifications</h3>
        <div className="setting-item">
          <span>Message sounds</span>
          <button 
            className={`toggle-button ${notificationSettings.sounds ? 'active' : ''}`}
            onClick={() => toggleNotificationSetting('sounds')}
          >
            {notificationSettings.sounds ? <FiBell /> : <IoMdNotificationsOff />}
          </button>
        </div>
        <div className="setting-item">
          <span>Message previews</span>
          <button 
            className={`toggle-button ${notificationSettings.previews ? 'active' : ''}`}
            onClick={() => toggleNotificationSetting('previews')}
          >
            {notificationSettings.previews ? <FiEye /> : <FiEyeOff />}
          </button>
        </div>
      </div>
      
      <button className="close-button" onClick={onClose}>
        Close
      </button>
    </div>
  );
};

ContactInfoPanel.propTypes = {
  contact: PropTypes.object.isRequired,
  notificationSettings: PropTypes.object.isRequired,
  toggleNotificationSetting: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};