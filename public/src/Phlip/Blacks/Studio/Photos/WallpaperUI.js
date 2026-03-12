import React, { forwardRef, useState, useRef } from 'react';
import "./Wallpaper.css";
import { useWallpaper } from '../../../../Kiss/defaultwallpapers';
import { defaultWallpapers, wallpaperLibrary }  from '../../../../Kiss/defaultwallpapers';
export const WallpaperUI = forwardRef(({ currentWallpaper: initialWallpaper, onClose, onSelect }, ref) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef(null);
  const {
    currentWallpaper,
    setCurrentWallpaper,
    customImages,
    handleImageUpload,
    removeCustomImage,
    getPreviewStyle,
    allWallpapers
  } = useWallpaper(initialWallpaper);

  const selectFromLibrary = (wallpaper) => {
    setCurrentWallpaper(wallpaper);
    setShowLibrary(false);
  };

  const handleApply = () => {
    if (currentWallpaper) {
      onSelect(currentWallpaper);
    }
    onClose();
  };

  const handleRemoveCustomImage = (id, e) => {
    e.stopPropagation();
    removeCustomImage(id);
  };

  const downloadWallpaper = () => {
    if (!currentWallpaper) return;
    
    if (currentWallpaper.value.startsWith('url(')) {
      const wallpaperId = currentWallpaper.id.replace('local_', '');
      const wallpaperFile = wallpaperLibrary.find(w => w.id === currentWallpaper.id);
      
      if (wallpaperFile) {
        const url = wallpaperFile.value.match(/url\((.*?)\)/)[1];
        const link = document.createElement('a');
        link.href = url;
        link.download = currentWallpaper.name || 'wallpaper.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (currentWallpaper.value.startsWith('data:image')) {
      const link = document.createElement('a');
      link.href = currentWallpaper.value;
      link.download = currentWallpaper.name || 'wallpaper.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileChange = (e) => {
    handleImageUpload(e);
    // Reset the input to allow selecting the same file again
    e.target.value = null;
  };

  if (showLibrary) {
    return (
      <div className="imo-container">
        <div className="imo-modal" ref={ref}>
          <div className="imo-modal-header">
            <button className="imo-back-button" onClick={() => setShowLibrary(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="imo-modal-title">Wallpapers</div>
          </div>

          <div className="imo-library-grid">
            {wallpaperLibrary.map(wallpaper => {
              const matchingDefault = defaultWallpapers.find(w => w.id === wallpaper.id);
              return (
                <div
                  key={wallpaper.id}
                  className={`imo-library-item ${currentWallpaper?.id === wallpaper.id ? 'imo-selected' : ''}`}
                  onClick={() => selectFromLibrary(matchingDefault || wallpaper)}
                  style={getPreviewStyle(wallpaper)}
                >
                  {matchingDefault && (
                    <div className="imo-library-item-name">{matchingDefault.name}</div>
                  )}
                  {currentWallpaper?.id === wallpaper.id && (
                    <div className="imo-selection-check">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="imo-container">
      <div className="imo-modal" ref={ref}>
        <div className="imo-modal-header">
          <button className="imo-back-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="imo-modal-title">Wallpaper</div>
        </div>

        <div className="imo-preview-area">
          <div 
            className="imo-preview-background"
            style={getPreviewStyle(currentWallpaper || defaultWallpapers[0])}
          >
            <div className="imo-chat-preview">
              <div className="imo-message imo-received">Hello Paltech Consolidated 🥰!</div>
              <div className="imo-message imo-sent">Hi! Campuslife 😊</div>
            </div>
          </div>
        </div>

        <div className="imo-wallpaper-selection">
          <div className="imo-wallpaper-scroll">
            {/* Modified upload button to match the second component */}
           
            <button 
              className="imo-wallpaper-upload"
              onClick={() => setShowLibrary(true)}
            >
              <div className="imo-upload-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6H20M4 10H20M4 14H20M4 18H20" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="imo-upload-label">Library</div>
            </button>

            {allWallpapers.map(wallpaper => (
              <div
                key={wallpaper.id}
                className={`imo-wallpaper-thumbnail ${currentWallpaper?.id === wallpaper.id ? 'imo-selected' : ''}`}
                onClick={() => setCurrentWallpaper(wallpaper)}
                style={getPreviewStyle(wallpaper)}
              >
                {currentWallpaper?.id === wallpaper.id && (
                  <div className="imo-selection-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                {wallpaper.isCustom && (
                  <button 
                    className="imo-remove-button"
                    onClick={(e) => handleRemoveCustomImage(wallpaper.id, e)}
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

        <div className="imo-button-group-UI">
          <button 
            className="imo-download-button"
            onClick={downloadWallpaper}
            disabled={!currentWallpaper || currentWallpaper.value.startsWith('#')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Save
          </button>
       
        </div> 
      </div> 
    </div> 
  );
});

WallpaperUI.displayName = 'WallpaperUI';

export default WallpaperUI;