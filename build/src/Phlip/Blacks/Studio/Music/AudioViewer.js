import React, { useState, useEffect } from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { AudioControlsManager } from './AudioControlsManager';
import "./AudioViewer.css";

export const AudioViewer = ({ 
  audioSrc, 
  onBackToLibrary,
  audioList = [],
  audios = [],
  currentAudioIndex = 0,
  onAudioChange
}) => {
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    volume: 0.7,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    playbackRate: 1,
    isLooping: false, // Keeping for backward compatibility
    repeatMode: 'none', // Added repeat mode ('none', 'all', 'one')
    error: null,
    isLoading: false
  });

  const [uiState, setUiState] = useState({
    isFullscreen: true, // Default to fullscreen for fixed version
    isPiP: false,
    showControls: true,
    showSkipBack: false,
    showSkipForward: false,
    showVolumeChange: false,
    isMobile: false
  });

  const hasNextAudio = audioList.length > 0 && currentAudioIndex < audioList.length - 1;
  const hasPreviousAudio = audioList.length > 0 && currentAudioIndex > 0;
  const currentAudio = Array.isArray(audios) && audios.length > 0 ? audios[currentAudioIndex] : null;

  // Update player state helper
  const updatePlayerState = (newState) => {
    setPlayerState(prev => ({ ...prev, ...newState }));
  };

  // Update UI state helper
  const updateUiState = (newState) => {
    setUiState(prev => ({ ...prev, ...newState }));
  };

  // Handle audio ending based on repeat mode
  useEffect(() => {
    if (playerState.currentTime >= playerState.duration && playerState.duration > 0) {
      if (playerState.repeatMode === 'one') {
        // For 'one' mode, just restart the current track
        updatePlayerState({ currentTime: 0, isPlaying: true });
      } else if (playerState.repeatMode === 'all' && !hasNextAudio) {
        // For 'all' mode when at end of playlist, loop back to start
        onAudioChange(0);
      } else if (hasNextAudio) {
        // For 'none' mode or 'all' mode with next track available
        onAudioChange(currentAudioIndex + 1);
      } else {
        // For 'none' mode at end of playlist
        updatePlayerState({ isPlaying: false });
      }
    }
  }, [playerState.currentTime, playerState.duration, playerState.repeatMode]);

  // Lock body scroll when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    const checkIfMobile = () => {
      updateUiState({ isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) });
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      // Cleanup - restore scrolling when component unmounts
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const [controlApi, setControlApi] = useState(null);

  return (
    <div className={`audio-viewer-container ${uiState.isFullscreen ? 'fullscreen' : ''}`}>
      <div className="back-to-library-audio" onClick={onBackToLibrary} aria-label="Back to library">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </div>

      {/* Now Playing Visual */}
      <div className="now-playing-audio">
        <div className={`now-playing-disk-audio ${playerState.isPlaying ? 'spin' : ''}`}>
          {currentAudio && currentAudio.thumbnail ? (
            <img src={currentAudio.thumbnail} alt={currentAudio.title || 'Artwork'} />
          ) : (
            <div className="now-playing-placeholder-audio">🎵</div>
          )}
        </div>
        <div className="now-playing-title-audio">
          {currentAudio?.title || 'Now Playing'}
        </div>
        <div className={`now-playing-wave-bars ${playerState.isPlaying ? 'playing' : 'paused'}`}>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <AudioVisualizer
        audioSrc={audioSrc}
        playerState={playerState}
        uiState={uiState}
        updatePlayerState={updatePlayerState}
        updateUiState={updateUiState}
        hasNextAudio={hasNextAudio}
        hasPreviousAudio={hasPreviousAudio}
        onAudioChange={onAudioChange}
        currentAudioIndex={currentAudioIndex}
        registerControlApi={setControlApi}
      />

      <AudioControlsManager
        playerState={playerState}
        uiState={uiState}
        updatePlayerState={updatePlayerState}
        updateUiState={updateUiState}
        hasNextAudio={hasNextAudio}
        hasPreviousAudio={hasPreviousAudio}
        onAudioChange={onAudioChange}
        currentAudioIndex={currentAudioIndex}
        controlApi={controlApi}
      />

      {playerState.isLoading && (
        <div className="alc-loading-overlay-audio">
          <div className="alc-spinner-audio"></div>
        </div>
      )}

      {playerState.error && (
        <div className="alc-error-overlay-audio">
          <div className="alc-error-box-audio">
            <p>{playerState.error}</p>
            <button
              onClick={() => {
                updatePlayerState({ error: null });
              }}
              aria-label="Retry audio playback"
            >
              Retry
            </button>
            <button onClick={() => updatePlayerState({ error: null })} aria-label="Close error message">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};