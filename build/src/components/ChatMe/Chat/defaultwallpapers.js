import { useState, useEffect } from 'react';

import WP0 from "../Assets/Wallpapers/WP0.jpg";
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
import WP21 from "../Assets/Wallpapers/WP21.jpg";
import WP22 from "../Assets/Wallpapers/WP22.jpg";
import WP23 from "../Assets/Wallpapers/WP23.jpg";
import WP24 from "../Assets/Wallpapers/WP24.jpg";
import WP25 from "../Assets/Wallpapers/WP25.jpg";
import WP26 from "../Assets/Wallpapers/WP26.jpg";
import WP27 from "../Assets/Wallpapers/WP27.jpg";
import WP28 from "../Assets/Wallpapers/WP28.jpg";
import WP29 from "../Assets/Wallpapers/WP29.jpg";
import WP30 from "../Assets/Wallpapers/WP30.jpg";
import WP31 from "../Assets/Wallpapers/WP31.jpg";
import WP32 from "../Assets/Wallpapers/WP32.jpg";
import WP33 from "../Assets/Wallpapers/WP33.jpg";
import WP34 from "../Assets/Wallpapers/WP34.jpg";
import WP35 from "../Assets/Wallpapers/WP35.jpg";
import WP36 from "../Assets/Wallpapers/WP36.jpg";
import WP37 from "../Assets/Wallpapers/WP37.jpg";
import WP38 from "../Assets/Wallpapers/WP38.jpg";
import WP39 from "../Assets/Wallpapers/WP39.jpg";
import WP40 from "../Assets/Wallpapers/WP40.jpg";
import WP41 from "../Assets/Wallpapers/WP41.jpg";
import WP42 from "../Assets/Wallpapers/WP42.jpg";
import WP43 from "../Assets/Wallpapers/WP43.jpg";
import WP44 from "../Assets/Wallpapers/WP44.jpg";
import WP45 from "../Assets/Wallpapers/WP45.jpg";
import WP46 from "../Assets/Wallpapers/WP46.jpg";
import WP47 from "../Assets/Wallpapers/WP47.jpg";
import WP48 from "../Assets/Wallpapers/WP48.jpg";
import WP49 from "../Assets/Wallpapers/WP49.jpg";
import WP50 from "../Assets/Wallpapers/WP50.jpg";
import WP51 from "../Assets/Wallpapers/WP51.jpg";
import WP52 from "../Assets/Wallpapers/WP52.jpg";
import WP53 from "../Assets/Wallpapers/WP53.jpg";
import WP54 from "../Assets/Wallpapers/WP54.jpg";
import WP55 from "../Assets/Wallpapers/WP55.jpg";
import WP56 from "../Assets/Wallpapers/WP56.jpg";
import WP57 from "../Assets/Wallpapers/WP57.jpg";
import WP58 from "../Assets/Wallpapers/WP58.jpg";
import WP59 from "../Assets/Wallpapers/WP59.jpg";
import WP60 from "../Assets/Wallpapers/WP60.jpg";
import WP61 from "../Assets/Wallpapers/WP61.jpg";
import WP62 from "../Assets/Wallpapers/WP62.jpg";
import WP63 from "../Assets/Wallpapers/WP63.jpg";
import WP64 from "../Assets/Wallpapers/WP64.jpg";
import WP65 from "../Assets/Wallpapers/WP65.jpg";
import WP66 from "../Assets/Wallpapers/WP66.jpg";
import WP67 from "../Assets/Wallpapers/WP67.jpg";
import WP68 from "../Assets/Wallpapers/WP68.jpg";
import WP69 from "../Assets/Wallpapers/WP69.jpg";
import WP70 from "../Assets/Wallpapers/WP70.jpg";
import WP71 from "../Assets/Wallpapers/WP71.jpg";
import WP72 from "../Assets/Wallpapers/WP72.jpg";
import WP73 from "../Assets/Wallpapers/WP73.jpg";
import WP74 from "../Assets/Wallpapers/WP74.jpg";
import WP75 from "../Assets/Wallpapers/WP75.jpg";
import WP76 from "../Assets/Wallpapers/WP76.jpg";
import WP77 from "../Assets/Wallpapers/WP77.jpg";
import WP78 from "../Assets/Wallpapers/WP78.jpg";
import WP79 from "../Assets/Wallpapers/WP79.jpg";
import WP80 from "../Assets/Wallpapers/WP80.jpg";
import WP81 from "../Assets/Wallpapers/WP81.jpg";
import WP82 from "../Assets/Wallpapers/WP82.jpg";
import WP83 from "../Assets/Wallpapers/WP83.jpg";
import WP84 from "../Assets/Wallpapers/WP84.jpg";
import WP85 from "../Assets/Wallpapers/WP85.jpg";
import WP86 from "../Assets/Wallpapers/WP86.jpg";
import WP87 from "../Assets/Wallpapers/WP87.jpg";
import WP88 from "../Assets/Wallpapers/WP88.jpg";
import WP89 from "../Assets/Wallpapers/WP89.jpg";
import WP90 from "../Assets/Wallpapers/WP90.jpg";
import WP91 from "../Assets/Wallpapers/WP91.jpg";
import WP92 from "../Assets/Wallpapers/WP92.jpg";
import WP93 from "../Assets/Wallpapers/WP93.jpg";
import WP94 from "../Assets/Wallpapers/WP94.jpg";
import WP95 from "../Assets/Wallpapers/WP95.jpg";
import WP96 from "../Assets/Wallpapers/WP96.jpg";
import WP97 from "../Assets/Wallpapers/WP97.jpg";
import WP98 from "../Assets/Wallpapers/WP98.jpg";
import WP99 from "../Assets/Wallpapers/WP99.jpg";
import WP100 from "../Assets/Wallpapers/WP100.jpg";
import WP101 from "../Assets/Wallpapers/WP101.jpg";
import WP102 from "../Assets/Wallpapers/WP102.jpg";
import WP103 from "../Assets/Wallpapers/WP103.jpg";
import WP104 from "../Assets/Wallpapers/WP104.jpg";
import WP105 from "../Assets/Wallpapers/WP105.jpg";
import WP106 from "../Assets/Wallpapers/WP106.jpg";
import WP107 from "../Assets/Wallpapers/WP107.jpg";
import WP108 from "../Assets/Wallpapers/WP108.jpg";
import WP109 from "../Assets/Wallpapers/WP109.jpg";
import WP110 from "../Assets/Wallpapers/WP110.jpg";
import WP111 from "../Assets/Wallpapers/WP111.jpg";
import WP112 from "../Assets/Wallpapers/WP112.jpg";
import WP113 from "../Assets/Wallpapers/WP113.jpg";
import WP114 from "../Assets/Wallpapers/WP114.jpg";
import WP115 from "../Assets/Wallpapers/WP115.jpg";
import WP116 from "../Assets/Wallpapers/WP116.jpg";
import WP117 from "../Assets/Wallpapers/WP117.jpg";
import WP118 from "../Assets/Wallpapers/WP118.jpg";
import WP119 from "../Assets/Wallpapers/WP119.jpg";
import WP120 from "../Assets/Wallpapers/WP120.jpg";
import WP121 from "../Assets/Wallpapers/WP121.jpg";
import WP122 from "../Assets/Wallpapers/WP122.jpg";
import WP123 from "../Assets/Wallpapers/WP123.jpg";
import WP124 from "../Assets/Wallpapers/WP124.jpg";
import WP125 from "../Assets/Wallpapers/WP125.jpg";
import WP126 from "../Assets/Wallpapers/WP126.jpg";
import WP127 from "../Assets/Wallpapers/WP127.jpg";
import WP128 from "../Assets/Wallpapers/WP128.jpg";
import WP129 from "../Assets/Wallpapers/WP129.jpg";
import WP130 from "../Assets/Wallpapers/WP130.jpg";
import WP131 from "../Assets/Wallpapers/WP131.jpg";
import WP132 from "../Assets/Wallpapers/WP132.jpg";
import WP133 from "../Assets/Wallpapers/WP133.jpg";
import WP134 from "../Assets/Wallpapers/WP134.jpg";
import WP135 from "../Assets/Wallpapers/WP135.jpg";
import WP136 from "../Assets/Wallpapers/WP136.jpg";
import WP137 from "../Assets/Wallpapers/WP137.jpg";
import WP138 from "../Assets/Wallpapers/WP138.jpg";
import WP139 from "../Assets/Wallpapers/WP139.jpg";
import WP140 from "../Assets/Wallpapers/WP140.jpg";
import WP141 from "../Assets/Wallpapers/WP141.jpg";
import WP142 from "../Assets/Wallpapers/WP142.jpg";
import WP143 from "../Assets/Wallpapers/WP143.jpg";
import WP144 from "../Assets/Wallpapers/WP144.jpg";
import WP145 from "../Assets/Wallpapers/WP145.jpg";
import WP146 from "../Assets/Wallpapers/WP146.jpg";
import WP147 from "../Assets/Wallpapers/WP147.jpg";
import WP148 from "../Assets/Wallpapers/WP148.jpg";
import WP149 from "../Assets/Wallpapers/WP149.jpg";
import WP150 from "../Assets/Wallpapers/WP150.jpg";
import WP151 from "../Assets/Wallpapers/WP151.jpg";
import WP152 from "../Assets/Wallpapers/WP152.jpg";
import WP153 from "../Assets/Wallpapers/WP153.jpg";
import WP154 from "../Assets/Wallpapers/WP154.jpg";
import WP155 from "../Assets/Wallpapers/WP155.jpg";
import WP156 from "../Assets/Wallpapers/WP156.jpg";
import WP157 from "../Assets/Wallpapers/WP157.jpg";
import WP158 from "../Assets/Wallpapers/WP158.jpg";
import WP159 from "../Assets/Wallpapers/WP159.jpg";
import WP160 from "../Assets/Wallpapers/WP160.jpg";
import WP161 from "../Assets/Wallpapers/WP161.jpg";
import WP162 from "../Assets/Wallpapers/WP162.jpg";
import WP163 from "../Assets/Wallpapers/WP163.jpg";
import WP164 from "../Assets/Wallpapers/WP164.jpg";
import WP165 from "../Assets/Wallpapers/WP165.jpg";
import WP166 from "../Assets/Wallpapers/WP166.jpg";
import WP167 from "../Assets/Wallpapers/WP167.jpg";
import WP168 from "../Assets/Wallpapers/WP168.jpg";
import WP169 from "../Assets/Wallpapers/WP169.jpg";
import WP170 from "../Assets/Wallpapers/WP170.jpg";
import WP171 from "../Assets/Wallpapers/WP171.jpg";
import WP172 from "../Assets/Wallpapers/WP172.jpg";
import WP173 from "../Assets/Wallpapers/WP173.jpg";
import WP174 from "../Assets/Wallpapers/WP174.jpg";
import WP175 from "../Assets/Wallpapers/WP175.jpg";
import WP176 from "../Assets/Wallpapers/WP176.jpg";
import WP177 from "../Assets/Wallpapers/WP177.jpg";
import WP178 from "../Assets/Wallpapers/WP178.jpg";
import WP179 from "../Assets/Wallpapers/WP179.jpg";
import WP180 from "../Assets/Wallpapers/WP180.jpg";
import WP181 from "../Assets/Wallpapers/WP181.jpg";
import WP182 from "../Assets/Wallpapers/WP182.jpg";
import WP183 from "../Assets/Wallpapers/WP183.jpg";
import WP184 from "../Assets/Wallpapers/WP184.jpg";
import WP185 from "../Assets/Wallpapers/WP185.jpg";
import WP186 from "../Assets/Wallpapers/WP186.jpg";
import WP187 from "../Assets/Wallpapers/WP187.jpg";
import WP188 from "../Assets/Wallpapers/WP188.jpg";
import WP189 from "../Assets/Wallpapers/WP189.jpg";
import WP190 from "../Assets/Wallpapers/WP190.jpg";
import WP191 from "../Assets/Wallpapers/WP191.jpg";
import WP192 from "../Assets/Wallpapers/WP192.jpg";
import WP193 from "../Assets/Wallpapers/WP193.jpg";
import WP194 from "../Assets/Wallpapers/WP194.jpg";
import WP195 from "../Assets/Wallpapers/WP195.jpg";
import WP196 from "../Assets/Wallpapers/WP196.jpg";
import WP197 from "../Assets/Wallpapers/WP197.jpg";
import WP198 from "../Assets/Wallpapers/WP198.jpg";
import WP199 from "../Assets/Wallpapers/WP199.jpg";
import WP200 from "../Assets/Wallpapers/WP200.jpg";
import WP201 from "../Assets/Wallpapers/WP201.jpg";
import WP202 from "../Assets/Wallpapers/WP202.jpg";
import WP203 from "../Assets/Wallpapers/WP203.jpg";
import WP204 from "../Assets/Wallpapers/WP204.jpg";
import WP205 from "../Assets/Wallpapers/WP205.jpg";
import WP206 from "../Assets/Wallpapers/WP206.jpg";
import WP207 from "../Assets/Wallpapers/WP207.jpg";
import WP208 from "../Assets/Wallpapers/WP208.jpg";
import WP209 from "../Assets/Wallpapers/WP209.jpg";
import WP210 from "../Assets/Wallpapers/WP210.jpg";
import WP211 from "../Assets/Wallpapers/WP211.jpg";
import WP212 from "../Assets/Wallpapers/WP212.jpg";
import WP213 from "../Assets/Wallpapers/WP213.jpg";
import WP214 from "../Assets/Wallpapers/WP214.jpg";
import WP215 from "../Assets/Wallpapers/WP215.jpg";
import WP216 from "../Assets/Wallpapers/WP216.jpg";
import WP217 from "../Assets/Wallpapers/WP217.jpg";
import WP218 from "../Assets/Wallpapers/WP218.jpg";
import WP219 from "../Assets/Wallpapers/WP219.jpg";
import WP220 from "../Assets/Wallpapers/WP220.jpg";


