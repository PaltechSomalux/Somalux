import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MemeTextElements } from './MemeTextElements';
import { MemeShapeElements } from './MemeShapeElements';
import { MemePhotoElements } from './MemePhotoElements';
import { MemeEmojiElements } from './MemeEmojiElements';
import './Memes.css';
import PaltechWhite from "../../../../../Assets/PaltechWhite.png";

const applyGradient = (ctx, gradientString, x, y, width, height) => {
  if (gradientString.startsWith('linear-gradient')) {
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
  return gradientString;
};

export const MemeCanvas = ({
  image,
  texts,
  setTexts,
  shapes,
  setShapes,
  emojis = [],
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
  eraserSettings,
  selectedFeature,
  isCropping,
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const wrapperRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isErasing, setIsErasing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);

  // Add PaltechWhite logo immediately when a new image is uploaded
  useEffect(() => {
    if (image && !photos.some(photo => photo.id === 'paltechWhite')) {
      const photoWidth = 100; // Default width
      const photoHeight = 100; // Default height
      const padding = 10; // Padding from the edges

      // Add the logo with fallback dimensions if imageDimensions are not yet set
      setPhotos((prevPhotos) => {
        if (prevPhotos.some(photo => photo.id === 'paltechWhite')) {
          return prevPhotos;
        }
        return [
          ...prevPhotos,
          {
            id: 'paltechWhite',
            type: 'photo',
            src: PaltechWhite,
            x: imageDimensions.width ? imageDimensions.width - photoWidth / 2 - padding : 490,
            y: imageDimensions.height ? photoHeight / 2 + padding : 60,
            width: photoWidth,
            height: photoHeight,
            rotation: 0,
            opacity: 1,
            brightness: 1,
          },
        ];
      });
    }
  }, [image, photos, setPhotos]); // Removed imageDimensions from dependencies

  useEffect(() => {
    if (image && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const updateDimensions = () => {
        const { width, height } = img.getBoundingClientRect();
        setImageDimensions({ width, height });
        canvas.width = width;
        canvas.height = height;

        // Update logo position if it exists
        setPhotos((prevPhotos) =>
          prevPhotos.map((photo) =>
            photo.id === 'paltechWhite'
              ? {
                  ...photo,
                  x: width - photo.width / 2 - 10,
                  y: photo.height / 2 + 10,
                }
              : photo
          )
        );
      };
      img.addEventListener('load', updateDimensions);
      if (img.complete) updateDimensions();
      return () => img.removeEventListener('load', updateDimensions);
    } else if (!image && canvasRef.current && photos.length > 0) {
      const canvas = canvasRef.current;
      const firstPhoto = photos[0];
      const photoImg = new Image();
      photoImg.src = firstPhoto.src;
      const updateDimensions = () => {
        const aspectRatio = photoImg.width / photoImg.height || 16 / 9;
        const maxHeight = window.innerHeight * 0.7;
        const height = Math.min(maxHeight, photoImg.height || 500);
        const width = height * aspectRatio;
        setImageDimensions({ width, height });
        canvas.width = width;
        canvas.height = height;
      };
      photoImg.addEventListener('load', updateDimensions);
      if (photoImg.complete) updateDimensions();
      return () => photoImg.removeEventListener('load', updateDimensions);
    } else if (!image && canvasRef.current) {
      const canvas = canvasRef.current;
      const defaultWidth = 500;
      const defaultHeight = defaultWidth * (9 / 16);
      setImageDimensions({ width: defaultWidth, height: defaultHeight });
      canvas.width = defaultWidth;
      canvas.height = defaultHeight;
    }
  }, [image, photos]);

  useEffect(() => {
    if (setCanvasRefs) {
      setCanvasRefs({ canvasRef, imageRef });
    }
  }, [setCanvasRefs]);

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image && imageRef.current) {
      const img = imageRef.current;
      ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    }
  }, [image, filters, imageDimensions]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const drawEraserStroke = useCallback(
    (x, y) => {
      if (!canvasRef.current || !isErasing || selectedFeature !== 'eraser' || isCropping || !image) return;
      const ctx = canvasRef.current.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = eraserSettings.size;
      if (lastPoint) {
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      setLastPoint({ x, y });
    },
    [isErasing, eraserSettings, lastPoint, selectedFeature, isCropping, image]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (selectedFeature === 'eraser' && !isCropping && image) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsErasing(true);
        setLastPoint({ x, y });
        drawEraserStroke(x, y);
      }
    },
    [drawEraserStroke, selectedFeature, isCropping, image]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isErasing && selectedFeature === 'eraser' && !isCropping && image) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawEraserStroke(x, y);
      }
    },
    [isErasing, drawEraserStroke, selectedFeature, isCropping, image]
  );

  const handleMouseUp = useCallback(() => {
    if (isErasing) {
      setIsErasing(false);
      setLastPoint(null);
      const ctx = canvasRef.current.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [isErasing]);

  const handleTouchStartEraser = useCallback(
    (e) => {
      if (selectedFeature === 'eraser' && !isCropping && image) {
        e.preventDefault();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        setIsErasing(true);
        setLastPoint({ x, y });
        drawEraserStroke(x, y);
      }
    },
    [drawEraserStroke, selectedFeature, isCropping, image]
  );

  const handleTouchMoveEraser = useCallback(
    (e) => {
      if (isErasing && selectedFeature === 'eraser' && !isCropping && image) {
        e.preventDefault();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        drawEraserStroke(x, y);
      }
    },
    [isErasing, drawEraserStroke, selectedFeature, isCropping, image]
  );

  const handleTouchEndEraser = useCallback(() => {
    if (isErasing) {
      setIsErasing(false);
      setLastPoint(null);
      const ctx = canvasRef.current.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [isErasing]);

  const handleCanvasClick = useCallback(() => {
    setIsEditing(false);
    setActiveElement({ type: null, id: null });
  }, [setIsEditing, setActiveElement]);

  const handleImageUploadClick = useCallback(() => {
    fileInputRef.current.click();
  }, [fileInputRef]);

  const handleTouchStart = useCallback(
    (e) => {
      if (
        e.target === wrapperRef.current ||
        e.target === imageRef.current ||
        e.target.closest('.meme-element')
      ) {
        e.preventDefault();
      }
      handleTouchStartEraser(e);
    },
    [handleTouchStartEraser]
  );

  return (
    <div
      className="canvas-wrapper"
      ref={wrapperRef}
      onPointerMove={handleDrag}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
      onTouchMove={(e) => {
        handleTouchMove(e);
        handleTouchMoveEraser(e);
      }}
      onTouchEnd={(e) => {
        handleTouchEnd(e);
        handleTouchEndEraser(e);
      }}
      onTouchStart={handleTouchStart}
      onWheel={handleMouseWheelRotation}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ touchAction: 'none', position: 'relative', overflow: 'hidden' }}
    >
      <div className="image-container" style={{ position: 'relative' }}>
        {image && (
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
              opacity: 0,
            }}
          />
        )}
        <canvas
          ref={canvasRef}
          style={{
            position: image ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            width: '100%',
            height: 'auto',
            maxHeight: '70vh',
            background: image ? 'transparent' : '#f0f0f0',
          }}
        />
        <MemePhotoElements
          photos={photos}
          activeElement={activeElement}
          dragging={dragging}
          isRotating={isRotating}
          isCropping={isCropping}
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
          isCropping={isCropping}
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
          applyGradient={applyGradient}
        />
        <MemeShapeElements
          shapes={shapes}
          activeElement={activeElement}
          dragging={dragging}
          isRotating={isRotating}
          isCropping={isCropping}
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
          applyGradient={applyGradient}
        />
        <MemeEmojiElements
          emojis={emojis || []}
          activeElement={activeElement}
          dragging={dragging}
          isRotating={isRotating}
          isCropping={isCropping}
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
        {!image && photos.length === 0 && (
          <div
            className="upload-prompt"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
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
    </div>
  );
};