import React, { useCallback, useEffect, useRef } from 'react';
import { loadImage, applyGradient } from './MemeUtils';

export const MemeDownload = ({ image, texts, shapes, emojis, photos, filters, canvasRefs }) => {
  // Cache for preloaded images
  const imageCache = useRef(new Map());
  // Track if download is in progress
  const isDownloading = useRef(false);
  // Store detected image format
  const imageFormat = useRef('image/jpeg');

  // Preload images and detect format on component mount
  useEffect(() => {
    const preloadImages = async () => {
      try {
        // Preload background image and detect format
        if (image) {
          const bgImg = await loadImage(image);
          imageCache.current.set(image, bgImg);
          // Detect image format from URL or data URL
          if (image.startsWith('data:image/png') || image.toLowerCase().endsWith('.png')) {
            imageFormat.current = 'image/png';
          } else if (image.startsWith('data:image/jpeg') || image.toLowerCase().endsWith('.jpg') || image.toLowerCase().endsWith('.jpeg')) {
            imageFormat.current = 'image/jpeg';
          }
        }
        // Preload photos and detect format from first photo if no single image
        if (photos.length > 0 && !image) {
          const photoPromises = photos.map(async (photo) => {
            const img = await loadImage(photo.src);
            imageCache.current.set(photo.src, img);
            // Set format based on first photo if not already set
            if (!image && photos.indexOf(photo) === 0) {
              if (photo.src.startsWith('data:image/png') || photo.src.toLowerCase().endsWith('.png')) {
                imageFormat.current = 'image/png';
              } else if (photo.src.startsWith('data:image/jpeg') || photo.src.toLowerCase().endsWith('.jpg') || photo.src.toLowerCase().endsWith('.jpeg')) {
                imageFormat.current = 'image/jpeg';
              }
            }
          });
          await Promise.all(photoPromises);
        }
      } catch (err) {
        console.error('Failed to preload images:', err);
      }
    };
    preloadImages();
  }, [image, photos]);

  const drawUnderline = (ctx, text, scaledFontSize, textWidth, scaleX, scaleY) => {
    ctx.beginPath();
    const underlineY = scaledFontSize * 0.1;
    ctx.moveTo(-textWidth / 2, underlineY);
    ctx.lineTo(textWidth / 2, underlineY);
    ctx.strokeStyle = text.stroke || '#000000';
    ctx.lineWidth = scaledFontSize / 20;
    ctx.stroke();
  };

  const drawGradientText = (ctx, text, scaledFontSize, fontStyle, scaleX, scaleY) => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const textWidth = ctx.measureText(text.content || '').width;
    const textHeight = scaledFontSize * 1.2;

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
    tempCanvas.remove();
  };

  const drawPhoto = (ctx, photo, scaleX, scaleY) => {
    const img = imageCache.current.get(photo.src);
    if (!img) return;

    ctx.save();
    const scaledX = photo.x * scaleX;
    const scaledY = photo.y * scaleY;
    const scaledWidth = photo.width * scaleX;
    const scaledHeight = photo.height * scaleY;
    ctx.translate(scaledX, scaledY);
    ctx.rotate((photo.rotation || 0) * Math.PI / 180);
    ctx.globalAlpha = photo.opacity || 1;
    ctx.filter = `brightness(${photo.brightness * 100 || 100}%)`;
    ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    ctx.restore();
  };

  const drawShape = (ctx, shape, scaleX, scaleY) => {
    ctx.save();
    const scaledX = shape.x * scaleX;
    const scaledY = shape.y * scaleY;
    const scaledWidth = shape.width * scaleX;
    const scaledHeight = shape.height * scaleY;

    ctx.translate(scaledX, scaledY);
    ctx.rotate((shape.rotation || 0) * Math.PI / 180);

    const effectiveFillColor = shape.fill || shape.fillColor || '#ff0000';
    const effectiveOutlineColor = shape.outlineColor || '#000000';
    ctx.fillStyle = effectiveFillColor.includes('gradient')
      ? applyGradient(ctx, effectiveFillColor, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
      : shape.fill === 'none' ? 'transparent' : effectiveFillColor;
    ctx.strokeStyle = shape.outlineWidth === 0
      ? 'none'
      : effectiveOutlineColor.includes('gradient')
        ? applyGradient(ctx, effectiveOutlineColor, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
        : effectiveOutlineColor;
    ctx.lineWidth = (shape.outlineWidth || 2) * Math.min(scaleX, scaleY);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const isLineShape = ['line', 'arrow', 'double-arrow'].includes(shape.shapeType);
    const unitWidth = scaledWidth / 100;
    const unitHeight = isLineShape ? scaledHeight / 20 : scaledHeight / 100;

    switch (shape.shapeType) {
      case 'rectangle':
        ctx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        break;
      case 'rounded-rectangle':
        const radius = Math.min(scaledWidth, scaledHeight) * 0.2;
        ctx.moveTo(-scaledWidth / 2 + radius, -scaledHeight / 2);
        ctx.lineTo(scaledWidth / 2 - radius, -scaledHeight / 2);
        ctx.quadraticCurveTo(scaledWidth / 2, -scaledHeight / 2, scaledWidth / 2, -scaledHeight / 2 + radius);
        ctx.lineTo(scaledWidth / 2, scaledHeight / 2 - radius);
        ctx.quadraticCurveTo(scaledWidth / 2, scaledHeight / 2, scaledWidth / 2 - radius, scaledHeight / 2);
        ctx.lineTo(-scaledWidth / 2 + radius, scaledHeight / 2);
        ctx.quadraticCurveTo(-scaledWidth / 2, scaledHeight / 2, -scaledWidth / 2, scaledHeight / 2 - radius);
        ctx.lineTo(-scaledWidth / 2, -scaledHeight / 2 + radius);
        ctx.quadraticCurveTo(-scaledWidth / 2, -scaledHeight / 2, -scaledWidth / 2 + radius, -scaledHeight / 2);
        ctx.closePath();
        break;
      case 'banner':
        ctx.moveTo(-scaledWidth / 2, scaledHeight * 0.2);
        ctx.quadraticCurveTo(0, 0, scaledWidth / 2, scaledHeight * 0.2);
        ctx.lineTo(scaledWidth / 2, scaledHeight * 0.8);
        ctx.quadraticCurveTo(0, scaledHeight, -scaledWidth / 2, scaledHeight * 0.8);
        ctx.closePath();
        break;
      case 'arrow':
        ctx.moveTo(-scaledWidth / 2, 0);
        ctx.lineTo(scaledWidth / 2, 0);
        ctx.moveTo(scaledWidth / 2, 0);
        ctx.lineTo(scaledWidth / 2 - unitWidth * 10, unitHeight * 5);
        ctx.moveTo(scaledWidth / 2, 0);
        ctx.lineTo(scaledWidth / 2 - unitWidth * 10, -unitHeight * 5);
        break;
      case 'double-arrow':
        ctx.moveTo(-scaledWidth / 2, 0);
        ctx.lineTo(scaledWidth / 2, 0);
        ctx.moveTo(-scaledWidth / 2, 0);
        ctx.lineTo(-scaledWidth / 2 + unitWidth * 10, unitHeight * 5);
        ctx.moveTo(-scaledWidth / 2, 0);
        ctx.lineTo(-scaledWidth / 2 + unitWidth * 10, -unitHeight * 5);
        ctx.moveTo(scaledWidth / 2, 0);
        ctx.lineTo(scaledWidth / 2 - unitWidth * 10, unitHeight * 5);
        ctx.moveTo(scaledWidth / 2, 0);
        ctx.lineTo(scaledWidth / 2 - unitWidth * 10, -unitHeight * 5);
        break;
      case 'circle':
        ctx.ellipse(0, 0, scaledWidth / 2, scaledHeight / 2, 0, 0, Math.PI * 2);
        ctx.closePath();
        break;
      case 'line':
        ctx.moveTo(-scaledWidth / 2, 0);
        ctx.lineTo(scaledWidth / 2, 0);
        break;
      case 'flowchart-terminator':
        const termRadiusX = scaledWidth * 0.2;
        const termRadiusY = scaledHeight * 0.5;
        ctx.moveTo(-scaledWidth / 2 + termRadiusX, -scaledHeight / 2);
        ctx.lineTo(scaledWidth / 2 - termRadiusX, -scaledHeight / 2);
        ctx.bezierCurveTo(
          scaledWidth / 2, -scaledHeight / 2,
          scaledWidth / 2, scaledHeight / 2,
          scaledWidth / 2 - termRadiusX, scaledHeight / 2
        );
        ctx.lineTo(-scaledWidth / 2 + termRadiusX, scaledHeight / 2);
        ctx.bezierCurveTo(
          -scaledWidth / 2, scaledHeight / 2,
          -scaledWidth / 2, -scaledHeight / 2,
          -scaledWidth / 2 + termRadiusX, -scaledHeight / 2
        );
        ctx.closePath();
        break;
      case 'flowchart-preparation':
        const prepOffset = scaledWidth * 0.25;
        ctx.moveTo(-scaledWidth / 2 + prepOffset, -scaledHeight / 2);
        ctx.lineTo(scaledWidth / 2 - prepOffset, -scaledHeight / 2);
        ctx.lineTo(scaledWidth / 2, scaledHeight / 2);
        ctx.lineTo(-scaledWidth / 2 + prepOffset, scaledHeight / 2);
        ctx.lineTo(-scaledWidth / 2, 0);
        ctx.closePath();
        break;
      case 'speech-bubble-oval':
        const ovalRadiusX = scaledWidth * 0.4;
        const ovalRadiusY = scaledHeight * 0.5;
        ctx.moveTo(-ovalRadiusX, -scaledHeight / 2);
        ctx.bezierCurveTo(
          -scaledWidth / 2, -scaledHeight / 2,
          -scaledWidth / 2, scaledHeight / 2,
          -ovalRadiusX, scaledHeight / 2
        );
        ctx.lineTo(0, scaledHeight / 2);
        ctx.lineTo(-unitWidth * 10, scaledHeight / 2 + unitHeight * 20);
        ctx.lineTo(unitWidth * 10, scaledHeight / 2 + unitHeight * 20);
        ctx.lineTo(ovalRadiusX, scaledHeight / 2);
        ctx.bezierCurveTo(
          scaledWidth / 2, scaledHeight / 2,
          scaledWidth / 2, -scaledHeight / 2,
          ovalRadiusX, -scaledHeight / 2
        );
        ctx.closePath();
        break;
      case 'speech-bubble-rounded-rectangle':
        const speechRadius = Math.min(scaledWidth, scaledHeight) * 0.2;
        ctx.moveTo(-scaledWidth / 2 + speechRadius, -scaledHeight / 2);
        ctx.lineTo(scaledWidth / 2 - speechRadius, -scaledHeight / 2);
        ctx.quadraticCurveTo(scaledWidth / 2, -scaledHeight / 2, scaledWidth / 2, -scaledHeight / 2 + speechRadius);
        ctx.lineTo(scaledWidth / 2, scaledHeight / 2 - speechRadius - unitHeight * 20);
        ctx.quadraticCurveTo(scaledWidth / 2, scaledHeight / 2 - unitHeight * 20, scaledWidth / 2 - speechRadius, scaledHeight / 2 - unitHeight * 20);
        ctx.lineTo(unitWidth * 20, scaledHeight / 2 - unitHeight * 20);
        ctx.lineTo(0, scaledHeight / 2);
        ctx.lineTo(-unitWidth * 20, scaledHeight / 2 - unitHeight * 20);
        ctx.lineTo(-scaledWidth / 2 + speechRadius, scaledHeight / 2 - unitHeight * 20);
        ctx.quadraticCurveTo(-scaledWidth / 2, scaledHeight / 2 - unitHeight * 20, -scaledWidth / 2, scaledHeight / 2 - speechRadius - unitHeight * 20);
        ctx.lineTo(-scaledWidth / 2, -scaledHeight / 2 + speechRadius);
        ctx.quadraticCurveTo(-scaledWidth / 2, -scaledHeight / 2, -scaledWidth / 2 + speechRadius, -scaledHeight / 2);
        ctx.closePath();
        break;
      case 'speech-bubble-rectangle':
        ctx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight - unitHeight * 20);
        ctx.moveTo(unitWidth * 20, scaledHeight / 2 - unitHeight * 20);
        ctx.lineTo(0, scaledHeight / 2);
        ctx.lineTo(-unitWidth * 20, scaledHeight / 2 - unitHeight * 20);
        ctx.closePath();
        break;
      case 'ribbon-curved':
        ctx.moveTo(-scaledWidth / 2, scaledHeight * 0.2);
        ctx.quadraticCurveTo(0, 0, scaledWidth / 2, scaledHeight * 0.2);
        ctx.lineTo(scaledWidth / 2, scaledHeight * 0.8);
        ctx.quadraticCurveTo(0, scaledHeight, -scaledWidth / 2, scaledHeight * 0.8);
        ctx.closePath();
        ctx.moveTo(-scaledWidth / 2, scaledHeight * 0.2);
        ctx.lineTo(-scaledWidth * 0.3, scaledHeight * 0.4);
        ctx.lineTo(-scaledWidth / 2, scaledHeight * 0.6);
        ctx.moveTo(scaledWidth / 2, scaledHeight * 0.2);
        ctx.lineTo(scaledWidth * 0.3, scaledHeight * 0.4);
        ctx.lineTo(scaledWidth / 2, scaledHeight * 0.6);
        break;
      case 'double-wave':
        ctx.moveTo(-scaledWidth / 2, scaledHeight * 0.3);
        ctx.quadraticCurveTo(-scaledWidth / 4, scaledHeight * 0.1, 0, scaledHeight * 0.3);
        ctx.quadraticCurveTo(scaledWidth / 4, scaledHeight * 0.5, scaledWidth / 2, scaledHeight * 0.3);
        ctx.lineTo(scaledWidth / 2, scaledHeight * 0.7);
        ctx.quadraticCurveTo(scaledWidth / 4, scaledHeight * 0.9, 0, scaledHeight * 0.7);
        ctx.quadraticCurveTo(-scaledWidth / 4, scaledHeight * 0.5, -scaledWidth / 2, scaledHeight * 0.7);
        ctx.closePath();
        break;
      case 'wave':
        ctx.moveTo(-scaledWidth / 2, scaledHeight * 0.8);
        ctx.quadraticCurveTo(-scaledWidth / 4, scaledHeight * 0.6, 0, scaledHeight * 0.8);
        ctx.quadraticCurveTo(scaledWidth / 4, scaledHeight, scaledWidth / 2, scaledHeight * 0.8);
        ctx.lineTo(scaledWidth / 2, scaledHeight);
        ctx.lineTo(-scaledWidth / 2, scaledHeight);
        ctx.closePath();
        break;
      case 'scroll-horizontal':
        const scrollRadius = Math.min(scaledWidth, scaledHeight) * 0.2;
        ctx.moveTo(-scaledWidth / 2 + scrollRadius, -scaledHeight / 2);
        ctx.lineTo(scaledWidth / 2 - scrollRadius, -scaledHeight / 2);
        ctx.quadraticCurveTo(scaledWidth / 2, -scaledHeight / 2, scaledWidth / 2, -scaledHeight / 2 + scrollRadius);
        ctx.quadraticCurveTo(scaledWidth / 2 - unitWidth * 10, -scaledHeight / 2 + scaledHeight * 0.4, scaledWidth / 2, scaledHeight / 2 - scrollRadius);
        ctx.quadraticCurveTo(scaledWidth / 2, scaledHeight / 2, scaledWidth / 2 - scrollRadius, scaledHeight / 2);
        ctx.lineTo(-scaledWidth / 2 + scrollRadius, scaledHeight / 2);
        ctx.quadraticCurveTo(-scaledWidth / 2, scaledHeight / 2, -scaledWidth / 2, scaledHeight / 2 - scrollRadius);
        ctx.quadraticCurveTo(-scaledWidth / 2 + unitWidth * 10, scaledHeight / 2 - scaledHeight * 0.4, -scaledWidth / 2, -scaledHeight / 2 + scrollRadius);
        ctx.closePath();
        break;
      case 'star':
        const starPoints = [
          [0, -50], [20, -15], [65, -15], [30, 10], [50, 45],
          [0, 20], [-50, 45], [-30, 10], [-65, -15], [-20, -15]
        ];
        starPoints.forEach(([x, y], index) => {
          const px = x * unitWidth;
          const py = y * unitHeight;
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        break;
      case 'heart':
        ctx.moveTo(0, 30 * unitHeight);
        ctx.bezierCurveTo(
          20 * unitWidth, 10 * unitHeight,
          40 * unitWidth, 10 * unitHeight,
          40 * unitWidth, 30 * unitHeight
        );
        ctx.quadraticCurveTo(40 * unitWidth, 50 * unitHeight, 0, 80 * unitHeight);
        ctx.quadraticCurveTo(-40 * unitWidth, 50 * unitHeight, -40 * unitWidth, 30 * unitHeight);
        ctx.bezierCurveTo(
          -40 * unitWidth, 10 * unitHeight,
          -20 * unitWidth, 10 * unitHeight,
          0, 30 * unitHeight
        );
        ctx.closePath();
        break;
      case 'cloud':
        const cloudRadius = 20 * Math.min(unitWidth, unitHeight);
        ctx.moveTo(-20 * unitWidth, 40 * unitHeight);
        ctx.bezierCurveTo(
          -40 * unitWidth, 20 * unitHeight,
          -40 * unitWidth, 60 * unitHeight,
          -20 * unitWidth, 40 * unitHeight
        );
        ctx.bezierCurveTo(
          0, 20 * unitHeight,
          20 * unitWidth, 20 * unitHeight,
          40 * unitWidth, 40 * unitHeight
        );
        ctx.bezierCurveTo(
          60 * unitWidth, 60 * unitHeight,
          40 * unitWidth, 60 * unitHeight,
          20 * unitWidth, 40 * unitHeight
        );
        ctx.bezierCurveTo(
          0, 60 * unitHeight,
          -20 * unitWidth, 60 * unitHeight,
          -20 * unitWidth, 40 * unitHeight
        );
        ctx.closePath();
        break;
      case 'hexagon':
        const hexPoints = [
          [-25, -50], [25, -50], [50, 0],
          [25, 50], [-25, 50], [-50, 0]
        ];
        hexPoints.forEach(([x, y], index) => {
          const px = x * unitWidth;
          const py = y * unitHeight;
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        break;
      case 'triangle':
        ctx.moveTo(0, -50 * unitHeight);
        ctx.lineTo(50 * unitWidth, 50 * unitHeight);
        ctx.lineTo(-50 * unitWidth, 50 * unitHeight);
        ctx.closePath();
        break;
      default:
        ctx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    }
    ctx.fill();
    if (shape.outlineWidth > 0) ctx.stroke();
    ctx.restore();
  };

  const downloadMeme = useCallback(() => {
    // Prevent multiple downloads
    if (isDownloading.current) return;
    isDownloading.current = true;

    const { canvasRef, imageRef } = canvasRefs;
    if (!canvasRef?.current || (!image && photos.length === 0)) {
      alert('No image or photos available for download. Please select an image.');
      isDownloading.current = false;
      return;
    }

    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Get dimensions
    let originalWidth, originalHeight;
    if (image && imageRef?.current) {
      const img = imageCache.current.get(image) || imageRef.current;
      originalWidth = img.naturalWidth;
      originalHeight = img.naturalHeight;
    } else {
      // Use canvas dimensions for merged photos or first photo dimensions
      if (photos.length > 0) {
        const firstPhoto = imageCache.current.get(photos[0].src);
        if (firstPhoto) {
          originalWidth = firstPhoto.naturalWidth;
          originalHeight = firstPhoto.naturalHeight;
        } else {
          originalWidth = canvas.width;
          originalHeight = canvas.height;
        }
      } else {
        originalWidth = canvas.width;
        originalHeight = canvas.height;
      }
    }

    // Set canvas to original image dimensions (no DPR scaling to match input)
    tempCanvas.width = originalWidth;
    tempCanvas.height = originalHeight;

    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = originalWidth / canvasRect.width;
    const scaleY = originalHeight / canvasRect.height;

    // Draw background
    if (image && imageRef?.current && imageRef.current.complete) {
      tempCtx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `;
      const img = imageCache.current.get(image) || imageRef.current;
      tempCtx.drawImage(img, 0, 0, originalWidth, originalHeight);
      tempCtx.filter = 'none';
    } else {
      tempCtx.drawImage(canvas, 0, 0, originalWidth, originalHeight);
    }

    // Draw photos
    photos.forEach((photo) => drawPhoto(tempCtx, photo, scaleX, scaleY));

    // Draw shapes
    shapes.forEach((shape) => drawShape(tempCtx, shape, scaleX, scaleY));

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

      if (text.stroke && text.stroke !== 'none') {
        tempCtx.strokeStyle = text.stroke;
        tempCtx.lineWidth = scaledFontSize / 40;
        tempCtx.strokeText(text.content || '', 0, 0);
      }

      if ((text.color || '#ffffff').includes('gradient')) {
        drawGradientText(tempCtx, text, scaledFontSize, fontStyle, scaleX, scaleY);
      } else {
        tempCtx.fillStyle = text.color || '#ffffff';
        tempCtx.fillText(text.content || '', 0, 0);
      }

      if (text.underline !== 'none') {
        drawUnderline(tempCtx, text, scaledFontSize, textWidth, scaleX, scaleY);
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

    // Export image with original quality
    return new Promise((resolve, reject) => {
      const mimeType = imageFormat.current;
      const quality = mimeType === 'image/jpeg' ? 1.0 : undefined; // Maximum quality for JPEG, undefined for PNG
      tempCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            isDownloading.current = false;
            return;
          }

          const sizeKB = (blob.size / 1024).toFixed(2);
          console.log(`Downloaded image size: ${sizeKB} KB, Format: ${mimeType}`);

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `meme.${mimeType === 'image/png' ? 'png' : 'jpg'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          tempCanvas.remove();
          resolve();
        },
        mimeType,
        quality
      );
    }).catch((err) => {
      console.error('Failed to process image:', err);
      alert('Failed to process the image. Please try again.');
      isDownloading.current = false;
    }).finally(() => {
      isDownloading.current = false;
    });
  }, [image, texts, shapes, emojis, photos, filters, canvasRefs]);

  return (
    <button
      onClick={downloadMeme}
      disabled={(!image && photos.length === 0) || isDownloading.current}
      className="download-button"
      aria-label="Download meme"
    >
      Download
    </button>
  );
};