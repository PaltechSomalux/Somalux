import { useState, useEffect } from 'react';

// Dynamically import all wallpaper images (WP1-WP100)
const wallpapers = {};
for (let i = 1; i <= 100; i++) {
  try {
    wallpapers[`WP${i}`] = require(`../Assets/Wallpapers/${i < 10 ? 'wp' : 'WP'}${i}.jpg`).default;
  } catch (e) {
    console.warn(`Could not load wallpaper WP${i}:`, e.message);
  }
}

// Default wallpaper names (you can customize these)
const wallpaperNames = [
  'Mountain View', 'Ocean Sunset', 'Forest Trail', 'Desert Dunes', 'City Skyline',
  'Northern Lights', 'Tropical Beach', 'Autumn Forest', 'Winter Wonderland', 'Spring Meadow',
  // Add more names as needed...
];

// Generate default wallpapers array
const generateDefaultWallpapers = () => {
  const localWallpapers = [];
  for (let i = 1; i <= 100; i++) {
    if (wallpapers[`WP${i}`]) {
      localWallpapers.push({
        id: `local_wp${i}`,
        name: wallpaperNames[i % wallpaperNames.length] || `Wallpaper ${i}`,
        value: `url(${wallpapers[`WP${i}`]})`
      });
    }
  }
  return [
    // Solid colors
    { id: 'solid_black', name: 'Deep Black', value: '#000000' },
    { id: 'solid_white', name: 'Pure White', value: '#ffffff' },
    { id: 'solid_gray', name: 'Cool Gray', value: '#808080' },
    { id: 'solid_blue', name: 'Sky Blue', value: '#87CEEB' },
    
    // Local wallpapers
    ...localWallpapers,
    
    // Gradients
    { id: 'gradient_rainbow', name: 'Rainbow', value: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff)' },
    { id: 'gradient_sunset', name: 'Sunset', value: 'linear-gradient(to right, #ff7e5f, #feb47b)' },
    { id: 'gradient_ocean', name: 'Ocean', value: 'linear-gradient(to right, #00b4db, #0083b0)' },
  ];
};

export const defaultWallpapers = generateDefaultWallpapers();

// You can customize which wallpapers appear in the library
export const wallpaperLibrary = [
  { id: 'solid_black', name: 'Deep Black', value: '#000000' },
  { id: 'solid_white', name: 'Pure White', value: '#ffffff' },
  { id: 'gradient_rainbow', name: 'Rainbow', value: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff)' },
  // Include some of the local wallpapers (every 5th one for example)
  ...defaultWallpapers.filter((_, index) => index > 3 && index % 5 === 0)
];

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
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.[^/.]+$/, "") || 'My Photo',
          value: `url(${event.target.result})`,
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

export default useWallpaper;