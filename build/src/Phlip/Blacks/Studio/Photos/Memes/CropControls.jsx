import React, { useCallback } from 'react';
import './Memes.css'; // Ensure this CSS file includes necessary styles for crop controls

export const MemeCropControls = ({ cropSettings, handleCropChange, selectedFeature, isCropping, applyCrop, cancelCrop }) => {
  // Predefined aspect ratios (common ratios like Photoshop/Windows Photos)
  const aspectRatios = [
    { label: 'Free', value: null },
    { label: '1:1 (Square)', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:2', value: 3 / 2 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
  ];

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    (ratio) => {
      handleCropChange('aspectRatio', ratio);
    },
    [handleCropChange]
  );

  return (
    <>
      {selectedFeature === 'crop' && isCropping && (
        <div className="secondary-tools-scroll-container-memes">
          <div className="bob tool-group-memes secondary-tools">
            <div className="crop-controls">
              {/* Aspect Ratio Selection */}
              <div className="form-group-memes">
                <label>Aspect Ratio</label>
                <select
                  value={cropSettings.aspectRatio || ''}
                  onChange={(e) => handleAspectRatioChange(e.target.value === '' ? null : Number(e.target.value))}
                  className="aspect-ratio-select"
                >
                  {aspectRatios.map((ratio) => (
                    <option key={ratio.label} value={ratio.value ?? ''}>
                      {ratio.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manual Width and Height Inputs */}
              <div className="form-group-memes">
                <label>Width (px)</label>
                <input
                  type="number"
                  min="1"
                  value={cropSettings.width || ''}
                  onChange={(e) => handleCropChange('width', Number(e.target.value))}
                  className="size-input"
                  placeholder="Width"
                />
              </div>
              <div className="form-group-memes">
                <label>Height (px)</label>
                <input
                  type="number"
                  min="1"
                  value={cropSettings.height || ''}
                  onChange={(e) => handleCropChange('height', Number(e.target.value))}
                  className="size-input"
                  placeholder="Height"
                />
              </div>

              {/* Crop Position (X, Y coordinates) */}
              <div className="form-group-memes">
                <label>X Position (px)</label>
                <input
                  type="number"
                  min="0"
                  value={cropSettings.x || 0}
                  onChange={(e) => handleCropChange('x', Number(e.target.value))}
                  className="size-input"
                  placeholder="X Position"
                />
              </div>
              <div className="form-group-memes">
                <label>Y Position (px)</label>
                <input
                  type="number"
                  min="0"
                  value={cropSettings.y || 0}
                  onChange={(e) => handleCropChange('y', Number(e.target.value))}
                  className="size-input"
                  placeholder="Y Position"
                />
              </div>

              {/* Apply and Cancel Buttons */}
              <div className="form-group-memes button-group">
                <button onClick={applyCrop} className="apply-crop-btn">
                  Apply
                </button>
                <button onClick={cancelCrop} className="cancel-crop-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};