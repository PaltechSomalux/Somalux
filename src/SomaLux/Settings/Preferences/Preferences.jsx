import React, { useState, useEffect } from 'react';
import './Preferences.css';

export const Preferences = () => {
  // Default preferences
  const defaultPreferences = {
    theme: 'light',
    fontSize: 'medium',
    language: 'en',
    notifications: true,
    timeFormat: '12h',
    highContrast: false,
    reduceMotion: false
  };

  // Load saved preferences or use defaults
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('userPreferences');
      return saved ? JSON.parse(saved) : defaultPreferences;
    } catch (error) {
      console.error("Failed to parse saved preferences", error);
      return defaultPreferences;
    }
  });

  // Apply preferences when they change
  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      applyPreferences();
    } catch (error) {
      console.error("Failed to save preferences", error);
    }
  }, [preferences]);

  const applyPreferences = () => {
    // Apply theme
    document.body.className = '';
    document.body.classList.add(`${preferences.theme}-theme`);
    
    // Apply high contrast
    if (preferences.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (preferences.reduceMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }

    // Apply font size
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'x-large': '20px'
    };
    document.body.style.fontSize = sizes[preferences.fontSize];
    
    // Apply language (would need i18n implementation in a real app)
    document.documentElement.lang = preferences.language;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all preferences to default?")) {
      setPreferences(defaultPreferences);
    }
  };

  return (
    <div className={`preferences-container ${preferences.theme}-theme`}>
      <h2>User Preferences</h2>

      {/* Theme Selection */}
      <div className="preference-section">
        <h3>Theme</h3>
        <div className="option-group">
          {['light', 'dark', 'system'].map((theme) => (
            <label key={theme}>
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={preferences.theme === theme}
                onChange={handleChange}
              />
              {theme.charAt(0).toUpperCase() + theme.slice(1)} {theme === 'system' ? '(OS Default)' : 'Mode'}
            </label>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="preference-section">
        <h3>Font Size</h3>
        <select
          name="fontSize"
          value={preferences.fontSize}
          onChange={handleChange}
          aria-label="Select font size"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="x-large">Extra Large</option>
        </select>
      </div>

      {/* Language */}
      <div className="preference-section">
        <h3>Language</h3>
        <select
          name="language"
          value={preferences.language}
          onChange={handleChange}
          aria-label="Select language"
        >
          <option value="en">English</option>
          <option value="es">Español (Spanish)</option>
          <option value="fr">Français (French)</option>
          <option value="de">Deutsch (German)</option>
          <option value="ja">日本語 (Japanese)</option>
        </select>
      </div>

      {/* Notifications */}
      <div className="preference-section">
        <h3>Notifications</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="notifications"
            checked={preferences.notifications}
            onChange={handleChange}
          />
          <span className="checkbox-custom"></span>
          Enable Notifications
        </label>
      </div>

      {/* Time Format */}
      <div className="preference-section">
        <h3>Time Format</h3>
        <div className="option-group">
          {['12h', '24h'].map((format) => (
            <label key={format}>
              <input
                type="radio"
                name="timeFormat"
                value={format}
                checked={preferences.timeFormat === format}
                onChange={handleChange}
              />
              {format === '12h' ? '12-hour' : '24-hour'}
            </label>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="preference-section">
        <h3>Accessibility</h3>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="highContrast"
            checked={preferences.highContrast}
            onChange={handleChange}
          />
          <span className="checkbox-custom"></span>
          High Contrast Mode
        </label>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="reduceMotion"
            checked={preferences.reduceMotion}
            onChange={handleChange}
          />
          <span className="checkbox-custom"></span>
          Reduce Motion
        </label>
      </div>

      {/* Reset Button */}
      <div className="preference-actions">
        <button onClick={resetToDefaults} className="reset-button">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};