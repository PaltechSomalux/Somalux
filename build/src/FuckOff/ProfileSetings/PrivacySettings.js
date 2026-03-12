import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './PrivacySettings.css';
import { savePrivacySetting, resetPrivacyToDefaults } from '../../utils/privacy';

export const PrivacySettings = ({ 
  user = {}, 
  onSettingChange = () => {},
  onResetSettings = () => {},
  onBlockedContacts = () => {},
  onMutedContacts = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('privacy');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [showMutedList, setShowMutedList] = useState(false);

  // Safe defaults for user settings
  const safeUser = {
    lastSeen: 'everyone',
    profilePhotoVisibility: 'everyone',
    aboutVisibility: 'everyone',
    readReceipts: true,
    blockedContacts: [],
    mutedContacts: [],
    statusVisibility: 'contacts',
    groupPrivacy: 'contacts',
    ...user
  };

  const privacyOptions = [
    {
      id: 'lastSeen',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
      ),
      title: 'Last seen',
      value: safeUser.lastSeen,
      options: ['everyone', 'contacts', 'nobody'],
      description: 'Control who can see when you were last active'
    },
    {
      id: 'profilePhotoVisibility',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
          <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z"/>
        </svg>
      ),
      title: 'Profile photo',
      value: safeUser.profilePhotoVisibility,
      options: ['everyone', 'contacts', 'nobody'],
      description: 'Choose who can see your profile picture'
    },
    {
      id: 'aboutVisibility',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
      ),
      title: 'About info',
      value: safeUser.aboutVisibility,
      options: ['everyone', 'contacts', 'nobody'],
      description: 'Manage who can view your about information'
    },
    {
      id: 'statusVisibility',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
        </svg>
      ),
      title: 'Status updates',
      value: safeUser.statusVisibility,
      options: ['everyone', 'contacts', 'nobody'],
      description: 'Control who can see your status updates'
    },
    {
      id: 'groupPrivacy',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      title: 'Group privacy',
      value: safeUser.groupPrivacy,
      options: ['everyone', 'contacts', 'nobody'],
      description: 'Determine who can add you to groups'
    },
    {
      id: 'readReceipts',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#075E54">
          <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
        </svg>
      ),
      title: 'Read receipts',
      value: safeUser.readReceipts,
      isToggle: true,
      description: 'Turn read receipts on or off for all messages'
    }
  ];

  const getDisplayValue = (value) => {
    const displayMap = {
      everyone: 'Everyone',
      contacts: 'My contacts',
      nobody: 'Nobody',
      true: 'On',
      false: 'Off'
    };
    return displayMap[value] || value;
  };

  const handleSettingChange = async (setting, value) => {
    try {
      await savePrivacySetting(setting.id, value);
    } catch (e) {
      console.warn('Failed to save privacy setting', setting.id, e);
    }
    onSettingChange(setting.id, value);
  };

  const handleResetSettings = async () => {
    try { await resetPrivacyToDefaults(); } catch(e) { console.warn('Reset privacy failed', e); }
    onResetSettings();
    setShowResetConfirm(false);
  };

  return (
    <div className="privacy-management">
      
      <div className="privacy-tabs">
        <button 
          className={activeTab === 'privacy' ? 'active' : ''}
          onClick={() => setActiveTab('privacy')}
        >
          Privacy
        </button>
        <button 
          className={activeTab === 'blocked' ? 'active' : ''}
          onClick={() => setActiveTab('blocked')}
        >
          Blocked Contacts
        </button>
        <button 
          className={activeTab === 'muted' ? 'active' : ''}
          onClick={() => setActiveTab('muted')}
        >
          Muted Contacts
        </button>
      </div>
      
      {activeTab === 'privacy' && (
        <div className="privacy-settings">
          {privacyOptions.map((setting) => (
            <div key={setting.id} className="action-card">
              <div className="setting-header">
                <div className="setting-icon">{setting.icon}</div>
                <div className="setting-info">
                  <h3>{setting.title}</h3>
                  <p>{setting.description}</p>
                </div>
              </div>
              <div className="setting-control">
                {setting.isToggle ? (
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={setting.value}
                      onChange={() => handleSettingChange(setting, !setting.value)}
                    />
                    <span className="slider round"></span>
                    <span className="toggle-label">
                      {setting.value ? 'On' : 'Off'}
                    </span>
                  </label>
                ) : (
                  <select
                    value={setting.value}
                    onChange={(e) => handleSettingChange(setting, e.target.value)}
                    className="privacy-select"
                  >
                    {setting.options.map(option => (
                      <option key={option} value={option}>
                        {getDisplayValue(option)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
          
          <div className="action-card warning">
            <h3>Reset Privacy Settings</h3>
            <p>Reset all privacy settings to their default values.</p>
            {!showResetConfirm ? (
              <button 
                className="btn-reset"
                onClick={() => setShowResetConfirm(true)}
              >
                Reset Settings
              </button>
            ) : (
              <div className="reset-confirm">
                <p>Are you sure you want to reset all privacy settings?</p>
                <div className="form-actions">
                  <button 
                    className="btn-confirm"
                    onClick={handleResetSettings}
                  >
                    Confirm Reset
                  </button>
                  <button 
                    className="btn-cancel"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'blocked' && (
        <div className="blocked-contacts">
          <div className="action-card">
            <h3>Blocked Contacts</h3>
            <p>Manage contacts you've blocked from contacting you.</p>
            
            {safeUser.blockedContacts.length > 0 ? (
              <div className="contacts-list">
                {safeUser.blockedContacts.map(contact => (
                  <div key={contact.id} className="contact-item">
                    <div className="contact-info">
                      <span className="name">{contact.name}</span>
                      <span className="phone">{contact.phone}</span>
                    </div>
                    <button 
                      className="btn-unblock"
                      onClick={() => onBlockedContacts(contact.id, false)}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-contacts">You haven't blocked any contacts yet.</p>
            )}
            
            <button 
              className="btn-manage"
              onClick={() => onBlockedContacts(null, true)}
            >
              Block New Contact
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'muted' && (
        <div className="muted-contacts">
          <div className="action-card">
            <h3>Muted Contacts</h3>
            <p>Manage contacts you've muted to stop receiving notifications.</p>
            
            {safeUser.mutedContacts.length > 0 ? (
              <div className="contacts-list">
                {safeUser.mutedContacts.map(contact => (
                  <div key={contact.id} className="contact-item">
                    <div className="contact-info">
                      <span className="name">{contact.name}</span>
                      <span className="phone">{contact.phone}</span>
                    </div>
                    <button 
                      className="btn-unmute"
                      onClick={() => onMutedContacts(contact.id, false)}
                    >
                      Unmute
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-contacts">You haven't muted any contacts yet.</p>
            )}
            
            <button 
              className="btn-manage"
              onClick={() => onMutedContacts(null, true)}
            >
              Mute New Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

PrivacySettings.propTypes = {
  user: PropTypes.shape({
    lastSeen: PropTypes.oneOf(['everyone', 'contacts', 'nobody']),
    profilePhotoVisibility: PropTypes.oneOf(['everyone', 'contacts', 'nobody']),
    aboutVisibility: PropTypes.oneOf(['everyone', 'contacts', 'nobody']),
    statusVisibility: PropTypes.oneOf(['everyone', 'contacts', 'nobody']),
    groupPrivacy: PropTypes.oneOf(['everyone', 'contacts', 'nobody']),
    readReceipts: PropTypes.bool,
    blockedContacts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        phone: PropTypes.string
      })
    ),
    mutedContacts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        phone: PropTypes.string
      })
    )
  }),
  onSettingChange: PropTypes.func,
  onResetSettings: PropTypes.func,
  onBlockedContacts: PropTypes.func,
  onMutedContacts: PropTypes.func
};

PrivacySettings.defaultProps = {
  user: {
    lastSeen: 'everyone',
    profilePhotoVisibility: 'everyone',
    aboutVisibility: 'everyone',
    statusVisibility: 'contacts',
    groupPrivacy: 'contacts',
    readReceipts: true,
    blockedContacts: [],
    mutedContacts: []
  },
  onSettingChange: () => {},
  onResetSettings: () => {},
  onBlockedContacts: () => {},
  onMutedContacts: () => {}
};