import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';

export const ImageFormat = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [targetFormat, setTargetFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.92); // For JPEG/WEBP
  const [file, setFile] = useState(null);

  const convertAndDownload = async (file) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const mime = targetFormat;
      const q = (mime === 'image/jpeg' || mime === 'image/webp') ? quality : undefined;

      await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Failed to create image blob'));
          const base = file.name.replace(/\.[^/.]+$/, '');
          const ext = mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : 'webp';
          saveAs(blob, `${base}.${ext}`);
          resolve();
        }, mime, q);
      });

      setStatus('Converted & Downloaded.');
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
    await convertAndDownload(file);
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
      <h4>Image Format Converter</h4>
      <div className="controls" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label>
          Format:
          <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPG</option>
            <option value="image/webp">WEBP</option>
          </select>
        </label>
        {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
          <label>
            Quality: {Math.round(quality * 100)}%
            <input type="range" min={0.1} max={1} step={0.01} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} style={{ marginLeft: 8 }} />
          </label>
        )}
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
