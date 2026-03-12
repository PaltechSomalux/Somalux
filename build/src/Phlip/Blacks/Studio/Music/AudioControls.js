import React from 'react';
import "./AudioControls.css";

export const AudioControls = ({
  showControls,
  isPlaying,
  currentTime,
  duration,
  buffered, 
  formatTime,
  togglePlayPause,
  playPrevious,
  playNext,
  onTimeChange,
  repeatMode, // 'none', 'all', 'one'
  toggleRepeatMode, // function to cycle through repeat modes
  onMouseMove,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}) => {

  const handleControlClick = (e, callback) => {
    e.stopPropagation();
    if (callback) callback();
  };

  return (
    <div 
      className={`audio-controls-audio ${showControls ? 'audio-controls--visible-audio' : 'audio-controls--hidden-audio'}`}
      onClick={(e) => e.stopPropagation()}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >

      <div className="audio-controls__progress-container-audio">
        <div className="audio-controls__time-audio audio-controls__time--start-audio">
          {formatTime(currentTime)}
        </div>
        <div className="audio-controls__progress-background-audio">
          <div 
            className="audio-controls__buffer-bar-audio" 
            style={{ width: `${(buffered / duration) * 100 || 0}%` }}
          ></div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              onTimeChange(parseFloat(e.target.value));
            }}
            className="audio-controls__progress-bar-audio"
          />
          <div 
            className="audio-controls__progress-fill-audio" 
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          ></div>
        </div>
        <div className="audio-controls__time-audio audio-controls__time--end-audio">
          {formatTime(duration)}
        </div>
      </div>
      
      <div className="audio-controls__bar-audio">
        <div className="audio-controls__center-group-audio">
          <button 
            className="audio-controls__button-audio" 
            onClick={(e) => handleControlClick(e, playPrevious)}
            aria-label="Play previous track"
          >
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <path 
                d="M18 6L12 12L18 18V6ZM12 6L6 12L12 18V6Z" 
                fill="#e9edef" 
                stroke="#e9edef" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          
          <button 
            className="audio-controls__button-audio" 
            onClick={(e) => handleControlClick(e, togglePlayPause)}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <svg width="48" height="48" viewBox="0 0 40 40">
              {isPlaying ? (
                <>
                  <rect x="7.5" y="5" width="4" height="14" rx="1" ry="1" fill="#e9edef"/>
                  <rect x="12.5" y="5" width="4" height="14" rx="1" ry="1" fill="#e9edef"/>
                </>
              ) : (
                <path 
                  d="M8 5L18 12L8 19V5Z" 
                  fill="#e9edef" 
                  stroke="#e9edef" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </button>
          
          <button 
            className="audio-controls__button-audio" 
            onClick={(e) => handleControlClick(e, playNext)}
            aria-label="Play next track"
          >
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <path 
                d="M12 6L18 12L12 18V6ZM18 6L24 12L18 18V6Z" 
                fill="#e9edef" 
                stroke="#e9edef" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="audio-controls__repeat-button-container">
          <button 
            className={`audio-controls__button-audio audio-controls__repeat-button ${repeatMode !== 'none' ? 'audio-controls__repeat-button--active' : ''}`}
            onClick={(e) => handleControlClick(e, toggleRepeatMode)}
            aria-label={`Repeat ${repeatMode === 'one' ? 'current track' : repeatMode === 'all' ? 'all' : 'off'}`}
          >
            <svg width="48" height="48" viewBox="0 0 70 70" fill="none">
              <path  
                d="M28 28H12V24L6 30L12 36V32H32V22H28V28ZM12 12H28V16L34 10L28 4V8H8V18H12V12Z" 
                fill={repeatMode !== 'none' ? "lightgrey" : "lightgrey"}
                stroke={repeatMode !== 'none' ? "lightgrey" : "#e9edef"}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {repeatMode === 'one' && (
                <text 
                  x="20" 
                  y="26" 
                  textAnchor="middle" 
                  fill="#00a884" 
                  fontSize="14" 
                  fontWeight="bold"
                >
                  1
                </text>
              )}
            </svg>
          </button>
        </div>
      </div>
    </div>
  ); 
}; 