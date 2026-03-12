import React, { useCallback } from 'react';
import { loadImage, applyGradient } from './MemeUtils';

export const MemeDownload = ({ image, texts, shapes, emojis, photos, filters, canvasRefs }) => {
  const { canvasRef, imageRef } = canvasRefs;

  const drawUnderline = (ctx, text, scaledFontSize, textWidth) => {
    ctx.beginPath();
    const underlineY = scaledFontSize * 0.1;
    ctx.moveTo(-textWidth / 2, underlineY);
    ctx.lineTo(textWidth / 2, underlineY);
    ctx.strokeStyle = text.stroke || '#000000';
    ctx.lineWidth = scaledFontSize / 20;
    ctx.stroke();
  };

  const drawGradientText = (ctx, text, scaledFontSize, fontStyle, textWidth, textHeight) => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = textWidth;
    tempCanvas.height = textHeight;

    tempCtx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily || 'Arial'}`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';

    tempCtx.fillText(text.content || '', textWidth / 2, textHeight / 2);
    tempCtx.globalCompositeOperation = 'source-in';

    const gradient = applyGradient(tempCtx, text.color || '#ffffff', 0, 0, textWidth, textHeight);
    tempCtx.fillStyle = gradient;
    tempCtx.fillRect(0, 0, textWidth, textHeight);

    ctx.drawImage(tempCanvas, -textWidth / 2, -textHeight / 2);
  };

  const downloadMeme = useCallback(async () => {
    if (!canvasRef?.current || (!image && photos.length === 0)) {
      console.warn('No image or photos available for download');
      return;
    }

    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Get original dimensions
    let originalWidth, originalHeight;
    let isSingleImage = false;

    if (image && imageRef?.current && imageRef.current.complete) {
      isSingleImage = true;
      const img = imageRef.current;
      originalWidth = img.naturalWidth;
      originalHeight = img.naturalHeight;
    } else if (photos.length > 0) {
      // For merged photos, use the first photo's dimensions or canvas dimensions
      const firstPhoto = photos[0];
      try {
        const img = await loadImage(firstPhoto.src);
        originalWidth = img.naturalWidth;
        originalHeight = img.naturalHeight;
      } catch (error) {
        console.warn('Failed to load first photo, using canvas dimensions');
        originalWidth = canvas.width;
        originalHeight = canvas.height;
      }
    } else {
      originalWidth = canvas.width;
      originalHeight = canvas.height;
    }

    // Optional downscaling to reduce file size (adjust max dimensions as needed)
    const MAX_DIMENSION = 1920; // Example: Cap at 1920px for width or height
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
      const aspectRatio = originalWidth / originalHeight;
      if (originalWidth > originalHeight) {
        targetWidth = MAX_DIMENSION;
        targetHeight = Math.round(MAX_DIMENSION / aspectRatio);
      } else {
        targetHeight = MAX_DIMENSION;
        targetWidth = Math.round(MAX_DIMENSION * aspectRatio);
      }
    }

    // Set canvas to target dimensions
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;

    // Calculate scaling factors based on canvas dimensions
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = targetWidth / canvasRect.width;
    const scaleY = targetHeight / canvasRect.height;

    // Draw background
    if (isSingleImage) {
      tempCtx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `;
      tempCtx.drawImage(imageRef.current, 0, 0, targetWidth, targetHeight);
      tempCtx.filter = 'none';
    } else if (photos.length > 0) {
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // Draw photos
    try {
      const photoImages = await Promise.all(photos.map((photo) => loadImage(photo.src)));
      photoImages.forEach((img, index) => {
        const photo = photos[index];
        tempCtx.save();
        const scaledX = photo.x * scaleX;
        const scaledY = photo.y * scaleY;
        const scaledWidth = photo.width * scaleX;
        const scaledHeight = photo.height * scaleY;
        tempCtx.translate(scaledX, scaledY);
        tempCtx.rotate((photo.rotation || 0) * Math.PI / 180);
        tempCtx.globalAlpha = photo.opacity || 1;
        tempCtx.filter = `brightness(${photo.brightness * 100 || 100}%)`;
        tempCtx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        tempCtx.restore();
      });
    } catch (error) {
      console.error('Error loading photos for download:', error);
      tempCanvas.remove();
      return;
    }

    // Draw shapes
    shapes.forEach((shape) => {
      tempCtx.save();
      const scaledX = shape.x * scaleX;
      const scaledY = shape.y * scaleY;
      const scaledWidth = shape.width * scaleX;
      const scaledHeight = shape.height * scaleY;

      tempCtx.translate(scaledX, scaledY);
      tempCtx.rotate((shape.rotation || 0) * Math.PI / 180);

      const effectiveFillColor = shape.fill || shape.fillColor || '#ff0000';
      const effectiveOutlineColor = shape.outlineColor || '#000000';
      tempCtx.fillStyle = effectiveFillColor.includes('gradient')
        ? applyGradient(tempCtx, effectiveFillColor, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
        : shape.fill === 'none' ? 'transparent' : effectiveFillColor;
      tempCtx.strokeStyle = shape.outlineWidth === 0
        ? 'none'
        : effectiveOutlineColor.includes('gradient')
          ? applyGradient(tempCtx, effectiveOutlineColor, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
          : effectiveOutlineColor;
      tempCtx.lineWidth = (shape.outlineWidth || 2) * Math.min(scaleX, scaleY);
      tempCtx.lineCap = 'round';
      tempCtx.lineJoin = 'round';

      tempCtx.beginPath();
      const isLineShape = ['line', 'arrow', 'double-arrow'].includes(shape.shapeType);
      const unitWidth = scaledWidth / 100;
      const unitHeight = isLineShape ? scaledHeight / 20 : scaledHeight / 100;

      switch (shape.shapeType) {
        case 'rectangle':
          tempCtx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          break;
        case 'rounded-rectangle':
          const radius = Math.min(scaledWidth, scaledHeight) * 0.2;
          tempCtx.moveTo(-scaledWidth / 2 + radius, -scaledHeight / 2);
          tempCtx.lineTo(scaledWidth / 2 - radius, -scaledHeight / 2);
          tempCtx.quadraticCurveTo(scaledWidth / 2, -scaledHeight / 2, scaledWidth / 2, -scaledHeight / 2 + radius);
          tempCtx.lineTo(scaledWidth / 2, scaledHeight / 2 - radius);
          tempCtx.quadraticCurveTo(scaledWidth / 2, scaledHeight / 2, scaledWidth / 2 - radius, scaledHeight / 2);
          tempCtx.lineTo(-scaledWidth / 2 + radius, scaledHeight / 2);
          tempCtx.quadraticCurveTo(-scaledWidth / 2, scaledHeight / 2, -scaledWidth / 2, scaledHeight / 2 - radius);
          tempCtx.lineTo(-scaledWidth / 2, -scaledHeight / 2 + radius);
          tempCtx.quadraticCurveTo(-scaledWidth / 2, -scaledHeight / 2, -scaledWidth / 2 + radius, -scaledHeight / 2);
          tempCtx.closePath();
          break;
        case 'banner':
          tempCtx.moveTo(-scaledWidth / 2, scaledHeight * 0.2);
          tempCtx.quadraticCurveTo(0, 0, scaledWidth / 2, scaledHeight * 0.2);
          tempCtx.lineTo(scaledWidth / 2, scaledHeight * 0.8);
          tempCtx.quadraticCurveTo(0, scaledHeight, -scaledWidth / 2, scaledHeight * 0.8);
          tempCtx.closePath();
          break;
        case 'arrow':
          tempCtx.moveTo(-scaledWidth / 2, 0);
          tempCtx.lineTo(scaledWidth / 2, 0);
          tempCtx.moveTo(scaledWidth / 2, 0);
          tempCtx.lineTo(scaledWidth / 2 - unitWidth * 10, unitHeight * 5);
          tempCtx.moveTo(scaledWidth / 2, 0);
          tempCtx.lineTo(scaledWidth / 2 - unitWidth * 10, -unitHeight * 5);
          break;
        case 'double-arrow':
          tempCtx.moveTo(-scaledWidth / 2, 0);
          tempCtx.lineTo(scaledWidth / 2, 0);
          tempCtx.moveTo(-scaledWidth / 2, 0);
          tempCtx.lineTo(-scaledWidth / 2 + unitWidth * 10, unitHeight * 5);
          tempCtx.moveTo(-scaledWidth / 2, 0);
          tempCtx.lineTo(-scaledWidth / 2 + unitWidth * 10, -unitHeight * 5);
          tempCtx.moveTo(scaledWidth / 2, 0);
          tempCtx.lineTo(scaledWidth / 2 - unitWidth * 10, unitHeight * 5);
          tempCtx.moveTo(scaledWidth / 2, 0);
          tempCtx.lineTo(scaledWidth / 2 - unitWidth * 10, -unitHeight * 5);
          break;
        case 'circle':
          tempCtx.ellipse(0, 0, scaledWidth / 2, scaledHeight / 2, 0, 0, Math.PI * 2);
          tempCtx.closePath();
          break;
        case 'line':
          tempCtx.moveTo(-scaledWidth / 2, 0);
          tempCtx.lineTo(scaledWidth / 2, 0);
          break;
        case 'flowchart-terminator':
          const termRadiusX = scaledWidth * 0.2;
          const termRadiusY = scaledHeight * 0.5;
          tempCtx.moveTo(-scaledWidth / 2 + termRadiusX, -scaledHeight / 2);
          tempCtx.lineTo(scaledWidth / 2 - termRadiusX, -scaledHeight / 2);
          tempCtx.bezierCurveTo(
            scaledWidth / 2, -scaledHeight / 2,
            scaledWidth / 2, scaledHeight / 2,
            scaledWidth / 2 - termRadiusX, scaledHeight / 2
          );
          tempCtx.lineTo(-scaledWidth / 2 + termRadiusX, scaledHeight / 2);
          tempCtx.bezierCurveTo(
            -scaledWidth / 2, scaledHeight / 2,
            -scaledWidth / 2, -scaledHeight / 2,
            -scaledWidth / 2 + termRadiusX, -scaledHeight / 2
          );
          tempCtx.closePath();
          break;
        case 'flowchart-preparation':
          const prepOffset = scaledWidth * 0.25;
          tempCtx.moveTo(-scaledWidth / 2 + prepOffset, -scaledHeight / 2);
          tempCtx.lineTo(scaledWidth / 2 - prepOffset, -scaledHeight / 2);
          tempCtx.lineTo(scaledWidth / 2, scaledHeight / 2);
          tempCtx.lineTo(-scaledWidth / 2 + prepOffset, scaledHeight / 2);
          tempCtx.lineTo(-scaledWidth / 2, 0);
          tempCtx.closePath();
          break;
        case 'speech-bubble-oval':
          const ovalRadiusX = scaledWidth * 0.4;
          const ovalRadiusY = scaledHeight * 0.5;
          tempCtx.moveTo(-ovalRadiusX, -scaledHeight / 2);
          tempCtx.bezierCurveTo(
            -scaledWidth / 2, -scaledHeight / 2,
            -scaledWidth / 2, scaledHeight / 2,
            -ovalRadiusX, scaledHeight / 2
          );
          tempCtx.lineTo(0, scaledHeight / 2);
          tempCtx.lineTo(-unitWidth * 10, scaledHeight / 2 + unitHeight * 20);
          tempCtx.lineTo(unitWidth * 10, scaledHeight / 2 + unitHeight * 20);
          tempCtx.lineTo(ovalRadiusX, scaledHeight / 2);
          tempCtx.bezierCurveTo(
            scaledWidth / 2, scaledHeight / 2,
            scaledWidth / 2, -scaledHeight / 2,
            ovalRadiusX, -scaledHeight / 2
          );
          tempCtx.closePath();
          break;
        case 'speech-bubble-rounded-rectangle':
          const speechRadius = Math.min(scaledWidth, scaledHeight) * 0.2;
          tempCtx.moveTo(-scaledWidth / 2 + speechRadius, -scaledHeight / 2);
          tempCtx.lineTo(scaledWidth / 2 - speechRadius, -scaledHeight / 2);
          tempCtx.quadraticCurveTo(scaledWidth / 2, -scaledHeight / 2, scaledWidth / 2, -scaledHeight / 2 + speechRadius);
          tempCtx.lineTo(scaledWidth / 2, scaledHeight / 2 - speechRadius - unitHeight * 20);
          tempCtx.quadraticCurveTo(scaledWidth / 2, scaledHeight / 2 - unitHeight * 20, scaledWidth / 2 - speechRadius, scaledHeight / 2 - unitHeight * 20);
          tempCtx.lineTo(unitWidth * 20, scaledHeight / 2 - unitHeight * 20);
          tempCtx.lineTo(0, scaledHeight / 2);
          tempCtx.lineTo(-unitWidth * 20, scaledHeight / 2 - unitHeight * 20);
          tempCtx.lineTo(-scaledWidth / 2 + speechRadius, scaledHeight / 2 - unitHeight * 20);
          tempCtx.quadraticCurveTo(-scaledWidth / 2, scaledHeight / 2 - unitHeight * 20, -scaledWidth / 2, scaledHeight / 2 - speechRadius - unitHeight * 20);
          tempCtx.lineTo(-scaledWidth / 2, -scaledHeight / 2 + speechRadius);
          tempCtx.quadraticCurveTo(-scaledWidth / 2, -scaledHeight / 2, -scaledWidth / 2 + speechRadius, -scaledHeight / 2);
          tempCtx.closePath();
          break;
        case 'speech-bubble-rectangle':
          tempCtx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight - unitHeight * 20);
          tempCtx.moveTo(unitWidth * 20, scaledHeight / 2 - unitHeight * 20);
          tempCtx.lineTo(0, scaledHeight / 2);
          tempCtx.lineTo(-unitWidth * 20, scaledHeight / 2 - unitHeight * 20);
          tempCtx.closePath();
          break;
        case 'ribbon-curved':
          tempCtx.moveTo(-scaledWidth / 2, scaledHeight * 0.2);
          tempCtx.quadraticCurveTo(0, 0, scaledWidth / 2, scaledHeight * 0.2);
          tempCtx.lineTo(scaledWidth / 2, scaledHeight * 0.8);
          tempCtx.quadraticCurveTo(0, scaledHeight, -scaledWidth / 2, scaledHeight * 0.8);
          tempCtx.closePath();
          tempCtx.moveTo(-scaledWidth / 2, scaledHeight * 0.2);
          tempCtx.lineTo(-scaledWidth * 0.3, scaledHeight * 0.4);
          tempCtx.lineTo(-scaledWidth / 2, scaledHeight * 0.6);
          tempCtx.moveTo(scaledWidth / 2, scaledHeight * 0.2);
          tempCtx.lineTo(scaledWidth * 0.3, scaledHeight * 0.4);
          tempCtx.lineTo(scaledWidth / 2, scaledHeight * 0.6);
          break;
        case 'double-wave':
          tempCtx.moveTo(-scaledWidth / 2, scaledHeight * 0.3);
          tempCtx.quadraticCurveTo(-scaledWidth / 4, scaledHeight * 0.1, 0, scaledHeight * 0.3);
          tempCtx.quadraticCurveTo(scaledWidth / 4, scaledHeight * 0.5, scaledWidth / 2, scaledHeight * 0.3);
          tempCtx.lineTo(scaledWidth / 2, scaledHeight * 0.7);
          tempCtx.quadraticCurveTo(scaledWidth / 4, scaledHeight * 0.9, 0, scaledHeight * 0.7);
          tempCtx.quadraticCurveTo(-scaledWidth / 4, scaledHeight * 0.5, -scaledWidth / 2, scaledHeight * 0.7);
          tempCtx.closePath();
          break;
        case 'wave':
          tempCtx.moveTo(-scaledWidth / 2, scaledHeight * 0.8);
          tempCtx.quadraticCurveTo(-scaledWidth / 4, scaledHeight * 0.6, 0, scaledHeight * 0.8);
          tempCtx.quadraticCurveTo(scaledWidth / 4, scaledHeight, scaledWidth / 2, scaledHeight * 0.8);
          tempCtx.lineTo(scaledWidth / 2, scaledHeight);
          tempCtx.lineTo(-scaledWidth / 2, scaledHeight);
          tempCtx.closePath();
          break;
        case 'scroll-horizontal':
          const scrollRadius = Math.min(scaledWidth, scaledHeight) * 0.2;
          tempCtx.moveTo(-scaledWidth / 2 + scrollRadius, -scaledHeight / 2);
          tempCtx.lineTo(scaledWidth / 2 - scrollRadius, -scaledHeight / 2);
          tempCtx.quadraticCurveTo(scaledWidth / 2, -scaledHeight / 2, scaledWidth / 2, -scaledHeight / 2 + scrollRadius);
          tempCtx.quadraticCurveTo(scaledWidth / 2 - unitWidth * 10, -scaledHeight / 2 + scaledHeight * 0.4, scaledWidth / 2, scaledHeight / 2 - scrollRadius);
          tempCtx.quadraticCurveTo(scaledWidth / 2, scaledHeight / 2, scaledWidth / 2 - scrollRadius, scaledHeight / 2);
          tempCtx.lineTo(-scaledWidth / 2 + scrollRadius, scaledHeight / 2);
          tempCtx.quadraticCurveTo(-scaledWidth / 2, scaledHeight / 2, -scaledWidth / 2, scaledHeight / 2 - scrollRadius);
          tempCtx.quadraticCurveTo(-scaledWidth / 2 + unitWidth * 10, scaledHeight / 2 - scaledHeight * 0.4, -scaledWidth / 2, -scaledHeight / 2 + scrollRadius);
          tempCtx.closePath();
          break;
        case 'star':
          const starPoints = [
            [0, -50], [20, -15], [65, -15], [30, 10], [50, 45],
            [0, 20], [-50, 45], [-30, 10], [-65, -15], [-20, -15]
          ];
          starPoints.forEach(([x, y], index) => {
            const px = x * unitWidth;
            const py = y * unitHeight;
            if (index === 0) tempCtx.moveTo(px, py);
            else tempCtx.lineTo(px, py);
          });
          tempCtx.closePath();
          break;
        case 'heart':
          tempCtx.moveTo(0, 30 * unitHeight);
          tempCtx.bezierCurveTo(
            20 * unitWidth, 10 * unitHeight,
            40 * unitWidth, 10 * unitHeight,
            40 * unitWidth, 30 * unitHeight
          );
          tempCtx.quadraticCurveTo(40 * unitWidth, 50 * unitHeight, 0, 80 * unitHeight);
          tempCtx.quadraticCurveTo(-40 * unitWidth, 50 * unitHeight, -40 * unitWidth, 30 * unitHeight);
          tempCtx.bezierCurveTo(
            -40 * unitWidth, 10 * unitHeight,
            -20 * unitWidth, 10 * unitHeight,
            0, 30 * unitHeight
          );
          tempCtx.closePath();
          break;
        case 'cloud':
          const cloudRadius = 20 * Math.min(unitWidth, unitHeight);
          tempCtx.moveTo(-20 * unitWidth, 40 * unitHeight);
          tempCtx.bezierCurveTo(
            -40 * unitWidth, 20 * unitHeight,
            -40 * unitWidth, 60 * unitHeight,
            -20 * unitWidth, 40 * unitHeight
          );
          tempCtx.bezierCurveTo(
            0, 20 * unitHeight,
            20 * unitWidth, 20 * unitHeight,
            40 * unitWidth, 40 * unitHeight
          );
          tempCtx.bezierCurveTo(
            60 * unitWidth, 60 * unitHeight,
            40 * unitWidth, 60 * unitHeight,
            20 * unitWidth, 40 * unitHeight
          );
          tempCtx.bezierCurveTo(
            0, 60 * unitHeight,
            -20 * unitWidth, 60 * unitHeight,
            -20 * unitWidth, 40 * unitHeight
          );
          tempCtx.closePath();
          break;
        case 'hexagon':
          const hexPoints = [
            [-25, -50], [25, -50], [50, 0],
            [25, 50], [-25, 50], [-50, 0]
          ];
          hexPoints.forEach(([x, y], index) => {
            const px = x * unitWidth;
            const py = y * unitHeight;
            if (index === 0) tempCtx.moveTo(px, py);
            else tempCtx.lineTo(px, py);
          });
          tempCtx.closePath();
          break;
        case 'triangle':
          tempCtx.moveTo(0, -50 * unitHeight);
          tempCtx.lineTo(50 * unitWidth, 50 * unitHeight);
          tempCtx.lineTo(-50 * unitWidth, 50 * unitHeight);
          tempCtx.closePath();
          break;
        default:
          tempCtx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      }
      tempCtx.fill();
      if (shape.outlineWidth > 0) tempCtx.stroke();
      tempCtx.restore();
    });

    // Draw text
    texts.forEach((text) => {
      tempCtx.save();
      const scaledX = text.x * scaleX;
      const scaledY = text.y * scaleY;
      const scaledFontSize = text.fontSize * Math.min(scaleX, scaleY);
      let fontStyle = '';
      if (text.italic) fontStyle += 'italic ';
      if (text.bold) fontStyle += 'bold ';
      tempCtx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily || 'Arial'}`;
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      tempCtx.translate(scaledX, scaledY);
      tempCtx.rotate((text.rotation || 0) * Math.PI / 180);

      const textWidth = tempCtx.measureText(text.content || '').width;
      const textHeight = scaledFontSize * 1.2;

      if (text.stroke && text.stroke !== 'none') {
        tempCtx.strokeStyle = text.stroke;
        tempCtx.lineWidth = scaledFontSize / 40;
        tempCtx.strokeText(text.content || '', 0, 0);
      }

      if ((text.color || '#ffffff').includes('gradient')) {
        drawGradientText(tempCtx, text, scaledFontSize, fontStyle, textWidth, textHeight);
      } else {
        tempCtx.fillStyle = text.color || '#ffffff';
        tempCtx.fillText(text.content || '', 0, 0);
      }

      if (text.underline !== 'none') {
        drawUnderline(tempCtx, text, scaledFontSize, textWidth);
      }
      tempCtx.restore();
    });

    // Draw emojis
    emojis.forEach((emoji) => {
      tempCtx.save();
      const scaledX = emoji.x * scaleX;
      const scaledY = emoji.y * scaleY;
      const scaledSize = emoji.size * Math.min(scaleX, scaleY);
      tempCtx.translate(scaledX, scaledY);
      tempCtx.rotate((emoji.rotation || 0) * Math.PI / 180);
      tempCtx.font = `${scaledSize}px serif`;
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      tempCtx.fillText(emoji.content || emoji.emoji || '', 0, 0);
      tempCtx.restore();
    });

    // Export as optimized JPEG
    const dataURL = tempCanvas.toDataURL('image/jpeg', 0.9); // Adjusted quality for smaller file size
    const link = document.createElement('a');
    link.download = 'meme.jpg';
    link.href = dataURL;
    link.click();

    // Clean up
    tempCanvas.remove();
  }, [image, texts, shapes, emojis, photos, filters, canvasRef, imageRef]);

  return (
    <button
      onClick={downloadMeme}
      disabled={!image && photos.length === 0}
      className="download-button"
      aria-label="Download meme"
    >
      Download
    </button>
  );
};