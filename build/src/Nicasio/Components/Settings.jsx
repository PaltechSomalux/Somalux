import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export const Settings = ({ 
  initialSettings = {
    notifications: true,
    darkMode: false,
    emailAlerts: true,
    autoSave: false,
    fontSize: 'medium'
  },
  onSaveSettings,
  onExportData,
  onBackupSystem
}) => {
  const [settings, setSettings] = useState(initialSettings);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Reset modified state when initialSettings prop changes
  useEffect(() => {
    setSettings(initialSettings);
    setIsModified(false);
  }, [initialSettings]);

  const handleSettingChange = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    setIsModified(true);
    setSaveStatus(null);
  };

  const handleSave = async () => {
    if (!isModified) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      if (onSaveSettings) {
        await onSaveSettings(settings);
      }
      setIsModified(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setIsModified(false);
    setSaveStatus(null);
  };

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      alert('Export functionality would be implemented here');
    }
  };

  const handleBackup = () => {
    if (onBackupSystem) {
      onBackupSystem();
    } else {
      alert('Backup functionality would be implemented here');
    }
  };

  const getSaveStatusMessage = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'success': return 'Settings saved successfully!';
      case 'error': return 'Failed to save settings';
      default: return null;
    }
  };

  return (
    <div className="settings-view">
      <h2>System Settings</h2>
      
      <div className="settings-section">
        <h3>Notification Preferences</h3>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
            />
            Enable Notifications
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={settings.emailAlerts}
              onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
            />
            Email Alerts
          </label>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={settings.darkMode}
              onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
            />
            Dark Mode
          </label>
        </div>
        <div className="setting-item">
          <label>Font Size</label>
          <select
            value={settings.fontSize}
            onChange={(e) => handleSettingChange('fontSize', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Data Management</h3>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={settings.autoSave}
              onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
            />
            Auto-save Changes
          </label>
        </div>
        <button 
          className="secondary-btn" 
          onClick={handleExport}
          disabled={isSaving}
        >
          Export Course Data
        </button>
        <button 
          className="secondary-btn" 
          onClick={handleBackup}
          disabled={isSaving}
        >
          Backup System
        </button>
      </div>
      
      <div className="settings-actions">
        <div className="status-message">
          {getSaveStatusMessage()}
        </div>
        <button 
          className="secondary-btn" 
          onClick={handleReset}
          disabled={!isModified || isSaving}
        >
          Reset
        </button>
        <button 
          className="primary-btn" 
          onClick={handleSave}
          disabled={!isModified || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

Settings.propTypes = {
  initialSettings: PropTypes.shape({
    notifications: PropTypes.bool,
    darkMode: PropTypes.bool,
    emailAlerts: PropTypes.bool,
    autoSave: PropTypes.bool,
    fontSize: PropTypes.oneOf(['small', 'medium', 'large'])
  }),
  onSaveSettings: PropTypes.func,
  onExportData: PropTypes.func,
  onBackupSystem: PropTypes.func
};