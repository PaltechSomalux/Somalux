import React, { useState } from 'react';
import { FiX, FiCheck, FiImage, FiUpload } from 'react-icons/fi';
import './WallpaperPanel.css';
const wallpapers = [
  { id: 'default', name: 'Default', color: 'transparent' },
  { id: 'solid-blue', name: 'Blue', color: '#e3f2fd' },
  { id: 'solid-green', name: 'Green', color: '#e8f5e9' },
  { id: 'solid-gray', name: 'Gray', color: '#f5f5f5' },
  { id: 'dark', name: 'Dark', color: '#212121' },
];

export const WallpaperPanel = ({ show, onClose, currentWallpaper, onWallpaperChange }) => {
  const [selectedWallpaper, setSelectedWallpaper] = useState(currentWallpaper);
  const [customWallpaper, setCustomWallpaper] = useState(null);

  const handleApply = () => {
    onWallpaperChange(selectedWallpaper);
    if (customWallpaper) {
      // Handle custom wallpaper upload
      const wallpaperId = `custom-${Date.now()}`;
      onWallpaperChange(wallpaperId);
      // You would typically upload the image and store the URL
    }
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomWallpaper(event.target.result);
        setSelectedWallpaper('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`wallpaper-panel ${show ? 'show' : ''}`}>
      <div className="wallpaper-header">
        <h3>Chat Wallpaper</h3>
        <button onClick={onClose} className="close-button">
          <FiX />
        </button>
      </div>

      <div className="wallpaper-options">
        {wallpapers.map((wp) => (
          <div
            key={wp.id}
            className={`wallpaper-option ${selectedWallpaper === wp.id ? 'selected' : ''}`}
            onClick={() => {
              setSelectedWallpaper(wp.id);
              setCustomWallpaper(null);
            }}
            style={{ backgroundColor: wp.color }}
          >
            {selectedWallpaper === wp.id && (
              <div className="selected-icon">
                <FiCheck />
              </div>
            )}
            <span className="wallpaper-name">{wp.name}</span>
          </div>
        ))}
      </div>

      <div className="custom-wallpaper-upload">
        <label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="upload-button">
            <FiUpload /> Upload Custom Wallpaper
          </div>
        </label>
        {customWallpaper && (
          <div className="custom-wallpaper-preview">
            <img src={customWallpaper} alt="Custom wallpaper preview" />
          </div>
        )}
      </div>

      <div className="wallpaper-actions">
        <button onClick={onClose} className="cancel-button">
          Cancel
        </button>
        <button onClick={handleApply} className="apply-button">
          Apply
        </button>
      </div>
    </div>
  );
};

