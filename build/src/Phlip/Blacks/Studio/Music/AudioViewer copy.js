import React, { useState, useRef, useEffect } from 'react';
import { AudioControls } from './AudioControls';
import "./AudioViewer.css";

export const AudioViewer = ({ 
  audioSrc, 
  onBackToLibrary,
  audioList = [],
  currentAudioIndex = 0,
  onAudioChange,
  artwork = null // Optional album art
}) => {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [hasNextAudio, setHasNextAudio] = useState(false);
  const [hasPreviousAudio, setHasPreviousAudio] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [showPlaybackRatePopup, setShowPlaybackRatePopup] = useState(false);
  const [visualizerData, setVisualizerData] = useState([]);
  const [activeTab, setActiveTab] = useState('nowPlaying'); // 'nowPlaying' or 'playlist'

  // Refs
  const audioRef = useRef(null);
  const playerContainerRef = useRef(null);
  const visualizerRef = useRef(null);
  const animationRef = useRef(null);

  // Update hasNext/hasPrevious whenever audioList or currentAudioIndex changes
  useEffect(() => {
    setHasNextAudio(audioList.length > 0 && currentAudioIndex < audioList.length - 1);
    setHasPreviousAudio(audioList.length > 0 && currentAudioIndex > 0);
  }, [audioList, currentAudioIndex]);

  // Check if mobile on mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Initialize audio visualizer
  useEffect(() => {
    if (!audioRef.current || !visualizerRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 64;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateVisualizer = () => {
      analyser.getByteFrequencyData(dataArray);
      setVisualizerData(Array.from(dataArray));
      animationRef.current = requestAnimationFrame(updateVisualizer);
    };

    if (isPlaying) {
      updateVisualizer();
    } else {
      cancelAnimationFrame(animationRef.current);
      setVisualizerData(new Array(bufferLength).fill(0));
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      analyser.disconnect();
      source.disconnect();
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [isPlaying]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            seek(-10);
          } else {
            playPreviousAudio();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            seek(10);
          } else {
            playNextAudio();
          }
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
        case 'l':
        case 'L':
          e.preventDefault();
          toggleLoop();
          break;
        case '>':
        case '.':
          e.preventDefault();
          adjustPlaybackRate('up');
          break;
        case '<':
        case ',':
          e.preventDefault();
          adjustPlaybackRate('down');
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setActiveTab(prev => prev === 'nowPlaying' ? 'playlist' : 'nowPlaying');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, playbackRate, isLooping, hasNextAudio, hasPreviousAudio]);

  // Apply playback rate and looping
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.loop = isLooping;
    }
  }, [playbackRate, isLooping]);

  const seek = (seconds) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const adjustPlaybackRate = (direction) => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    let newIndex;

    if (direction === 'up') {
      newIndex = Math.min(rates.length - 1, currentIndex + 1);
    } else {
      newIndex = Math.max(0, currentIndex - 1);
    }

    setPlaybackRate(rates[newIndex]);
    setShowPlaybackRatePopup(true);
    setTimeout(() => setShowPlaybackRatePopup(false), 1000);
    resetControlsTimeout();
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    resetControlsTimeout();
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
    if (!audioSrc) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error("Playback failed:", error);
          setError("Playback failed. Please try again or select another audio.");
        });
      }
      setIsPlaying(!isPlaying);
    }
    resetControlsTimeout();
  };

  const playNextAudio = () => {
    if (hasNextAudio) {
      onAudioChange(currentAudioIndex + 1);
    }
    resetControlsTimeout();
  };

  const playPreviousAudio = () => {
    if (hasPreviousAudio) {
      onAudioChange(currentAudioIndex - 1);
    }
    resetControlsTimeout();
  };

  const handleVolumeChange = (newVolume) => {
    const clampedVolume = Math.min(1, Math.max(0, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
      if (clampedVolume > 0 && isMuted) {
        setIsMuted(false);
      }
    }
    setShowVolumePopup(true);
    setTimeout(() => setShowVolumePopup(false), 1000);
    resetControlsTimeout();
  };

  const adjustVolume = (direction) => {
    const step = 0.05;
    const newVolume = direction === 'up'
      ? Math.min(1, volume + step)
      : Math.max(0, volume - step);
    handleVolumeChange(newVolume);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted && volume === 0) {
        const newVolume = 0.5;
        setVolume(newVolume);
        audioRef.current.volume = newVolume;
      }
      setShowVolumePopup(true);
      setTimeout(() => setShowVolumePopup(false), 1000);
    }
    resetControlsTimeout();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.buffered.length > 0) {
        setBuffered(audioRef.current.buffered.end(audioRef.current.buffered.length - 1));
      }
    }
  };

  const handleAudioError = () => {
    setError("Failed to load audio. Please try another source or refresh.");
    setIsLoading(false);
  };

  const handleAudioCanPlay = () => {
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

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setControlsTimeout(setTimeout(() => setShowControls(false), 3000));
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const handleTimeChange = (newTime) => {
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (hasNextAudio && !isLooping) {
        playNextAudio();
      }
    };

    const handleProgress = () => {
      if (audioElement.buffered.length > 0) {
        setBuffered(audioElement.buffered.end(audioElement.buffered.length - 1));
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('error', handleAudioError);
    audioElement.addEventListener('canplay', handleAudioCanPlay);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('progress', handleProgress);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('error', handleAudioError);
      audioElement.removeEventListener('canplay', handleAudioCanPlay);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('progress', handleProgress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeout) clearTimeout(controlsTimeout);
      cancelAnimationFrame(animationRef.current);
    };
  }, [audioSrc, volume, isMuted, hasNextAudio, isLooping]);

  return (
    <div
      className={`audio-player-container ${isFullscreen ? 'fullscreen' : ''}`}
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !isDragging && setShowControls(false)}
      onMouseEnter={() => resetControlsTimeout()}
      tabIndex="0"
      role="region"
      aria-label="Audio player"
    >
      {/* Backdrop with album art or gradient */}
      <div className="audio-backdrop">
        {artwork ? (
          <img src={artwork} alt="Album art" className="album-art-backdrop" />
        ) : (
          <div className="gradient-backdrop"></div>
        )}
        <div className="backdrop-overlay"></div>
      </div>

      {/* Header with back button and title */}
      <div className={`audio-header ${showControls ? 'visible' : ''}`}>
        <button 
          className="back-button" 
          onClick={onBackToLibrary}
          aria-label="Back to library"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        
        <div className="audio-title">
          {audioSrc ? audioSrc.split('/').pop().replace(/\.[^/.]+$/, "") : 'No audio selected'}
        </div>
      </div>

      {/* Main content area */}
      <div className="audio-content">
        {/* Now Playing View */}
        {activeTab === 'nowPlaying' && (
          <div className="now-playing-view">
            {/* Album art or placeholder */}
            <div className="album-art-container">
              {artwork ? (
                <img 
                  src={artwork} 
                  alt="Album cover" 
                  className={`album-art ${isPlaying ? 'playing' : ''}`}
                />
              ) : (
                <div className="album-art-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Audio visualizer */}
            <div className="audio-visualizer" ref={visualizerRef}>
              {visualizerData.map((value, index) => (
                <div 
                  key={index} 
                  className="visualizer-bar"
                  style={{
                    height: `${value / 2}%`,
                    backgroundColor: `hsl(${200 + (value / 255 * 100)}, 80%, 60%)`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Playlist View */}
        {activeTab === 'playlist' && audioList.length > 0 && (
          <div className="playlist-view">
            <h3>Playlist</h3>
            <ul className="playlist-items">
              {audioList.map((audio, index) => (
                <li 
                  key={index} 
                  className={`playlist-item ${index === currentAudioIndex ? 'active' : ''}`}
                  onClick={() => onAudioChange(index)}
                >
                  <span className="track-number">{index + 1}</span>
                  <span className="track-title">{audio.split('/').pop().replace(/\.[^/.]+$/, "")}</span>
                  {index === currentAudioIndex && (
                    <span className="now-playing-indicator">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Audio element (hidden) */}
      <audio
        ref={audioRef}
        src={audioSrc}
        autoPlay
        aria-label="Audio content"
      />

      {/* Volume popup */}
      {showVolumePopup && (
        <div className="volume-popup">
          <div className="volume-icon">
            {isMuted || volume === 0 ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M16.5,12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45,2.45c0.03-0.2,0.05-0.41,0.05-0.63z M19.93,11c0.17,0.66,0.27,1.35,0.27,2.07 s-0.1,1.41-0.27,2.07l1.93,1.93c0.5-1.11,0.8-2.32,0.8-3.6s-0.3-2.49-0.8-3.6L19.93,11z M4.27,4L2.86,5.41L7,9.56v6.09 c0,1.1,0.9,2,2,2h4l4.44,4.44l1.41-1.41L4.27,4z M12,4L9.91,6.09L12,8.18V4z"/>
              </svg>
            ) : volume > 0.5 ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
              </svg>
            )}
          </div>
          <div className="volume-level">
            <div
              className="volume-progress"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            ></div>
          </div>
          <div className="volume-percent">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </div>
        </div>
      )}

      {/* Playback rate popup */}
      {showPlaybackRatePopup && (
        <div className="playback-rate-popup">
          <span>Speed: {playbackRate.toFixed(2)}x</span>
        </div>
      )}

      {/* Controls */}
      <AudioControls
        showControls={showControls}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        volume={volume}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        playbackRate={playbackRate}
        isLooping={isLooping}
        hasNextAudio={hasNextAudio}
        hasPreviousAudio={hasPreviousAudio}
        formatTime={formatTime}
        togglePlayPause={togglePlayPause}
        skipBackward={() => seek(-10)}
        skipForward={() => seek(10)}
        handleVolumeChange={handleVolumeChange}
        toggleMute={toggleMute}
        toggleFullscreen={toggleFullscreen}
        adjustPlaybackRate={adjustPlaybackRate}
        toggleLoop={toggleLoop}
        onTimeChange={handleTimeChange}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        playPreviousAudio={playPreviousAudio}
        playNextAudio={playNextAudio}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner">
            <div className="spinner-circle"></div>
          </div>
          <div className="loading-text">Loading audio...</div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="error-overlay">
          <div className="error-box">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#ff4d4f">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p>{error}</p>
            <div className="error-buttons">
              <button
                className="retry-button"
                onClick={() => {
                  setError(null);
                  if (audioRef.current) {
                    audioRef.current.load();
                    audioRef.current.play().catch(() => setError("Playback failed. Please try again."));
                  }
                }}
              >
                Retry
              </button>
              <button 
                className="close-button"
                onClick={() => setError(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};