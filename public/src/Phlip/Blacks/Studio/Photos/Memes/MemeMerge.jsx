// MemeMerge.jsx
import React, { useRef } from 'react';
import { restrictToBounds } from './MemeUtils';

export const MemeMerge = ({
  canvasRefs,
  setPhotos,
  setActiveElement,
  setSelectedFeature,
  photoOpacity,
  photoBrightness,
  shapes,
  mergeInputRef, // Receive the ref from Memes
}) => {
  const localMergeInputRef = useRef(null); // Local ref for fallback
  const inputRef = mergeInputRef || localMergeInputRef; // Use passed ref if available

  const handleMergeImages = (e) => {
    console.log('handleMergeImages called with files:', e.target.files.length);
    const files = Array.from(e.target.files);
    if (!files.length) {
      console.warn('No files selected for merging');
      return;
    }
    if (!canvasRefs.canvasRef?.current) {
      console.error('Canvas reference is not available');
      return;
    }

    const canvas = canvasRefs.canvasRef.current;
    const canvasWidth = canvas.width || 500; // Fallback width
    const canvasHeight = canvas.height || 500 * (9 / 16); // Fallback height
    const totalImages = files.length;

    // Determine grid layout
    let cols, rows;
    if (totalImages === 1) {
      cols = 1;
      rows = 1;
    } else if (totalImages === 2) {
      cols = 2;
      rows = 1;
    } else if (totalImages <= 4) {
      cols = 2;
      rows = 2;
    } else {
      cols = Math.ceil(Math.sqrt(totalImages));
      rows = Math.ceil(totalImages / cols);
    }

    const imageWidth = canvasWidth / cols;
    const imageHeight = canvasHeight / rows;

    const newPhotos = files.map((file, index) => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const id = `photo-${Date.now()}-${Math.random()}`;
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = col * imageWidth;
            const y = row * imageHeight;

            // Maintain aspect ratio while filling the grid cell
            let width = imageWidth;
            let height = imageHeight;
            const aspectRatio = img.width / img.height;
            if (width / height > aspectRatio) {
              width = height * aspectRatio; // Fit to height
            } else {
              height = width / aspectRatio; // Fit to width
            }

            // Center the image in the grid cell
            const offsetX = (imageWidth - width) / 2;
            const offsetY = (imageHeight - height) / 2;

            const { x: boundedX, y: boundedY } = restrictToBounds(
              'photo',
              id,
              x + offsetX,
              y + offsetY,
              width,
              height,
              0,
              canvasRefs.canvasRef,
              shapes
            );

            resolve({
              id,
              type: 'photo',
              src: event.target.result,
              x: boundedX,
              y: boundedY,
              width,
              height,
              opacity: photoOpacity / 100,
              brightness: photoBrightness / 100,
              rotation: 0,
            });
          };
          img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
        };
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPhotos)
      .then((newPhotosArray) => {
        console.log('Merged photos processed:', newPhotosArray);
        setPhotos(newPhotosArray);
        setActiveElement({ type: 'photo', id: newPhotosArray[0]?.id || null });
        setSelectedFeature('photo');
      })
      .catch((error) => {
        console.error('Error processing merged images:', error);
      });

    // Reset the input value to allow re-uploading the same files
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <input
      type="file"
      accept="image/*"
      multiple
      ref={inputRef}
      style={{ display: 'none' }}
      onChange={handleMergeImages}
      aria-label="Upload multiple photos to merge"
    />
  );
};