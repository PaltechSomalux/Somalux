import React, { useState } from 'react';
import './PhotoEditor.css';
import { BackgroundRemover } from './Bg/BackgroundRemover';
import { Memes } from './Memes/Memes';
import { Sports } from './Sports/Sports';
import { WallpaperUI } from './WallpaperUI';

// Placeholder component for News tab
const News = () => {
  return <div>News Content</div>;
};

export const PhotoEditor = () => {
  const [activeTab, setActiveTab] = useState('memes'); // Default to Memes
  const [currentWallpaper, setCurrentWallpaper] = useState(null); // State for wallpaper

  const handleWallpaperSelect = (wallpaper) => {
    setCurrentWallpaper(wallpaper);
  };

  const openMoviesLink = () => {
    window.open('https://ww1.goojara.to/watch-movies', '_blank');
  };

  const openSeriesLink = () => {
    window.open('https://ww1.goojara.to/watch-series', '_blank');
  };

  return (
    <div className="photo-editor-container">
      <div className="photo-editor-tabs">
        <button 
          className={activeTab === 'memes' ? 'active' : ''}
          onClick={() => setActiveTab('memes')}
        >
          Photos
        </button>
        <button 
          className={activeTab === 'sports' ? 'active' : ''}
          onClick={() => setActiveTab('sports')}
        >
          Sports
        </button>
        <button 
          className="movies-link-button"
          onClick={openMoviesLink}
        >
          Movies
        </button>
        <button 
          className="series-link-button"
          onClick={openSeriesLink}
        >
          Series
        </button>
        <button 
          className={activeTab === 'wallpapers' ? 'active' : ''}
          onClick={() => setActiveTab('wallpapers')}
        >
          Wallpapers
        </button>
        <button 
          className={activeTab === 'background' ? 'active' : ''}
          onClick={() => setActiveTab('background')}
        >
          Background
        </button>
        <button 
          className={activeTab === 'news' ? 'active' : ''}
          onClick={() => setActiveTab('news')}
        >
          News
        </button>
      </div>
      
      <div className="photo-editor-content">
        {activeTab === 'memes' && <Memes />}
        {activeTab === 'sports' && <Sports />}
        {activeTab === 'wallpapers' && (
          <WallpaperUI 
            currentWallpaper={currentWallpaper}
            onSelect={handleWallpaperSelect}
            onClose={() => setActiveTab('memes')} // Default to Memes tab
          />
        )}
        {activeTab === 'background' && <BackgroundRemover />}
        {activeTab === 'news' && <News />}
      </div>
    </div>
  );
};