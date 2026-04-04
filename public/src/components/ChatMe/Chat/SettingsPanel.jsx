import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import "./SettingsPanel.css";
import { 
  FiBell, FiUser, FiLock, FiLogOut, 
  FiX, FiEye, FiEyeOff, FiMail, FiKey,
  FiUnlock 
} from 'react-icons/fi';
import { IoMdNotifications, IoMdNotificationsOff } from 'react-icons/io';

export const SettingsPanel = forwardRef(({
  showSettings,
  setShowSettings,
  activeSettingsTab,
  setActiveSettingsTab,
  notificationSettings,
  toggleNotificationSetting,
  accountSettings,
  setAccountSettings,
  securitySettings,
  setSecuritySettings,
  authError,
  authSuccess,
  isAuthenticating,
  onUpdateEmail,
  onUpdatePassword,
  onDeactivateAccount,
  onLogout,
  settingsPanelRef,
  setAuthError,
  setAuthSuccess
}, ref) => {
  if (!showSettings) return null;

  return (
    <div className="settings-panel" ref={ref}>
      <div className="settings-header">
        <h2>Settings</h2>
        <button 
          onClick={() => {
            setShowSettings(false);
            setAuthError('');
            setAuthSuccess('');
          }}
          aria-label="Close settings"
        >
          <FiX />
        </button>
      </div>

      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeSettingsTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('notifications')}
        >
          <FiBell /> Notifications
        </button>
        <button 
          className={`tab-button ${activeSettingsTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('account')}
        >
          <FiUser /> Account
        </button>
        <button 
          className={`tab-button ${activeSettingsTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('security')}
        >
          <FiLock /> Security
        </button>
      </div>

      <div className="settings-content">
        {authError && <div className="auth-error">{authError}</div>}
        {authSuccess && <div className="auth-success">{authSuccess}</div>}

        {activeSettingsTab === 'notifications' && (
          <div className="notifications-settings">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Message Notifications</h4>
                <p>Receive notifications for new messages</p>
              </div>
              <button 
                className={`toggle-button ${notificationSettings.messageNotifications ? 'active' : ''}`}
                onClick={() => toggleNotificationSetting('messageNotifications')}
              >
                {notificationSettings.messageNotifications ? <IoMdNotifications /> : <IoMdNotificationsOff />}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Group Notifications</h4>
                <p>Receive notifications for group messages</p>
              </div>
              <button 
                className={`toggle-button ${notificationSettings.groupNotifications ? 'active' : ''}`}
                onClick={() => toggleNotificationSetting('groupNotifications')}
              >
                {notificationSettings.groupNotifications ? <IoMdNotifications /> : <IoMdNotificationsOff />}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Show Preview</h4>
                <p>Show message content in notifications</p>
              </div>
              <button 
                className={`toggle-button ${notificationSettings.showPreview ? 'active' : ''}`}
                onClick={() => toggleNotificationSetting('showPreview')}
              >
                {notificationSettings.showPreview ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Notification Sounds</h4>
                <p>Play sounds for incoming messages</p>
              </div>
              <button 
                className={`toggle-button ${notificationSettings.sounds ? 'active' : ''}`}
                onClick={() => toggleNotificationSetting('sounds')}
              >
                {notificationSettings.sounds ? <FiBell /> : <IoMdNotificationsOff />}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Vibration</h4>
                <p>Vibrate for incoming messages</p>
              </div>
              <button 
                className={`toggle-button ${notificationSettings.vibrate ? 'active' : ''}`}
                onClick={() => toggleNotificationSetting('vibrate')}
              >
                {notificationSettings.vibrate ? <IoMdNotifications /> : <IoMdNotificationsOff />}
              </button>
            </div>
          </div>
        )}

        {activeSettingsTab === 'account' && (
          <div className="account-settings">
            <div className="setting-section">
              <h3>Email Address</h3>
              <div className="input-group">
                <input
                  type="email"
                  value={accountSettings.email}
                  onChange={(e) => setAccountSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter new email"
                />
                <button 
                  className="save-button"
                  onClick={onUpdateEmail}
                  disabled={!accountSettings.email || isAuthenticating}
                >
                  {isAuthenticating ? 'Updating...' : 'Update Email'}
                </button>
              </div>
            </div>

            <div className="setting-section">
              <h3>Change Password</h3>
              <div className="input-group">
                <input
                  type="password"
                  value={accountSettings.currentPassword}
                  onChange={(e) => setAccountSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={accountSettings.newPassword}
                  onChange={(e) => setAccountSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="New password"
                />
                <input
                  type="password"
                  value={accountSettings.confirmPassword}
                  onChange={(e) => setAccountSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
                <button 
                  className="save-button"
                  onClick={onUpdatePassword}
                  disabled={isAuthenticating || !accountSettings.currentPassword || 
                           !accountSettings.newPassword || accountSettings.newPassword !== accountSettings.confirmPassword}
                >
                  {isAuthenticating ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </div>

            <div className="setting-section danger-zone">
              <h3>Account Deactivation</h3>
              <p>Deactivating your account will remove all your data from our servers. This cannot be undone.</p>
              
              {!accountSettings.deactivateAccount ? (
                <button 
                  className="danger-button"
                  onClick={() => setAccountSettings(prev => ({ ...prev, deactivateAccount: true }))}
                >
                  Deactivate Account
                </button>
              ) : (
                <div className="confirmation-buttons">
                  <p>Are you sure you want to deactivate your account?</p>
                  <button 
                    className="danger-button"
                    onClick={() => onDeactivateAccount(true)}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? 'Deactivating...' : 'Confirm Deactivation'}
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => setAccountSettings(prev => ({ ...prev, deactivateAccount: false }))}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSettingsTab === 'security' && (
          <div className="security-settings">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Two-Factor Authentication</h4>
                <p>Add an extra layer of security to your account</p>
              </div>
              <button 
                className={`toggle-button ${securitySettings.twoFactorAuth ? 'active' : ''}`}
                onClick={() => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }))}
              >
                {securitySettings.twoFactorAuth ? <FiLock /> : <FiUnlock />}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Login Alerts</h4>
                <p>Get notified when your account is accessed from a new device</p>
              </div>
              <button 
                className={`toggle-button ${securitySettings.loginAlerts ? 'active' : ''}`}
                onClick={() => setSecuritySettings(prev => ({ ...prev, loginAlerts: !prev.loginAlerts }))}
              >
                {securitySettings.loginAlerts ? <IoMdNotifications /> : <IoMdNotificationsOff />}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Show Last Seen</h4>
                <p>Allow others to see when you were last active</p>
              </div>
              <button 
                className={`toggle-button ${securitySettings.showLastSeen ? 'active' : ''}`}
                onClick={() => setSecuritySettings(prev => ({ ...prev, showLastSeen: !prev.showLastSeen }))}
              >
                {securitySettings.showLastSeen ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Show Profile Photo</h4>
                <p>Allow others to see your profile picture</p>
              </div>
              <button 
                className={`toggle-button ${securitySettings.showProfilePhoto ? 'active' : ''}`}
                onClick={() => setSecuritySettings(prev => ({ ...prev, showProfilePhoto: !prev.showProfilePhoto }))}
              >
                {securitySettings.showProfilePhoto ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Show Status</h4>
                <p>Allow others to see your status updates</p>
              </div>
              <button 
                className={`toggle-button ${securitySettings.showStatus ? 'active' : ''}`}
                onClick={() => setSecuritySettings(prev => ({ ...prev, showStatus: !prev.showStatus }))}
              >
                {securitySettings.showStatus ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>

            <div className="logout-section">
              <button 
                className="logout-button"
                onClick={onLogout}
              >
                <FiLogOut /> Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SettingsPanel.propTypes = {
  showSettings: PropTypes.bool.isRequired,
  setShowSettings: PropTypes.func.isRequired,
  activeSettingsTab: PropTypes.string.isRequired,
  setActiveSettingsTab: PropTypes.func.isRequired,
  notificationSettings: PropTypes.shape({
    messageNotifications: PropTypes.bool,
    groupNotifications: PropTypes.bool,
    showPreview: PropTypes.bool,
    sounds: PropTypes.bool,
    vibrate: PropTypes.bool
  }).isRequired,
  toggleNotificationSetting: PropTypes.func.isRequired,
  accountSettings: PropTypes.shape({
    email: PropTypes.string,
    currentPassword: PropTypes.string,
    newPassword: PropTypes.string,
    confirmPassword: PropTypes.string,
    deactivateAccount: PropTypes.bool
  }).isRequired,
  setAccountSettings: PropTypes.func.isRequired,
  securitySettings: PropTypes.shape({
    twoFactorAuth: PropTypes.bool,
    loginAlerts: PropTypes.bool,
    showLastSeen: PropTypes.bool,
    showProfilePhoto: PropTypes.bool,
    showStatus: PropTypes.bool
  }).isRequired,
  setSecuritySettings: PropTypes.func.isRequired,
  authError: PropTypes.string,
  authSuccess: PropTypes.string,
  isAuthenticating: PropTypes.bool,
  onUpdateEmail: PropTypes.func.isRequired,
  onUpdatePassword: PropTypes.func.isRequired,
  onDeactivateAccount: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  setAuthError: PropTypes.func.isRequired,
  setAuthSuccess: PropTypes.func.isRequired
};

SettingsPanel.displayName = 'SettingsPanel';