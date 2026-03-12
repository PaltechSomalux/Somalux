import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Check, Warning } from 'phosphor-react';
import { createClient } from '@supabase/supabase-js';
import './ImageUploader.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export const ImageUploader = ({ onImagesUploaded, maxImages = 10, listingId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 900;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }));
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + uploadedImages.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setError('');
    const uploadedUrls = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`);
        }

        // Compress image
        const compressedFile = await compressImage(file);
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${listingId || 'temp'}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `listings/${fileName}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('rental-images')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('rental-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setUploadedImages([...uploadedImages, ...uploadedUrls]);
      onImagesUploaded([...uploadedImages, ...uploadedUrls]);
      setProgress(0);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    onImagesUploaded(newImages);
  };

  return (
    <div className="image-uploader">
      <div className="upload-header">
        <h4>Property Images</h4>
        <span className="image-count">{uploadedImages.length}/{maxImages}</span>
      </div>

      {/* Image Preview Grid */}
      {uploadedImages.length > 0 && (
        <div className="uploaded-images-grid">
          {uploadedImages.map((url, index) => (
            <div key={index} className="uploaded-image-item">
              <img src={url} alt={`Upload ${index + 1}`} />
              <button
                className="remove-image-btn"
                onClick={() => removeImage(index)}
                type="button"
              >
                <X size={16} weight="bold" />
              </button>
              {index === 0 && <div className="main-badge">Main</div>}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {uploadedImages.length < maxImages && (
        <label className="upload-area">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          
          {uploading ? (
            <div className="upload-progress">
              <div className="spinner-small"></div>
              <span>Uploading... {progress}%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <div className="upload-placeholder">
              <Upload size={32} />
              <h5>Click to upload images</h5>
              <p>PNG, JPG up to 5MB • Max {maxImages} images</p>
              <p className="upload-hint">First image will be the main photo</p>
            </div>
          )}
        </label>
      )}

      {/* Error Message */}
      {error && (
        <div className="upload-error">
          <Warning size={18} weight="fill" />
          <span>{error}</span>
        </div>
      )}

      {/* Tips */}
      <div className="upload-tips">
        <h5>📸 Photo Tips:</h5>
        <ul>
          <li>Take photos during daytime for best lighting</li>
          <li>Show bedroom, bathroom, kitchen if available</li>
          <li>Include exterior view and nearby landmarks</li>
          <li>Make sure rooms are clean and organized</li>
        </ul>
      </div>
    </div>
  );
};
