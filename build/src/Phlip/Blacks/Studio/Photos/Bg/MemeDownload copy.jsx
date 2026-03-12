import React, { useCallback } from 'react';
import { loadImage } from './MemeUtils';

export const MemeDownload = ({ image, texts, shapes, emojis, photos, filters, canvasRefs }) => {
  const drawUnderline = (ctx, text, scaledFontSize, textWidth, scaleX, scaleY) => {
    // Placeholder for drawUnderline (assumed in MemeUtils)
    // Implement as needed based on MemeUtils.js
  };

  const downloadMeme = useCallback(() => {
    const { canvasRef, imageRef } = canvasRefs;
    if (!canvasRef?.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Determine canvas dimensions
    let canvasWidth, canvasHeight;
    if (image && imageRef?.current) {
      // Use background image dimensions
      const imgElement = imageRef.current;
      canvasWidth = imgElement.naturalWidth;
      canvasHeight = imgElement.naturalHeight;
    } else {
      // Use default dimensions for transparent canvas (matches MemeCanvas.js)
      canvasWidth = 800;
      canvasHeight = 600;
    }

    // Apply device pixel ratio for high-resolution output
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Calculate scaling factors based on displayed dimensions
    const displayRect = imageRef?.current?.getBoundingClientRect() || {
      width: canvasWidth,
      height: canvasHeight,
    };
    const displayWidth = displayRect.width || canvasWidth;
    const displayHeight = displayRect.height || canvasHeight;
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / displayHeight;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Load all images (background if present, and photos)
    Promise.all([
      image ? loadImage(image) : Promise.resolve(null),
      ...photos.map((photo) => loadImage(photo.src)),
    ])
      .then(([backgroundImg, ...photoImages]) => {
        // Draw background image with filters if present
        if (backgroundImg) {
          ctx.filter = `
            brightness(${filters.brightness || 100}%)
            contrast(${filters.contrast || 100}%)
            saturate(${filters.saturation || 100}%)
            grayscale(${filters.grayscale || 0}%)
            sepia(${filters.sepia || 0}%)
            blur(${filters.blur || 0}px)
          `;
          ctx.drawImage(backgroundImg, 0, 0, canvasWidth, canvasHeight);
          ctx.filter = 'none';
        }

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
          const scaledX = shape.x * scaleX;
          const scaledY = shape.y * scaleY;
          const scaledWidth = shape.width * scaleX;
          const scaledHeight = shape.height * scaleY;

          ctx.translate(scaledX, scaledY);
          ctx.rotate((shape.rotation || 0) * Math.PI / 180);

          ctx.fillStyle = shape.fillColor === 'none' ? 'transparent' : shape.fillColor || '#ff0000';
          ctx.strokeStyle = shape.outlineColor || '#000000';
          ctx.lineWidth = (shape.outlineWidth || 2) * Math.min(scaleX, scaleY);

          ctx.beginPath();
          const isLineShape = ['line', 'arrow', 'double-arrow'].includes(shape.shapeType);
          const unitWidth = scaledWidth / 100;
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
          const scaledFontSize = text.fontSize * Math.min(scaleX, scaleY);
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
        const dataURL = canvas.toDataURL('image/png', 0.9); // Use PNG for transparency
        const link = document.createElement('a');
        link.download = 'meme.png';
        link.href = dataURL;
        link.click();

        // Reset canvas scaling
        ctx.scale(1 / dpr, 1 / dpr);
      })
      .catch((error) => {
        console.error('Error loading images for download:', error);
      });
  }, [image, texts, shapes, emojis, photos, filters, canvasRefs]);

  return (
    <button
      onClick={downloadMeme}
      disabled={!image && photos.length === 0} // Enable button if photos exist
      className="download-button"
    >
      Download
    </button>
  );
};