import React from 'react';

export const HelpSettings = () => {
  return (
    <div className="settings-section" style={{ border: 'none' }}>
      <div className="settings-item">
        <div className="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Help</h3>
          <p>FAQ, contact us, privacy policy</p>
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
          <h3>Tell a friend</h3>
        </div>
        <div className="settings-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};