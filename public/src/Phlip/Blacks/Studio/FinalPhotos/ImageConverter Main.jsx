import React, { useState, useRef } from 'react';
import { WatermarkControls } from './WatermarkControls2';
import { ImageDropzone } from './ImageDropzone2';
import { StatusDisplay } from './StatusDisplay';
import { applyTextWatermark, applyImageWatermark } from './WatermarkUtils';
import "./ImageConverter.css";

export const ImageConverter = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkColor, setWatermarkColor] = useState('#ffffff');
  const [watermarkSize, setWatermarkSize] = useState(48);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [watermarkType, setWatermarkType] = useState('text');
  const [logoImage, setLogoImage] = useState(null);
  const logoInputRef = useRef(null);

  const onDrop = async (acceptedFiles) => {
    setStatus('Processing...');
    setError(null);

    const file = acceptedFiles[0];
    if (!file) {
      setError('No file selected');
      setStatus('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported for watermarking');
      setStatus('');
      return;
    }

    try {
      const image = await addWatermarkToImage(file);
      downloadImage(image, file.name);
      setStatus('Watermarked image downloaded!');
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStatus('');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file for the logo');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const addWatermarkToImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          ctx.drawImage(img, 0, 0);

          if (watermarkType === 'text' && watermarkText) {
            applyTextWatermark(ctx, canvas.width, canvas.height, {
              text: watermarkText,
              size: watermarkSize,
              color: watermarkColor,
              opacity: watermarkOpacity,
              position: watermarkPosition
            });
            resolve(canvas);
          } else if (watermarkType === 'image' && logoImage) {
            applyImageWatermark(ctx, canvas.width, canvas.height, {
              image: logoImage,
              opacity: watermarkOpacity,
              position: watermarkPosition
            })
              .then(() => resolve(canvas))
              .catch(reject);
          } else {
            resolve(canvas);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const downloadImage = (canvas, originalName) => {
    const extension = originalName.split('.').pop().toLowerCase();
    let mimeType = 'image/jpeg';
    if (extension === 'png') {
      mimeType = 'image/png';
    }

    canvas.toBlob((blob) => {
      const newName = originalName.replace(/\.[^/.]+$/, '') + '-watermarked.' + extension;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = newName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, mimeType, 0.92);
  };

  return (
    <div className="converter-container">
      <p>Upload your image to add a watermark</p>
      
      <WatermarkControls
        watermarkType={watermarkType}
        setWatermarkType={setWatermarkType}
        watermarkText={watermarkText}
        setWatermarkText={setWatermarkText}
        watermarkColor={watermarkColor}
        setWatermarkColor={setWatermarkColor}
        watermarkSize={watermarkSize}
        setWatermarkSize={setWatermarkSize}
        watermarkOpacity={watermarkOpacity}
        setWatermarkOpacity={setWatermarkOpacity}
        watermarkPosition={watermarkPosition}
        setWatermarkPosition={setWatermarkPosition}
        logoImage={logoImage}
        setLogoImage={setLogoImage}
        logoInputRef={logoInputRef}
        handleLogoUpload={handleLogoUpload}
      />
      
      <ImageDropzone onDrop={onDrop} />
      
      <StatusDisplay status={status} error={error} />
    </div>
  );
};