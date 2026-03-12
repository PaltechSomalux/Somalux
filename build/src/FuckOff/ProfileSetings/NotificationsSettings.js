import React from 'react';
import "./NotificationsSettings.css";
export const NotificationsSettings = ({ user, toggleSetting }) => {
  return (
    <div className="settings-section" style={{ border: 'none' }}>
      <div className="settings-item">
        <div className="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Message notifications</h3>
          <p>Tone: {user.notificationTone === 'default' ? 'Default' : 'Custom'}</p>
        </div>
        <div className="settings-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </div>
      </div>
      
      <div className="settings-item">
        <div className="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Group notifications</h3>
          <p>Tone: {user.notificationTone === 'default' ? 'Default' : 'Custom'}</p>
        </div>
        <div className="settings-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </div>
      </div>
      
      <div className="settings-item">
        <div className="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Vibration</h3>
          <p>{user.vibration ? 'On' : 'Off'}</p>
        </div>
        <div className="settings-toggle">
          <label className="switch">
            <input 
              type="checkbox" 
              checked={user.vibration}
              onChange={() => toggleSetting('vibration')}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-item">
        <div className="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Popup notifications</h3>
          <p>On</p>
        </div>
        <div className="settings-toggle">
          <label className="switch">
            <input type="checkbox" checked />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-item">
        <div className="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Light</h3>
          <p>White</p>
        </div>
        <div className="settings-toggle">
          <label className="switch">
            <input type="checkbox" checked />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-item">
        <div className="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Use high priority notifications</h3>
          <p>Show previews of notifications</p>
        </div>
        <div className="settings-toggle">
          <label className="switch">
            <input type="checkbox" checked />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
    </div>
  );
};