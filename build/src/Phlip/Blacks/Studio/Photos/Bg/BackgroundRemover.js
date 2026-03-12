import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import "./BackgroundRemover.css";

export const BackgroundRemover = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [transparency, setTransparency] = useState(1.0);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    await handleImageUpload(acceptedFiles[0]);
  };

  const handleImageUpload = async (file) => {
    setStatus('Loading image...');
    setError(null);
    setProcessing(true);

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      setProcessing(false);
      setStatus('');
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      setOriginalImage(imageUrl);
      setStatus('Image loaded. Click "Remove Background" to process.');
    } catch (err) {
      setError(`Error loading image: ${err.message}`);
      setStatus('');
    } finally {
      setProcessing(false);
    }
  };

  const removeBackground = async () => {
    if (!originalImage) {
      setError('Please upload an image first');
      return;
    }

    setStatus('Removing background... (this may take a moment)');
    setProcessing(true);

    try {
      // In a real implementation, you would call an API like remove.bg here
      // This is a mock implementation that just returns the original image
      // For demo purposes, we'll simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock result - in reality you'd get this from an API
      setProcessedImage(originalImage);
      setStatus('Background removed successfully!');
    } catch (err) {
      setError(`Error removing background: ${err.message}`);
      setStatus('');
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const a = document.createElement('a');
    a.href = processedImage;
    a.download = 'background-removed.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: false,
  });

  return (
    <div className="background-remover-container-bg">
      <div className="preview-area-bg">
        <div className="image-upload-section-bg" {...getRootProps()}>
          <input {...getInputProps()} />
          {originalImage ? (
            <img 
              src={originalImage} 
              alt="Original" 
              className="preview-image-bg"
            />
          ) : (
            <div className={`dropzone-bg ${isDragActive ? 'active' : ''}`}>
              {isDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <div className="upload-prompt-bg">
                  <p>Drag & drop an image here</p>
                  <p>or</p>
                  <button 
                    type="button"
                    className="browse-btn-bg"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current.click();
                    }}
                  >
                    Browse Files
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {processedImage && (
          <div className="result-section-bg">
            <img 
              src={processedImage} 
              alt="Background Removed" 
              className="preview-image-bg"
              style={{
                backgroundColor: bgColor,
                opacity: transparency
              }}
            />
            <div className="result-controls-bg">
              <div className="control-group-bg">
                <label>Transparency:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={transparency}
                  onChange={(e) => setTransparency(parseFloat(e.target.value))}
                />
              </div>
              <div className="control-group-bg">
                <label>Background Color:</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </div>
              <button 
                className="download-btn-bg"
                onClick={downloadImage}
                disabled={!processedImage}
              >
                Download Result
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="action-buttons-bg">
        <button
          className={`process-btn-bg ${processing ? 'processing' : ''}`}
          onClick={removeBackground}
          disabled={!originalImage || processing}
        >
          {processing ? 'Processing...' : 'Remove Background'}
        </button>
        
        {originalImage && (
          <button
            className="reset-btn-bg"
            onClick={() => {
              setOriginalImage(null);
              setProcessedImage(null);
              setStatus('');
            }}
          >
            Start Over
          </button>
        )}
      </div>

      {status && <p className="status-bg">{status}</p>}
      {error && <p className="error-bg">{error}</p>}
    </div>
  );
};