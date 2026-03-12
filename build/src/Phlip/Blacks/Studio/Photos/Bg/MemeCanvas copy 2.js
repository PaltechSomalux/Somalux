import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MemeTextElements } from './MemeTextElements';
import { MemeShapeElements } from './MemeShapeElements';
import { MemePhotoElements } from './MemePhotoElements';
import { MemeEmojiElements } from './MemeEmojiElements';
import './Memes.css';

// Helper function to apply gradients for canvas rendering
const applyGradient = (ctx, gradientString, x, y, width, height) => {
  if (gradientString.startsWith('linear-gradient')) {
    // Extract angle and colors
    const angleMatch = gradientString.match(/(\d+)deg/);
    const angle = angleMatch ? parseFloat(angleMatch[1]) : 0;
    const rad = (angle * Math.PI) / 180;
    const x1 = x + (Math.cos(rad) * width) / 2;
    const y1 = y + (Math.sin(rad) * height) / 2;
    const x2 = x - (Math.cos(rad) * width) / 2;
    const y2 = y - (Math.sin(rad) * height) / 2;
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    const colors = gradientString.match(/#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)/g) || [];
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
  } else if (gradientString.startsWith('radial-gradient')) {
    const gradient = ctx.createRadialGradient(
      x + width / 2,
      y + height / 2,
      0,
      x + width / 2,
      y + height / 2,
      Math.max(width, height) / 2
    );
    const colors = gradientString.match(/#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)/g) || [];
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
  }
  return gradientString; // Fallback to solid color
};

export const MemeCanvas = ({
  image,
  texts,
  setTexts,
  shapes,
  setShapes,
  emojis,
  setEmojis,
  photos,
  setPhotos,
  filters,
  activeElement,
  setActiveElement,
  dragging,
  isRotating,
  isEditing,
  setIsEditing,
  textStyles,
  textColor,
  strokeColor,
  fontFamily,
  handleDrag,
  handleTouchMove,
  handleTouchEnd,
  handleMouseWheelRotation,
  handleTextZoom,
  handleShapeResize,
  handleEmojiZoom,
  handlePhotoResize,
  startDragging,
  stopDragging,
  startRotation,
  handleRotation,
  stopRotation,
  handleElementClick,
  handleDoubleClick,
  startLongPress,
  handleTextBlur,
  handleTextKeyDown,
  handleTouchZoom,
  setImage,
  handleImageUpload,
  setCanvasRefs,
  updateShapeProperties,
  updatePhotoProperties,
  textInputRef,
  fileInputRef,
  updateText,
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const wrapperRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Update image dimensions when image loads
  useEffect(() => {
    if (image && imageRef.current) {
      const img = imageRef.current;
      const updateDimensions = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.addEventListener('load', updateDimensions);
      if (img.complete) updateDimensions();
      return () => img.removeEventListener('load', updateDimensions);
    }
  }, [image]);

  // Pass canvas and image refs to parent
  useEffect(() => {
    if (setCanvasRefs) {
      setCanvasRefs({ canvasRef, imageRef });
    }
  }, [setCanvasRefs]);

  // Handle canvas click to deselect elements
  const handleCanvasClick = useCallback(() => {
    setIsEditing(false);
    setActiveElement({ type: null, id: null });
  }, [setIsEditing, setActiveElement]);

  // Trigger file input for image upload
  const handleImageUploadClick = useCallback(() => {
    fileInputRef.current.click();
  }, [fileInputRef]);

  // Prevent default touch behavior on canvas and elements
  const handleTouchStart = useCallback((e) => {
    if (
      e.target === wrapperRef.current ||
      e.target === imageRef.current ||
      e.target.closest('.meme-element')
    ) {
      e.preventDefault();
    }
  }, []);

  return (
    <div
      className="canvas-wrapper"
      ref={wrapperRef}
      onPointerMove={handleDrag}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onWheel={handleMouseWheelRotation}
      style={{ touchAction: 'none', position: 'relative', overflow: 'hidden' }}
      onClick={handleCanvasClick}
    >
      {image ? (
        <div className="image-container" style={{ position: 'relative' }}>
          <img
            ref={imageRef}
            src={image}
            alt="Meme background"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '70vh',
              display: 'block',
              objectFit: 'contain',
              filter: `
                brightness(${filters.brightness}%)
                contrast(${filters.contrast}%)
                saturate(${filters.saturation}%)
                grayscale(${filters.grayscale}%)
                sepia(${filters.sepia}%)
                blur(${filters.blur}px)
              `,
            }}
          />
          <MemePhotoElements
            photos={photos}
            activeElement={activeElement}
            dragging={dragging}
            isRotating={isRotating}
            isCropping={false}
            handleDrag={handleDrag}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            startDragging={startDragging}
            stopDragging={stopDragging}
            startRotation={startRotation}
            handleRotation={handleRotation}
            stopRotation={stopRotation}
            handleElementClick={handleElementClick}
            handleDoubleClick={handleDoubleClick}
            handleMouseWheelRotation={handleMouseWheelRotation}
            handleTouchZoom={handleTouchZoom}
            updatePhotoProperties={updatePhotoProperties}
          />
          <MemeTextElements
            texts={texts}
            activeElement={activeElement}
            isEditing={isEditing}
            textStyles={textStyles}
            textColor={textColor}
            strokeColor={strokeColor}
            fontFamily={fontFamily}
            dragging={dragging}
            isRotating={isRotating}
            isCropping={false}
            handleDrag={handleDrag}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            handleTextZoom={handleTextZoom}
            startDragging={startDragging}
            stopDragging={stopDragging}
            startRotation={startRotation}
            handleRotation={handleRotation}
            stopRotation={stopRotation}
            handleElementClick={handleElementClick}
            handleDoubleClick={handleDoubleClick}
            startLongPress={startLongPress}
            handleMouseWheelRotation={handleMouseWheelRotation}
            handleTextBlur={handleTextBlur}
            handleTextKeyDown={handleTextKeyDown}
            textInputRef={textInputRef}
            updateText={updateText}
            handleTouchZoom={handleTouchZoom}
            applyGradient={applyGradient} // Pass gradient helper
          />
          <MemeShapeElements
            shapes={shapes}
            activeElement={activeElement}
            dragging={dragging}
            isRotating={isRotating}
            isCropping={false}
            handleDrag={handleDrag}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            handleShapeResize={handleShapeResize}
            startDragging={startDragging}
            stopDragging={stopDragging}
            startRotation={startRotation}
            handleRotation={handleRotation}
            stopRotation={stopRotation}
            handleElementClick={handleElementClick}
            handleDoubleClick={handleDoubleClick}
            handleMouseWheelRotation={handleMouseWheelRotation}
            handleTouchZoom={handleTouchZoom}
            updateShapeProperties={updateShapeProperties}
            applyGradient={applyGradient} // Pass gradient helper
          />
          <MemeEmojiElements
            emojis={emojis}
            activeElement={activeElement}
            dragging={dragging}
            isRotating={isRotating}
            isCropping={false}
            handleDrag={handleDrag}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            handleEmojiZoom={handleEmojiZoom}
            startDragging={startDragging}
            stopDragging={stopDragging}
            startRotation={startRotation}
            handleRotation={handleRotation}
            stopRotation={stopRotation}
            handleElementClick={handleElementClick}
            handleDoubleClick={handleDoubleClick}
            handleMouseWheelRotation={handleMouseWheelRotation}
            handleTouchZoom={handleTouchZoom}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      ) : (
        <div className="upload-prompt">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
            aria-label="Upload image"
          />
          <button
            className="upload-button"
            onClick={handleImageUploadClick}
            aria-label="Upload image"
          >
            Upload your image
          </button>
        </div>
      )}
    </div>
  );
};