import React from 'react';

export const StorageSettings = ({ user, setUser }) => {
  return (
    <div className="settings-section" style={{ border: 'none' }}>
      <div className="settings-item">
        <div className="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M8 4v4H4v2h4v4h2v-4h4V8h-4V4H8zM4 14v2h4v4h2v-4h4v-2h-4v-4h-2v4H4z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Storage usage</h3>
          <p>{user.accountInfo.storageUsage} used</p>
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
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Network usage</h3>
          <p>{user.accountInfo.networkUsage}</p>
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
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Media auto-download</h3>
          <p>Configure when media is auto-downloaded</p>
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
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Media visibility</h3>
          <p>{user.mediaVisibility === 'show' ? 'Show media in gallery' : 'Hide media from gallery'}</p>
        </div>
        <div className="settings-toggle">
          <label className="switch">
            <input 
              type="checkbox" 
              checked={user.mediaVisibility === 'show'}
              onChange={() => setUser(prev => ({ 
                ...prev, 
                mediaVisibility: prev.mediaVisibility === 'show' ? 'hide' : 'show'
              }))}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
    </div>
  );
};