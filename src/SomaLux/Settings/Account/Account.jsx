import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Account.css';

export const Account = ({ 
  settings = {}, 
  onExportData = () => {}, 
  onDeactivate = () => {}, 
  onDelete = () => {},
  onChangePassword = () => {},
  onChangeEmail = () => {},
  onTwoFactorToggle = () => {},
  onDownloadData = () => {},
  onRequestDataDeletion = () => {},
  userData = {}
}) => {
  // State for all form controls
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [activeTab, setActiveTab] = useState('security');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [selectedDataTypes, setSelectedDataTypes] = useState([]);

  // Safe defaults for settings and userData
  const safeSettings = {
    account: {
      deactivate: false,
      ...settings.account
    },
    security: {
      twoFactorEnabled: false,
      ...settings.security
    },
    ...settings
  };

  const safeUserData = {
    sessions: [],
    dataTypes: [],
    ...userData
  };

  // Handler functions
  const handleDeactivate = () => {
    setIsDeactivating(true);
    onDeactivate(password);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(password);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword === confirmPassword) {
      onChangePassword(currentPassword, newPassword);
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    }
  };

  const handleEmailChange = (e) => {
    e.preventDefault();
    onChangeEmail(newEmail, currentPassword);
    setShowEmailForm(false);
    setNewEmail('');
    setCurrentPassword('');
  };

  const handleDataTypeToggle = (typeId) => {
    setSelectedDataTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId) 
        : [...prev, typeId]
    );
  };

  const handleExportData = () => {
    onExportData(exportFormat);
  };

  return (
    <div className="account-management">
      <h2>Account Management</h2>
      
      <div className="account-tabs">
        <button 
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button 
          className={activeTab === 'data' ? 'active' : ''}
          onClick={() => setActiveTab('data')}
        >
          Data
        </button>
        <button 
          className={activeTab === 'danger' ? 'active' : ''}
          onClick={() => setActiveTab('danger')}
        >
          Danger Zone
        </button>
      </div>
      
      {activeTab === 'security' && (
        <div className="security-settings">
          <div className="action-card">
            <h3>Change Password</h3>
            <p>Update your account password for enhanced security.</p>
            {!showPasswordForm ? (
              <button 
                className="btn-change"
                onClick={() => setShowPasswordForm(true)}
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength="8"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-confirm">
                    Update Password
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowPasswordForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          
          <div className="action-card">
            <h3>Change Email</h3>
            <p>Update the email address associated with your account.</p>
            {!showEmailForm ? (
              <button 
                className="btn-change"
                onClick={() => setShowEmailForm(true)}
              >
                Change Email
              </button>
            ) : (
              <form onSubmit={handleEmailChange} className="email-form">
                <div className="form-group">
                  <label>New Email Address</label>
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-confirm">
                    Update Email
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowEmailForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          
          <div className="action-card">
            <h3>Two-Factor Authentication</h3>
            <p>Add an extra layer of security to your account.</p>
            <div className="form-group toggle">
              <label>
                <input 
                  type="checkbox" 
                  checked={safeSettings.security.twoFactorEnabled}
                  onChange={() => onTwoFactorToggle(!safeSettings.security.twoFactorEnabled)}
                />
                <span className="toggle-switch"></span>
                {safeSettings.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </label>
            </div>
            {safeSettings.security.twoFactorEnabled && (
              <div className="two-factor-info">
                <p>Two-factor authentication is currently active on your account.</p>
                <button className="btn-manage">Manage Authenticator App</button>
              </div>
            )}
          </div>
          
          <div className="action-card">
            <h3>Active Sessions</h3>
            <p>View and manage devices that are currently logged in to your account.</p>
            <div className="sessions-list">
              {safeUserData.sessions.map(session => (
                <div key={session.id} className="session-item">
                  <div className="session-info">
                    <span className="device">{session.device || 'Unknown Device'}</span>
                    <span className="location">{session.location || 'Unknown Location'}</span>
                    <span className="ip">{session.ip || 'IP not available'}</span>
                    <span className="last-active">{session.lastActive || 'Active now'}</span>
                  </div>
                  {!session.current && (
                    <button className="btn-logout">Log Out</button>
                  )}
                </div>
              ))}
              {safeUserData.sessions.length === 0 && (
                <p className="no-sessions">No active sessions found.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'data' && (
        <div className="data-settings">
          <div className="action-card">
            <h3>Export Your Data</h3>
            <p>Download a copy of all your data including settings, activity, and preferences.</p>
            <div className="export-options">
              <label>Format:</label>
              <select 
                value={exportFormat} 
                onChange={(e) => setExportFormat(e.target.value)}
                className="export-select"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
              </select>
            </div>
            <button className="btn-export" onClick={handleExportData}>
              Export Data
            </button>
          </div>
          
          <div className="action-card">
            <h3>Download Specific Data</h3>
            <p>Choose which data you want to download.</p>
            <div className="data-options">
              {safeUserData.dataTypes.map(type => (
                <div key={type.id} className="form-group checkbox">
                  <input 
                    type="checkbox" 
                    id={`data-${type.id}`}
                    checked={selectedDataTypes.includes(type.id)}
                    onChange={() => handleDataTypeToggle(type.id)}
                  />
                  <label htmlFor={`data-${type.id}`}>{type.label}</label>
                </div>
              ))}
              {safeUserData.dataTypes.length === 0 && (
                <p className="no-data-types">No data types available for download.</p>
              )}
            </div>
            <button 
              className="btn-download" 
              onClick={() => onDownloadData(selectedDataTypes)}
              disabled={selectedDataTypes.length === 0}
            >
              Download Selected
            </button>
          </div>
          
          <div className="action-card warning">
            <h3>Request Data Deletion</h3>
            <p>Request deletion of specific data types while keeping your account active.</p>
            <div className="form-group">
              <label>Select data to delete:</label>
              <select 
                multiple
                className="deletion-select"
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions);
                  setSelectedDataTypes(options.map(option => option.value));
                }}
              >
                {safeUserData.dataTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <button 
              className="btn-request" 
              onClick={() => onRequestDataDeletion(selectedDataTypes)}
              disabled={selectedDataTypes.length === 0}
            >
              Request Deletion
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'danger' && (
        <div className="danger-settings">
          <div className="action-card warning">
            <h3>Deactivate Account</h3>
            <p>Temporarily disable your account. Your data will be preserved but hidden.</p>
            <div className="form-group checkbox">
              <input 
                type="checkbox" 
                id="deactivateAccount"
                checked={isDeactivating}
                onChange={() => setIsDeactivating(!isDeactivating)}
              />
              <label htmlFor="deactivateAccount">I want to deactivate my account</label>
            </div>
            {isDeactivating && (
              <div className="deactivate-confirm">
                <p>Are you sure you want to deactivate your account?</p>
                <div className="form-group">
                  <label>Enter your password to confirm</label>
                  <input 
                    type="password" 
                    placeholder="Current password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  className="btn-confirm"
                  onClick={handleDeactivate}
                  disabled={!password}
                >
                  Confirm Deactivation
                </button>
              </div>
            )}
          </div>
          
          <div className="action-card danger">
            <h3>Delete Account</h3>
            <p>Permanently delete your account and all associated data. This cannot be undone.</p>
            <div className="form-group checkbox">
              <input 
                type="checkbox" 
                id="deleteAccount"
                checked={isDeleting}
                onChange={() => setIsDeleting(!isDeleting)}
              />
              <label htmlFor="deleteAccount">I want to permanently delete my account</label>
            </div>
            {isDeleting && (
              <div className="delete-confirm">
                <p>This will permanently erase all your data. Are you absolutely sure?</p>
                <div className="form-group">
                  <label>Enter your password to confirm</label>
                  <input 
                    type="password" 
                    placeholder="Current password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  className="btn-confirm-danger"
                  onClick={handleDelete}
                  disabled={!password}
                >
                  Permanently Delete Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Account.propTypes = {
  settings: PropTypes.shape({
    account: PropTypes.shape({
      deactivate: PropTypes.bool
    }),
    security: PropTypes.shape({
      twoFactorEnabled: PropTypes.bool
    })
  }),
  userData: PropTypes.shape({
    sessions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        device: PropTypes.string,
        location: PropTypes.string,
        ip: PropTypes.string,
        lastActive: PropTypes.string,
        current: PropTypes.bool
      })
    ),
    dataTypes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string
      })
    )
  }),
  onExportData: PropTypes.func,
  onDeactivate: PropTypes.func,
  onDelete: PropTypes.func,
  onChangePassword: PropTypes.func,
  onChangeEmail: PropTypes.func,
  onTwoFactorToggle: PropTypes.func,
  onDownloadData: PropTypes.func,
  onRequestDataDeletion: PropTypes.func
};

Account.defaultProps = {
  settings: {
    account: {
      deactivate: false
    },
    security: {
      twoFactorEnabled: false
    }
  },
  userData: {
    sessions: [],
    dataTypes: []
  },
  onExportData: () => {},
  onDeactivate: () => {},
  onDelete: () => {},
  onChangePassword: () => {},
  onChangeEmail: () => {},
  onTwoFactorToggle: () => {},
  onDownloadData: () => {},
  onRequestDataDeletion: () => {}
};