import React, { useState, useRef } from 'react';
import './VideosList.css';

export const VideosList = ({ videos = [], setVideos, onVideoSelect, onBack }) => {
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editVideoTitle, setEditVideoTitle] = useState('');
  const [showMenuForVideo, setShowMenuForVideo] = useState(null);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event) => {
    try {
      const files = Array.from(event.target.files || []);
      const videoFiles = files.filter(file => {
        const name = file.name.toLowerCase();
        return file.type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.ogg') || name.endsWith('.mov');
      });
      if (videoFiles.length === 0) {
        alert('Please select valid video files (MP4, WEBM, OGG, MOV)');
        return;
      }

      const newVideos = videoFiles.map(file => ({
        id: `video-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: 'Processing...',
        size: formatFileSize(file.size),
        path: URL.createObjectURL(file),
        thumbnail: null,
        isFavorite: false,
        file
      }));

      setVideos((prev) => ([...(prev || []), ...newVideos]));
      event.target.value = '';

      // Compute durations asynchronously
      newVideos.forEach(v => {
        const vid = document.createElement('video');
        vid.src = v.path;
        vid.preload = 'metadata';
        vid.addEventListener('loadedmetadata', () => {
          const seconds = Math.round(vid.duration || 0);
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          const formatted = `${m}:${s.toString().padStart(2, '0')}`;
          setVideos((prev) => (prev || []).map(item => item.id === v.id ? { ...item, duration: formatted } : item));
        });
        vid.addEventListener('error', () => {
          setVideos((prev) => (prev || []).map(item => item.id === v.id ? { ...item, duration: 'N/A' } : item));
        });
      });
    } catch (e) {
      console.error('Error uploading videos:', e);
      alert('Error uploading videos. Please try again.');
    }
  };

  const handleDeleteVideo = (videoId) => {
    setVideos((prev) => (prev || []).filter(video => video.id !== videoId));
    setShowMenuForVideo(null);
  };

  const handleRenameVideo = (videoId) => {
    const video = videos.find(v => v.id === videoId);
    setEditVideoTitle(video.title);
    setEditingVideoId(videoId);
    setShowMenuForVideo(null);
  };

  const saveVideoTitle = () => {
    setVideos((prev) => (prev || []).map(video => 
      video.id === editingVideoId ? { ...video, title: editVideoTitle } : video
    ));
    setEditingVideoId(null);
  };

  const toggleFavoriteVideo = (videoId) => {
    setVideos((prev) => (prev || []).map(video => 
      video.id === videoId ? { ...video, isFavorite: !video.isFavorite } : video
    ));
    setShowMenuForVideo(null);
  };

  const handleVideoClick = (video) => {
    if (!editingVideoId) {
      onVideoSelect(video, videos);
    }
  };

  return (
    <div className="video-organizer">
      <div className="video-list-header">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
      </div>

      <div className="videos-list">
        {videos.map(video => (
          <div 
            key={video.id} 
            className={`video-item ${video.isFavorite ? 'favorite' : ''}`}
            onClick={() => handleVideoClick(video)}
          >
            <div className="video-thumbnail-container">
              <div 
                className="video-thumbnail" 
                style={{ backgroundImage: `url(${video.thumbnail})` }}
              >
                <div className="play-icon">▶</div>
                <div className="duration">{video.duration}</div>
              </div>
            </div>
            
            <div className="video-info">
              {editingVideoId === video.id ? (
                <input
                  type="text"
                  value={editVideoTitle}
                  onChange={(e) => setEditVideoTitle(e.target.value)}
                  onBlur={saveVideoTitle}
                  onKeyPress={(e) => e.key === 'Enter' && saveVideoTitle()}
                  autoFocus
                  className="video-title-input"
                />
              ) : (
                <h4 className="video-title">{video.title}</h4>
              )}
              <div className="video-details">
                <span className="video-size">{video.size}</span>
              </div>
            </div>
            
            <div 
              className="video-actions"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="video-menu-container">
                <button 
                  className="video-menu-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuForVideo(showMenuForVideo === video.id ? null : video.id);
                  }}
                  aria-label="Video options"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
                
                {showMenuForVideo === video.id && (
                  <div className="video-menu-dropdown">
                    <button 
                      onClick={() => handleRenameVideo(video.id)}
                      aria-label="Rename video"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                      Rename
                    </button>
                    <button 
                      onClick={() => toggleFavoriteVideo(video.id)}
                      aria-label={video.isFavorite ? 'Remove favorite' : 'Add favorite'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d={video.isFavorite ? 
                          "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" : 
                          "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"}/>
                      </svg>
                      {video.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                    </button>
                    <button 
                      className="delete-button" 
                      onClick={() => handleDeleteVideo(video.id)}
                      aria-label="Delete video"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept="video/*"
        multiple
      />

      {/* FAB Button */}
      <button 
        className="floating-add-btn"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        aria-label="Upload videos"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </div>
  );
};