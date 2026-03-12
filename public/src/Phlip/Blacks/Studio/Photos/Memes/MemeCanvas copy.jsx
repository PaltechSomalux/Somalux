import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MemeTextElements } from './MemeTextElements';
import { MemeShapeElements } from './MemeShapeElements';
import { MemePhotoElements } from './MemePhotoElements';
import { MemeEmojiElements } from './MemeEmojiElements';
import './Memes.css';

// Helper function to apply gradients (unchanged)
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

  // Update image dimensions and canvas size
  useEffect(() => {
    if (image && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const updateDimensions = () => {
        const { width, height } = img.getBoundingClientRect();
        setImageDimensions({ width, height });
        canvas.width = width;
        canvas.height = height;
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

  // Redraw canvas with all elements
  const redrawCanvas = useCallback(() => {
    if (!image || !canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background image with filters
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

    // Draw texts
    texts.forEach((text) => {
      ctx.save();
      ctx.translate(text.x, text.y);
      ctx.rotate((text.rotation * Math.PI) / 180);
      ctx.font = `${text.bold ? 'bold ' : ''}${text.italic ? 'italic ' : ''}${text.fontSize}px ${text.fontFamily}`;
      ctx.fillStyle = applyGradient(ctx, text.color, 0, 0, text.width || 100, text.height || 50);
      ctx.fillText(text.content, 0, 0);
      if (text.stroke !== 'none') {
        ctx.strokeStyle = text.stroke;
        ctx.lineWidth = 2;
        ctx.strokeText(text.content, 0, 0);
      }
      ctx.restore();
    });

    // Draw shapes
    shapes.forEach((shape) => {
      ctx.save();
      ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
      ctx.rotate((shape.rotation * Math.PI) / 180);
      ctx.fillStyle = applyGradient(ctx, shape.fill, -shape.width / 2, -shape.height / 2, shape.width, shape.height);
      if (shape.type === 'rectangle') {
        ctx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
      } else if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, shape.width / 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw emojis
    emojis.forEach((emoji) => {
      ctx.save();
      ctx.translate(emoji.x + emoji.size / 2, emoji.y + emoji.size / 2);
      ctx.rotate((emoji.rotation * Math.PI) / 180);
      ctx.font = `${emoji.size}px sans-serif`;
      ctx.fillText(emoji.content, -emoji.size / 2, emoji.size / 2);
      ctx.restore();
    });

    // Draw photos
    photos.forEach((photo) => {
      ctx.save();
      ctx.translate(photo.x + photo.width / 2, photo.y + photo.height / 2);
      ctx.rotate((photo.rotation * Math.PI) / 180);
      const img = new Image();
      img.src = photo.src;
      ctx.drawImage(img, -photo.width / 2, -photo.height / 2, photo.width, photo.height);
      ctx.restore();
    });
  }, [image, filters, texts, shapes, emojis, photos, imageDimensions]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle eraser drawing with white mark
  const drawEraserStroke = useCallback(
    (x, y) => {
      if (!canvasRef.current || !isErasing || selectedFeature !== 'eraser' || isCropping) return;
      const ctx = canvasRef.current.getContext('2d');
      ctx.globalCompositeOperation = 'source-over'; // Use source-over to draw white
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Set solid white stroke
      ctx.strokeStyle = '#ffffff'; // White color for eraser
      ctx.lineWidth = eraserSettings.size;

      if (lastPoint) {
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      setLastPoint({ x, y });

      // Redraw other elements to ensure they appear above the white stroke
      texts.forEach((text) => {
        ctx.save();
        ctx.translate(text.x, text.y);
        ctx.rotate((text.rotation * Math.PI) / 180);
        ctx.font = `${text.bold ? 'bold ' : ''}${text.italic ? 'italic ' : ''}${text.fontSize}px ${text.fontFamily}`;
        ctx.fillStyle = applyGradient(ctx, text.color, 0, 0, text.width || 100, text.height || 50);
        ctx.fillText(text.content, 0, 0);
        if (text.stroke !== 'none') {
          ctx.strokeStyle = text.stroke;
          ctx.lineWidth = 2;
          ctx.strokeText(text.content, 0, 0);
        }
        ctx.restore();
      });

      shapes.forEach((shape) => {
        ctx.save();
        ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
        ctx.rotate((shape.rotation * Math.PI) / 180);
        ctx.fillStyle = applyGradient(ctx, shape.fill, -shape.width / 2, -shape.height / 2, shape.width, shape.height);
        if (shape.type === 'rectangle') {
          ctx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
        } else if (shape.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, shape.width / 2, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();
      });

      emojis.forEach((emoji) => {
        ctx.save();
        ctx.translate(emoji.x + emoji.size / 2, emoji.y + emoji.size / 2);
        ctx.rotate((emoji.rotation * Math.PI) / 180);
        ctx.font = `${emoji.size}px sans-serif`;
        ctx.fillText(emoji.content, -emoji.size / 2, emoji.size / 2);
        ctx.restore();
      });

      photos.forEach((photo) => {
        ctx.save();
        ctx.translate(photo.x + photo.width / 2, photo.y + photo.height / 2);
        ctx.rotate((photo.rotation * Math.PI) / 180);
        const img = new Image();
        img.src = photo.src;
        ctx.drawImage(img, -photo.width / 2, -photo.height / 2, photo.width, photo.height);
        ctx.restore();
      });
    },
    [isErasing, eraserSettings, lastPoint, selectedFeature, isCropping, texts, shapes, emojis, photos]
  );

  // Handle mouse down for eraser
  const handleMouseDown = useCallback(
    (e) => {
      if (selectedFeature === 'eraser' && !isCropping) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsErasing(true);
        setLastPoint({ x, y });
        drawEraserStroke(x, y);
      }
    },
    [drawEraserStroke, selectedFeature, isCropping]
  );

  // Handle mouse move for eraser
  const handleMouseMove = useCallback(
    (e) => {
      if (isErasing && selectedFeature === 'eraser' && !isCropping) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawEraserStroke(x, y);
      }
    },
    [isErasing, drawEraserStroke, selectedFeature, isCropping]
  );

  // Handle mouse up for eraser
  const handleMouseUp = useCallback(() => {
    if (isErasing) {
      setIsErasing(false);
      setLastPoint(null);
      const ctx = canvasRef.current.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [isErasing]);

  // Handle touch start for eraser
  const handleTouchStartEraser = useCallback(
    (e) => {
      if (selectedFeature === 'eraser' && !isCropping) {
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
    [drawEraserStroke, selectedFeature, isCropping]
  );

  // Handle touch move for eraser
  const handleTouchMoveEraser = useCallback(
    (e) => {
      if (isErasing && selectedFeature === 'eraser' && !isCropping) {
        e.preventDefault();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        drawEraserStroke(x, y);
      }
    },
    [isErasing, drawEraserStroke, selectedFeature, isCropping]
  );

  // Handle touch end for eraser
  const handleTouchEndEraser = useCallback(() => {
    if (isErasing) {
      setIsErasing(false);
      setLastPoint(null);
      const ctx = canvasRef.current.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [isErasing]);

  // Handle canvas click to deselect elements
  const handleCanvasClick = useCallback(() => {
    setIsEditing(false);
    setActiveElement({ type: null, id: null });
  }, [setIsEditing, setActiveElement]);

  // Trigger file input for image upload
  const handleImageUploadClick = useCallback(() => {
    fileInputRef.current.click();
  }, [fileInputRef]);

  // Prevent default touch behavior
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
              opacity: 0, // Hide img as canvas handles rendering
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 'auto',
              maxHeight: '70vh',
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
            emojis={emojis}
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