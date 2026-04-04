// src/components/Chat/WallpaperSettings.js
import React, { useState, useRef } from 'react';
import { useChat } from './ChatContext';
import { FiX, FiImage, FiCheck, FiSliders } from 'react-icons/fi';
import './WallpaperSettings.css';

const wallpapers = [
  { id: 'default', name: 'Default', url: '' },
  { id: 'wp1', name: 'Blue Dots', url: 'https://example.com/wallpapers/blue-dots.jpg' },
  { id: 'wp2', name: 'Green Leaves', url: 'https://example.com/wallpapers/green-leaves.jpg' },
  { id: 'wp3', name: 'Mountain', url: 'https://example.com/wallpapers/mountain.jpg' },
  { id: 'wp4', name: 'Beach', url: 'https://example.com/wallpapers/beach.jpg' },
  { id: 'wp5', name: 'Abstract', url: 'https://example.com/wallpapers/abstract.jpg' },
];

export const WallpaperSettings = () => {
  const { wallpaper, setWallpaper } = useChat();
  const [showPanel, setShowPanel] = useState(false);
  const [showCustomUpload, setShowCustomUpload] = useState(false);
  const [customWallpaper, setCustomWallpaper] = useState(null);
  const fileInputRef = useRef(null);

  const handleWallpaperSelect = (selectedWallpaper) => {
    if (selectedWallpaper.id === 'custom') {
      setShowCustomUpload(true);
    } else {
      setWallpaper({
        selected: selectedWallpaper.id,
        custom: null,
      });
    }
  };

  const handleCustomWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomWallpaper(event.target.result);
        setWallpaper({
          selected: 'custom',
          custom: event.target.result,
        });
        setShowCustomUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpacityChange = (e) => {
    setWallpaper({
      ...wallpaper,
      opacity: parseFloat(e.target.value),
    });
  };

  return (
    <>
      <button 
        className="wallpaper-settings-button"
        onClick={() => setShowPanel(!showPanel)}
      >
        <FiSliders />
      </button>

      {showPanel && (
        <div className="wallpaper-settings-panel">
          <div className="wallpaper-settings-header">
            <h3>Chat Wallpaper</h3>
            <button onClick={() => setShowPanel(false)}>
              <FiX />
            </button>
          </div>

          <div className="wallpaper-opacity-control">
            <label>Opacity: {Math.round(wallpaper.opacity * 100)}%</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={wallpaper.opacity}
              onChange={handleOpacityChange}
            />
          </div>

          <div className="wallpaper-grid">
            {wallpapers.map((wp) => (
              <div
                key={wp.id}
                className={`wallpaper-item ${wallpaper.selected === wp.id ? 'selected' : ''}`}
                onClick={() => handleWallpaperSelect(wp)}
              >
                {wp.id === 'default' ? (
                  <div className="default-wallpaper">
                    <span>Default</span>
                  </div>
                ) : (
                  <img src={wp.url} alt={wp.name} />
                )}
                {wallpaper.selected === wp.id && (
                  <div className="wallpaper-checkmark">
                    <FiCheck />
                  </div>
                )}
              </div>
            ))}
            <div
              className={`wallpaper-item ${wallpaper.selected === 'custom' ? 'selected' : ''}`}
              onClick={() => handleWallpaperSelect({ id: 'custom' })}
            >
              <div className="custom-wallpaper-upload">
                <FiImage />
                <span>Custom</span>
              </div>
              {wallpaper.selected === 'custom' && (
                <div className="wallpaper-checkmark">
                  <FiCheck />
                </div>
              )}
            </div>
          </div>

          {showCustomUpload && (
            <div className="custom-wallpaper-upload-panel">
              <h4>Upload Custom Wallpaper</h4>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCustomWallpaperUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button onClick={() => fileInputRef.current.click()}>
                Select Image
              </button>
              <button onClick={() => setShowCustomUpload(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

