import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiCheck, FiUpload } from 'react-icons/fi';
import './WallpaperPicker.css';

const defaultWallpapers = [
  { id: 'default', name: 'Default', value: 'linear-gradient(to bottom, #00a884, #1e2b32)' },
  { id: 'solid_blue', name: 'Solid Blue', value: '#0091ff' },
  { id: 'solid_green', name: 'Solid Green', value: '#00a884' },
  { id: 'solid_purple', name: 'Solid Purple', value: '#7856ff' },
  { id: 'pattern1', name: 'Pattern 1', value: 'url(/patterns/pattern1.png)' },
  { id: 'pattern2', name: 'Pattern 2', value: 'url(/patterns/pattern2.png)' },
  // Add more patterns as needed
];

export const WallpaperPicker = ({
  onClose,
  onSelectWallpaper,
  currentWallpaper,
  applyToAllChats,
  setApplyToAllChats
}) => {
  const fileInputRef = useRef(null);
  
  const handleCustomWallpaper = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      onSelectWallpaper({
        id: `custom_${Date.now()}`,
        name: 'Custom Wallpaper',
        value: `url(${event.target.result})`,
        isCustom: true
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="wallpaper-picker-overlay">
      <div className="wallpaper-picker-container">
        <div className="wallpaper-picker-header">
          <h3>Wallpaper</h3>
          <button onClick={onClose} aria-label="Close wallpaper picker">
            <FiX />
          </button>
        </div>
        
        <div className="wallpaper-options">
          <h4>Choose from default wallpapers</h4>
          <div className="wallpaper-grid">
            {defaultWallpapers.map((wp) => (
              <div 
                key={wp.id}
                className={`wallpaper-item ${currentWallpaper.id === wp.id ? 'selected' : ''}`}
                onClick={() => onSelectWallpaper(wp)}
                style={{ background: wp.value }}
                aria-label={`Select ${wp.name} wallpaper`}
              >
                {currentWallpaper.id === wp.id && <FiCheck className="check-icon" />}
              </div>
            ))}
          </div>
        </div>
        
        <div className="custom-wallpaper-section">
          <h4>Custom wallpaper</h4>
          <button 
            className="upload-button"
            onClick={() => fileInputRef.current.click()}
          >
            <FiUpload /> Upload Photo
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleCustomWallpaper}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
        
        <div className="wallpaper-apply-option">
          <label>
            <input 
              type="checkbox" 
              checked={applyToAllChats}
              onChange={(e) => setApplyToAllChats(e.target.checked)}
            />
            Apply to all chats
          </label>
        </div>
        
        <div className="wallpaper-picker-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="apply-button" 
            onClick={() => {
              onSelectWallpaper(currentWallpaper);
              onClose();
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

WallpaperPicker.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelectWallpaper: PropTypes.func.isRequired,
  currentWallpaper: PropTypes.object.isRequired,
  applyToAllChats: PropTypes.bool.isRequired,
  setApplyToAllChats: PropTypes.func.isRequired
};