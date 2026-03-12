import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

export const ImageToWord = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);

  const onDrop = async (acceptedFiles) => {
    setStatus('');
    setError(null);
    const f = acceptedFiles[0] || null;
    if (f && f.type.startsWith('image/')) {
      setFile(f);
    } else if (f) {
      setError('Unsupported file type. Please use images (JPG/PNG).');
    }
  };

  const handleConvert = async () => {
    setStatus('Processing...');
    setError(null);
    if (!file) {
      setError('No file selected');
      setStatus('');
      return;
    }
    try {
      const imageArrayBuffer = await file.arrayBuffer();
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageArrayBuffer,
                  transformation: {
                    width: 500,
                    height: 500,
                  },
                }),
              ],
            }),
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, 'converted-document.docx');
      setStatus('Converted & Downloaded.');
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStatus('');
    }
  };

  // Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    multiple: false,
  });

  return (
    <div className="converter-container">
      <p>Upload Image</p>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the image here...</p>
        ) : (
          <p>Drag and drop or click to select an image</p>
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