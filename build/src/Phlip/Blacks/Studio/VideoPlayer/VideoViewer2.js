import React, { useState, useRef, useEffect } from 'react';
import { VideoControls } from './VideoControls';
import { VideoOverlays } from './VideoOverlays';
import "./VideoViewer.css";

export const VideoViewer2 = ({
  videoSrc,
  onNextVideo,
  onPreviousVideo,
  hasNextVideo,
  hasPreviousVideo,
  onBackToLibrary,
  formatTime,
  videoTitle
}) => {
  // Player state
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
  const [isMobile, setIsMobile] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeatMode, setRepeatMode] = useState('none');
  const [lastTouchPosition, setLastTouchPosition] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [touchCount, setTouchCount] = useState(0);
  const [clickTimeout, setClickTimeout] = useState(null);
  const [showVolumeChange, setShowVolumeChange] = useState(false);
  const [showSkipBack, setShowSkipBack] = useState(false);
  const [showSkipForward, setShowSkipForward] = useState(false);
  const [isOrientationTriggeredFullscreen, setIsOrientationTriggeredFullscreen] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const skipTimeoutRef = useRef(null);
  const volumeTimeoutRef = useRef(null);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);

  // Check if mobile on mount and handle orientation changes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    const handleOrientationChange = () => {
      if (!isMobile) return;

      const orientation = window.screen.orientation?.type || 'portrait-primary';
      if (orientation.includes('landscape') && !isFullscreen) {
        enterFullscreen();
        setIsOrientationTriggeredFullscreen(true);
      } else if (orientation.includes('portrait') && isFullscreen && isOrientationTriggeredFullscreen) {
        exitFullscreen();
        setIsOrientationTriggeredFullscreen(false);
      }
    };

    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('resize', checkIfMobile);
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, [isMobile, isFullscreen, isOrientationTriggeredFullscreen]);

  // Helper function to enter fullscreen
  const enterFullscreen = async () => {
    try {
      if (playerContainerRef.current && !document.fullscreenElement) {
        await playerContainerRef.current.requestFullscreen();
        if (window.screen.orientation && window.screen.orientation.lock) {
          await window.screen.orientation.lock('landscape').catch(err => {
            console.warn(`Failed to lock orientation: ${err.message}`);
          });
        }
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error(`Error entering fullscreen: ${err.message}`);
    }
  };

  // Helper function to exit fullscreen
  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        if (window.screen.orientation && window.screen.orientation.unlock) {
          window.screen.orientation.unlock();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error(`Error exiting fullscreen: ${err.message}`);
    }
  };

  // Handle keyboard events for desktop controls
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e) => {
      if (document.activeElement !== playerContainerRef.current) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume('down');
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPreviousVideo();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNextVideo();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '+':
          e.preventDefault();
          adjustPlaybackRate('up');
          break;
        case '-':
          e.preventDefault();
          adjustPlaybackRate('down');
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          toggleRepeatMode();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, isMobile, playbackRate, repeatMode, hasNextVideo, hasPreviousVideo]);

  // Apply brightness, volume, playback rate, and looping
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.filter = `brightness(${brightness}%)`;
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.loop = repeatMode === 'one';
    }
  }, [brightness, volume, isMuted, playbackRate, repeatMode]);

  const adjustPlaybackRate = (direction) => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    let newIndex;

    if (direction === 'up') {
      newIndex = Math.min(rates.length - 1, currentIndex + 1);
    } else {
      newIndex = Math.max(0, currentIndex - 1);
    }

    setPlaybackRate(rates[newIndex]);
    resetControlsTimeout();
  };

  const toggleRepeatMode = () => {
    setRepeatMode((prevMode) => {
      if (prevMode === 'none') return 'one';
      if (prevMode === 'one') return 'all';
      return 'none';
    });
    resetControlsTimeout();
  };

  const handleVideoClick = (e) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const rect = videoElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const videoWidth = rect.width;
    const isRightMargin = clickX > (videoWidth * 2) / 3;
    const isLeftMargin = clickX < videoWidth / 3;

    setClickCount((prev) => prev + 1);

    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }

    const timeout = setTimeout(() => {
      if (clickCount === 1) {
        // Single click: Toggle play/pause
        togglePlayPause();
      }
      setClickCount(0);
    }, 300); // 300ms for double-click detection

    setClickTimeout(timeout);

    if (clickCount === 1) {
      // Double click: Handle skip
      if (isRightMargin) {
        const newTime = Math.min(videoElement.currentTime + 10, videoElement.duration);
        videoElement.currentTime = newTime;
        setCurrentTime(newTime);
        showSkipAnimation('forward');
      } else if (isLeftMargin) {
        const newTime = Math.max(videoElement.currentTime - 10, 0);
        videoElement.currentTime = newTime;
        setCurrentTime(newTime);
        showSkipAnimation('back');
      }
      setClickCount(0);
      clearTimeout(timeout);
    }
  };

  const handleTouchStart = (e) => {
    if (!isMobile) return;

    const touch = e.touches[0];
    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    setLastTouchPosition({ x: touch.clientX, y: touch.clientY });

    setTouchCount((prev) => prev + 1);

    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }

    const timeout = setTimeout(() => {
      if (touchCount === 1) {
        // Single tap: Toggle play/pause
        togglePlayPause();
        setShowControls(true);
        resetControlsTimeout();
      }
      setTouchCount(0);
    }, 300); // 300ms for double-tap detection

    setClickTimeout(timeout);

    if (touchCount === 1) {
      // Double tap: Handle skip
      const screenWidth = window.innerWidth;
      const videoElement = videoRef.current;
      if (!videoElement) return;

      if (touch.clientX > (screenWidth * 2) / 3) {
        const newTime = Math.min(videoElement.currentTime + 10, videoElement.duration);
        videoElement.currentTime = newTime;
        setCurrentTime(newTime);
        showSkipAnimation('forward');
      } else if (touch.clientX < screenWidth / 3) {
        const newTime = Math.max(videoElement.currentTime - 10, 0);
        videoElement.currentTime = newTime;
        setCurrentTime(newTime);
        showSkipAnimation('back');
      }
      setTouchCount(0);
      clearTimeout(timeout);
    }
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !lastTouchPosition) return;

    const touch = e.touches[0];
    const deltaY = touchStartYRef.current - touch.clientY;
    const screenWidth = window.innerWidth;
    const isRightSide = touch.clientX > screenWidth / 2;

    if (isRightSide) {
      const volumeDelta = deltaY / 150;
      const newVolume = Math.min(1, Math.max(0, volume + volumeDelta));
      handleVolumeChange(newVolume);
    } else {
      const brightnessDelta = deltaY / 3;
      const newBrightness = Math.min(100, Math.max(0, brightness + brightnessDelta));
      setBrightness(newBrightness);
    }

    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    setLastTouchPosition({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setLastTouchPosition(null);
  };

  const togglePlayPause = () => {
    if (!videoSrc) return;

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error("Playback failed:", error);
          setError("Playback failed. Please try again or select another video.");
        });
      }
      setIsPlaying(!isPlaying);
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
    setShowVolumeChange(true);
    clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => setShowVolumeChange(false), 1000);
  };

  const adjustVolume = (direction) => {
    const step = 0.05;
    const newVolume = direction === 'up'
      ? Math.min(1, volume + step)
      : Math.max(0, volume - step);
    handleVolumeChange(newVolume);
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
      setShowVolumeChange(true);
      clearTimeout(volumeTimeoutRef.current);
      volumeTimeoutRef.current = setTimeout(() => setShowVolumeChange(false), 1000);
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
    setError("Failed to load video. Please try another source or refresh.");
    setIsLoading(false);
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await enterFullscreen();
        setIsOrientationTriggeredFullscreen(false);
      } else {
        await exitFullscreen();
        setIsOrientationTriggeredFullscreen(false);
      }
    } catch (err) {
      console.error(`Error toggling fullscreen: ${err.message}`);
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

  const handleMouseMove = () => {
    resetControlsTimeout();
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
      if (repeatMode === 'one') {
        videoElement.currentTime = 0;
        videoElement.play().catch(error => {
          console.error("Playback failed:", error);
          setError("Playback failed. Please try again.");
        });
        setIsPlaying(true);
      } else if (repeatMode === 'all' && hasNextVideo) {
        onNextVideo();
      }
    };

    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        setBuffered(videoElement.buffered.end(videoElement.buffered.length - 1));
      }
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen && window.screen.orientation && window.screen.orientation.unlock) {
        window.screen.orientation.unlock();
      }
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
      if (clickTimeout) clearTimeout(clickTimeout);
    };
  }, [videoSrc, hasNextVideo, repeatMode]);

  const defaultFormatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const date = new Date(0);
    date.setSeconds(seconds);
    return seconds >= 3600
      ? date.toISOString().substr(11, 8)
      : date.toISOString().substr(14, 5);
  };

  const timeFormatter = formatTime || defaultFormatTime;

  return (
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
      role="region"
      aria-label="Video player"
    >
      <div className="back-to-library-wrapper">
        <div className="back-to-library-container" onClick={onBackToLibrary} aria-label="Back to library">
          <div className="back-to-library-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </div>
          {videoTitle && <span className="video-title">{videoTitle}</span>}
        </div>
      </div>

      <video
        ref={videoRef}
        src={videoSrc}
        onClick={handleVideoClick}
        autoPlay
        className="video-element"
        aria-label="Video content"
      />

      <VideoOverlays
        isMobile={isMobile}
        lastTouchPosition={lastTouchPosition}
        brightness={brightness}
        showVolumeChange={showVolumeChange}
        isMuted={isMuted}
        volume={volume}
        isLoading={isLoading}
        error={error}
        showSkipBack={showSkipBack}
        showSkipForward={showSkipForward}
        onRetry={() => {
          setError(null);
          if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(() => setError("Playback failed. Please try again."));
          }
        }}
        onCloseError={() => setError(null)}
      />

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
        playbackRate={playbackRate}
        repeatMode={repeatMode}
        hasNextVideo={hasNextVideo}
        hasPreviousVideo={hasPreviousVideo}
        formatTime={timeFormatter}
        togglePlayPause={togglePlayPause}
        skipBackward={onPreviousVideo}
        skipForward={onNextVideo}
        handleVolumeChange={handleVolumeChange}
        toggleMute={toggleMute}
        togglePiP={togglePiP}
        toggleFullscreen={toggleFullscreen}
        adjustPlaybackRate={adjustPlaybackRate}
        toggleRepeatMode={toggleRepeatMode}
        onTimeChange={(newTime) => {
          setCurrentTime(newTime);
          if (videoRef.current) {
            videoRef.current.currentTime = newTime;
          }
        }}
      />
    </div>
  );
};