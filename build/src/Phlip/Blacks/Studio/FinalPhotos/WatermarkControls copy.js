import React, { useEffect, useState, useRef } from 'react';
import { FaPen, FaImage } from 'react-icons/fa';
import './WatermarkControls.css';

export const WatermarkControls = ({
  watermarkType,
  setWatermarkType,
  watermarkText,
  setWatermarkText,
  watermarkColor,
  setWatermarkColor,
  watermarkSize,
  setWatermarkSize,
  watermarkOpacity,
  setWatermarkOpacity,
  watermarkPosition,
  setWatermarkPosition,
  watermarkFontFamily,
  setWatermarkFontFamily,
  logoImage,
  setLogoImage,
  logoInputRef,
  handleLogoUpload,
  selectedImage,
  setPreviewImage
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const colorPickerRef = useRef(null);
  const fontDropdownRef = useRef(null);
  
  // Standard color palette similar to MS Word
  const colorPalette = [
    '#000000', '#FFFFFF', '#EEECE1', '#1F497D', '#4F81BD', '#C0504D', '#9BBB59', 
    '#8064A2', '#4BACC6', '#F79646', '#FF0000', '#FFC000', '#FFFF00', '#92D050',
    '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0', '#C00000'
  ];

  // Common font families similar to MS Word
  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Arial Black', value: '"Arial Black", sans-serif' },
    { name: 'Calibri', value: 'Calibri, sans-serif' },
    { name: 'Cambria', value: 'Cambria, serif' },
    { name: 'Candara', value: 'Candara, sans-serif' },
    { name: 'Comic Sans MS', value: '"Comic Sans MS", sans-serif' },
    { name: 'Consolas', value: 'Consolas, monospace' },
    { name: 'Courier New', value: '"Courier New", monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Impact', value: 'Impact, sans-serif' },
    { name: 'Lucida Console', value: '"Lucida Console", monospace' },
    { name: 'Segoe UI', value: '"Segoe UI", sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' }
  ];

  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

  const applyTextWatermark = (ctx, width, height) => {
    ctx.font = `${watermarkSize}px ${watermarkFontFamily}`;
    ctx.fillStyle = watermarkColor;
    ctx.globalAlpha = watermarkOpacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(watermarkText).width;
    const textHeight = watermarkSize;
    
    let x, y;
    
    switch (watermarkPosition) {
      case 'top-left':
        x = textWidth / 2 + 20;
        y = textHeight / 2 + 20;
        break;
      case 'top-right':
        x = width - textWidth / 2 - 20;
        y = textHeight / 2 + 20;
        break;
      case 'bottom-left':
        x = textWidth / 2 + 20;
        y = height - textHeight / 2 - 20;
        break;
      case 'bottom-right':
        x = width - textWidth / 2 - 20;
        y = height - textHeight / 2 - 20;
        break;
      case 'tiled':
        const stepX = width / 3;
        const stepY = height / 3;
        for (let i = 1; i < 3; i++) {
          for (let j = 1; j < 3; j++) {
            ctx.fillText(watermarkText, stepX * i, stepY * j);
          }
        }
        return;
      default: // center
        x = width / 2;
        y = height / 2;
    }
    
    ctx.fillText(watermarkText, x, y);
  };

  const updateWatermarkedPreview = async () => {
    if (!selectedImage) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);

        if (watermarkType === 'text' && watermarkText) {
          applyTextWatermark(ctx, canvas.width, canvas.height);
        }

        setPreviewImage(canvas.toDataURL());
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(selectedImage);
  };

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker);
    setShowFontDropdown(false);
  };

  const toggleFontDropdown = () => {
    setShowFontDropdown(!showFontDropdown);
    setShowColorPicker(false);
  };

  const handleColorSelect = (color) => {
    setWatermarkColor(color);
    setShowColorPicker(false);
  };

  const handleFontSelect = (font) => {
    setWatermarkFontFamily(font);
    setShowFontDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target)) {
        setShowFontDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (watermarkType === 'text' && selectedImage) {
      updateWatermarkedPreview();
    }
  }, [watermarkText, watermarkColor, watermarkSize, watermarkOpacity, watermarkPosition, watermarkType, watermarkFontFamily, selectedImage]);

  // Get the display name for the current font family
  const getCurrentFontName = () => {
    const font = fontFamilies.find(f => f.value === watermarkFontFamily);
    return font ? font.name : watermarkFontFamily;
  };

  return (
    <div className="watermark-controls-container">
      <div className="watermark-controls-scrollable">
        <div className="control-group type-toggle">
          <div className="toggle-buttons">
            <button
              type="button"
              className={`toggle-button ${watermarkType === 'text' ? 'active' : ''}`}
              onClick={() => setWatermarkType('text')}
              aria-label="Text watermark"
            >
              <FaPen className="icon" />
              <span>Text</span>
            </button>
            <button
              type="button"
              className={`toggle-button ${watermarkType === 'image' ? 'active' : ''}`}
              onClick={() => setWatermarkType('image')}
              aria-label="Image watermark"
            >
              <FaImage className="icon" />
              <span>Image</span>
            </button>
          </div>
        </div>

        {watermarkType === 'text' ? (
          <>
            <div className="control-group horizontal">
              <label>Text:</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Watermark text"
                className="watermark-text-input"
              />
            </div>
            
            <div className="control-group horizontal">
              <label>Font:</label>
              <div className="font-family-selector" ref={fontDropdownRef}>
                <button 
                  className="font-family-button" 
                  onClick={toggleFontDropdown}
                  aria-label="Font family"
                >
                  <span className="font-family-preview" style={{ fontFamily: watermarkFontFamily }}>
                    {getCurrentFontName()}
                  </span>
                </button>
                
                {showFontDropdown && (
                  <div className="font-family-dropdown">
                    <div className="font-family-list">
                      {fontFamilies.map((font) => (
                        <button
                          key={font.value}
                          className="font-option"
                          style={{ fontFamily: font.value }}
                          onClick={() => handleFontSelect(font.value)}
                          aria-label={`Font ${font.name}`}
                        >
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="control-group horizontal">
              <label>Color:</label>
              <div className="word-style-color-picker" ref={colorPickerRef}>
                <button 
                  className="color-picker-button" 
                  onClick={toggleColorPicker}
                  aria-label="Text color"
                >
                  <span className="color-picker-preview" style={{ color: watermarkColor }}>A</span>
                  <span className="color-underline" style={{ backgroundColor: watermarkColor }}></span>
                </button>
                
                {showColorPicker && (
                  <div className="color-picker-dropdown">
                    <div className="color-palette">
                      {colorPalette.map((color) => (
                        <button
                          key={color}
                          className="color-option"
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorSelect(color)}
                          aria-label={`Color ${color}`}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={watermarkColor}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      className="custom-color-input"
                    />
                    <div className="custom-color-label">More Colors...</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="control-group horizontal">
              <label>Size:</label>
              <div className="font-size-selector">
                <input
                  type="number"
                  value={watermarkSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) setWatermarkSize(value);
                  }}
                  min="1"
                  max="200"
                  className="font-size-input"
                />
                <select
                  value={watermarkSize}
                  onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                  className="font-size-dropdown"
                >
                  {fontSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <div className="control-group horizontal logo-upload">
            <label>Logo:</label>
            {logoImage ? (
              <div className="logo-preview-container">
                <img src={logoImage} alt="Logo preview" className="logo-preview" />
                <button 
                  type="button" 
                  onClick={() => setLogoImage(null)}
                  className="remove-logo-btn"
                >
                  ×
                </button>
              </div>
            ) : ( 
              <div 
                className="logo-upload-area"
                onClick={() => logoInputRef.current.click()}
              >
                <p>Upload logo</p>
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
        )}

        <div className="control-group horizontal">
          <label>Opacity:</label>
          <div className="opacity-control">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
              className="opacity-slider"
            />
            <span className="opacity-value">{watermarkOpacity.toFixed(1)}</span>
          </div>
        </div>

        <div className="control-group horizontal">
          <label>Position:</label>
          <select
            value={watermarkPosition}
            onChange={(e) => setWatermarkPosition(e.target.value)}
            className="position-select"
          >
            <option value="center">Center</option>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="tiled">Tiled</option>
          </select>
        </div>
      </div>
    </div>
  );
};  