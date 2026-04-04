import { useState, useEffect } from 'react';

// Wallpaper images not present in repository
// To enable wallpapers:
// 1. Add wallpaper image files to src/Assets/Wallpapers/ directory
// 2. Import them here: import WP0 from "../../../Assets/Wallpapers/WP0.jpg"; etc
// 3. Add them to the wallpapers array below

/**
 * Default wallpapers for chat backgrounds
 * Currently empty as wallpaper images are not included in the repository
 */
const wallpapers = [];

export const defaultWallpapers = wallpapers || [];

/**
 * Library of available wallpapers
 * Can be populated with actual wallpaper objects when images are added
 */
export const wallpaperLibrary = [
  // Structure: { id: 'unique-id', name: 'Display Name', src: 'path/to/image' }
  // Add wallpaper entries here when images are available
];

/**
 * Hook for managing wallpaper state and operations
 * @param {string} initialWallpaper - Initial wallpaper selection
 * @returns {object} Wallpaper state and functions
 */
export const useWallpaper = (initialWallpaper = null) => {
  const [currentWallpaper, setCurrentWallpaper] = useState(initialWallpaper);
  const [customImages, setCustomImages] = useState([]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = {
          id: `custom-${Date.now()}`,
          name: file.name,
          src: e.target.result,
          isCustom: true
        };
        setCustomImages(prev => [...prev, imageData]);
        setCurrentWallpaper(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomImage = (imageId) => {
    setCustomImages(prev => prev.filter(img => img.id !== imageId));
    if (currentWallpaper?.id === imageId) {
      setCurrentWallpaper(null);
    }
  };

  const getPreviewStyle = (wallpaper) => {
    if (!wallpaper) return {};
    return {
      backgroundImage: `url(${wallpaper.src || wallpaper})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  };

  const allWallpapers = [
    ...wallpaperLibrary,
    ...customImages
  ];

  return {
    currentWallpaper,
    setCurrentWallpaper,
    customImages,
    handleImageUpload,
    removeCustomImage,
    getPreviewStyle,
    allWallpapers
  };
};