// Create arrays of wallpapers
const wallpapers = [
  WP0, WP1, WP2, WP3, WP4, WP5, WP6, WP7, WP8, WP9, WP10, 
  WP11, WP12, WP13, WP14, WP15, WP16, WP17, WP18, WP19, WP20,
  WP21, WP22, WP23, WP24, WP25, WP26, WP27, WP28, WP29, WP30,
  WP31, WP32, WP33, WP34, WP35, WP36, WP37, WP38, WP39, WP40,
  WP41, WP42, WP43, WP44, WP45, WP46, WP47, WP48, WP49, WP50,
  WP51, WP52, WP53, WP54, WP55, WP56, WP57, WP58, WP59, WP60,
  WP61, WP62, WP63, WP64, WP65, WP66, WP67, WP68, WP69, WP70,
  WP71, WP72, WP73, WP74, WP75, WP76, WP77, WP78, WP79, WP80,
  WP81, WP82, WP83, WP84, WP85, WP86, WP87, WP88, WP89, WP90,
  WP91, WP92, WP93, WP94, WP95, WP96, WP97, WP98, WP99, WP100,
  WP101, WP102, WP103, WP104, WP105, WP106, WP107, WP108, WP109, WP110,
  WP111, WP112, WP113, WP114, WP115, WP116, WP117, WP118, WP119, WP120,
  WP121, WP122, WP123, WP124, WP125, WP126, WP127, WP128, WP129, WP130,
  WP131, WP132, WP133,WP134, WP135, WP136, WP137, WP138, WP139, WP140,
  WP141, WP142, WP143, WP144, WP145, WP146, WP147, WP148, WP149, WP150,
  WP151, WP152, WP153, WP154, WP155, WP156, WP157, WP158, WP159, WP160,
  WP161, WP162, WP163, WP164, WP165, WP166, WP167, WP168, WP169, WP170,
  WP171, WP172, WP173, WP174, WP175, WP176, WP177, WP178, WP179, WP180,
  WP181, WP182, WP183, WP184, WP185, WP186,WP187, WP188, WP189, WP190,
WP191, WP192, WP193, WP194, WP195,WP196, WP197, WP198, WP199, WP200,
WP201, WP202, WP203, WP204, WP205,WP206, WP207, WP208, WP209, WP210,
WP211, WP212, WP213, WP214, WP215,WP216, WP217, WP218, WP219, WP220,
];

