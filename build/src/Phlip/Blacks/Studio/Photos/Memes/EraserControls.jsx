import React from 'react';
import './Memes.css'; // Ensure this CSS file includes necessary styles for eraser controls

export const EraserControls = ({ eraserSettings, handleEraserChange, selectedFeature, isCropping }) => {
  return (
    <>
      {selectedFeature === 'eraser' && !isCropping && (
        <div className="secondary-tools-scroll-container-memes">
          <div className="bob tool-group-memes secondary-tools">
            <div className="eraser-controls">
              <div className="form-group-memes">
                <label>Brush Size</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={eraserSettings.size}
                  onChange={(e) => handleEraserChange('size', e.target.value)}
                  className="size-slider"
                />
                <span>{eraserSettings.size}px</span>
              </div>
              <div className="form-group-memes">
                <label>Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={eraserSettings.opacity}
                  onChange={(e) => handleEraserChange('opacity', e.target.value)}
                  className="size-slider"
                />
                <span>{eraserSettings.opacity}%</span>
              </div>
              <div className="form-group-memes">
                <label>Hardness</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={eraserSettings.hardness}
                  onChange={(e) => handleEraserChange('hardness', e.target.value)}
                  className="size-slider"
                />
                <span>{eraserSettings.hardness}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};