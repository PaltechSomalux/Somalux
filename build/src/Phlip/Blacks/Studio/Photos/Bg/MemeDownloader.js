import React, { useCallback } from 'react';
import { loadImage } from './MemeUtils';export const MemeDownload = ({ image, texts, shapes, emojis, photos, filters, canvasRefs }) => {
  const drawUnderline = (ctx, text, scaledFontSize, textWidth, scaleX, scaleY) => {
    // Placeholder for drawUnderline (assumed in MemeUtils)
  };  const downloadMeme = useCallback(() => {
    const { canvasRef, imageRef } = canvasRefs;
    if (!canvasRef?.current || !imageRef?.current || !image) return;const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');
const imgElement = imageRef.current;

Promise.all([loadImage(image), ...photos.map((photo) => loadImage(photo.src))])
  .then(([backgroundImg, ...photoImages]) => {
    // Set canvas to image's natural dimensions
    canvas.width = backgroundImg.naturalWidth;
    canvas.height = backgroundImg.naturalHeight;

    // Apply device pixel ratio for high-resolution output
    const dpr = window.devicePixelRatio || 1;
    canvas.width *= dpr;
    canvas.height *= dpr;
    ctx.scale(dpr, dpr);

    // Get preview image's displayed dimensions
    const displayRect = imgElement.getBoundingClientRect();
    const displayWidth = displayRect.width;
    const displayHeight = displayRect.height;

    // Calculate scaling factors from display to natural dimensions
    const scaleX = backgroundImg.naturalWidth / displayWidth;
    const scaleY = backgroundImg.naturalHeight / displayHeight;

    // Draw background image with filters
    ctx.filter = `
      brightness(${filters.brightness || 100}%)
      contrast(${filters.contrast || 100}%)
      saturate(${filters.saturation || 100}%)
      grayscale(${filters.grayscale || 0}%)
      sepia(${filters.sepia || 0}%)
      blur(${filters.blur || 0}px)
    `;
    ctx.drawImage(backgroundImg, 0, 0, backgroundImg.naturalWidth, backgroundImg.naturalHeight);
    ctx.filter = 'none';

    // Draw photos
    photos.forEach((photo, index) => {
      ctx.save();
      const scaledX = photo.x * scaleX;
      const scaledY = photo.y * scaleY;
      const scaledWidth = photo.width * scaleX;
      const scaledHeight = photo.height * scaleY;
      ctx.translate(scaledX, scaledY);
      ctx.rotate((photo.rotation * Math.PI) / 180);
      ctx.globalAlpha = photo.opacity || 1;
      ctx.filter = `brightness(${photo.brightness * 100 || 100}%)`;
      ctx.drawImage(photoImages[index], -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
    });

    // Draw shapes
    shapes.forEach((shape) => {
      ctx.save();
      // Scale coordinates to canvas dimensions
      const scaledX = shape.x * scaleX;
      const scaledY = shape.y * scaleY;
      const scaledWidth = shape.width * scaleX;
      const scaledHeight = shape.height * scaleY;

      // Translate to shape's center and rotate, matching CSS transform: translate(-50%, -50%) rotate()
      ctx.translate(scaledX, scaledY);
      ctx.rotate((shape.rotation || 0) * Math.PI / 180);

      ctx.fillStyle = shape.fillColor === 'none' ? 'transparent' : shape.fillColor || '#ff0000';
      ctx.strokeStyle = shape.outlineColor || '#000000';
      ctx.lineWidth = (shape.outlineWidth || 2) * Math.min(scaleX, scaleY); // Use min to avoid distortion

      ctx.beginPath();
      const isLineShape = ['line', 'arrow', 'double-arrow'].includes(shape.shapeType);
      const unitWidth = scaledWidth / 100; // Normalize to SVG viewBox
      const unitHeight = isLineShape ? scaledHeight / 20 : scaledHeight / 100;

      switch (shape.shapeType) {
        case 'rectangle':
        case 'square':
          ctx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          break;
        case 'circle':
          ctx.ellipse(0, 0, scaledWidth / 2, scaledHeight / 2, 0, 0, Math.PI * 2);
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
        case 'ribbon':
          ctx.moveTo(-scaledWidth / 2, scaledHeight * 0.2);
          ctx.lineTo(-scaledWidth * 0.4, 0);
          ctx.lineTo(scaledWidth / 2, 0);
          ctx.lineTo(scaledWidth / 2, scaledHeight * 0.8);
          ctx.lineTo(-scaledWidth * 0.4, scaledHeight * 0.8);
          ctx.lineTo(-scaledWidth / 2, scaledHeight * 0.6);
          ctx.closePath();
          break;
        case 'speech-bubble':
          ctx.moveTo(-scaledWidth * 0.3, -scaledHeight / 2);
          ctx.lineTo(scaledWidth * 0.3, -scaledHeight / 2);
          ctx.quadraticCurveTo(scaledWidth / 2, -scaledHeight / 2, scaledWidth / 2, -scaledHeight * 0.3);
          ctx.lineTo(scaledWidth / 2, scaledHeight * 0.1);
          ctx.quadraticCurveTo(scaledWidth / 2, scaledHeight * 0.3, scaledWidth * 0.3, scaledHeight * 0.3);
          ctx.lineTo(scaledWidth * 0.1, scaledHeight * 0.3);
          ctx.lineTo(0, scaledHeight / 2);
          ctx.lineTo(-scaledWidth * 0.1, scaledHeight * 0.3);
          ctx.lineTo(-scaledWidth * 0.3, scaledHeight * 0.3);
          ctx.quadraticCurveTo(-scaledWidth / 2, scaledHeight * 0.3, -scaledWidth / 2, scaledHeight * 0.1);
          ctx.lineTo(-scaledWidth / 2, -scaledHeight * 0.3);
          ctx.quadraticCurveTo(-scaledWidth / 2, -scaledHeight / 2, -scaledWidth * 0.3, -scaledHeight / 2);
          ctx.closePath();
          break;
        case 'thought-bubble':
          ctx.moveTo(-scaledWidth * 0.3, -scaledHeight / 2);
          ctx.lineTo(scaledWidth * 0.3, -scaledHeight / 2);
          ctx.quadraticCurveTo(scaledWidth / 2, -scaledHeight / 2, scaledWidth / 2, -scaledHeight * 0.3);
          ctx.lineTo(scaledWidth / 2, scaledHeight * 0.1);
          ctx.quadraticCurveTo(scaledWidth / 2, scaledHeight * 0.3, scaledWidth * 0.3, scaledHeight * 0.3);
          ctx.lineTo(0, scaledHeight * 0.3);
          ctx.ellipse(0, scaledHeight * 0.35, scaledWidth * 0.05, scaledHeight * 0.05, 0, 0, Math.PI * 2);
          ctx.moveTo(0, scaledHeight * 0.4);
          ctx.ellipse(0, scaledHeight * 0.45, scaledWidth * 0.03, scaledHeight * 0.03, 0, 0, Math.PI * 2);
          ctx.moveTo(-scaledWidth * 0.3, scaledHeight * 0.3);
          ctx.quadraticCurveTo(-scaledWidth / 2, scaledHeight * 0.3, -scaledWidth / 2, scaledHeight * 0.1);
          ctx.lineTo(-scaledWidth / 2, -scaledHeight * 0.3);
          ctx.quadraticCurveTo(-scaledWidth / 2, -scaledHeight / 2, -scaledWidth * 0.3, -scaledHeight / 2);
          ctx.closePath();
          break;
        case 'callout':
          ctx.rect(-scaledWidth * 0.3, -scaledHeight * 0.3, scaledWidth * 0.6, scaledHeight * 0.6);
          ctx.moveTo(0, scaledHeight * 0.3);
          ctx.lineTo(-scaledWidth * 0.1, scaledHeight / 2);
          ctx.lineTo(scaledWidth * 0.1, scaledHeight / 2);
          ctx.closePath();
          break;
        case 'arrow':
          ctx.moveTo(-scaledWidth / 2, 0);
          ctx.lineTo(scaledWidth / 2, 0);
          ctx.moveTo(scaledWidth / 2, 0);
          ctx.lineTo(scaledWidth / 2 - scaledWidth * 0.1, scaledHeight * 0.25);
          ctx.moveTo(scaledWidth / 2, 0);
          ctx.lineTo(scaledWidth / 2 - scaledWidth * 0.1, -scaledHeight * 0.25);
          break;
        case 'double-arrow':
          ctx.moveTo(-scaledWidth / 2, 0);
          ctx.lineTo(scaledWidth / 2, 0);
          ctx.moveTo(-scaledWidth / 2, 0);
          ctx.lineTo(-scaledWidth / 2 + scaledWidth * 0.1, scaledHeight * 0.25);
          ctx.moveTo(-scaledWidth / 2, 0);
          ctx.lineTo(-scaledWidth / 2 + scaledWidth * 0.1, -scaledHeight * 0.25);
          ctx.moveTo(scaledWidth / 2, 0);
          ctx.lineTo(scaledWidth / 2 - scaledWidth * 0.1, scaledHeight * 0.25);
          ctx.moveTo(scaledWidth / 2, 0);
          ctx.lineTo(scaledWidth / 2 - scaledWidth * 0.1, -scaledHeight * 0.25);
          break;
        case 'line':
          ctx.moveTo(-scaledWidth / 2, 0);
          ctx.lineTo(scaledWidth / 2, 0);
          break;
        default:
          ctx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      }
      ctx.fill();
      if (shape.outlineWidth > 0) ctx.stroke();
      ctx.restore();
    });

    // Draw texts
    texts.forEach((text) => {
      ctx.save();
      const scaledX = text.x * scaleX;
      const scaledY = text.y * scaleY;
      const scaledFontSize = text.fontSize * Math.min(scaleX, scaleY); // Consistent scaling
      let fontStyle = '';
      if (text.italic) fontStyle += 'italic ';
      if (text.bold) fontStyle += 'bold ';
      ctx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(scaledX, scaledY);
      ctx.rotate((text.rotation || 0) * Math.PI / 180);

      ctx.strokeStyle = text.stroke || '#000000';
      ctx.lineWidth = scaledFontSize / 40;
      ctx.strokeText(text.content || '', 0, 0);

      ctx.fillStyle = text.color || '#ffffff';
      ctx.fillText(text.content || '', 0, 0);

      if (text.underline !== 'none') {
        const textWidth = ctx.measureText(text.content || '').width;
        drawUnderline(ctx, text, scaledFontSize, textWidth, scaleX, scaleY);
      }
      ctx.restore();
    });

    // Draw emojis
    emojis.forEach((emoji) => {
      ctx.save();
      const scaledX = emoji.x * scaleX;
      const scaledY = emoji.y * scaleY;
      const scaledSize = emoji.size * Math.min(scaleX, scaleY);
      ctx.translate(scaledX, scaledY);
      ctx.rotate((emoji.rotation || 0) * Math.PI / 180);
      ctx.font = `${scaledSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji.emoji || '', 0, 0);
      ctx.restore();
    });

    // Generate and download image
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    const link = document.createElement('a');
    link.download = 'meme.jpg';
    link.href = dataURL;
    link.click();

    // Reset canvas scaling
    ctx.scale(1 / dpr, 1 / dpr);
  })
  .catch((error) => {
    console.error('Error loading images for download:', error);
  });  }, [image, texts, shapes, emojis, photos, filters, canvasRefs]);  return (
    <button onClick={downloadMeme} disabled={!image} className="download-button">
      Download
    </button>
  );
}; 

