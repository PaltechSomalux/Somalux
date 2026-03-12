import React from 'react';

export const MemeCropBox = ({
  isCropping,
  cropArea,
  startCropDrag,
  handleCropDrag,
  startCropResize,
  handleCropResize,
  stopCrop
}) => {
  if (!isCropping) return null;
  return (
    <div
      className="crop-box"
      style={{
        position: 'absolute',
        left: `${cropArea.x}px`,
        top: `${cropArea.y}px`,
        width: `${cropArea.width}px`,
        height: `${cropArea.height}px`,
        border: '2px dashed #007bff',
        background: 'rgba(0, 123, 255, 0.2)',
        cursor: 'move',
        touchAction: 'none',
      }}
      onPointerDown={startCropDrag}
      onTouchStart={startCropDrag}
      onPointerMove={handleCropDrag}
      onTouchMove={handleCropDrag}
      onPointerUp={stopCrop}
      onTouchEnd={stopCrop}
    >
      <div className="crop-overlay" />
      <div
        className="crop-handle top-left"
        onPointerDown={(e) => startCropResize('top-left', e)}
        onTouchStart={(e) => startCropResize('top-left', e)}
        onPointerMove={handleCropResize}
        onTouchMove={handleCropResize}
        onPointerUp={stopCrop}
        onTouchEnd={stopCrop}
      />
      <div
        className="crop-handle top-right"
        onPointerDown={(e) => startCropResize('top-right', e)}
        onTouchStart={(e) => startCropResize('top-right', e)}
        onPointerMove={handleCropResize}
        onTouchMove={handleCropResize}
        onPointerUp={stopCrop}
        onTouchEnd={stopCrop}
      />
      <div
        className="crop-handle bottom-left"
        onPointerDown={(e) => startCropResize('bottom-left', e)}
        onTouchStart={(e) => startCropResize('bottom-left', e)}
        onPointerMove={handleCropResize}
        onTouchMove={handleCropResize}
        onPointerUp={stopCrop}
        onTouchEnd={stopCrop}
      />
      <div
        className="crop-handle bottom-right"
        onPointerDown={(e) => startCropResize('bottom-right', e)}
        onTouchStart={(e) => startCropResize('bottom-right', e)}
        onPointerMove={handleCropResize}
        onTouchMove={handleCropResize}
        onPointerUp={stopCrop}
        onTouchEnd={stopCrop}
      />
    </div>
  );
};
