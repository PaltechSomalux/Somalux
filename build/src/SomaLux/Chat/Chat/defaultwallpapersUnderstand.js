import { useState, useEffect } from 'react';
// Import all local wallpaper images
import WP1 from "../Assets/Wallpapers/WP1.jpg";
import WP2 from "../Assets/Wallpapers/WP2.jpg";
import WP3 from "../Assets/Wallpapers/WP3.jpg";
import WP4 from "../Assets/Wallpapers/WP4.jpg";
import WP5 from "../Assets/Wallpapers/WP5.jpg";
import WP6 from "../Assets/Wallpapers/WP6.jpg";
import WP7 from "../Assets/Wallpapers/WP7.jpg";
import WP8 from "../Assets/Wallpapers/WP8.jpg";
import WP9 from "../Assets/Wallpapers/WP9.jpg";
import WP10 from "../Assets/Wallpapers/WP10.jpg";
import WP11 from "../Assets/Wallpapers/WP11.jpg";
import WP12 from "../Assets/Wallpapers/WP12.jpg";
import WP13 from "../Assets/Wallpapers/WP13.jpg";
import WP14 from "../Assets/Wallpapers/WP14.jpg";
import WP15 from "../Assets/Wallpapers/WP15.jpg";
import WP16 from "../Assets/Wallpapers/WP16.jpg";
import WP17 from "../Assets/Wallpapers/WP17.jpg";
import WP18 from "../Assets/Wallpapers/WP18.jpg";
import WP19 from "../Assets/Wallpapers/WP19.jpg";
import WP20 from "../Assets/Wallpapers/WP20.jpg";

// Export the wallpapers as named exports
export const defaultWallpapers = [
  // Solid colors
  { id: 'solid_black', name: 'Deep Black', value: '#000000' },
  
  // Local wallpapers
  { id: 'local_wp1', name: 'Mountain View', value: `url(${WP1})` },
{ id: 'local_wp2', name: 'Ocean Sunset', value: `url(${WP2})` },
{ id: 'local_wp3', name: 'Forest Trail', value: `url(${WP3})` },
{ id: 'local_wp4', name: 'Desert Dunes', value: `url(${WP4})` },
{ id: 'local_wp5', name: 'City Lights', value: `url(${WP5})` },
{ id: 'local_wp6', name: 'Winter Peaks', value: `url(${WP6})` },
{ id: 'local_wp7', name: 'Autumn Valley', value: `url(${WP7})` },
{ id: 'local_wp8', name: 'Tropical Beach', value: `url(${WP8})` },
{ id: 'local_wp9', name: 'Northern Lights', value: `url(${WP9})` },
{ id: 'local_wp10', name: 'Misty Lake', value: `url(${WP10})` },
{ id: 'local_wp11', name: 'Canyon Cliffs', value: `url(${WP11})` },
{ id: 'local_wp12', name: 'Starry Night', value: `url(${WP12})` },
{ id: 'local_wp13', name: 'Sunflower Field', value: `url(${WP13})` },
{ id: 'local_wp14', name: 'Foggy Bridge', value: `url(${WP14})` },
{ id: 'local_wp15', name: 'Lavender Hills', value: `url(${WP15})` },
{ id: 'local_wp16', name: 'Waterfall Mist', value: `url(${WP16})` },
{ id: 'local_wp17', name: 'Moonlit Ocean', value: `url(${WP17})` },
{ id: 'local_wp18', name: 'Cherry Blossoms', value: `url(${WP18})` },
{ id: 'local_wp19', name: 'Volcano Glow', value: `url(${WP19})` },
{ id: 'local_wp20', name: 'Cloudy Summit', value: `url(${WP20})` }
  
  // Gradients
  //{ id: 'gradient_rainbow', name: 'Rainbow', value: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff)' },
];

