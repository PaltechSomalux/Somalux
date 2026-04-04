import React from 'react';
import './OfflineNotification.css';

export const OfflineNotification = () => {
  return (
    <div className="offline-notification floating-notification">
      <i className="fas fa-wifi"></i> No internet connection
    </div>
  );
};