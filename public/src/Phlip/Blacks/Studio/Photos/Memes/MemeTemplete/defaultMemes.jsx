import { useState, useEffect } from 'react';
import MEME0 from "../../../../../../Assets/Meme/MEME0.jpg";
import MEME1 from "../../../../../../Assets/Meme/MEME1.jpg";
import MEME2 from "../../../../../../Assets/Meme/MEME2.jpg";
import MEME3 from "../../../../../../Assets/Meme/MEME3.jpg";
import MEME4 from "../../../../../../Assets/Meme/MEME4.jpg";
import MEME5 from "../../../../../../Assets/Meme/MEME5.jpg";
import MEME6 from "../../../../../../Assets/Meme/MEME6.jpg";
import MEME7 from "../../../../../../Assets/Meme/MEME7.jpg";
import MEME8 from "../../../../../../Assets/Meme/MEME8.jpg";
import MEME9 from "../../../../../../Assets/Meme/MEME9.jpg";
import MEME10 from "../../../../../../Assets/Meme/MEME10.jpg";
import MEME11 from "../../../../../../Assets/Meme/MEME11.jpg";
import MEME12 from "../../../../../../Assets/Meme/MEME12.jpg";
import MEME13 from "../../../../../../Assets/Meme/MEME13.jpg";
import MEME14 from "../../../../../../Assets/Meme/MEME14.jpg";
import MEME15 from "../../../../../../Assets/Meme/MEME15.jpg";
import MEME16 from "../../../../../../Assets/Meme/MEME16.jpg";
import MEME17 from "../../../../../../Assets/Meme/MEME17.jpg";
import MEME18 from "../../../../../../Assets/Meme/MEME18.jpg";
import MEME19 from "../../../../../../Assets/Meme/MEME19.jpg";
import MEME20 from "../../../../../../Assets/Meme/MEME20.jpg";
import MEME21 from "../../../../../../Assets/Meme/MEME21.jpg";
import MEME22 from "../../../../../../Assets/Meme/MEME22.jpg";
import MEME23 from "../../../../../../Assets/Meme/MEME23.jpg";
import MEME24 from "../../../../../../Assets/Meme/MEME24.jpg";
import MEME25 from "../../../../../../Assets/Meme/MEME25.jpg";
import MEME26 from "../../../../../../Assets/Meme/MEME26.jpg";
import MEME27 from "../../../../../../Assets/Meme/MEME27.jpg";
import MEME28 from "../../../../../../Assets/Meme/MEME28.jpg";
import MEME29 from "../../../../../../Assets/Meme/MEME29.jpg";
import MEME30 from "../../../../../../Assets/Meme/MEME30.jpg";
import MEME31 from "../../../../../../Assets/Meme/MEME31.jpg";
import MEME32 from "../../../../../../Assets/Meme/MEME32.jpg";
import MEME33 from "../../../../../../Assets/Meme/MEME33.jpg";
import MEME34 from "../../../../../../Assets/Meme/MEME34.jpg";
import MEME35 from "../../../../../../Assets/Meme/MEME35.jpg";
import MEME36 from "../../../../../../Assets/Meme/MEME36.jpg";
import MEME37 from "../../../../../../Assets/Meme/MEME37.jpg";
import MEME38 from "../../../../../../Assets/Meme/MEME38.jpg";
import MEME39 from "../../../../../../Assets/Meme/MEME39.jpg";
import MEME40 from "../../../../../../Assets/Meme/MEME40.jpg";
import MEME41 from "../../../../../../Assets/Meme/MEME41.jpg";
import MEME42 from "../../../../../../Assets/Meme/MEME42.jpg";
import MEME43 from "../../../../../../Assets/Meme/MEME43.jpg";
import MEME44 from "../../../../../../Assets/Meme/MEME44.jpg";
import MEME45 from "../../../../../../Assets/Meme/MEME45.jpg";
import MEME46 from "../../../../../../Assets/Meme/MEME46.jpg";
import MEME47 from "../../../../../../Assets/Meme/MEME47.jpg";
import MEME48 from "../../../../../../Assets/Meme/MEME48.jpg";
import MEME49 from "../../../../../../Assets/Meme/MEME49.jpg";
import MEME50 from "../../../../../../Assets/Meme/MEME50.jpg";

