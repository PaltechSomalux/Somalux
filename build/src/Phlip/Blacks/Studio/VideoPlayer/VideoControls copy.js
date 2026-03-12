import React from 'react';
import "./VideoControls.css";

export const VideoControls = ({
  showControls,
  isPlaying,
  currentTime,
  duration,
  buffered,
  isPiP,
  isFullscreen,
  formatTime,
  togglePlayPause,
  skipBackward,
  skipForward,
  togglePiP,
  toggleFullscreen,
  onTimeChange
}) => {
  const handleControlClick = (e, callback) => {
    e.stopPropagation();
    if (callback) callback();
  };

  return (
    <div 
      className={`video-controls ${showControls ? 'video-controls--visible' : 'video-controls--hidden'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="video-controls__progress-container">
        <div className="video-controls__time video-controls__time--start">{formatTime(currentTime)}</div>
        <div className="video-controls__progress-background">
          <div 
            className="video-controls__buffer-bar" 
            style={{ width: `${(buffered / duration) * 100}%` }}
          ></div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              onTimeChange(parseFloat(e.target.value));
            }}
            className="video-controls__progress-bar"
          />
          <div 
            className="video-controls__progress-fill" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>
        </div>
        <div className="video-controls__time video-controls__time--end">{formatTime(duration)}</div>
      </div>
      
      <div className="video-controls__bar">
        <div className="video-controls__center-group">
          <button 
            className="video-controls__button" 
            onClick={(e) => handleControlClick(e, skipBackward)}
            aria-label="Skip backward 10 seconds"
          >
            <svg width="20" height="20" viewBox="0 0 34 34">
              <path d="M15,6v12l-8.5-6L15,6L15,6z M7,6v12H3V6H7z" fill="white"/>
            </svg>
          </button>
          
          <button 
            className="video-controls__button video-controls__play-button" 
            onClick={(e) => handleControlClick(e, togglePlayPause)}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 30 30">
                <rect x="6" y="4" width="4" height="16" fill="white"/>
                <rect x="14" y="4" width="4" height="16" fill="white"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 30 30">
                <polygon points="5,4 19,12 5,20" fill="white"/>
              </svg>
            )}
          </button>
          
          <button 
            className="video-controls__button" 
            onClick={(e) => handleControlClick(e, skipForward)}
            aria-label="Skip forward 10 seconds"
          >
            <svg width="20" height="20" viewBox="0 0 34 34">
              <path d="M9,6v12l8.5-6L9,6L9,6z M17,6v12h4V6H17z" fill="white"/>
            </svg>
          </button>
        </div>
        
        <div className="video-controls__right-group">
          {document.pictureInPictureEnabled && (
          <button 
              className="video-controls__button" 
              onClick={(e) => handleControlClick(e, togglePiP)}
              aria-label={isPiP ? "Exit picture-in-picture" : "Enter picture-in-picture"}
            >
              <svg width="24" height="24" viewBox="0 0 45 45">
                <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z" fill="white"/>
              </svg>
            </button>
          )}
          
          <button 
            className="video-controls__button" 
            onClick={(e) => handleControlClick(e, toggleFullscreen)}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg width="24" height="24" viewBox="0 0 18 18">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 20 20">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};