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
  repeatMode,
  formatTime,
  togglePlayPause,
  skipBackward,
  skipForward,
  togglePiP,
  toggleFullscreen,
  toggleRepeatMode,
  onTimeChange
}) => {
  const handleControlClick = (e, callback) => {
    e.stopPropagation();
    callback?.();
  };

  return (
    <div 
      className={`video-controls ${showControls ? 'video-controls--visible' : 'video-controls--hidden'}`}
      onClick={(e) => e.stopPropagation()}
      role="region"
      aria-label="Video controls"
    >
      <div className="video-controls__progress-container">
        <div className="video-controls__time video-controls__time--start">{formatTime(currentTime)}</div>
        <div className="video-controls__progress-background">
          <div 
            className="video-controls__buffer-bar" 
            style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
          ></div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onTimeChange(parseFloat(e.target.value))}
            className="video-controls__progress-bar"
            aria-label="Seek video"
          />
          <div 
            className="video-controls__progress-fill" 
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="video-controls__time video-controls__time--end">{formatTime(duration)}</div>
      </div>
      
      <div className="video-controls__bar">
        {/* Left group - PiP button */}
        <div className="video-controls__left-group">
          {document.pictureInPictureEnabled && (
            <button 
              className="video-controls__button" 
              onClick={(e) => handleControlClick(e, togglePiP)}
              aria-label={isPiP ? "Exit picture-in-picture" : "Enter picture-in-picture"}
            >
              <svg width="32" height="32" viewBox="0 0 35 35">
                <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z" fill="white"/>
              </svg>
            </button>
          )}
        </div>
        
        {/* Center group - Play controls */}
        <div className="video-controls__center-group">
          <button 
            className="video-controls__button" 
            onClick={(e) => handleControlClick(e, skipBackward)}
            aria-label="Skip backward 10 seconds"
          >
            <svg width="32" height="32" viewBox="0 0 22 22" fill="none">
              <path 
                d="M18 6L12 12L18 18V6ZM12 6L6 12L12 18V6Z" 
                fill="white" 
                stroke="white" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          
          <button  
            className="video-controls__button video-controls__play-button" 
            onClick={(e) => handleControlClick(e, togglePlayPause)}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="32" height="32" viewBox="0 0 22 22">
                <rect x="7.5" y="5" width="4" height="14" rx="1" ry="1" fill="white"/>
                <rect x="12.5" y="5" width="4" height="14" rx="1" ry="1" fill="white"/>
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 22 22">
                <path 
                  d="M8 5L18 12L8 19V5Z" 
                  fill="white" 
                  stroke="white" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            )} 
          </button>
          
          <button 
            className="video-controls__button" 
            onClick={(e) => handleControlClick(e, skipForward)}
            aria-label="Skip forward 10 seconds"
          >
            <svg width="32" height="32" viewBox="0 0 22 22" fill="none">
              <path 
                d="M4 6L10 12L4 18V6ZM10 6L16 12L10 18V6Z" 
                fill="white" 
                stroke="white" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
         
        {/* Right group - Fullscreen and Repeat buttons */}
        <div className="video-controls__right-group">
          <button 
            className="video-controls__button" 
            onClick={(e) => handleControlClick(e, toggleFullscreen)}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg width="32" height="32" viewBox="0 0 35 35">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/>
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 30 30">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/>
              </svg>
            )}
          </button>
          <button 
            className={`video-controls__button ${repeatMode !== 'none' ? 'video-controls__button--active' : ''}`} 
            onClick={(e) => handleControlClick(e, toggleRepeatMode)}
            aria-label={
              repeatMode === 'one' ? 'Repeat one enabled' : 
              repeatMode === 'all' ? 'Repeat all enabled' : 
              'Repeat disabled'
            }
          >
            {repeatMode === 'one' ? (
              <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
                <path 
                  d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-7v4h-2v-4h2z" 
                  fill="white" 
                  stroke="white" 
                  strokeWidth="1" 
                />
                <text x="12" y="14" fontSize="8" fill="white" textAnchor="middle">1</text>
              </svg>
            ) : repeatMode === 'all' ? (
              <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
                <path 
                  d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" 
                  fill="white" 
                  stroke="white" 
                  strokeWidth="1" 
                />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
                <path 
                  d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" 
                  fill="white" 
                  stroke="white" 
                  strokeWidth="1" 
                  opacity="0.5"
                />
              </svg>
            )}
          </button>
        </div>  
      </div>
    </div>
  );
};