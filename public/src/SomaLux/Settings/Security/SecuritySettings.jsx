import React, { useState, useEffect } from 'react';
import './SecuritySettings.css';

export const SecuritySettings = ({ settings, onUpdateSettings }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState(settings.security.sessionTimeout || 30);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [passwordHistory, setPasswordHistory] = useState([]);
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const loadPasswordHistory = async () => {
      const history = [
        { date: '2023-01-15', password: '••••••••' },
        { date: '2022-11-20', password: '••••••••' },
        { date: '2022-08-05', password: '••••••••' }
      ];
      setPasswordHistory(history);
    };
    loadPasswordHistory();
  }, []);

  useEffect(() => {
    if (settings.security.twoFactorEnabled && recoveryCodes.length === 0) {
      generateRecoveryCodes();
    }
  }, [settings.security.twoFactorEnabled]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleChange = (field, value) => {
    onUpdateSettings({
      ...settings,
      security: { ...settings.security, [field]: value }
    });
  };

  const toggleSetting = (field) => {
    onUpdateSettings({
      ...settings,
      security: { 
        ...settings.security, 
        [field]: !settings.security[field] 
      }
    });
  };

  const removeConnectedDevice = (deviceId) => {
    onUpdateSettings({
      ...settings,
      security: { 
        ...settings.security, 
        connectedDevices: settings.security.connectedDevices.filter(d => d.id !== deviceId)
      }
    });
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    const length = password.length;
    if (length > 5) strength++;
    if (length > 8) strength++;
    if (length > 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    const commonPasswords = ['password', '123456', 'qwerty'];
    if (!commonPasswords.includes(password.toLowerCase())) strength++;
    return Math.min(strength, 5);
  };

  const generateRecoveryCodes = () => {
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).slice(2, 10).toUpperCase()
    );
    setRecoveryCodes(codes);
    setShowRecoveryCodes(true);
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    onUpdateSettings({
      ...settings,
      security: { ...settings.security, newPassword: value }
    });
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const validateForm = () => {
    const newErrors = {};
    const { newPassword, confirmPassword, password } = settings.security;
    
    if ((newPassword || confirmPassword) && !password) {
      newErrors.password = 'Current password is required';
    }
    
    if (newPassword) {
      if (newPassword.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(newPassword)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[0-9]/.test(newPassword)) {
        newErrors.password = 'Password must contain at least one number';
      } else if (passwordHistory.some(entry => entry.password === newPassword)) {
        newErrors.password = 'Cannot reuse a previous password';
      }
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (settings.security.useSecurityQuestions) {
      securityQuestions.forEach((q, i) => {
        if (!q.question.trim()) {
          newErrors[`question${i}`] = 'Question is required';
        }
        if (!q.answer.trim()) {
          newErrors[`answer${i}`] = 'Answer is required';
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveSettings = async () => {
    if (!validateForm()) {
      setSaveStatus('Please fix errors before saving');
      return;
    }
    
    setIsSaving(true);
    setSaveStatus('Saving...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (settings.security.newPassword) {
        onUpdateSettings({
          ...settings,
          security: { 
            ...settings.security,
            lastPasswordChange: new Date().toISOString(),
            password: '',
            newPassword: '',
            confirmPassword: ''
          }
        });
        setPasswordStrength(0);
      }
      
      if (settings.security.sessionTimeout !== sessionTimeout) {
        onUpdateSettings({
          ...settings,
          security: { 
            ...settings.security,
            sessionTimeout: sessionTimeout
          }
        });
      }
      
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('Error saving settings');
      console.error('Error saving security settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const verifyTwoFactorCode = () => {
    if (verificationCode.length === 6) {
      setSaveStatus('2FA verified successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } else {
      setSaveStatus('Invalid verification code');
    }
  };

  const handleSecurityQuestionChange = (index, field, value) => {
    const updatedQuestions = [...securityQuestions];
    updatedQuestions[index][field] = value;
    setSecurityQuestions(updatedQuestions);
  };

  return (
    <div className="security-settings-single-page">
      <h2>Security Settings</h2>
      
      {/* Password Section */}
      <div className={`settings-section ${expandedSection === 'password' ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('password')}>
          <h3>Password Security</h3>
          <span className="status-indicator">
            {passwordStrength >= 3 ? 'Secure' : 'Needs Improvement'}
          </span>
          <span className="toggle-icon">{expandedSection === 'password' ? '−' : '+'}</span>
        </div>
        
        {expandedSection === 'password' && (
          <div className="section-content">
            <div className="form-row">
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={settings.security.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Enter current password"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
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
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={settings.security.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>
            </div>
            
            <div className="password-strength-meter">
              <div className="strength-bars">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`strength-bar ${i < passwordStrength ? 'active' : ''}`}
                    style={{ backgroundColor: getStrengthColor(passwordStrength) }}
                  />
                ))}
              </div>
              <span className="strength-text">
                Strength: {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength]}
              </span>
            </div>
            
            <div className="password-hints">
              <p>Password must contain:</p>
              <ul>
                <li className={settings.security.newPassword?.length >= 8 ? 'valid' : ''}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(settings.security.newPassword) ? 'valid' : ''}>
                  One uppercase letter
                </li>
                <li className={/[0-9]/.test(settings.security.newPassword) ? 'valid' : ''}>
                  One number
                </li>
                <li className={/[^A-Za-z0-9]/.test(settings.security.newPassword) ? 'valid' : ''}>
                  One special character
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Two-Factor Authentication */}
      <div className={`settings-section ${expandedSection === 'twoFactor' ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('twoFactor')}>
          <h3>Two-Factor Authentication</h3>
          <span className="status-indicator">
            {settings.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <span className="toggle-icon">{expandedSection === 'twoFactor' ? '−' : '+'}</span>
        </div>
        
        {expandedSection === 'twoFactor' && (
          <div className="section-content">
            <div className="form-group checkbox">
              <input 
                type="checkbox" 
                id="twoFactorEnabled"
                checked={settings.security.twoFactorEnabled}
                onChange={() => toggleSetting('twoFactorEnabled')}
              />
              <label htmlFor="twoFactorEnabled">Enable Two-Factor Authentication</label>
            </div>
            
            {settings.security.twoFactorEnabled && (
              <>
                <div className="two-factor-setup">
                  <div className="qr-code-container">
                    <div className="qr-code-placeholder">
                      <p>Scan with your authenticator app</p>
                    </div>
                    <div className="manual-code">
                      <p>Or enter manually:</p>
                      <code>JBSWY3DPEHPK3PXP</code>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Verification Code</label>
                    <input 
                      type="text" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                    />
                    <button 
                      className="btn-verify"
                      onClick={verifyTwoFactorCode}
                      disabled={verificationCode.length !== 6}
                    >
                      Verify Code
                    </button>
                  </div>
                </div>
                
                <div className="recovery-codes">
                  <h4>Recovery Codes</h4>
                  <p>Save these codes in case you lose access to your authenticator app.</p>
                  {showRecoveryCodes ? (
                    <div className="codes-display">
                      <div className="codes-grid">
                        {recoveryCodes.map((code, index) => (
                          <div key={index} className="code-item">{code}</div>
                        ))}
                      </div>
                      <div className="code-actions">
                        <button className="btn-download">Download</button>
                        <button className="btn-print">Print</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="btn-show-codes"
                      onClick={() => setShowRecoveryCodes(true)}
                    >
                      Show Recovery Codes
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Session Management */}
      <div className={`settings-section ${expandedSection === 'sessions' ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('sessions')}>
          <h3>Session Management</h3>
          <span className="status-indicator">
            {settings.security.connectedDevices.length} active sessions
          </span>
          <span className="toggle-icon">{expandedSection === 'sessions' ? '−' : '+'}</span>
        </div>
        
        {expandedSection === 'sessions' && (
          <div className="section-content">
            <div className="form-group">
              <label>Session Timeout</label>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="0">Never (not recommended)</option>
              </select>
            </div>
            
            <div className="active-sessions">
              <h4>Active Sessions</h4>
              {settings.security.connectedDevices.length > 0 ? (
                <ul className="device-list">
                  {settings.security.connectedDevices.map(device => (
                    <li key={device.id} className="device-item">
                      <div className="device-icon">
                        {device.type === 'mobile' ? '📱' : '💻'}
                      </div>
                      <div className="device-info">
                        <span className="device-name">{device.name}</span>
                        <span className="device-details">
                          {device.type} • {device.location} • Last active: {device.lastActive}
                        </span>
                        {device.current && (
                          <span className="current-session">Current Session</span>
                        )}
                      </div>
                      {!device.current && (
                        <button 
                          className="btn-remove"
                          onClick={() => removeConnectedDevice(device.id)}
                        >
                          Log Out
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No active sessions</p>
              )}
            </div>
            
            <button 
              className="btn-logout-all"
              onClick={() => {
                onUpdateSettings({
                  ...settings,
                  security: { 
                    ...settings.security, 
                    connectedDevices: settings.security.connectedDevices.filter(d => d.current)
                  }
                });
              }}
            >
              Log Out All Other Devices
            </button>
          </div>
        )}
      </div>
      
      {/* Recovery Options */}
      <div className={`settings-section ${expandedSection === 'recovery' ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('recovery')}>
          <h3>Recovery Options</h3>
          <span className="status-indicator">
            {settings.security.recoveryEmail ? 'Configured' : 'Not Configured'}
          </span>
          <span className="toggle-icon">{expandedSection === 'recovery' ? '−' : '+'}</span>
        </div>
        
        {expandedSection === 'recovery' && (
          <div className="section-content">
            <div className="form-group">
              <label>Recovery Email</label>
              <input
                type="email"
                value={settings.security.recoveryEmail}
                onChange={(e) => handleChange('recoveryEmail', e.target.value)}
                placeholder="Enter recovery email"
              />
            </div>
            
            <div className="form-group">
              <label>Recovery Phone Number</label>
              <input
                type="tel"
                value={settings.security.recoveryPhone}
                onChange={(e) => handleChange('recoveryPhone', e.target.value)}
                placeholder="Enter phone number with country code"
              />
            </div>
            
            <div className="form-group checkbox">
              <input 
                type="checkbox" 
                id="useSecurityQuestions"
                checked={settings.security.useSecurityQuestions}
                onChange={() => toggleSetting('useSecurityQuestions')}
              />
              <label htmlFor="useSecurityQuestions">Enable Security Questions</label>
            </div>
            
            {settings.security.useSecurityQuestions && (
              <div className="security-questions">
                {securityQuestions.map((question, index) => (
                  <div key={index} className="form-group question-group">
                    <label>Question {index + 1}</label>
                    <select
                      value={question.question}
                      onChange={(e) => handleSecurityQuestionChange(index, 'question', e.target.value)}
                    >
                      <option value="">Select a question</option>
                      <option value="What was your first pet's name?">What was your first pet's name?</option>
                      <option value="What city were you born in?">What city were you born in?</option>
                      <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                      <option value="What was the name of your first school?">What was the name of your first school?</option>
                      <option value="custom">Custom question...</option>
                    </select>
                    
                    {question.question === 'custom' && (
                      <input
                        type="text"
                        placeholder="Enter your custom question"
                        value={question.customQuestion || ''}
                        onChange={(e) => handleSecurityQuestionChange(index, 'customQuestion', e.target.value)}
                      />
                    )}
                    
                    <label>Answer</label>
                    <input
                      type="text"
                      value={question.answer}
                      onChange={(e) => handleSecurityQuestionChange(index, 'answer', e.target.value)}
                      placeholder="Your answer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="form-actions">
        <button 
          className="btn-save"
          onClick={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        {saveStatus && (
          <span className={`save-status ${saveStatus.includes('success') ? 'success' : ''}`}>
            {saveStatus}
          </span>
        )}
      </div>
    </div>
  );
};

const getStrengthColor = (strength) => {
  const colors = [
    '#ff4d4f', // Very Weak
    '#ff7d4f', // Weak
    '#ffa940', // Fair
    '#ffc53d', // Good
    '#73d13d', // Strong
    '#52c41a'  // Very Strong
  ];
  return colors[strength];
};

SecuritySettings.displayName = 'SecuritySettings';