 import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MemeTextElements } from './MemeTextElements';
import { MemeShapeElements } from './MemeShapeElements';
import { MemePhotoElements } from './MemePhotoElements';
import { MemeEmojiElements } from './MemeEmojiElements';
import './Memes.css';

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

  useEffect(() => {
    if (setCanvasRefs) {
      setCanvasRefs({ canvasRef, imageRef });
    }
  }, [setCanvasRefs]);

  const handleCanvasClick = useCallback(() => {
    setIsEditing(false);
    setActiveElement({ type: null, id: null });
  }, [setIsEditing, setActiveElement]);

  const handleImageUploadClick = useCallback(() => {
    fileInputRef.current.click();
  }, [fileInputRef]);

  const handleTouchStart = useCallback((e) => {
    if (e.target === wrapperRef.current || e.target === imageRef.current || e.target.closest('.meme-element')) {
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
          {/* Other elements (text, shape, emoji) remain the same */}
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