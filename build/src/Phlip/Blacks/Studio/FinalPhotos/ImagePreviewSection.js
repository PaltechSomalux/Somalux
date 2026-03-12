import React, { useEffect, useRef } from 'react';
import './ImagePreviewSection.css';

export const ImagePreviewSection = ({
  previewImage,
  selectedImage,
  setSelectedImage,
  setPreviewImage,
  canvasRef,
  textElements, // Added to receive textElements
  watermarkType,
  watermarkOpacity,
  watermarkPosition,
  logoImage
}) => {
  const localCanvasRef = useRef(null); // Local ref in case canvasRef is not provided

  // Function to render the image and text elements on the canvas
  const renderCanvas = () => {
    if (!selectedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Draw text watermarks if watermarkType is 'text'
      if (watermarkType === 'text' && textElements.length > 0) {
        textElements.forEach((textEl) => {
          ctx.save();
          ctx.font = `${textEl.fontSize * textEl.scale}px ${textEl.fontFamily}`;
          ctx.fillStyle = textEl.color;
          ctx.globalAlpha = watermarkOpacity;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.translate(textEl.position.x, textEl.position.y);
          ctx.rotate((textEl.rotation * Math.PI) / 180);
          ctx.scale(textEl.scale, textEl.scale);
          ctx.fillText(textEl.text, 0, 0);
          ctx.restore();
        });
      }

      // Draw logo watermark if watermarkType is 'image'
      if (watermarkType === 'image' && logoImage) {
        const logo = new Image();
        logo.onload = () => {
          const scale = Math.min(canvas.width / logo.width, canvas.height / logo.height, 0.3);
          const imgWidth = logo.width * scale;
          const imgHeight = logo.height * scale;
          let x, y;

          switch (watermarkPosition) {
            case 'top-left':
              x = 20;
              y = 20;
              break;
            case 'top-right':
              x = canvas.width - imgWidth - 20;
              y = 20;
              break;
            case 'bottom-left':
              x = 20;
              y = canvas.height - imgHeight - 20;
              break;
            case 'bottom-right':
              x = canvas.width - imgWidth - 20;
              y = canvas.height - imgHeight - 20;
              break;
            case 'tiled':
              const stepX = canvas.width / 3;
              const stepY = canvas.height / 3;
              for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                  ctx.drawImage(logo, stepX * i + (stepX - imgWidth) / 2, stepY * j + (stepY - imgHeight) / 2, imgWidth, imgHeight);
                }
              }
              break;
            default:
              x = (canvas.width - imgWidth) / 2;
              y = (canvas.height - imgHeight) / 2;
          }

          ctx.globalAlpha = watermarkOpacity;
          ctx.drawImage(logo, x, y, imgWidth, imgHeight);
          ctx.globalAlpha = 1;

          // Update previewImage
          setPreviewImage(canvas.toDataURL());
        };
        logo.src = logoImage;
      } else {
        // Update previewImage if no logo
        setPreviewImage(canvas.toDataURL());
      }
    };
    img.src = URL.createObjectURL(selectedImage);
  };

  useEffect(() => {
    if (selectedImage) {
      renderCanvas();
    }
  }, [selectedImage, textElements, watermarkType, watermarkOpacity, watermarkPosition, logoImage]);

  return (
    <div className="preview-section">
      {selectedImage ? (
        <div className="preview-container">
          <canvas
            ref={canvasRef}
            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
          />
        </div>
      ) : (
        <p>No image selected</p>
      )}
    </div>
  );
};