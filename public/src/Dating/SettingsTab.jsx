import React from 'react';
import { FaLock, FaSignOutAlt, FaExclamationTriangle } from 'react-icons/fa';
import "./SettingsTab.css";
export const SettingsTab = ({ 
  setShowLocationModal, 
  setShowActivityModal,
  setShowDeleteAccountModal
}) => {
  return (
    <div className="settings-tab">
      <h3>Account Settings</h3>
      
      <div className="setting-group">
        <h4>Activity Status</h4>
        <button 
          className="activity-status-button"
          onClick={() => setShowActivityModal(true)}
        >
          Set Status
        </button>
      </div>
      
      <div className="setting-group">
        <h4>Location</h4>
        <button 
          className="update-location"
          onClick={() => setShowLocationModal(true)}
        >
          Update Location
        </button>
      </div>
      
      <div className="setting-group">
        <h4>Safety Center</h4>
        <button className="safety-button">
          <FaLock /> Open Safety Center
        </button>
      </div>
      
      <div className="setting-group">
        <h4>Account Actions</h4>
        <button 
          className="delete-account"
          onClick={() => setShowDeleteAccountModal(true)}
        >
          Delete Account
        </button>
        <button className="logout-button">
          <FaSignOutAlt /> Log Out
        </button>
      </div>
    </div>
  );
};
