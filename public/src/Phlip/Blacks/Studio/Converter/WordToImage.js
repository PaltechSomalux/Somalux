import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as mammoth from 'mammoth';
import { saveAs } from 'file-saver';

export const WordToImage = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [foundCount, setFoundCount] = useState(0);
  const [file, setFile] = useState(null);

  const dataUrlToBlob = (dataURL) => {
    const parts = dataURL.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const onDrop = async (acceptedFiles) => {
    setStatus('');
    setError(null);
    setFoundCount(0);
    const f = acceptedFiles[0] || null;
    if (f && f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setFile(f);
    } else if (f) {
      setError('Please select a .docx file');
    }
  };

  const handleConvert = async () => {
    setStatus('Processing...');
    setError(null);
    setFoundCount(0);
    if (!file) {
      setError('No file selected');
      setStatus('');
      return;
    }
    try {
      const images = [];
      await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, {
        convertImage: mammoth.images.imgElement((image) => {
          return image.read('base64').then((imageBuffer) => {
            const dataUrl = `data:${image.contentType};base64,${imageBuffer}`;
            images.push({ dataUrl, contentType: image.contentType });
            return { src: dataUrl };
          });
        }),
      });

      if (images.length === 0) {
        setStatus('No images found in the document.');
        setFoundCount(0);
        return;
      }

      images.forEach((img, idx) => {
        const blob = dataUrlToBlob(img.dataUrl);
        const base = file.name.replace(/\.[^/.]+$/, '');
        const ext = img.contentType.split('/')[1] || 'png';
        saveAs(blob, `${base}_image_${idx + 1}.${ext}`);
      });

      setFoundCount(images.length);
      setStatus('Images extracted & downloaded.');
    } catch (e) {
      setError(`Error: ${e.message}`);
      setStatus('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });

  return (
    <div className="converter-container">
      <h4>Word to Image</h4>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the .docx here...</p>
        ) : (
          <p>Drag & drop a .docx file, or click to select</p>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleConvert} disabled={!file}>Convert</button>
      </div>
      {foundCount > 0 && <p className="file-info">Found {foundCount} image(s)</p>}
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};
