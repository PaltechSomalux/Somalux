import React, { useState, useEffect } from 'react';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import './SettingsPanel.css';

import { Fonts } from './Fonts/Fonts';
import { Account } from './Account/Account';

export const SettingsPanel = () => {
  // Load settings from localStorage if available
  const loadInitialState = () => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      profile: {
        name: '',
        email: '', 
        bio: '',
        profilePic: null,
        gender: '',
        dob: '',
        address: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      security: {
        password: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: false,
        connectedDevices: [],
        securityQuestions: [],
        lastPasswordChange: null,
      },
      notifications: {
        email: true,
        push: true,
        marketingEmails: false,
        digestFrequency: 'weekly',
        soundEnabled: true,
        desktopNotifications: true,
        notificationSchedule: { start: '08:00', end: '22:00' },
      },
      preferences: {
        theme: 'light',
        darkMode: false,
        language: 'en',
        fontSize: 'medium',
        timeFormat: '12h',
        dateFormat: 'MM/DD/YYYY',
        keyboardShortcuts: true,
      },
      billing: {
        paymentMethods: [],
        subscriptionPlan: 'free',
        billingAddress: '',
        invoiceHistory: [],
        autoRenew: true,
      },
      integrations: {
        google: false,
        slack: false,
        github: false,
        apiKey: '',
        webhooks: [],
        oauthApps: [],
      },
      accessibility: {
        highContrast: false,
        screenReader: false,
        reducedMotion: false,
        keyboardNavigation: false,
        colorBlindMode: 'none',
        textToSpeech: false,
      },
      advanced: {
        developerMode: false,
        betaFeatures: false,
        apiSettings: {},
        analyticsConsent: true,
        telemetry: false,
      }
    };
  };

  const [settings, setSettings] = useState(loadInitialState());
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [previewProfilePic, setPreviewProfilePic] = useState(null);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  // Handle profile picture upload
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewProfilePic(reader.result);
        setSettings(prev => ({
          ...prev,
          profile: { ...prev.profile, profilePic: file }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length > 5) strength++;
    if (password.length > 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, newPassword: value }
    }));
    setPasswordStrength(calculatePasswordStrength(value));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (settings.security.newPassword && settings.security.newPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (settings.security.newPassword !== settings.security.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!settings.profile.email.includes('@')) {
      newErrors.email = 'Invalid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save settings
  const saveSettings = async (section) => {
    if (!validateForm()) {
      setSaveStatus('Please fix errors before saving');
      return;
    }
    
    setIsSaving(true);
    setSaveStatus('Saving...');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input changes generically
  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  // Handle checkbox toggles
  const toggleSetting = (section, field) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: !prev[section][field] }
    }));
  };

  // Add a connected device
  const addConnectedDevice = (device) => {
    setSettings(prev => ({
      ...prev,
      security: { 
        ...prev.security, 
        connectedDevices: [...prev.security.connectedDevices, device] 
      }
    }));
  };

  // Remove a connected device
  const removeConnectedDevice = (deviceId) => {
    setSettings(prev => ({
      ...prev,
      security: { 
        ...prev.security, 
        connectedDevices: prev.security.connectedDevices.filter(d => d.id !== deviceId)
      }
    }));
  };

  // Add a payment method
  const addPaymentMethod = (method) => {
    setSettings(prev => ({
      ...prev,
      billing: { 
        ...prev.billing, 
        paymentMethods: [...prev.billing.paymentMethods, method] 
      }
    }));
  };

  // Remove a payment method
  const removePaymentMethod = (methodId) => {
    setSettings(prev => ({
      ...prev,
      billing: { 
        ...prev.billing, 
        paymentMethods: prev.billing.paymentMethods.filter(m => m.id !== methodId)
      }
    }));
  };

  // Reset section to defaults
  const resetSection = (section) => {
    const defaults = loadInitialState()[section];
    setSettings(prev => ({
      ...prev,
      [section]: defaults
    }));
  };

  return (
    <div className="settings-container">
      <h1 className="settings-title">Account Settings</h1>
      
      <Tabs selectedIndex={activeTab} onSelect={index => setActiveTab(index)}>
        <TabList>
          <Tab>Security</Tab>
   
          <Tab>Fonts</Tab>
          <Tab>Account</Tab>
        </TabList>
        
        {/* Security Tab */}
        <TabPanel>
          <div className="settings-section">
            <h2>Security Settings</h2>
            
            <div className="security-status">
              <div className="status-item">
                <span className="status-label">Password Strength:</span>
                <span className={`status-value strength-${passwordStrength}`}>
                  {['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength]}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Two-Factor Authentication:</span>
                <span className={`status-value ${settings.security.twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                  {settings.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {settings.security.lastPasswordChange && (
                <div className="status-item">
                  <span className="status-label">Last Password Change:</span>
                  <span className="status-value">
                    {new Date(settings.security.lastPasswordChange).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password" 
                value={settings.security.password}
                onChange={(e) => handleChange('security', 'password', e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={settings.security.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
                <div className="password-strength-meter">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div 
                      key={i} 
                      className={`strength-bar ${i <= passwordStrength ? 'active' : ''}`}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={settings.security.confirmPassword}
                  onChange={(e) => handleChange('security', 'confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>
            
            <div className="form-group checkbox">
              <input 
                type="checkbox" 
                id="twoFactorEnabled"
                checked={settings.security.twoFactorEnabled}
                onChange={() => toggleSetting('security', 'twoFactorEnabled')}
              />
              <label htmlFor="twoFactorEnabled">Enable Two-Factor Authentication</label>
              <p className="hint">Add an extra layer of security to your account</p>
            </div>
            
            {settings.security.twoFactorEnabled && (
              <div className="two-factor-setup">
                <h3>Two-Factor Setup</h3>
                <div className="qr-code-placeholder">
                  {/* In a real app, you would display a QR code here */}
                  <p>Scan this QR code with your authenticator app</p>
                </div>
                <div className="form-group">
                  <label>Verification Code</label>
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                  />
                </div>
              </div>
            )}
            
            <div className="connected-devices">
              <h3>Connected Devices</h3>
              {settings.security.connectedDevices.length > 0 ? (
                <ul className="device-list">
                  {settings.security.connectedDevices.map(device => (
                    <li key={device.id} className="device-item">
                      <div className="device-info">
                        <span className="device-name">{device.name}</span>
                        <span className="device-details">
                          {device.type} • {device.location} • Last active: {device.lastActive}
                        </span>
                      </div>
                      <button 
                        className="btn-remove"
                        onClick={() => removeConnectedDevice(device.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No devices connected</p>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                className="btn-save"
                onClick={() => saveSettings('security')}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Update Security'}
              </button>
              {saveStatus && <span className="save-status">{saveStatus}</span>}
            </div>
          </div>
        </TabPanel>
        
       
        
        {/* Fonts */}
        <TabPanel>
          <Fonts/>
        </TabPanel>
        
        {/* Account*/}
        <TabPanel>
          <Account/>
        </TabPanel>
      </Tabs>
    </div>
  );
};

// Add displayName for better logging
SettingsPanel.displayName = 'SettingsPanel';