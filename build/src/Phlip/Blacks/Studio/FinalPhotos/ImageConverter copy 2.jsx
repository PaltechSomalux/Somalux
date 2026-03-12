import React, { useState, useRef, useEffect } from 'react';
import { WatermarkControls } from './WatermarkControls';
import { TextEditor } from './TextEditor';
import { ImageDropzone } from './ImageDropzone';
import { StatusDisplay } from './StatusDisplay';
import { ImagePreviewSection } from './ImagePreviewSection';
import { applyTextWatermark, applyImageWatermark } from './WatermarkUtils';
import "./ImageConverter.css";

export const ImageConverter = () => {
  // State declarations
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [watermarkText, setWatermarkText] = useState('Your Watermark');
  const [watermarkColor, setWatermarkColor] = useState('#ffffff');
  const [watermarkSize, setWatermarkSize] = useState(48);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [watermarkType, setWatermarkType] = useState('text');
  const [watermarkFontFamily, setWatermarkFontFamily] = useState('Arial, sans-serif');
  const [logoImage, setLogoImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const logoInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Function to update the preview image with watermark
  const updateWatermarkedPreview = async () => {
    if (!selectedImage) return;

    try {
      const canvas = await addWatermarkToImage(selectedImage);
      setPreviewImage(canvas.toDataURL());
    } catch (err) {
      console.error('Error updating preview:', err);
    }
  };

  // Effect to update preview when watermark settings change
  useEffect(() => {
    if (editMode && selectedImage) {
      updateWatermarkedPreview();
    }
  }, [
    watermarkType,
    watermarkText,
    watermarkColor,
    watermarkSize,
    watermarkOpacity,
    watermarkPosition,
    watermarkFontFamily,
    logoImage,
    editMode,
    selectedImage
  ]);

  // onDrop handler
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
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
        setStatus('');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStatus('');
    }
  };

  // handleLogoUpload
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

  // Updated addWatermarkToImage
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

          if (watermarkType === 'text') {
            applyTextWatermark(ctx, canvas.width, canvas.height, {
              text: watermarkText,
              size: watermarkSize,
              color: watermarkColor,
              opacity: watermarkOpacity,
              position: watermarkPosition,
              fontFamily: watermarkFontFamily
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

  // handleApplyWatermark
  const handleApplyWatermark = async () => {
    if (!selectedImage) {
      setError('No image selected');
      return;
    }

    setStatus('Applying watermark...');
    setError(null);

    try {
      const image = await addWatermarkToImage(selectedImage);
      downloadImage(image, selectedImage.name);
      setStatus('Watermarked image downloaded!');
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStatus('');
    }
  };

  // downloadImage
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

  // handleEditImage
  const handleEditImage = () => {
    setEditMode(true);
  };

  // handleCancelEdit
  const handleCancelEdit = () => {
    setEditMode(false);
    // Reset preview to original when canceling
    if (selectedImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  // handleReset
  const handleReset = () => {
    setSelectedImage(null);
    setPreviewImage(null);
    setEditMode(false);
    setStatus('');
    setError(null);
    // Reset all states
    setWatermarkText('Your Watermark');
    setWatermarkColor('#ffffff');
    setWatermarkSize(48);
    setWatermarkOpacity(0.7);
    setWatermarkPosition('center');
    setWatermarkType('text');
    setWatermarkFontFamily('Arial, sans-serif');
    setLogoImage(null);
  };

  return (
    <div className="converter-container">
      {!selectedImage ? (
        <>
          <p>Upload your image to get started</p>
          <ImageDropzone onDrop={onDrop} />
        </>
      ) : !editMode ? (
        <div className="preview-mode">
          <ImagePreviewSection
            previewImage={previewImage}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            setPreviewImage={setPreviewImage}
          />
          <div className="preview-actions">
            <button onClick={handleEditImage} className="action-button edit-button">
              Edit
            </button>
            <button onClick={handleReset} className="action-button reset-button">
              New
            </button>
          </div>
        </div>
      ) : (
        <div className="edit-mode">
          <div className="preview-with-text-editor">
            <ImagePreviewSection
              previewImage={previewImage}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              setPreviewImage={setPreviewImage}
            />
            {watermarkType === 'text' && (
              <TextEditor canvasRef={canvasRef} />
            )} 
          </div>
          
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
            watermarkFontFamily={watermarkFontFamily}
            setWatermarkFontFamily={setWatermarkFontFamily}
            logoImage={logoImage}
            setLogoImage={setLogoImage}
            logoInputRef={logoInputRef}
            handleLogoUpload={handleLogoUpload}
            selectedImage={selectedImage}
            setPreviewImage={setPreviewImage}
            canvasRef={canvasRef}
          />
          
          <div className="edit-actions">
            <button onClick={handleApplyWatermark} className="action-button apply-button">
              Download
            </button>
            <button onClick={handleCancelEdit} className="action-button cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <StatusDisplay status={status} error={error} />
    </div>
  );
};