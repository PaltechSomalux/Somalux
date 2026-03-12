import React, { useRef } from 'react';
import "./ImagePreviewSection.css";
import { TextEditor } from './TextEditor';

export const ImagePreviewSection = ({
  previewImage,
  selectedImage,
  setSelectedImage,
  setPreviewImage
}) => {
  const canvasRef = useRef(null);

  return (
    <div className="image-preview-container">
      {selectedImage && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            ref={canvasRef}
            src={previewImage}
            alt="Preview"
            className="preview-image"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
          <TextEditor canvasRef={canvasRef} />
        </div>
      )}
    </div>
  );
}; 