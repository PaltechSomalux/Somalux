import React, { useRef } from 'react';
import { restrictToBounds } from './MemeUtils';

export const MemeMerge = ({
  photos,
  setPhotos,
  photoOpacity,
  photoBrightness,
  canvasRefs,
  shapes,
  setActiveElement,
  setSelectedFeature
}) => {
  const mergeInputRef = useRef(null);

  const handleMergeImages = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !canvasRefs.imageRef?.current) return;

    const imgRect = canvasRefs.imageRef.current.getBoundingClientRect();
    const canvasWidth = imgRect.width;
    const canvasHeight = imgRect.height;
    const totalImages = photos.length + files.length;
    const gridSize = Math.ceil(Math.sqrt(totalImages));
    const imageWidth = canvasWidth / gridSize;
    const imageHeight = canvasHeight / gridSize;

    const newPhotos = files.map((file, index) => {
      const reader = new FileReader();
      return new Promise(resolve => {
        reader.onload = (event) => {
          const id = `photo-${Date.now()}-${Math.random()}`;
          const col = (photos.length + index) % gridSize;
          const row = Math.floor((photos.length + index) / gridSize);
          const { x, y, width, height } = restrictToBounds(
            'photo',
            id,
            col * imageWidth + imageWidth / 2,
            row * imageHeight + imageHeight / 2,
            imageWidth,
            imageHeight,
            0,
            canvasRefs.imageRef,
            shapes
          );
          resolve({
            id,
            type: 'photo',
            src: event.target.result,
            x,
            y,
            width,
            height,
            opacity: photoOpacity / 100,
            brightness: photoBrightness / 100,
            rotation: 0,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPhotos).then(newPhotosArray => {
      const allPhotos = [...photos, ...newPhotosArray];
      const updatedPhotos = allPhotos.map((photo, index) => {
        const col = index % gridSize;
        const row = Math.floor(index / gridSize);
        const { x, y, width, height } = restrictToBounds(
          'photo',
          photo.id,
          col * imageWidth + imageWidth / 2,
          row * imageHeight + imageHeight / 2,
          imageWidth,
          imageHeight,
          0,
          canvasRefs.imageRef,
          shapes
        );
        return { ...photo, x, y, width, height };
      });

      setPhotos(updatedPhotos);
      setActiveElement({ type: 'photo', id: newPhotosArray[0]?.id || null });
      setSelectedFeature('photo');
    });
  };

  return (
    <input
      type="file"
      accept="image/*"
      multiple
      ref={mergeInputRef}
      style={{ display: 'none' }}
      onChange={handleMergeImages}
    />
  );
};