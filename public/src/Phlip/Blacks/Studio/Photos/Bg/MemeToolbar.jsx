import React from 'react';
import { MemeFilterControls } from './MemeFilterControls';

export const MemeToolbar = ({
  image,
  activeElement,
  selectedFeature,
  isCropping,
  textColor,
  strokeColor,
  shapeColor,
  photoOpacity,
  photoBrightness,
  emojiSize,
  fontFamily,
  selectedShape,
  selectedEmoji,
  textStyles,
  filters,
  photoInputRef,
  setTextColor,
  setStrokeColor,
  setShapeColor,
  setPhotoOpacity,
  setPhotoBrightness,
  setEmojiSize,
  setFontFamily,
  setSelectedShape,
  setSelectedEmoji,
  setTextStyles,
  setIsCropping,
  setSelectedFeature,
  addText,
  addShape,
  addEmoji,
  addPhoto,
  deleteElement,
  handleFilterChange,
  toggleTextStyle,
  handleTextColorChange,
  handleStrokeColorChange,
  handleShapeColorChange,
  handlePhotoOpacityChange,
  handlePhotoBrightnessChange,
  handleFontFamilyChange,
  handleShapeTypeChange,
  handleEmojiChange,
  handleEmojiSizeChange,
  downloadMeme,
}) => {
  return (
    <div className="bottom-toolbar-memes">
      {image && (
        <>
          <div className="primary-tools-scroll-container-memes">
            <div className="tool-group-memes primary-tools">
              <button
                className={`tool-button-memes ${isCropping ? 'active' : ''}`}
                onClick={() => {
                  setIsCropping((prev) => !prev);
                  setActiveElement({ type: null, id: null });
                  setSelectedFeature(null);
                }}
                data-tooltip="Crop the background image"
              >
                <span>Crop</span>
              </button>
              <button
                className={`tool-button-memes ${selectedFeature === 'text' ? 'active' : ''}`}
                onClick={addText}
                data-tooltip="Add text to your meme"
                disabled={isCropping}
              >
                <span>Text</span>
              </button>
              <button
                className={`tool-button-memes ${selectedFeature === 'shape' ? 'active' : ''}`}
                onClick={addShape}
                data-tooltip="Add a shape to your meme"
                disabled={isCropping}
              >
                <span>Shapes</span>
              </button>
              <button
                className={`tool-button-memes ${selectedFeature === 'emoji' ? 'active' : ''}`}
                onClick={addEmoji}
                data-tooltip="Add an emoji to your meme"
                disabled={isCropping}
              >
                <span>Emoji</span>
              </button>
              <button
                className={`tool-button-memes ${selectedFeature === 'photo' ? 'active' : ''}`}
                onClick={() => photoInputRef.current.click()}
                data-tooltip="Add a photo to your meme"
                disabled={isCropping}
              >
                <span>Photo</span>
              </button>
              <button
                className={`tool-button-memes ${selectedFeature === 'filters' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFeature('filters');
                  setActiveElement({ type: null, id: null });
                }}
                data-tooltip="Apply filters to the background image"
                disabled={isCropping}
              >
                <span>Filters</span>
              </button>
              {activeElement.id && (
                <button
                  className="tool-button-memes"
                  onClick={deleteElement}
                  data-tooltip="Delete selected element"
                  disabled={isCropping}
                >
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
          <MemeFilterControls
            filters={filters}
            handleFilterChange={handleFilterChange}
            selectedFeature={selectedFeature}
            isCropping={isCropping}
          />
          {selectedFeature === 'text' && !isCropping && (
            <div className="secondary-tools-scroll-container-memes">
              <div className="tool-group-memes secondary-tools">
                <div className="form-group-memes">
                  <label>Font</label>
                  <select
                    value={fontFamily}
                    onChange={handleFontFamilyChange}
                    className="font-select-memes"
                  >
                    <option value="Impact">Impact</option>
                    <option value="Arial">Arial</option>
                    <option value="Comic Sans MS">Comic Sans</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Times New Roman">Times New Roman</option>
                  </select>
                </div>
                <div className="form-group-memes">
                  <label>Color</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={handleTextColorChange}
                    className="color-input-memes"
                  />
                </div>
                <div className="form-group-memes">
                  <label>Stroke</label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={handleStrokeColorChange}
                    className="color-input-memes"
                  />
                </div>
                <div className="style-buttons-memes">
                  <button
                    className={`style-button-memes ${textStyles.bold ? 'active' : ''}`}
                    onClick={() => toggleTextStyle('bold')}
                    data-tooltip="Bold"
                  >
                    <span style={{ fontWeight: 'bold' }}>B</span>
                  </button>
                  <button
                    className={`style-button-memes ${textStyles.italic ? 'active' : ''}`}
                    onClick={() => toggleTextStyle('italic')}
                    data-tooltip="Italic"
                  >
                    <span style={{ fontStyle: 'italic' }}>I</span>
                  </button>
                  <button
                    className={`style-button-memes ${textStyles.underline ? 'active' : ''}`}
                    onClick={() => toggleTextStyle('underline')}
                    data-tooltip="Underline"
                  >
                    <span style={{ textDecoration: 'underline' }}>U</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {selectedFeature === 'shape' && !isCropping && (
            <div className="secondary-tools-scroll-container-memes">
              <div className="tool-group-memes secondary-tools">
                <div className="form-group-memes">
                  <label>Type</label>
                  <select
                    value={selectedShape}
                    onChange={handleShapeTypeChange}
                    className="font-select-memes"
                  >
                    {SHAPES.map((shape) => (
                      <option key={shape} value={shape}>
                        {shape.charAt(0).toUpperCase() + shape.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group-memes">
                  <label>Color</label>
                  <input
                    type="color"
                    value={shapeColor}
                    onChange={handleShapeColorChange}
                    className="color-input-memes"
                  />
                </div>
              </div>
            </div>
          )}
          {selectedFeature === 'emoji' && !isCropping && (
            <div className="secondary-tools-scroll-container-memes">
              <div className="tool-group-memes secondary-tools">
                <div className="form-group-memes">
                  <label>Size</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={emojiSize}
                    onChange={handleEmojiSizeChange}
                    className="size-slider"
                  />
                  <span>{emojiSize}px</span>
                </div>
                <div className="emoji-selector-container">
                  <div className="emoji-selector">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        className={`emoji-option ${selectedEmoji === emoji ? 'active' : ''}`}
                        onClick={() => handleEmojiChange(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedFeature === 'photo' && !isCropping && (
            <div className="secondary-tools-scroll-container-memes">
              <div className="tool-group-memes secondary-tools">
                <div className="form-group-memes">
                  <label>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={photoOpacity}
                    onChange={handlePhotoOpacityChange}
                    className="size-slider"
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
                  />
                  <span>{photoBrightness}%</span>
                </div>
              </div>
            </div>
          )}
          <div className="download-button-container">
            <button
              className="download-button-memes"
              onClick={downloadMeme}
              data-tooltip="Download your meme"
              disabled={isCropping}
            >
              <span>Download Meme</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};