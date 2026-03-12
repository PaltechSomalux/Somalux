import React, { useEffect, useState, useRef } from 'react';
import { FaPen, FaImage, FaTimes } from 'react-icons/fa';
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
  setPreviewImage,
  canvasRef
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [textRotation, setTextRotation] = useState(0);
  const [textScale, setTextScale] = useState(1);
  const [isTextActive, setIsTextActive] = useState(false);
  
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
    if (!watermarkText) return;
    
    ctx.save();
    ctx.font = `${watermarkSize}px ${watermarkFontFamily}`;
    ctx.fillStyle = watermarkColor;
    ctx.globalAlpha = watermarkOpacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate text dimensions
    const textMetrics = ctx.measureText(watermarkText);
    const textWidth = textMetrics.width;
    const textHeight = watermarkSize;
    
    // Set transform origin to center of text
    const centerX = textPosition.x;
    const centerY = textPosition.y;
    
    // Apply transformations
    ctx.translate(centerX, centerY);
    ctx.rotate(textRotation * Math.PI / 180);
    ctx.scale(textScale, textScale);
    
    // Draw the text centered at the transform origin
    ctx.fillText(watermarkText, 0, 0);
    ctx.restore();
    
    // Draw bounding box if active
    if (isTextActive) {
      ctx.save();
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.globalAlpha = 0.5;
      
      ctx.translate(centerX, centerY);
      ctx.rotate(textRotation * Math.PI / 180);
      ctx.scale(textScale, textScale);
      
      ctx.strokeRect(
        -textWidth / 2 - 5,
        -textHeight / 2 - 5,
        textWidth + 10,
        textHeight + 10
      );
      
      // Draw rotation handle
      ctx.fillStyle = 'green';
      ctx.beginPath();
      ctx.arc(0, -textHeight / 2 - 15, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw resize handle
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(textWidth / 2 + 10, textHeight / 2 + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  };

  const updateWatermarkedPreview = async () => {
    if (!selectedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      if (watermarkType === 'text' && watermarkText) {
        applyTextWatermark(ctx, canvas.width, canvas.height);
      }
      
      setPreviewImage(canvas.toDataURL());
    };
    img.src = URL.createObjectURL(selectedImage);
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is on the text
    if (watermarkText) {
      const textWidth = watermarkSize * watermarkText.length * 0.6 * textScale;
      const textHeight = watermarkSize * textScale;
      
      // Simple hit test (could be improved)
      const distance = Math.sqrt(
        Math.pow(x - textPosition.x, 2) + 
        Math.pow(y - textPosition.y, 2)
      );
      
      if (distance < Math.max(textWidth, textHeight) * 0.8) {
        setIsTextActive(true);
        return;
      }
    }
    
    setIsTextActive(false);
  };

  const handleMouseDown = (e) => {
    if (!isTextActive || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if mouse is on rotation handle
    const rotationHandleX = textPosition.x;
    const rotationHandleY = textPosition.y - (watermarkSize * textScale / 2) - 15;
    const rotationDist = Math.sqrt(
      Math.pow(x - rotationHandleX, 2) + 
      Math.pow(y - rotationHandleY, 2)
    );
    
    if (rotationDist < 10) {
      setIsRotating(true);
      return;
    }
    
    // Check if mouse is on resize handle
    const resizeHandleX = textPosition.x + (watermarkSize * watermarkText.length * 0.6 * textScale / 2) + 10;
    const resizeHandleY = textPosition.y + (watermarkSize * textScale / 2) + 10;
    const resizeDist = Math.sqrt(
      Math.pow(x - resizeHandleX, 2) + 
      Math.pow(y - resizeHandleY, 2)
    );
    
    if (resizeDist < 10) {
      setIsResizing(true);
      setResizeStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Otherwise start dragging
    setIsDragging(true);
    setDragStart({
      x: e.clientX - textPosition.x,
      y: e.clientY - textPosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isTextActive || !canvasRef.current) return;
    
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setTextPosition({ x: newX, y: newY });
      updateWatermarkedPreview();
    } else if (isRotating) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = textPosition.x + rect.left;
      const centerY = textPosition.y + rect.top;
      const angle = Math.atan2(
        e.clientY - centerY,
        e.clientX - centerX
      ) * (180 / Math.PI);
      setTextRotation(angle);
      updateWatermarkedPreview();
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const newScale = Math.max(0.5, Math.min(3, textScale + deltaX * 0.01));
      setTextScale(newScale);
      setResizeStart({ x: e.clientX, y: e.clientY });
      updateWatermarkedPreview();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsRotating(false);
    setIsResizing(false);
  };

  // Event listeners setup
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.addEventListener('click', handleCanvasClick);
      canvasRef.current.addEventListener('mousedown', handleMouseDown);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleCanvasClick);
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isRotating, isResizing, isTextActive, textPosition, textRotation, textScale]);

  // Update preview when text properties change
  useEffect(() => {
    if (watermarkType === 'text' && selectedImage) {
      updateWatermarkedPreview();
    }
  }, [
    watermarkText, 
    watermarkColor, 
    watermarkSize, 
    watermarkOpacity, 
    watermarkFontFamily,
    textPosition,
    textRotation,
    textScale,
    isTextActive
  ]);

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
              onClick={() => {
                setWatermarkType('text');
                setIsTextActive(false);
              }}
              aria-label="Text watermark"
            >
              <FaPen className="icon" />
              <span>Text</span>
            </button>
            <button
              type="button"
              className={`toggle-button ${watermarkType === 'image' ? 'active' : ''}`}
              onClick={() => {
                setWatermarkType('image');
                setIsTextActive(false);
              }}
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
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Watermark text"
                className="watermark-text-input"
              />
              {isTextActive && (
                <button 
                  className="remove-watermark-btn"
                  onClick={() => setIsTextActive(false)}
                  aria-label="Deselect watermark"
                >
                  <FaTimes />
                </button>
              )}
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
                    if (!isNaN(value)) setWatermarkSize(Math.max(1, Math.min(200, value)));
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

        {isTextActive && (
          <div className="control-group horizontal">
            <label>Position:</label>
            <div className="position-values">
              X: {Math.round(textPosition.x)}, Y: {Math.round(textPosition.y)}
            </div>
          </div>
        )}

        {!isTextActive && (
          <div className="control-group horizontal">
            <label>Position:</label>
            <select
              value={watermarkPosition}
              onChange={(e) => {
                setWatermarkPosition(e.target.value);
                // Set default positions based on selection
                const canvas = canvasRef.current;
                if (canvas) {
                  switch (e.target.value) {
                    case 'top-left':
                      setTextPosition({ x: 50, y: 50 });
                      break;
                    case 'top-right':
                      setTextPosition({ x: canvas.width - 50, y: 50 });
                      break;
                    case 'bottom-left':
                      setTextPosition({ x: 50, y: canvas.height - 50 });
                      break;
                    case 'bottom-right':
                      setTextPosition({ x: canvas.width - 50, y: canvas.height - 50 });
                      break;
                    case 'center':
                    default:
                      setTextPosition({ x: canvas.width / 2, y: canvas.height / 2 });
                  }
                }
              }}
              className="position-select"
            >
              <option value="center">Center</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
        )}

        {isTextActive && (
          <div className="control-group instructions">
            <p>Drag to move, green dot to rotate, red dot to resize</p>
          </div>
        )}
      </div>
    </div>
  );
};