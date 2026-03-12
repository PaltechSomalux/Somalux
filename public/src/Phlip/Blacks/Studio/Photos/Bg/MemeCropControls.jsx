import React, { useState, useEffect, useCallback, useRef } from 'react';
import { throttle } from 'lodash';
import './Memes.css'; // Ensure this includes necessary crop-related styles

export const MemeCropControls = ({
  image,
  imageRef,
  canvasRef,
  filters,
  texts,
  setTexts,
  shapes,
  setShapes,
  emojis,
  setEmojis,
  photos,
  setPhotos,
  setImage,
}) => {
  // Crop-related state
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [cropPreview, setCropPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0, handle: null });
  const cropRef = useRef(null);
  const rafRef = useRef(null);

  // Initialize crop area when cropping starts
  useEffect(() => {
    if (isCropping && imageRef.current) {
      const img = imageRef.current;
      const rect = img.getBoundingClientRect();
      const margin = 20;
      setCropArea({
        x: rect.left + margin,
        y: rect.top + margin,
        width: rect.width - 2 * margin,
        height: rect.height - 2 * margin,
      });
    }
  }, [isCropping, imageRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const startCropDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    setDragOffset({ x: clientX - cropArea.x, y: clientY - cropArea.y });
  }, [cropArea]);

  const handleCropDrag = useCallback(
    throttle((e) => {
      if (!dragging) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const imgRect = imageRef.current.getBoundingClientRect();
      const margin = 10;

      let newX = clientX - dragOffset.x;
      let newY = clientY - dragOffset.y;

      newX = Math.max(imgRect.left + margin, Math.min(newX, imgRect.right - cropArea.width - margin));
      newY = Math.max(imgRect.top + margin, Math.min(newY, imgRect.bottom - cropArea.height - margin));

      setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
    }, 8),
    [dragging, dragOffset, cropArea, imageRef]
  );

  const startCropResize = useCallback((handle, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    setDragOffset({ x: e.clientX, y: e.clientY, handle });
  }, []);

  const handleCropResize = useCallback(
    throttle((e) => {
      if (!dragging || !dragOffset.handle) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const imgRect = imageRef.current.getBoundingClientRect();
      const margin = 10;
      const minSize = 20;

      setCropArea((prev) => {
        let { x, y, width, height } = prev;
        const deltaX = clientX - dragOffset.x;
        const deltaY = clientY - dragOffset.y;

        switch (dragOffset.handle) {
          case 'top-left':
            x = Math.max(imgRect.left + margin, Math.min(clientX, x + width - minSize));
            y = Math.max(imgRect.top + margin, Math.min(clientY, y + height - minSize));
            width = prev.x + prev.width - x;
            height = prev.y + prev.height - y;
            break;
          case 'top-right':
            y = Math.max(imgRect.top + margin, Math.min(clientY, y + height - minSize));
            width = Math.max(minSize, Math.min(clientX - prev.x, imgRect.right - prev.x - margin));
            height = prev.y + prev.height - y;
            break;
          case 'bottom-left':
            x = Math.max(imgRect.left + margin, Math.min(clientX, x + width - minSize));
            width = prev.x + prev.width - x;
            height = Math.max(minSize, Math.min(clientY - prev.y, imgRect.bottom - prev.y - margin));
            break;
          case 'bottom-right':
            width = Math.max(minSize, Math.min(clientX - prev.x, imgRect.right - prev.x - margin));
            height = Math.max(minSize, Math.min(clientY - prev.y, imgRect.bottom - prev.y - margin));
            break;
          default:
            break;
        }

        width = Math.max(minSize, width);
        height = Math.max(minSize, height);

        return { x, y, width, height };
      });

      setDragOffset((prev) => ({ ...prev, x: clientX, y: clientY }));
    }, 8),
    [dragging, dragOffset, imageRef]
  );

  const stopCrop = useCallback(() => {
    setDragging(false);
    setDragOffset({ x: 0, y: 0, handle: null });
  }, []);

  const applyCrop = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    const imgRect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;

    canvas.width = cropArea.width * scaleX;
    canvas.height = cropArea.height * scaleY;

    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
      blur(${filters.blur}px)
    `;
    ctx.drawImage(
      img,
      (cropArea.x - imgRect.left) * scaleX,
      (cropArea.y - imgRect.top) * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.filter = 'none';

    const croppedImage = canvas.toDataURL('image/png');
    setImage(croppedImage);
    setIsCropping(false);
    setCropPreview(null);
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });

    const offsetX = cropArea.x - imgRect.left;
    const offsetY = cropArea.y - imgRect.top;
    const scale = cropArea.width / imgRect.width;

    setTexts((prev) =>
      prev.map((text) => ({
        ...text,
        x: (text.x - offsetX) / scale,
        y: (text.y - offsetY) / scale,
        fontSize: text.fontSize / scale,
      }))
    );
    setShapes((prev) =>
      prev.map((shape) => ({
        ...shape,
        x: (shape.x - offsetX) / scale,
        y: (shape.y - offsetY) / scale,
        width: shape.width / scale,
        height: shape.height / scale,
      }))
    );
    setEmojis((prev) =>
      prev.map((emoji) => ({
        ...emoji,
        x: (emoji.x - offsetX) / scale,
        y: (emoji.y - offsetY) / scale,
        size: emoji.size / scale,
      }))
    );
    setPhotos((prev) =>
      prev.map((photo) => ({
        ...photo,
        x: (photo.x - offsetX) / scale,
        y: (photo.y - offsetY) / scale,
        width: photo.width / scale,
        height: photo.height / scale,
      }))
    );
  }, [cropArea, image, filters, imageRef, canvasRef, setImage, setTexts, setShapes, setEmojis, setPhotos]);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
    setCropPreview(null);
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
  }, []);

  const renderCropBox = useCallback(() => {
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
  }, [isCropping, cropArea, startCropDrag, handleCropDrag, stopCrop, startCropResize, handleCropResize]);

  return (
    <>
      {renderCropBox()}
      <button
        className={`tool-button-memes ${isCropping ? 'active' : ''}`}
        onClick={() => {
          setIsCropping((prev) => !prev);
        }}
        data-tooltip="Crop the background image"
      >
        <span>Crop</span>
      </button>
      {isCropping && (
        <div className="secondary-tools-scroll-container-memes">
          <div className="tool-group-memes secondary-tools">
            <button
              className="tool-button-memes"
              onClick={applyCrop}
              data-tooltip="Apply crop"
            >
              <span>Apply</span>
            </button>
            <button
              className="tool-button-memes"
              onClick={cancelCrop}
              data-tooltip="Cancel crop"
            >
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