export const defaultWallpapers = [
  
  ...wallpapers.map((wp, index) => ({
    id: `local_wp${index + 1}`,
    value: `url(${wp})`,
    name: `Wallpaper ${index + 1}`,
    isDefault: true
  }))
];

export const wallpaperLibrary = [
  ...defaultWallpapers,
  // Add any additional wallpaper categories here
];

export const useWallpaper = (initialWallpaper) => {
  const [customImages, setCustomImages] = useState([]);
  const [currentWallpaper, setCurrentWallpaper] = useState(() => {
    // 1. Check localStorage first
    const savedWallpaper = localStorage.getItem('chat_wallpaper');
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
        const found = [...defaultWallpapers, ...JSON.parse(localStorage.getItem('custom_wallpapers') || '[]')]
          .find(w => w.id === initialWallpaper);
        if (found) return found;
      }
    }

    // 3. Fallback to default (first wallpaper)
    return defaultWallpapers[0];
  });

  // Save to localStorage when wallpaper changes
  useEffect(() => {
    if (currentWallpaper) {
      localStorage.setItem('chat_wallpaper', JSON.stringify(currentWallpaper));
    }
  }, [currentWallpaper]);

  // Load custom wallpapers
  useEffect(() => {
    const savedImages = localStorage.getItem('custom_wallpapers');
    if (savedImages) {
      try {
        setCustomImages(JSON.parse(savedImages));
      } catch (e) {
        console.error('Failed to parse saved wallpapers', e);
      }
    }
  }, []);

  // Save custom wallpapers
  useEffect(() => {
    localStorage.setItem('custom_wallpapers', JSON.stringify(customImages));
  }, [customImages]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newWallpaper = {
          id: `custom_${Date.now()}`,
          value: event.target.result,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          isCustom: true,
          lastModified: Date.now()
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
    
    if (typeof wallpaper.value === 'string') {
      if (wallpaper.value.startsWith('url(') || wallpaper.value.startsWith('data:image')) {
        return { 
          backgroundImage: wallpaper.value.startsWith('url(') ? 
            wallpaper.value : 
            `url(${wallpaper.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      } else if (wallpaper.value.startsWith('linear-gradient')) {
        return { background: wallpaper.value };
      } else if (wallpaper.value.startsWith('#')) {
        return { backgroundColor: wallpaper.value };
      }
    }
    return { backgroundColor: '#ffffff' };
  };

  const resetToDefault = () => {
    setCurrentWallpaper(defaultWallpapers[0]);
  };

  const allWallpapers = [
    ...defaultWallpapers,
    ...customImages.sort((a, b) => b.lastModified - a.lastModified) // Newest first
  ];

  return {
    currentWallpaper,
    setCurrentWallpaper,
    customImages,
    defaultWallpapers,
    handleImageUpload,
    removeCustomImage,
    getPreviewStyle,
    resetToDefault,
    allWallpapers
  };
};