// Create arrays of meme templates
const memes = [
  MEME0, MEME1, MEME2, MEME3, MEME4, MEME5, MEME6, MEME7, MEME8, MEME9, MEME10,
  MEME11, MEME12, MEME13, MEME14, MEME15, MEME16, MEME17, MEME18, MEME19, MEME20,
  MEME21, MEME22, MEME23, MEME24, MEME25, MEME26, MEME27, MEME28, MEME29, MEME30,
  MEME31, MEME32, MEME33, MEME34, MEME35, MEME36, MEME37, MEME38, MEME39, MEME40,
  MEME41, MEME42, MEME43, MEME44, MEME45, MEME46, MEME47, MEME48, MEME49, MEME50
];
export const defaultMemes = [
  ...memes.map((meme, index) => ({
    id: `local_meme${index + 1}`,
    value: `url(${meme})`,
    name: `Meme Template ${index + 1}`,
    isDefault: true
  }))
];

export const memeLibrary = [
  ...defaultMemes,
  // Add any additional meme categories here
];

export const useMemeTemplates = (initialMeme) => {
  const [customMemes, setCustomMemes] = useState([]);
  const [currentMeme, setCurrentMeme] = useState(() => {
    // 1. Check localStorage first
    const savedMeme = localStorage.getItem('chat_meme_template');
    if (savedMeme) {
      try {
        const parsed = JSON.parse(savedMeme);
        if (parsed?.id && parsed?.value) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved meme template', e);
      }
    }

    // 2. Use initialMeme prop if provided
    if (initialMeme) {
      if (typeof initialMeme === 'object') {
        return initialMeme;
      } else {
        const found = [...defaultMemes, ...JSON.parse(localStorage.getItem('custom_memes') || '[]')]
          .find(m => m.id === initialMeme);
        if (found) return found;
      }
    }

    // 3. Fallback to default (first meme template)
    return defaultMemes[0];
  });

  // Save to localStorage when meme changes
  useEffect(() => {
    if (currentMeme) {
      localStorage.setItem('chat_meme_template', JSON.stringify(currentMeme));
    }
  }, [currentMeme]);

  // Load custom memes
  useEffect(() => {
    const savedMemes = localStorage.getItem('custom_memes');
    if (savedMemes) {
      try {
        setCustomMemes(JSON.parse(savedMemes));
      } catch (e) {
        console.error('Failed to parse saved meme templates', e);
      }
    }
  }, []);

  // Save custom memes
  useEffect(() => {
    localStorage.setItem('custom_memes', JSON.stringify(customMemes));
  }, [customMemes]);

  const handleMemeUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newMeme = {
          id: `custom_${Date.now()}`,
          value: event.target.result,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          isCustom: true,
          lastModified: Date.now()
        };

        setCustomMemes(prev => [...prev, newMeme]);
        setCurrentMeme(newMeme);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCustomMeme = (id) => {
    setCustomMemes(prev => prev.filter(meme => meme.id !== id));
    if (currentMeme?.id === id) {
      setCurrentMeme(defaultMemes[0]);
    }
  };

  const getPreviewStyle = (meme) => {
    if (!meme?.value) return { backgroundColor: '#ffffff' };

    if (typeof meme.value === 'string') {
      if (meme.value.startsWith('url(') || meme.value.startsWith('data:image')) {
        return {
          backgroundImage: meme.value.startsWith('url(') ?
            meme.value :
            `url(${meme.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      } else if (meme.value.startsWith('#')) {
        return { backgroundColor: meme.value };
      }
    }
    return { backgroundColor: '#ffffff' };
  };

  const resetToDefault = () => {
    setCurrentMeme(defaultMemes[0]);
  };

  const allMemes = [
    ...defaultMemes,
    ...customMemes.sort((a, b) => b.lastModified - a.lastModified) // Newest first
  ];

  return {
    currentMeme,
    setCurrentMeme,
    customMemes,
    defaultMemes,
    handleMemeUpload,
    removeCustomMeme,
    getPreviewStyle,
    resetToDefault,
    allMemes
  };
};