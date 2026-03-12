import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';

export const ImageCompress = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [quality, setQuality] = useState(0.7);
  const [maxWidth, setMaxWidth] = useState(0); // 0 = keep
  const [maxHeight, setMaxHeight] = useState(0);
  const [file, setFile] = useState(null);

  const compressImage = async (file) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Compute target dimensions
      let targetW = img.width;
      let targetH = img.height;
      if (maxWidth > 0 && targetW > maxWidth) {
        const ratio = maxWidth / targetW;
        targetW = maxWidth;
        targetH = Math.round(targetH * ratio);
      }
      if (maxHeight > 0 && targetH > maxHeight) {
        const ratio = maxHeight / targetH;
        targetH = maxHeight;
        targetW = Math.round(targetW * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Re-encode to JPEG for compression
      await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Failed to create image blob'));
          const base = file.name.replace(/\.[^/.]+$/, '');
          saveAs(blob, `${base}_compressed.jpg`);
          resolve();
        }, 'image/jpeg', quality);
      });

      setStatus('Compressed & Downloaded.');
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`Error: ${e.message}`);
      setStatus('');
    }
  };

  const onDrop = async (acceptedFiles) => {
    setStatus('');
    setError(null);
    const f = acceptedFiles[0] || null;
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setFile(f);
  };

  const handleConvert = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }
    setStatus('Processing...');
    await compressImage(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: false,
  });

  return (
    <div className="converter-container">
      <h4>Image Compression</h4>
      <div className="controls" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <label>
          Quality: {Math.round(quality * 100)}%
          <input type="range" min={0.1} max={1} step={0.01} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} style={{ marginLeft: 8, width: 180 }} />
        </label>
        <label>
          Max Width (px):
          <input type="number" value={maxWidth} min={0} onChange={(e) => setMaxWidth(parseInt(e.target.value || '0', 10))} style={{ marginLeft: 8, width: 100 }} />
        </label>
        <label>
          Max Height (px):
          <input type="number" value={maxHeight} min={0} onChange={(e) => setMaxHeight(parseInt(e.target.value || '0', 10))} style={{ marginLeft: 8, width: 100 }} />
        </label>
      </div>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the image here...</p>
        ) : (
          <p>Drag & drop an image, or click to select</p>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleConvert} disabled={!file}>Convert</button>
      </div>
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};