export const wallpaperLibrary = [
  // Local images in library
 { id: 'local_wp1', value: `url(${WP1})` },
{ id: 'local_wp2', value: `url(${WP2})` },
{ id: 'local_wp3', value: `url(${WP3})` },
{ id: 'local_wp4', value: `url(${WP4})` },
{ id: 'local_wp5', value: `url(${WP5})` },
{ id: 'local_wp6', value: `url(${WP6})` },
{ id: 'local_wp7', value: `url(${WP7})` },
{ id: 'local_wp8', value: `url(${WP8})` },
{ id: 'local_wp9', value: `url(${WP9})` },
{ id: 'local_wp10', value: `url(${WP10})` },
{ id: 'local_wp11', value: `url(${WP11})` },
{ id: 'local_wp12', value: `url(${WP12})` },
{ id: 'local_wp13', value: `url(${WP13})` },
{ id: 'local_wp14', value: `url(${WP14})` },
{ id: 'local_wp15', value: `url(${WP15})` },
{ id: 'local_wp16', value: `url(${WP16})` },
{ id: 'local_wp17', value: `url(${WP17})` },
{ id: 'local_wp18', value: `url(${WP18})` },
{ id: 'local_wp19', value: `url(${WP19})` },
{ id: 'local_wp20', value: `url(${WP20})` }

];

// Make sure to export the hook as default
export const useWallpaper = (initialWallpaper) => {
  const [customImages, setCustomImages] = useState([]);
  const [currentWallpaper, setCurrentWallpaper] = useState(() => {
    // 1. Check localStorage for saved wallpaper
    const savedWallpaper = localStorage.getItem('imo_current_wallpaper');
    if (savedWallpaper) {
      try {
        const parsed = JSON.parse(savedWallpaper);
        if (parsed?.id && parsed?.value) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved wallpaper', e);
      }
    }

    // 2. Use initialWallpaper prop if provided
    if (initialWallpaper) {
      if (typeof initialWallpaper === 'object') {
        return initialWallpaper;
      } else {
        const found = [...defaultWallpapers, ...JSON.parse(localStorage.getItem('imo_custom_wallpapers') || '[]')]
          .find(w => w.id === initialWallpaper);
        if (found) return found;
      }
    }

    // 3. Fallback to default
    return defaultWallpapers[0];
  });

  // Save current wallpaper to localStorage whenever it changes
  useEffect(() => {
    if (currentWallpaper) {
      localStorage.setItem('imo_current_wallpaper', JSON.stringify(currentWallpaper));
    }
  }, [currentWallpaper]);

  // Load custom wallpapers from localStorage
  useEffect(() => {
    const savedImages = localStorage.getItem('imo_custom_wallpapers');
    if (savedImages) {
      try {
        setCustomImages(JSON.parse(savedImages));
      } catch (e) {
        console.error('Failed to parse saved wallpapers', e);
      }
    }
  }, []);

  // Save custom wallpapers to localStorage when they change
  useEffect(() => {
    localStorage.setItem('imo_custom_wallpapers', JSON.stringify(customImages));
  }, [customImages]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newWallpaper = {
          id: `custom_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, "") || 'My Photo',
          value: event.target.result,
          isCustom: true
        };
        
        setCustomImages(prev => [...prev, newWallpaper]);
        setCurrentWallpaper(newWallpaper);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCustomImage = (id) => {
    setCustomImages(prev => prev.filter(img => img.id !== id));
    if (currentWallpaper?.id === id) {
      setCurrentWallpaper(defaultWallpapers[0]);
    }
  };

  const getPreviewStyle = (wallpaper) => {
    if (!wallpaper?.value) return { backgroundColor: '#ffffff' };
    
    if (typeof wallpaper.value === 'string' && 
        (wallpaper.value.startsWith('url(') || wallpaper.value.includes('data:image'))) {
      return { 
        backgroundImage: wallpaper.value,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    } else if (typeof wallpaper.value === 'string' && wallpaper.value.startsWith('linear-gradient')) {
      return { background: wallpaper.value };
    } else {
      return { backgroundColor: wallpaper.value };
    }
  };

  const allWallpapers = [...defaultWallpapers, ...customImages];

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

