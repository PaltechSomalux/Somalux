import React, { useEffect, useRef } from 'react';
import { getHighlightColors } from './TextFormatter';
import './ColorPicker.css';

export const ColorPicker = ({ 
  position, 
  onColorSelect, 
  onClose,
  currentText = ''
}) => {
  const pickerRef = useRef(null);
  const colors = getHighlightColors();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleColorClick = (colorValue) => {
    onColorSelect(colorValue);
  };

  return (
    <div 
      ref={pickerRef}
      className="color-picker-popup" 
      style={{
        bottom: position?.bottom || '60px',
        left: position?.left || '20px',
      }}
    >
      <div className="color-picker-header">
        <span className="color-picker-title">Choose highlight color</span>
        <button onClick={onClose} className="color-picker-close">×</button>
      </div>
      
      <div className="color-picker-preview">
        {currentText ? (
          <span className="preview-text">{currentText}</span>
        ) : (
          <span className="preview-placeholder">Type to see preview...</span>
        )}
      </div>

      <div className="color-picker-grid">
        {colors.map((color) => (
          <button
            key={color.value}
            className="color-picker-swatch"
            style={{ backgroundColor: color.hex }}
            onClick={() => handleColorClick(color.value)}
            title={color.name}
          >
            <span className="color-picker-label" style={{
              color: ['yellow', 'green', 'orange', 'lime', 'cyan', 'violet'].includes(color.value) ? '#000' : '#fff'
            }}>
              {color.name}
            </span>
          </button>
        ))}
      </div>

      <div className="color-picker-footer">
        <div className="formatting-help">
          <span className="help-title">Quick formatting:</span>
          <div className="help-items">
            <span className="help-item">*bold*</span>
            <span className="help-item">_italic_</span>
            <span className="help-item">~strike~</span>
            <span className="help-item">`code`</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
