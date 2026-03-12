import React, { useCallback, useRef } from 'react';
import { SportsFilterControls } from './SportsFilterControls';
import { FONT_FAMILIES, TEXT_COLORS, UNDERLINE_STYLES } from './SportsConstants';
import './Sports.css';

export const SportsControls = ({
  addText,
  addLogo,
  handleFilterChange,
  selectedFeature,
  setSelectedFeature,
  activeElement,
  deleteElement,
  fontFamily,
  handleFontFamilyChange,
  textColor = '#FF0000',
  handleTextColorChange,
  strokeColor,
  handleStrokeColorChange,
  textStyles,
  toggleTextStyle,
  logoOpacity,
  handleLogoOpacityChange,
  logoBrightness,
  handleLogoBrightnessChange,
  filters,
  handleImageUpload,
  newPhotoInputRef,
  handleMatchdayClick, // Prop for Matchday button functionality
  handleQuoteClick, // New prop for Quote button functionality
}) => {
  const logoInputRef = useRef(null);

  // Memoize the toggleTextStyle handler
  const handleToggleTextStyle = useCallback(
    (style, value) => {
      toggleTextStyle(style, value);
    },
    [toggleTextStyle]
  );

  // Memoize the logo upload handler
  const handleLogoClick = useCallback(() => {
    logoInputRef.current.click();
  }, []);

  // Memoize the new photo upload handler
  const handleNewPhotoClick = useCallback(() => {
    newPhotoInputRef.current.click();
  }, [newPhotoInputRef]);

  return (
    <div className="bottom-toolbar-sports">
      <div className="primary-tools-scroll-container-sports">
        <div className="tool-group-sports primary-tools">
          <button
            className={`tool-button-sports ${selectedFeature === 'text' ? 'active' : ''}`}
            onClick={addText}
            data-tooltip="Add text to your sports image"
            disabled={false}
            aria-label="Add text"
          >
            <span>Text</span>
          </button>
          <button
            className={`tool-button-sports ${selectedFeature === 'logo' ? 'active' : ''}`}
            onClick={handleLogoClick}
            data-tooltip="Add a logo to your sports image"
            disabled={false}
            aria-label="Add logo"
          >
            <span>Logo</span>
          </button>
          <button
            className={`tool-button-sports ${selectedFeature === 'filters' ? 'active' : ''}`}
            onClick={() => setSelectedFeature('filters')}
            data-tooltip="Apply filters to the background image"
            disabled={false}
            aria-label="Apply filters"
          >
            <span>Filters</span>
          </button>
          {activeElement.id && (
            <button
              className="tool-button-sports"
              onClick={deleteElement}
              data-tooltip="Delete selected element"
              disabled={false}
              aria-label="Delete element"
            >
              <span>Delete</span>
            </button>
          )}
          <input
            type="file"
            ref={logoInputRef}
            onChange={addLogo}
            accept="image/*"
            style={{ display: 'none' }}
            aria-label="Upload logo"
          />
          <input
            type="file"
            ref={newPhotoInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
            aria-label="Upload new photo"
          />
        </div>
      </div>
      {selectedFeature && selectedFeature !== 'filters' && (
        <div className="secondary-tools-scroll-container-sports">
          <div className="tool-group-sports secondary-tools">
            {selectedFeature === 'text' && (
              <>
                <div className="form-group-sports">
                  <label>Font</label>
                  <select
                    value={fontFamily}
                    onChange={handleFontFamilyChange}
                    className="font-select-sports"
                    aria-label="Select font"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group-sports">
                  <label>Color</label>
                  <select
                    value={textColor}
                    onChange={handleTextColorChange}
                    className="color-select-sports"
                    aria-label="Select text color"
                  >
                    {TEXT_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group-sports">
                  <label>Stroke</label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={handleStrokeColorChange}
                    className="color-input-sports"
                    aria-label="Select stroke color"
                  />
                </div>
                <div className="style-buttons-sports">
                  <button
                    className={`style-button-sports ${textStyles.bold ? 'active' : ''}`}
                    onClick={() => handleToggleTextStyle('bold')}
                    data-tooltip="Bold"
                    aria-label="Toggle bold text"
                  >
                    <span style={{ fontWeight: 'bold' }}>B</span>
                  </button>
                  <button
                    className={`style-button-sports ${textStyles.italic ? 'active' : ''}`}
                    onClick={() => handleToggleTextStyle('italic')}
                    data-tooltip="Italic"
                    aria-label="Toggle italic text"
                  >
                    <span style={{ fontStyle: 'italic' }}>I</span>
                  </button>
                </div>
                <div className="form-group-sports">
                  <label> U̲ </label>
                  <select
                    value={textStyles.underline || 'none'}
                    onChange={(e) => handleToggleTextStyle('underline', e.target.value)}
                    className="underline-select-sports"
                    aria-label="Select underline style"
                  >
                    {UNDERLINE_STYLES.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {selectedFeature === 'logo' && (
              <>
                <div className="form-group-sports">
                  <label>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={logoOpacity}
                    onChange={handleLogoOpacityChange}
                    className="size-slider-sports"
                    aria-label="Adjust logo opacity"
                  />
                  <span>{logoOpacity}%</span>
                </div>
                <div className="form-group-sports">
                  <label>Brightness</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={logoBrightness}
                    onChange={handleLogoBrightnessChange}
                    className="size-slider-sports"
                    aria-label="Adjust logo brightness"
                  />
                  <span>{logoBrightness}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <SportsFilterControls
        filters={filters}
        handleFilterChange={handleFilterChange}
        selectedFeature={selectedFeature}
        isCropping={false}
      />
      <div className="download-button-container-sports">
        <button
          className="download-button-sports"
          onClick={handleNewPhotoClick}
          disabled={false}
          aria-label="Upload new photo"
        >
          <span>New Photo</span>
        </button>
        <button
          className="download-button-sports"
          onClick={handleMatchdayClick || (() => console.log('Matchday button clicked'))}
          disabled={false}
          aria-label="Matchday action"
        >
          <span>Matchday</span>
        </button>
        <button
          className="download-button-sports"
          onClick={handleQuoteClick || (() => console.log('Quote button clicked'))} // Fallback handler
          disabled={false}
          aria-label="Quote action"
        >
          <span>Quote</span>
        </button>
      </div>
    </div>
  );
};