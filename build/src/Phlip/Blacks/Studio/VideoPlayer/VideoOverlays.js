import React from 'react';
import "./VideoOverlay.css";

export const VideoOverlays = ({
  isMobile,
  lastTouchPosition,
  brightness,
  showVolumeChange,
  isMuted,
  volume,
  isLoading,
  error,
  showSkipBack,
  showSkipForward,
  onRetry,
  onCloseError
}) => {
  return (
    <>
      {showVolumeChange && (
        <div className="volume-animation">
          <div className="volume-icon-container">
            <div className="volume-icon">
              {isMuted || volume === 0 ? (
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path d="M16.5,12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45,2.45c0.03-0.2,0.05-0.41,0.05-0.63z M19.93,11c0.17,0.66,0.27,1.35,0.27,2.07 s-0.1,1.41-0.27,2.07l1.93,1.93c0.5-1.11,0.8-2.32,0.8-3.6s-0.3-2.49-0.8-3.6L19.93,11z M4.27,4L2.86,5.41L7,9.56v6.09 c0,1.1,0.9,2,2,2h4l4.44,4.44l1.41-1.41L4.27,4z M12,4L9.91,6.09L12,8.18V4z" fill="white"/>
                </svg>
              ) : volume > 0.5 ? (
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="white"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path d="M7 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="white"/>
                </svg>
              )}
            </div>
            <div className="volume-level-container">
              <div
                className="volume-level-bar"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              ></div>
            </div>
            <div className="volume-percent">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </div>
          </div>
        </div>
      )}

      {isMobile && lastTouchPosition && lastTouchPosition.x < window.innerWidth / 2 && (
        <div className="brightness-indicator">
          <div className="brightness-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M20 15.31L23.31 12 20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            </svg>
          </div>
          <div className="brightness-level">
            {Math.round(brightness)}%
          </div>
        </div>
      )}

      {showSkipBack && (
        <div className="skip-animation skip-back">
          <span className="skip-text">&lt;&lt;10s</span>
        </div>
      )}

      {showSkipForward && (
        <div className="skip-animation skip-forward">
          <span className="skip-text">&gt;&gt;10s</span>
        </div>
      )}

      {isLoading && (
        <div className="vlc-loading-overlay">
          <div className="vlc-spinner"></div>
        </div>
      )}

      {error && (
        <div className="vlc-error-overlay">
          <div className="vlc-error-box">
            <p>{error}</p>
            <button
              onClick={onRetry}
              aria-label="Retry video playback"
            >
              Retry
            </button>
            <button onClick={onCloseError} aria-label="Close error message">
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};