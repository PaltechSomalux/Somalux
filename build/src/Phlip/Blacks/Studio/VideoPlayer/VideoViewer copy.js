import React, { useState, useRef, useEffect } from 'react';
import { VideoControls } from './VideoControls';
import "./VideoViewer.css";

export const VideoViewer = ({ videoSrc, onBackToLibrary }) => {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [showSkipBack, setShowSkipBack] = useState(false);
  const [showSkipForward, setShowSkipForward] = useState(false);
  const [showVolumeChange, setShowVolumeChange] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState(
    window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape"
  );
  const [lastTap, setLastTap] = useState(0);

  // Refs
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const skipTimeoutRef = useRef(null);
  const volumeTimeoutRef = useRef(null);

  // Check if orientation API is supported
  const isOrientationApiSupported = () => {
    return (
      typeof window !== 'undefined' && 
      window.screen && 
      window.screen.orientation && 
      typeof window.screen.orientation.lock === 'function'
    );
  };

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
      
      // On mobile, lock to landscape when entering fullscreen
      if (isMobile && orientation === "portrait" && isOrientationApiSupported()) {
        window.screen.orientation.lock('landscape').catch(e => {
          console.log("Orientation lock failed:", e);
        });
      }
    } else {
      document.exitFullscreen();
      
      // On mobile, unlock orientation when exiting fullscreen
      if (isMobile && isOrientationApiSupported()) {
        window.screen.orientation.unlock().catch(e => {
          console.log("Screen orientation unlock failed:", e);
        });
      }
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

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setControlsTimeout(setTimeout(() => setShowControls(false), 3000));
  };

  const handleDoubleTap = (e) => {
    const currentTime = Date.now();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      const videoRect = e.target.getBoundingClientRect();
      const tapPosition = e.clientX - videoRect.left;
      const thirdWidth = videoRect.width / 3;
      
      if (tapPosition < thirdWidth) {
        skipBackward();
      } else if (tapPosition > thirdWidth * 2) {
        skipForward();
      } else {
        togglePlayPause();
      }
    }
    setLastTap(currentTime);
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    const handleOrientationChange = () => {
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      setOrientation(isPortrait ? "portrait" : "landscape");
      
      // On mobile, lock to landscape when in fullscreen
      if (isMobile && isFullscreen && isPortrait && isOrientationApiSupported()) {
        window.screen.orientation.lock('landscape').catch(e => {
          console.log("Orientation lock failed:", e);
        });
      }
    };

    checkIfMobile();
    handleOrientationChange();
    
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      // Unlock orientation when unmounting
      if (isOrientationApiSupported()) {
        window.screen.orientation.unlock().catch(e => {
          console.log("Screen orientation unlock failed:", e);
        });
      }
    };
  }, [isFullscreen, isMobile]);

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

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('error', handleVideoError);
      videoElement.removeEventListener('canplay', handleVideoCanPlay);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('progress', handleProgress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeout) clearTimeout(controlsTimeout);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    };
  }, [videoSrc]);

  useEffect(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    
    if (orientation === "portrait") {
      container.classList.add("portrait-mode");
      container.classList.remove("landscape-mode");
    } else {
      container.classList.add("landscape-mode");
      container.classList.remove("portrait-mode");
    }
  }, [orientation]);

  return (
    <div 
      className={`player-wrapper ${isFullscreen ? 'fullscreen' : ''} ${isMobile ? 'mobile' : ''}`} 
      ref={playerContainerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => setShowControls(false)}
      onMouseEnter={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      tabIndex="0"
    >
      <div className="back-to-library" onClick={onBackToLibrary}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </div> 
       
      <video
        ref={videoRef}
        src={videoSrc}
        onClick={togglePlayPause}
        onTouchEnd={handleDoubleTap}
        autoPlay
        className="video-element"
        playsInline
        webkit-playsinline="true"
        x-webkit-airplay="allow"
      />
      
      {showSkipBack && (
        <div className="skip-animation skip-back">
          <div className="skip-icon">-10s</div>
        </div>
      )}
      
      {showSkipForward && (
        <div className="skip-animation skip-forward">
          <div className="skip-icon">+10s</div>
        </div>
      )}
      
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
      
      <VideoControls
        showControls={showControls}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        volume={volume}
        isMuted={isMuted}
        isPiP={isPiP}
        isFullscreen={isFullscreen}
        isMobile={isMobile}
        formatTime={formatTime}
        togglePlayPause={togglePlayPause}
        skipBackward={skipBackward}
        skipForward={skipForward}
        handleVolumeChange={handleVolumeChange}
        toggleMute={toggleMute}
        togglePiP={togglePiP}
        toggleFullscreen={toggleFullscreen}
        onTimeChange={(newTime) => {
          setCurrentTime(newTime);
          if (videoRef.current) {
            videoRef.current.currentTime = newTime;
          }
        }}
      />
      
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
  );
};