import React, { useRef } from 'react';

export const WatermarkControlsSection = ({
  watermarkType,
  setWatermarkType,
  watermarkColor,
  setWatermarkColor,
  watermarkSize,
  setWatermarkSize,
  watermarkOpacity,
  setWatermarkOpacity,
  logoImage,
  setLogoImage, 
  selectedImage,
  handleLogoUpload,
  downloadImage
}) => {
  const logoInputRef = useRef(null);

  return (
    <div className="controls-section">
      <div className="watermark-type-selector">
        <div 
          className={`watermark-type-option ${watermarkType === 'image' ? 'active' : ''}`}
          onClick={() => setWatermarkType('image')}
          title="Image Watermark"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>Image</span>
        </div>
      </div>
      
      <div className="controls-row">
        {watermarkType === 'image' && (
          <div className="controls-column">
            <div className="control-group logo-upload">
              <label>Logo Image:</label>
              {logoImage ? (
                <div className="logo-preview-container">
                  <img src={logoImage} alt="Logo preview" className="logo-preview" />
                  <button 
                    type="button" 
                    onClick={() => setLogoImage(null)}
                    className="remove-logo-btn"
                  >
                    Remove Logo
                  </button>
                </div>
              ) : (
                <div 
                  className="logo-upload-area"
                  onClick={() => logoInputRef.current.click()}
                >
                  <p>Upload Logo</p>
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="controls-column">
          <div className="control-group">
            <label>Opacity:</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
            />
            <span>{watermarkOpacity.toFixed(1)}</span>
          </div>
          
          {watermarkType === 'image' && (
            <div className="control-group">
              <label>Size:</label>
              <input
                type="range"
                min="10"
                max="200"
                value={watermarkSize}
                onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
              />
              <span>{watermarkSize}px</span>
            </div>
          )}
        </div>
      </div>
      
      <button 
        className="download-btn"
        onClick={downloadImage}
        disabled={!selectedImage}
      >
        Download 
      </button>
    </div>
  );
};