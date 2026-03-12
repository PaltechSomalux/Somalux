import React, { useState, useRef, useEffect } from 'react';
import { Videos } from './Videos';
import "./VideoPlayer.css";

export const VideoPlayer = () => {
  // Player state
  const [videoSrc, setVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [showVideoBrowser, setShowVideoBrowser] = useState(true);
  const [showSkipBack, setShowSkipBack] = useState(false);
  const [showSkipForward, setShowSkipForward] = useState(false);
  const [showVolumeChange, setShowVolumeChange] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const skipTimeoutRef = useRef(null);
  const volumeTimeoutRef = useRef(null);

  // Check if mobile on mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const date = new Date(0);
    date.setSeconds(seconds);
    return seconds >= 3600 
      ? date.toISOString().substr(11, 8)
      : date.toISOString().substr(14, 5);
  };

  const togglePlayPause = () => {
    if (!videoSrc) return;
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error("Playback failed:", error);
          setError("Playback failed. Please try again.");
        });
      }
      setIsPlaying(!isPlaying);
    }
    resetControlsTimeout();
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      showSkipAnimation('back');
    }
    resetControlsTimeout();
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + 10
      );
      showSkipAnimation('forward');
    }
    resetControlsTimeout();
  };

  const showSkipAnimation = (direction) => {
    if (direction === 'back') {
      setShowSkipBack(true);
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = setTimeout(() => setShowSkipBack(false), 1000);
    } else {
      setShowSkipForward(true);
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = setTimeout(() => setShowSkipForward(false), 1000);
    }
  };

  const handleVolumeChange = (newVolume) => {
    const clampedVolume = Math.min(1, Math.max(0, newVolume));
    setVolume(clampedVolume);
    if (videoRef.current) {
      videoRef.current.volume = clampedVolume;
      if (clampedVolume > 0 && isMuted) {
        setIsMuted(false);
      }
    }
    showVolumeAnimation();
    resetControlsTimeout();
  };

  const adjustVolume = (direction) => {
    const step = 0.05;
    const newVolume = direction === 'up' 
      ? Math.min(1, volume + step) 
      : Math.max(0, volume - step);
    handleVolumeChange(newVolume);
  };

  const showVolumeAnimation = () => {
    setShowVolumeChange(true);
    clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => setShowVolumeChange(false), 1000);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted && volume === 0) {
        const newVolume = 0.5;
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
      }
      showVolumeAnimation();
    }
    resetControlsTimeout();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      if (videoRef.current.buffered.length > 0) {
        setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
      }
    }
  };

  const handleVideoError = () => {
    setError("Failed to load video. Please try another source.");
    setIsLoading(false);
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    resetControlsTimeout();
  };

  const togglePiP = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      setIsPiP(false);
    } else if (document.pictureInPictureEnabled && videoRef.current) {
      await videoRef.current.requestPictureInPicture();
      setIsPiP(true);
    }
    resetControlsTimeout();
  };

  const handleVideoSelect = (video) => {
    setVideoSrc(video.path);
    setShowVideoBrowser(false);
    setIsPlaying(true);
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setControlsTimeout(setTimeout(() => setShowControls(false), 3000));
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || touchStartY === null) return;
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY - touchY;
    
    // Only adjust volume if significant vertical movement
    if (Math.abs(deltaY) > 10) {
      const volumeChange = deltaY / 200; // Adjust sensitivity
      handleVolumeChange(volume + volumeChange);
      setTouchStartY(touchY); // Update start position for continuous adjustment
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
  };

  const handleKeyDown = (e) => {
    if (!videoSrc) return;
    
    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        skipBackward();
        break;
      case 'ArrowRight':
        skipForward();
        break;
      case 'ArrowUp':
        adjustVolume('up');
        break;
      case 'ArrowDown':
        adjustVolume('down');
        break;
      case 'm':
        toggleMute();
        break;
      case 'f':
        toggleFullscreen();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        setBuffered(videoElement.buffered.end(videoElement.buffered.length - 1));
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('error', handleVideoError);
    videoElement.addEventListener('canplay', handleVideoCanPlay);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('progress', handleProgress);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('error', handleVideoError);
      videoElement.removeEventListener('canplay', handleVideoCanPlay);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('progress', handleProgress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeout) clearTimeout(controlsTimeout);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    };
  }, [videoSrc, volume, isMuted]);

  return (
    <div className="vlc-player-container">
      {showVideoBrowser ? (
        <Videos onVideoSelect={handleVideoSelect} />
      ) : (
        <div 
          className={`player-wrapper ${isFullscreen ? 'fullscreen' : ''}`} 
          ref={playerContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
          onMouseEnter={() => resetControlsTimeout()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          tabIndex="0"
        >
          <div className="back-to-library" onClick={() => setShowVideoBrowser(true)}>
           
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          </div> 
           
          <video
            ref={videoRef}
            src={videoSrc}
            onClick={togglePlayPause}
            autoPlay
            className="video-element"
          />
          
          {/* Skip Backward Animation */}
          {showSkipBack && (
            <div className="skip-animation skip-back">
              <div className="skip-icon">-10s</div>
            </div>
          )}
          
          {/* Skip Forward Animation */}
          {showSkipForward && (
            <div className="skip-animation skip-forward">
              <div className="skip-icon">+10s</div>
            </div>
          )}
          
          {/* Volume Change Animation */}
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
                      <path d="M7 9v6h4l5 5V4l-5 5H7z" fill="white"/>
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
          
          <div className={`vlc-controls ${showControls ? 'visible' : 'hidden'}`}>
            <div className="vlc-progress-container">
              <div className="vlc-buffer-bar" style={{ width: `${(buffered / duration) * 100}%` }}></div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setCurrentTime(newTime);
                  if (videoRef.current) {
                    videoRef.current.currentTime = newTime;
                  }
                }}
                className="vlc-progress-bar"
              />
            </div>
            
            <div className="vlc-control-bar">
              <div className="vlc-left-controls">
                <button className="vlc-control-btn" onClick={togglePlayPause}>
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" fill="white"/>
                      <rect x="14" y="4" width="4" height="16" fill="white"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <polygon points="5,4 19,12 5,20" fill="white"/>
                    </svg>
                  )}
                </button>
                
                <button className="vlc-control-btn" onClick={skipBackward}>
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M15,6v12l-8.5-6L15,6L15,6z M7,6v12H3V6H7z" fill="white"/>
                  </svg>
                </button>
                
                <button className="vlc-control-btn" onClick={skipForward}>
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M9,6v12l8.5-6L9,6L9,6z M17,6v12h4V6H17z" fill="white"/>
                  </svg>
                </button>
                
                <div className="vlc-volume-control">
                  <button className="vlc-control-btn" onClick={toggleMute}>
                    {isMuted || volume === 0 ? (
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M16.5,12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45,2.45c0.03-0.2,0.05-0.41,0.05-0.63z M19.93,11c0.17,0.66,0.27,1.35,0.27,2.07 s-0.1,1.41-0.27,2.07l1.93,1.93c0.5-1.11,0.8-2.32,0.8-3.6s-0.3-2.49-0.8-3.6L19.93,11z M4.27,4L2.86,5.41L7,9.56v6.09 c0,1.1,0.9,2,2,2h4l4.44,4.44l1.41-1.41L4.27,4z M12,4L9.91,6.09L12,8.18V4z" fill="white"/>
                      </svg>
                    ) : volume > 0.5 ? (
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="white"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M7 9v6h4l5 5V4l-5 5H7z" fill="white"/>
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="vlc-volume-slider"
                  />
                </div>
                
                <div className="vlc-time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              
              <div className="vlc-right-controls">
                {document.pictureInPictureEnabled && (
                  <button className="vlc-control-btn" onClick={togglePiP}>
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z" fill="white"/>
                    </svg>
                  </button>
                )}
                
                <button className="vlc-control-btn" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {isLoading && (
            <div className="vlc-loading-overlay">
              <div className="vlc-spinner"></div>
            </div>
          )}
          
          {error && (
            <div className="vlc-error-overlay">
              <div className="vlc-error-box">
                <p>{error}</p>
                <button onClick={() => setError(null)}>OK</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 