import React, { useEffect } from 'react';
import './ImagePreviewSection.css';

export const ImagePreviewSection = ({
  previewImage,
  selectedImage,
  setSelectedImage,
  setPreviewImage,
  canvasRef
}) => {
  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
      };
      img.src = URL.createObjectURL(selectedImage);
      return () => URL.revokeObjectURL(img.src);
    }
  }, [selectedImage]);

  return (
    <div className="preview-section">
      {previewImage ? (
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