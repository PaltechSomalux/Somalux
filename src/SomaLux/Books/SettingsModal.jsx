// SettingsModal.jsx - Enhanced reading settings
import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, fontSize, onFontSizeChange, theme, onThemeChange, onClose }) => {
  const [lineHeight, setLineHeight] = useState(1.6);
  const [letterSpacing, setLetterSpacing] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="stm-overlay" onClick={onClose}>
      <div className="stm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stm-header">
          <h2>⚙️ Reading Settings</h2>
          <button onClick={onClose} className="stm-close-btn">
            <FiX size={20} />
          </button>
        </div>

        <div className="stm-content">
          {/* Font Size Control */}
          <div className="stm-setting-group">
            <label className="stm-label">
              📝 Font Size
            </label>
            <div className="stm-font-size-control">
              <button 
                onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
                className="stm-size-btn"
              >
                A−
              </button>
              <input 
                type="range" 
                min="12" 
                max="24" 
                value={fontSize}
                onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                className="stm-size-slider"
              />
              <button 
                onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                className="stm-size-btn"
              >
                A+
              </button>
              <span className="stm-size-display">{fontSize}px</span>
            </div>
            <div className="stm-font-preview" style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>

          {/* Line Height Control */}
          <div className="stm-setting-group">
            <label className="stm-label">
              📏 Line Height
            </label>
            <div className="stm-control-row">
              <input 
                type="range" 
                min="1.2" 
                max="2.2" 
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                className="stm-size-slider"
              />
              <span className="stm-size-display">{lineHeight.toFixed(1)}</span>
            </div>
            <div className="stm-preview-text" style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </div>
          </div>

          {/* Letter Spacing */}
          <div className="stm-setting-group">
            <label className="stm-label">
              🔤 Letter Spacing
            </label>
            <div className="stm-control-row">
              <input 
                type="range" 
                min="-0.5" 
                max="2" 
                step="0.1"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
                className="stm-size-slider"
              />
              <span className="stm-size-display">{letterSpacing.toFixed(1)}px</span>
            </div>
            <div className="stm-preview-text" style={{ fontSize: `${fontSize}px`, letterSpacing: `${letterSpacing}px` }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>

          {/* Theme Selection */}
          <div className="stm-setting-group">
            <label className="stm-label">
              🎨 Theme
            </label>
            <div className="stm-theme-options">
              <button 
                className={`stm-theme-btn stm-theme-dark ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
                title="Dark theme"
              >
                🌙 Dark
              </button>
              <button 
                className={`stm-theme-btn stm-theme-light ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
                title="Light theme"
              >
                ☀️ Light
              </button>
              <button 
                className={`stm-theme-btn stm-theme-sepia ${theme === 'sepia' ? 'active' : ''}`}
                onClick={() => onThemeChange('sepia')}
                title="Sepia theme"
              >
                📖 Sepia
              </button>
            </div>
          </div>

          {/* Display Options */}
          <div className="stm-setting-group">
            <label className="stm-label">
              👀 Display Options
            </label>
            <div className="stm-checkbox-group">
              <label className="stm-checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Show page numbers</span>
              </label>
              <label className="stm-checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Show table of contents</span>
              </label>
              <label className="stm-checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Enable animations</span>
              </label>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="stm-setting-group">
            <label className="stm-label">
              ⌨️ Keyboard Shortcuts
            </label>
            <div className="stm-shortcuts">
              <div className="stm-shortcut-row">
                <span className="stm-shortcut-key">Esc</span>
                <span className="stm-shortcut-desc">Close PDF viewer</span>
              </div>
              <div className="stm-shortcut-row">
                <span className="stm-shortcut-key">Ctrl + +</span>
                <span className="stm-shortcut-desc">Zoom in</span>
              </div>
              <div className="stm-shortcut-row">
                <span className="stm-shortcut-key">Ctrl + −</span>
                <span className="stm-shortcut-desc">Zoom out</span>
              </div>
              <div className="stm-shortcut-row">
                <span className="stm-shortcut-key">Scroll</span>
                <span className="stm-shortcut-desc">Navigate pages</span>
              </div>
            </div>
          </div>

          <div className="stm-footer">
            <button onClick={onClose} className="stm-close-button">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
