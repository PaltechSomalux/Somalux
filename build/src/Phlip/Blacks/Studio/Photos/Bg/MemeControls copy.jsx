import React, { useCallback, useRef } from 'react';
import { MemeFilterControls } from './MemeFilterControls';
import { SHAPES, EMOJIS, FONT_FAMILIES } from './MemeConstants';
import './Memes.css';

// Define underline styles
const UNDERLINE_STYLES = [
  { value: 'none', label: 'None' },
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dash-dot', label: 'Dash Dot' },
  { value: 'dash-dot-dot', label: 'Dash Dot Dot' },
  { value: 'wave', label: 'Wave' },
  { value: 'thick', label: 'Thick' },
  { value: 'double-wave', label: 'Double Wave' },
  { value: 'heavy-wave', label: 'Heavy Wave' },
  { value: 'long-dash', label: 'Long Dash' },
  { value: 'thick-dash', label: 'Thick Dash' },
  { value: 'thick-dotted', label: 'Thick Dotted' },
  { value: 'thick-dash-dot', label: 'Thick Dash Dot' },
  { value: 'thick-dash-dot-dot', label: 'Thick Dash Dot Dot' },
];

// Define designer colors and gradients
const DESIGNER_COLORS = [
  { value: 'none', label: 'No Fill' },
  { value: '#2E2E2E', label: 'Midnight Charcoal' },
  { value: '#F4A261', label: 'Sunset Orange' },
  { value: '#2A9D8F', label: 'Tropical Teal' },
  { value: '#E76F51', label: 'Coral Blaze' },
  { value: '#E9C46A', label: 'Golden Saffron' },
  { value: '#264653', label: 'Deep Ocean' },
  { value: 'linear-gradient(45deg, #FF6B6B, #FFE66D)', label: 'Sunset Glow' },
  { value: 'linear-gradient(90deg, #4ECDC4, #556270)', label: 'Ocean Breeze' },
  { value: 'linear-gradient(135deg, #F94144, #F3722C, #F8961E)', label: 'Fiery Horizon' },
  { value: 'linear-gradient(120deg, #1A535C, #4ECDC4, #F7FFF7)', label: 'Aqua Dream' },
  { value: 'radial-gradient(circle, #F4A261, #E76F51)', label: 'Warm Ember' },
  { value: 'radial-gradient(circle, #2A9D8F, #264653)', label: 'Teal Vortex' },
  { value: 'linear-gradient(60deg, #833AB4, #FD1D1D, #FCB045)', label: 'Vibrant Pulse' },
];

