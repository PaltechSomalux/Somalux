import React from 'react';
import "./AccountSettings.css";
export const AccountSettings = () => {
  return (
    <div className="settings-section">
      <div className="settings-item">
        <div className="settings-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Security</h3>
          <p>Security notifications, two-step verification</p>
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
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Change number</h3>
          <p>Transfer your account info to a new number</p>
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
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11V11.99z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Request account info</h3>
          <p>Download your data</p>
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
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
          </svg>
        </div>
        <div className="settings-content">
          <h3>Delete my account</h3>
          <p>Delete your account and data</p>
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

