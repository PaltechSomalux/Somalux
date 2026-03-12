import React from 'react';

export const ProfileTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="settings-tabs">
      <div 
        className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        <div className="tab-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <div className="tab-content">
          <h3>Profile</h3>
          <p>Name, email, phone, bio</p>
        </div>
      </div>
      
      <div 
        className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
        onClick={() => setActiveTab('account')}
      >
        <div className="tab-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <div className="tab-content">
          <h3>Account</h3>
          <p>Security, change number, more</p>
        </div>
      </div>
      
      <div 
        className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`}
        onClick={() => setActiveTab('privacy')}
      >
        <div className="tab-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>
        <div className="tab-content">
          <h3>Privacy</h3>
          <p>Last seen, profile photo, about</p>
        </div>
      </div>
      
      <div 
        className={`settings-tab ${activeTab === 'chats' ? 'active' : ''}`}
        onClick={() => setActiveTab('chats')}
      >
        <div className="tab-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
          </svg>
        </div>
        <div className="tab-content">
          <h3>Chats</h3>
          <p>Theme, wallpapers, chat history</p>
        </div>
      </div>
      
      <div 
        className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
        onClick={() => setActiveTab('notifications')}
      >
        <div className="tab-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        </div>
        <div className="tab-content">
          <h3>Notifications</h3>
          <p>Message, group & call tones</p>
        </div>
      </div>
      
      <div 
        className={`settings-tab ${activeTab === 'storage' ? 'active' : ''}`}
        onClick={() => setActiveTab('storage')}
      >
        <div className="tab-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M8 4v4H4v2h4v4h2v-4h4V8h-4V4H8zM4 14v2h4v4h2v-4h4v-2h-4v-4h-2v4H4z"/>
          </svg>
        </div>
        <div className="tab-content">
          <h3>Storage and data</h3>
          <p>Network usage, auto-download</p>
        </div>
      </div>
      
      <div 
        className={`settings-tab ${activeTab === 'help' ? 'active' : ''}`}
        onClick={() => setActiveTab('help')}
      >
        <div className="tab-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
          </svg>
        </div>
        <div className="tab-content">
          <h3>Help</h3>
          <p>Help center, contact us, privacy policy</p>
        </div>
      </div>
    </div>
  );
};

