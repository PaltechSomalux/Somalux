import React, { useEffect, useState, useRef } from 'react';
import { FaPen, FaImage } from 'react-icons/fa';
import './WatermarkControls.css';

export const WatermarkControls = ({
  watermarkType,
  setWatermarkType,
  watermarkColor,
  setWatermarkColor,
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
  canvasRef,
  textElements,
  setTextElements
}) => {
  const [activeTextId, setActiveTextId] = useState(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [defaultFontSize, setDefaultFontSize] = useState(16);
  const colorPickerRef = useRef(null);
  const fontDropdownRef = useRef(null);

  const colorPalette = [
    '#000000', '#FFFFFF', '#EEECE1', '#1F497D', '#4F81BD', '#C0504D', '#9BBB59',
    '#8064A2', '#4BACC6', '#F79646', '#FF0000', '#FFC000', '#FFFF00', '#92D050',
    '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0', '#C00000'
  ];

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

  // Helper function to estimate text bounding box
  const getTextBounds = (textEl) => {
    if (!canvasRef.current) return { width: 0, height: 0 };
    const ctx = canvasRef.current.getContext('2d');
    ctx.font = `${textEl.fontSize * textEl.scale}px ${textEl.fontFamily}`;
    const metrics = ctx.measureText(textEl.text);
    const textWidth = metrics.width;
    const textHeight = textEl.fontSize * textEl.scale * 1.2; // Approximate height with padding
    return { width: textWidth, height: textHeight };
  };

  // Helper function to clamp position within canvas
  const clampPosition = (x, y, textEl) => {
    if (!canvasRef.current) return { x, y };
    const { width, height } = getTextBounds(textEl);
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;

    // Clamp x and y to keep text within canvas
    const clampedX = Math.max(width / 2, Math.min(canvasWidth - width / 2, x));
    const clampedY = Math.max(height / 2, Math.min(canvasHeight - height / 2, y));
    return { x: clampedX, y: clampedY };
  };

  const addTextElement = () => {
    if (!textInput.trim() || !canvasRef.current) return;

    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;
    const newTextElement = {
      id: Date.now(),
      text: textInput,
      position: clampPosition(canvasWidth / 2, canvasHeight / 2, {
        text: textInput,
        fontSize: fontSizes.includes(defaultFontSize) ? defaultFontSize : 16,
        fontFamily: watermarkFontFamily,
        scale: 1
      }), // Center by default, clamped
      rotation: 0,
      scale: 1,
      fontSize: fontSizes.includes(defaultFontSize) ? defaultFontSize : 16,
      fontFamily: watermarkFontFamily,
      color: watermarkColor
    };

    setTextElements([...textElements, newTextElement]);
    setTextInput('');
    setIsAddingText(false);
    setActiveTextId(newTextElement.id);
  };

  const updateTextElement = (id, updates) => {
    setTextElements(textElements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const removeTextElement = (id) => {
    setTextElements(textElements.filter(el => el.id !== id));
    if (activeTextId === id) setActiveTextId(null);
  };

  const handleCanvasClick = (e) => {
    if (!isAddingText || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTextElement = {
      id: Date.now(),
      text: textInput,
      position: clampPosition(x, y, {
        text: textInput,
        fontSize: fontSizes.includes(defaultFontSize) ? defaultFontSize : 16,
        fontFamily: watermarkFontFamily,
        scale: 1
      }),
      rotation: 0,
      scale: 1,
      fontSize: fontSizes.includes(defaultFontSize) ? defaultFontSize : 16,
      fontFamily: watermarkFontFamily,
      color: watermarkColor
    };

    setTextElements([...textElements, newTextElement]);
    setTextInput('');
    setIsAddingText(false);
    setActiveTextId(newTextElement.id);
  };

  const handleMouseDown = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsDragging(true);
    setDragStart({
      x: e.clientX - textEl.position.x,
      y: e.clientY - textEl.position.y
    });
  };

  const handleTouchStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - textEl.position.x,
        y: e.touches[0].clientY - textEl.position.y
      });
    }
  };

  const handleRotationStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsRotating(true);
  };

  const handleTouchRotationStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsRotating(true);
  };

  const handleResizeStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleTouchResizeStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsResizing(true);
    setResizeStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleMouseMove = (e) => {
    if (!activeTextId || !canvasRef.current) return;
    const activeText = textElements.find(el => el.id === activeTextId);
    if (!activeText) return;

    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const clampedPosition = clampPosition(newX, newY, activeText);
      updateTextElement(activeTextId, { position: clampedPosition });
    } else if (isRotating) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = activeText.position.x + rect.left + 50 * activeText.scale;
      const centerY = activeText.position.y + rect.top + 10 * activeText.scale;
      const angle = Math.atan2(
        e.clientY - centerY,
        e.clientX - centerX
      ) * (180 / Math.PI);
      updateTextElement(activeTextId, { rotation: angle });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const newScale = Math.max(0.5, Math.min(3, activeText.scale + deltaX * 0.01));
      updateTextElement(activeTextId, { scale: newScale });
      setResizeStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!activeTextId || !canvasRef.current) return;
    const activeText = textElements.find(el => el.id === activeTextId);
    if (!activeText || !e.touches[0]) return;

    const touch = e.touches[0];

    if (isDragging) {
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      const clampedPosition = clampPosition(newX, newY, activeText);
      updateTextElement(activeTextId, { position: clampedPosition });
    } else if (isRotating) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = activeText.position.x + rect.left + 50 * activeText.scale;
      const centerY = activeText.position.y + rect.top + 10 * activeText.scale;
      const angle = Math.atan2(
        touch.clientY - centerY,
        touch.clientX - centerX
      ) * (180 / Math.PI);
      updateTextElement(activeTextId, { rotation: angle });
    } else if (isResizing) {
      const deltaX = touch.clientX - resizeStart.x;
      const newScale = Math.max(0.5, Math.min(3, activeText.scale + deltaX * 0.01));
      updateTextElement(activeTextId, { scale: newScale });
      setResizeStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsRotating(false);
    setIsResizing(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsRotating(false);
    setIsResizing(false);
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
    if (activeTextId) {
      updateTextElement(activeTextId, { color });
    }
    setShowColorPicker(false);
  };

  const handleFontSelect = (font) => {
    setWatermarkFontFamily(font);
    if (activeTextId) {
      updateTextElement(activeTextId, { fontFamily: font });
    }
    setShowFontDropdown(false);
  };

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.addEventListener('click', handleCanvasClick);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleCanvasClick);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isRotating, isResizing, activeTextId, textElements, isAddingText]);

  const getCurrentFontName = () => {
    const font = fontFamilies.find(f => f.value === watermarkFontFamily);
    return font ? font.name : watermarkFontFamily;
  };

  const renderTextElements = () => {
    return textElements.map((textEl) => {
      const isActive = activeTextId === textEl.id;

      return (
        <div
          key={textEl.id}
          style={{
            position: 'absolute',
            left: `${textEl.position.x}px`,
            top: `${textEl.position.y}px`,
            cursor: isActive ? 'move' : 'pointer',
            backgroundColor: isActive ? 'rgba(0,0,255,0.1)' : 'transparent',
            padding: '2px',
            border: isActive ? '1px dashed blue' : 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            touchAction: 'none',
            transform: `rotate(${textEl.rotation}deg) scale(${textEl.scale})`,
            transformOrigin: 'center center',
            fontFamily: textEl.fontFamily,
            fontSize: `${textEl.fontSize}px`,
            color: textEl.color
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveTextId(textEl.id);
            setWatermarkColor(textEl.color);
            setWatermarkFontFamily(textEl.fontFamily);
            setDefaultFontSize(textEl.fontSize);
          }}
          onMouseDown={(e) => handleMouseDown(e, textEl)}
          onTouchStart={(e) => handleTouchStart(e, textEl)}
        >
          {textEl.text}
          {isActive && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'green',
                  borderRadius: '50%',
                  cursor: 'grab',
                  transform: 'translateX(-50%)'
                }}
                onMouseDown={(e) => handleRotationStart(e, textEl)}
                onTouchStart={(e) => handleTouchRotationStart(e, textEl)}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-20px',
                  right: '-20px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'red',
                  borderRadius: '50%',
                  cursor: 'nwse-resize',
                  transform: 'translate(50%, 50%)'
                }}
                onMouseDown={(e) => handleResizeStart(e, textEl)}
                onTouchStart={(e) => handleTouchResizeStart(e, textEl)}
              />
            </>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {watermarkType === 'text' && renderTextElements()}
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
                <button
                  onClick={() => setIsAddingText(!isAddingText)}
                  style={{ backgroundColor: isAddingText ? '#0b1216' : '#0b1216', padding: '8px 16px' }}
                >
                  {isAddingText ? 'Cancel' : 'Add Text'}
                </button>
                {activeTextId && (
                  <button
                    onClick={() => removeTextElement(activeTextId)}
                    style={{ backgroundColor: '#ff4444', color: 'white' }}
                  >
                    Delete
                  </button>
                )}
              </div>

              {isAddingText && (
                <div className="control-group horizontal">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter watermark text"
                    className="watermark-text-input"
                  />
                  <button onClick={addTextElement}>Add</button>
                </div>
              )}

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
                  <select
                    value={activeTextId ? textElements.find(el => el.id === activeTextId)?.fontSize : defaultFontSize}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value);
                      if (activeTextId) {
                        updateTextElement(activeTextId, { fontSize: newSize });
                      } else {
                        setDefaultFontSize(newSize);
                      }
                    }}
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
    </>
  );
};