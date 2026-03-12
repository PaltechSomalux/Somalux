import React, { useState, useEffect } from 'react';
import './Wallpaper.css';

const defaultWallpapers = [
  // Solid colors
  { id: 'solid_white', name: 'Pure White', value: '#ffffff' },
  { id: 'solid_black', name: 'Deep Black', value: '#000000' },
  { id: 'solid_neon_pink', name: 'Neon Pink', value: '#ff00ff' },
  { id: 'solid_electric_blue', name: 'Electric Blue', value: '#0066ff' },
  { id: 'solid_lime_green', name: 'Lime Green', value: '#00ff00' },
  { id: 'solid_sunshine', name: 'Sunshine', value: '#ffff00' },
  { id: 'solid_violet', name: 'Violet', value: '#9d00ff' },
  { id: 'solid_coral', name: 'Coral', value: '#ff7f50' },
  
  // Gradients
  { id: 'gradient_rainbow', name: 'Rainbow', value: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff)' },
  { id: 'gradient_tropical', name: 'Tropical', value: 'linear-gradient(135deg, #ff00cc, #ff6600, #ffcc00)' },
  { id: 'gradient_ocean', name: 'Ocean', value: 'linear-gradient(135deg, #00f2fe, #4facfe)' },
  { id: 'gradient_sunset', name: 'Vivid Sunset', value: 'linear-gradient(135deg, #ff4e50, #f9d423)' },
  { id: 'gradient_purple_haze', name: 'Purple Haze', value: 'linear-gradient(135deg, #b06ab3, #4568dc)' },
  { id: 'gradient_emerald', name: 'Emerald', value: 'linear-gradient(135deg, #00cdac, #02aab0)' },
  { id: 'gradient_fire', name: 'Fire', value: 'linear-gradient(135deg, #f12711, #f5af19)' },
  { id: 'gradient_cotton_candy', name: 'Cotton Candy', value: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 'gradient_mint', name: 'Mint', value: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { id: 'gradient_peach', name: 'Peach', value: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { id: 'gradient_lavender', name: 'Lavender', value: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)' },
  { id: 'gradient_amethyst', name: 'Amethyst', value: 'linear-gradient(135deg, #9d50bb, #6e48aa)' },
  { id: 'gradient_sunrise', name: 'Sunrise', value: 'linear-gradient(135deg, #ff512f, #dd2476)' },
  { id: 'gradient_aqua', name: 'Aqua', value: 'linear-gradient(135deg, #00dbde, #fc00ff)' },
  { id: 'gradient_neon', name: 'Neon', value: 'linear-gradient(135deg, #ff00cc, #3333ff)' },
  { id: 'gradient_gold', name: 'Gold', value: 'linear-gradient(135deg, #ffd700, #ffaa00)' },
  { id: 'gradient_silver', name: 'Silver', value: 'linear-gradient(135deg, #c0c0c0, #e0e0e0)' },
  
  // Pattern-like gradients
  { id: 'gradient_geometric', name: 'Geometric', value: 'linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)' },
  { id: 'gradient_watermelon', name: 'Watermelon', value: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
  { id: 'gradient_skyline', name: 'Skyline', value: 'linear-gradient(135deg, #1a2980, #26d0ce)' },
  { id: 'gradient_berry', name: 'Berry', value: 'linear-gradient(135deg, #8e2de2, #4a00e0)' },
  { id: 'gradient_sunshine', name: 'Sunshine', value: 'linear-gradient(135deg, #f46b45, #eea849)' }
];

export const Wallpaper = ({ currentWallpaper: initialWallpaper, onClose, onSelect }) => {
  const [customImages, setCustomImages] = useState([]);
  const [currentWallpaper, setCurrentWallpaper] = useState(() => {
    // Initialize state with proper wallpaper object
    if (typeof initialWallpaper === 'object') return initialWallpaper;
    
    // Find in default wallpapers first
    const defaultWallpaper = defaultWallpapers.find(w => w.id === initialWallpaper);
    if (defaultWallpaper) return defaultWallpaper;
    
    // Then check in localStorage for custom images
    const savedImages = JSON.parse(localStorage.getItem('imo_custom_wallpapers') || '[]');
    const customWallpaper = savedImages.find(w => w.id === initialWallpaper);
    if (customWallpaper) return customWallpaper;
    
    // Fallback to first default wallpaper
    return defaultWallpapers[0];
  });

  // Combine default and custom wallpapers
  const allWallpapers = [
    ...defaultWallpapers,
    ...customImages
  ];

  // Load saved custom wallpapers
  useEffect(() => {
    const savedImages = localStorage.getItem('imo_custom_wallpapers');
    if (savedImages) {
      try {
        setCustomImages(JSON.parse(savedImages));
      } catch (e) {
        console.error('Failed to parse saved wallpapers', e);
      }
    }
  }, []);

  // Save custom wallpapers
  useEffect(() => {
    localStorage.setItem('imo_custom_wallpapers', JSON.stringify(customImages));
  }, [customImages]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newWallpaper = {
          id: `custom_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, "") || 'My Photo',
          value: event.target.result,
          isCustom: true
        };
        
        setCustomImages(prev => [...prev, newWallpaper]);
        setCurrentWallpaper(newWallpaper);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCustomImage = (id, e) => {
    e.stopPropagation();
    setCustomImages(prev => prev.filter(img => img.id !== id));
    if (currentWallpaper.id === id) {
      setCurrentWallpaper(defaultWallpapers[0]);
    }
  };

  const handleApply = () => {
    onSelect(currentWallpaper);
    onClose();
  };

  // Get style for preview based on wallpaper
  const getPreviewStyle = (wallpaper) => {
    if (wallpaper.value.includes('data:image')) {
      return { 
        backgroundImage: `url(${wallpaper.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    } else if (wallpaper.value.startsWith('linear-gradient')) {
      return { background: wallpaper.value };
    } else {
      return { backgroundColor: wallpaper.value };
    }
  };

  return (
    <div className="imo-container-settings">
      <div className="imo-modal-settings">
        <div className="imo-modal-header-settings">
          <button className="imo-back-button-settings" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="imo-modal-title-settings">Wallpaper</div>
        </div>

        {/* Preview Area */}
        <div className="imo-preview-area-settings">
          <div 
            className="imo-preview-background-settings"
            style={getPreviewStyle(currentWallpaper)}
          >
            <div className="imo-chat-preview-settings">
              <div className="imo-message-settings imo-received-settings">Hello there!</div>
              <div className="imo-message-settings imo-sent-settings">Hi! How are you?</div>
            </div>
          </div>
        </div>

        {/* Wallpaper Selection */}
        <div className="imo-wallpaper-selection-settings">
          <div className="imo-wallpaper-scroll-settings">
            {/* Upload Button */}
            <label className="imo-wallpaper-upload-settings">
              <input type="file" accept="image/*" onChange={handleImageUpload} multiple />
              <div className="imo-upload-icon-settings">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="imo-upload-label-settings">Add Photo</div>
            </label>

            {/* Wallpaper Thumbnails */}
            {allWallpapers.map(wallpaper => (
              <div
                key={wallpaper.id}
                className={`imo-wallpaper-thumbnail-settings ${currentWallpaper.id === wallpaper.id ? 'imo-selected-settings' : ''}`}
                onClick={() => setCurrentWallpaper(wallpaper)}
                style={getPreviewStyle(wallpaper)}
              >
                {currentWallpaper.id === wallpaper.id && (
                  <div className="imo-selection-check-settings">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                {wallpaper.isCustom && (
                  <button 
                    className="imo-remove-button-settings"
                    onClick={(e) => removeCustomImage(wallpaper.id, e)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <div className="imo-apply-container-settings">
          <button 
            className="imo-apply-button-settings"
            onClick={handleApply}
          >
            Apply
          </button>
        </div> 
      </div>
    </div>
  );
};