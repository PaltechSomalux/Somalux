// StoryContent.js
import React, { useEffect } from 'react';
import "./StoryContent.css";

export const StoryContent = ({
  storyViewer,
  isPlaying,
  videoRef,
  handleVideoLoaded,
  formatTime,
  togglePlayPause,
  goToNextStory,
  goToPreviousStory
}) => {
  // Handle touch events for swipe navigation
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;
    
    const handleTouchStart = (e) => {
      touchStartY = e.changedTouches[0].screenY;
    };
    
    const handleTouchEnd = (e) => {
      touchEndY = e.changedTouches[0].screenY;
      const deltaY = touchEndY - touchStartY;
      
      // Swipe down threshold
      if (deltaY > 50) {
        // Close fullscreen or go back (you might want to add a callback prop for this)
      } 
      // Swipe up for next story
      else if (deltaY < -50) {
        goToNextStory();
      }
    };

    const container = document.querySelector('.imo-story-content');
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, false);
      container.addEventListener('touchend', handleTouchEnd, false);
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [goToNextStory]);

  return (
    <div 
      className="imo-story-content"
      onClick={togglePlayPause}
    >
      {storyViewer.content.type === 'video' ? (
        <div className="imo-video-container">
          <video 
            ref={videoRef}
            controls={false}
            autoPlay={isPlaying}
            onEnded={goToNextStory}
            onLoadedMetadata={handleVideoLoaded}
            onClick={(e) => e.stopPropagation()}
          >
            <source src={storyViewer.content.url} type="video/mp4" />
          </video>
          <div className="imo-video-controls">
            <span>{formatTime(videoRef.current?.currentTime || 0)}</span>
            <button 
              className="imo-play-pause-btn"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <span>{formatTime(videoRef.current?.duration || 0)}</span>
          </div>
        </div>
      ) : storyViewer.content.type === 'text' ? (
        <div className="imo-text-story">
          <p>{storyViewer.content.text}</p>
        </div>
      ) : (
        <img 
          src={storyViewer.content.url} 
          alt="Story" 
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        />
      )}
      
      {/* Navigation areas (invisible but clickable) */}
      <div 
        className="imo-story-nav imo-story-nav-top"
        onClick={(e) => {
          e.stopPropagation();
          goToPreviousStory();
        }}
      />
      <div 
        className="imo-story-nav imo-story-nav-bottom"
        onClick={(e) => {
          e.stopPropagation();
          goToNextStory();
        }}
      />
    </div>
  );
};