export const MemeControls = ({
  addText,
  addShape,
  addPhoto,
  addEmoji,
  deleteElement,
  handleFilterChange,
  selectedFeature,
  setSelectedFeature,
  activeElement,
  fontFamily,
  handleFontFamilyChange,
  textColor,
  handleTextColorChange,
  strokeColor,
  handleStrokeColorChange,
  textStyles,
  toggleTextStyle,
  selectedShape,
  handleShapeTypeChange,
  shapeFillColor,
  handleShapeFillColorChange,
  shapeOutlineColor,
  handleShapeOutlineColorChange,
  shapeOutlineWidth,
  handleShapeOutlineWidthChange,
  selectedEmoji,
  handleEmojiChange,
  photoOpacity,
  handlePhotoOpacityChange,
  photoBrightness,
  handlePhotoBrightnessChange,
  filters,
  updateShapeProperties,
  emojiSize,
  handleEmojiSizeChange,
  handleImageUpload,
  newPhotoInputRef,
  handleMergeImages,
  mergeInputRef,
}) => {
  const photoInputRef = useRef(null);

  // Memoize handlers
  const handleToggleTextStyle = useCallback(
    (style, value) => {
      toggleTextStyle(style, value);
    },
    [toggleTextStyle]
  );

  const handleAddShape = useCallback(() => {
    addShape({
      shapeType: selectedShape,
      fillColor: shapeFillColor,
      outlineColor: shapeOutlineColor,
      outlineWidth: shapeOutlineWidth,
    });
  }, [addShape, selectedShape, shapeFillColor, shapeOutlineColor, shapeOutlineWidth]);

  const handleNewPhotoClick = useCallback(() => {
    newPhotoInputRef.current.click();
  }, [newPhotoInputRef]);

  const handleMergeClick = useCallback(() => {
    mergeInputRef.current.click();
  }, []);

  return (
    <div className="bottom-toolbar-memes">
      <div className="primary-tools-scroll-container-memes">
        <div className="tool-group-memes primary-tools">
          <button
            className={`tool-button-memes ${selectedFeature === 'text' ? 'active' : ''}`}
            onClick={addText}
            data-tooltip="Add text to your meme"
            disabled={false}
            aria-label="Add text"
          >
            <span>Text</span>
          </button>
          <button
            className={`tool-button-memes ${selectedFeature === 'shape' ? 'active' : ''}`}
            onClick={handleAddShape}
            data-tooltip="Add a shape to your meme"
            disabled={false}
            aria-label="Add shape"
          >
            <span>Shapes</span>
          </button>
          <button
            className={`tool-button-memes ${selectedFeature === 'emoji' ? 'active' : ''}`}
            onClick={addEmoji}
            data-tooltip="Add an emoji to your meme"
            disabled={false}
            aria-label="Add emoji"
          >
            <span>Emoji</span>
          </button>
          <button
            className={`tool-button-memes ${selectedFeature === 'photo' ? 'active' : ''}`}
            onClick={() => photoInputRef.current.click()}
            data-tooltip="Add a photo to your meme"
            disabled={false}
            aria-label="Add photo"
          >
            <span>Photo</span>
          </button>
          <button
            className={`tool-button-memes ${selectedFeature === 'merge' ? 'active' : ''}`}
            onClick={handleMergeClick}
            data-tooltip="Merge multiple photos into the meme"
            disabled={false}
            aria-label="Merge photos"
          >
            <span>Merge</span>
          </button>
          <button
            className={`tool-button-memes ${selectedFeature === 'filters' ? 'active' : ''}`}
            onClick={() => setSelectedFeature('filters')}
            data-tooltip="Apply filters to the background image"
            disabled={false}
            aria-label="Apply filters"
          >
            <span>Filters</span>
          </button>
          <input
            type="file"
            ref={photoInputRef}
            onChange={addPhoto}
            accept="image/*"
            style={{ display: 'none' }}
            aria-label="Upload photo"
          />
          <input
            type="file"
            ref={newPhotoInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
            aria-label="Upload new photo"
          />
          <input
            type="file"
            ref={mergeInputRef}
            onChange={handleMergeImages}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            aria-label="Upload multiple photos to merge"
          />
          {activeElement.id && (
            <button
              className="tool-button-memes"
              onClick={deleteElement}
              data-tooltip="Delete selected element"
              disabled={false}
              aria-label="Delete element"
            >
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
      {selectedFeature && selectedFeature !== 'filters' && (
        <div className="secondary-tools-scroll-container-memes">
          <div className="tool-group-memes secondary-tools">
            {selectedFeature === 'text' && (
              <div className="text-controls">
                <div className="form-group-memes">
                  <label>Font</label>
                  <select
                    value={fontFamily}
                    onChange={handleFontFamilyChange}
                    className="font-select-memes"
                    aria-label="Select font"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group-memes">
                  <label>Color</label>
                  <select
                    value={textColor}
                    onChange={handleTextColorChange}
                    className="color-select-memes"
                    aria-label="Select text color"
                  >
                    {DESIGNER_COLORS.filter((color) => color.value !== 'none').map((color) => (
                      <option key={color.value} value={color.value} style={{ background: color.value }}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group-memes">
                  <label>Stroke</label>
                  <select
                    value={strokeColor}
                    onChange={handleStrokeColorChange}
                    className="color-select-memes"
                    aria-label="Select stroke color"
                  >
                    {DESIGNER_COLORS.filter((color) => color.value !== 'none').map((color) => (
                      <option key={color.value} value={color.value} style={{ background: color.value }}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="style-buttons-memes">
                  <button
                    className={`style-button-memes ${textStyles.bold ? 'active' : ''}`}
                    onClick={() => handleToggleTextStyle('bold')}
                    data-tooltip="Bold"
                    aria-label="Toggle bold text"
                  >
                    <span style={{ fontWeight: 'bold' }}>B</span>
                  </button>
                  <button
                    className={`style-button-memes ${textStyles.italic ? 'active' : ''}`}
                    onClick={() => handleToggleTextStyle('italic')}
                    data-tooltip="Italic"
                    aria-label="Toggle italic text"
                  >
                    <span style={{ fontStyle: 'italic' }}>I</span>
                  </button>
                </div>
                <div className="form-group-memes">
                  <label> U̲ </label>
                  <select
                    value={textStyles.underline || 'none'}
                    onChange={(e) => handleToggleTextStyle('underline', e.target.value)}
                    className="underline-select-memes"
                    aria-label="Select underline style"
                  >
                    {UNDERLINE_STYLES.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {selectedFeature === 'shape' && (
              <div className="shape-controls">
                <div className="form-group-memes">
                  <label>Type</label>
                  <select
                    value={selectedShape}
                    onChange={handleShapeTypeChange}
                    className="shape-select-memes"
                    aria-label="Select shape type"
                  >
                    {SHAPES.map((shape) => (
                      <option key={shape} value={shape}>
                        {shape.charAt(0).toUpperCase() + shape.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group-memes">
                  <label>Fill</label>
                  <select
                    value={shapeFillColor}
                    onChange={handleShapeFillColorChange}
                    className="color-select-memes"
                    aria-label="Select shape fill color"
                  >
                    {DESIGNER_COLORS.map((color) => (
                      <option key={color.value} value={color.value} style={{ background: color.value }}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group-memes">
                  <label>Outline</label>
                  <select
                    value={shapeOutlineColor}
                    onChange={handleShapeOutlineColorChange}
                    className="color-select-memes"
                    aria-label="Select shape outline color"
                  >
                    {DESIGNER_COLORS.filter((color) => color.value !== 'none').map((color) => (
                      <option key={color.value} value={color.value} style={{ background: color.value }}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group-memes">
                  <label>Width</label>
                  <select
                    value={shapeOutlineWidth}
                    onChange={handleShapeOutlineWidthChange}
                    className="width-select-memes"
                    aria-label="Select shape outline width"
                  >
                    <option value={0}>No Outline</option>
                    <option value={1}>1px</option>
                    <option value={2}>2px</option>
                    <option value={4}>4px</option>
                    <option value={6}>6px</option>
                    <option value={8}>8px</option>
                  </select>
                </div>
              </div>
            )}
            {selectedFeature === 'emoji' && (
              <div className="emoji-controls">
                <div className="form-group-memes">
                  <label>Emoji</label>
                  <div className="emoji-selector">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        className={`emoji-option ${selectedEmoji === emoji ? 'active' : ''}`}
                        onClick={() => handleEmojiChange(emoji)}
                        aria-label={`Select ${emoji} emoji`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group-memes">
                  <label>Size</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={emojiSize}
                    onChange={handleEmojiSizeChange}
                    className="size-slider"
                    aria-label="Adjust emoji size"
                  />
                  <span>{emojiSize}px</span>
                </div>
              </div>
            )}
            {selectedFeature === 'photo' && (
              <div className="photo-controls">
                <div className="form-group-memes">
                  <label>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={photoOpacity}
                    onChange={handlePhotoOpacityChange}
                    className="size-slider"
                    aria-label="Adjust photo opacity"
                  />
                  <span>{photoOpacity}%</span>
                </div>
                <div className="form-group-memes">
                  <label>Brightness</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={photoBrightness}
                    onChange={handlePhotoBrightnessChange}
                    className="size-slider"
                    aria-label="Adjust photo brightness"
                  />
                  <span>{photoBrightness}%</span>
                </div>
              </div>
            )}
            {selectedFeature === 'merge' && (
              <div className="form-group-memes">
                <p>Select multiple images to merge into the canvas.</p>
              </div>
            )}
          </div>
        </div>
      )}
      <MemeFilterControls
        filters={filters}
        handleFilterChange={handleFilterChange}
        selectedFeature={selectedFeature}
      />
      <div className="download-button-container">
        <button
          className="download-button-memes"
          onClick={handleNewPhotoClick}
          disabled={false}
        >
          <span>New Photo</span>
        </button>
      </div>
    </div>
  );
};