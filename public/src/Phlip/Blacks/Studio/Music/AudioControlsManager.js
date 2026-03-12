import React, { useEffect, useRef } from 'react';
import { AudioControls } from './AudioControls';
import "./AudioControlsManager.css";

export const AudioControlsManager = ({
  playerState,
  uiState,
  updatePlayerState,
  updateUiState,
  hasNextAudio,
  hasPreviousAudio,
  onAudioChange,
  currentAudioIndex,
  controlApi
}) => {
  const controlsTimeoutRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const touchCountRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const lastTouchPositionRef = useRef(null);

  // Handle keyboard events for desktop controls
  useEffect(() => {
    if (uiState.isMobile) return;

    const handleKeyDown = (e) => {
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
          playPreviousAudio();
          break;
        case 'ArrowRight':
          e.preventDefault();
          playNextAudio();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
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
  }, [playerState, uiState.isMobile]);

  useEffect(() => {
    const onGlobalMove = () => {
      updateUiState({ showControls: true });
      if (playerState.isPlaying) {
        resetControlsTimeout();
      }
    };
    window.addEventListener('mousemove', onGlobalMove);
    window.addEventListener('touchstart', onGlobalMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onGlobalMove);
      window.removeEventListener('touchstart', onGlobalMove);
    };
  }, [playerState.isPlaying]);

  const resetControlsTimeout = () => {
    updateUiState({ showControls: true });
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (playerState.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => updateUiState({ showControls: false }), 3000);
    }
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const togglePlayPause = () => {
    if (controlApi && typeof controlApi.togglePlayPause === 'function') {
      controlApi.togglePlayPause();
    } else {
      updatePlayerState({ isPlaying: !playerState.isPlaying });
    }
    resetControlsTimeout();
  };

  const playNextAudio = () => {
    if (playerState.repeatMode === 'one') {
      updatePlayerState({ currentTime: 0 });
      if (!playerState.isPlaying) {
        updatePlayerState({ isPlaying: true });
      }
    } else if (hasNextAudio || playerState.repeatMode === 'all') {
      const nextIndex = currentAudioIndex + 1;
      if (hasNextAudio) {
        if (controlApi && typeof controlApi.playNext === 'function') {
          controlApi.playNext();
        } else {
          onAudioChange(nextIndex);
        }
      } else if (playerState.repeatMode === 'all') {
        if (controlApi && typeof controlApi.playNext === 'function') {
          controlApi.playNext(0);
        } else {
          onAudioChange(0);
        }
      }
    }
    resetControlsTimeout();
  };

  const playPreviousAudio = () => {
    if (playerState.currentTime > 3) {
      updatePlayerState({ currentTime: 0 });
    } else if (hasPreviousAudio || playerState.repeatMode === 'all') {
      const prevIndex = currentAudioIndex - 1;
      if (hasPreviousAudio) {
        if (controlApi && typeof controlApi.playPrevious === 'function') {
          controlApi.playPrevious();
        } else {
          onAudioChange(prevIndex);
        }
      } else if (playerState.repeatMode === 'all') {
        if (controlApi && typeof controlApi.playPrevious === 'function') {
          controlApi.playPrevious(currentAudioIndex - 1);
        } else {
          onAudioChange(currentAudioIndex - 1);
        }
      }
    }
    resetControlsTimeout();
  };

  const toggleRepeatMode = () => {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(playerState.repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    updatePlayerState({ repeatMode: modes[nextIndex] });
    resetControlsTimeout();
  };

  const adjustVolume = (direction) => {
    const step = 0.05;
    const newVolume = direction === 'up'
      ? Math.min(1, playerState.volume + step)
      : Math.max(0, playerState.volume - step);
    handleVolumeChange(newVolume);
  };

  const handleVolumeChange = (newVolume) => {
    const clampedVolume = Math.min(1, Math.max(0, newVolume));
    if (controlApi && typeof controlApi.onVolumeChange === 'function') {
      controlApi.onVolumeChange(clampedVolume);
    } else {
      updatePlayerState({ 
        volume: clampedVolume,
        isMuted: clampedVolume > 0 && playerState.isMuted ? false : playerState.isMuted
      });
    }
    updateUiState({ showVolumeChange: true });
    setTimeout(() => updateUiState({ showVolumeChange: false }), 1000);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    if (controlApi && typeof controlApi.onToggleMute === 'function') {
      controlApi.onToggleMute();
    } else {
      const newMutedState = !playerState.isMuted;
      updatePlayerState({ 
        isMuted: newMutedState,
        volume: newMutedState && playerState.volume === 0 ? 0.5 : playerState.volume
      });
    }
    updateUiState({ showVolumeChange: true });
    setTimeout(() => updateUiState({ showVolumeChange: false }), 1000);
    resetControlsTimeout();
  };

  const adjustPlaybackRate = (direction) => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playerState.playbackRate);
    let newIndex;

    if (direction === 'up') {
      newIndex = Math.min(rates.length - 1, currentIndex + 1);
    } else {
      newIndex = Math.max(0, currentIndex - 1);
    }

    updatePlayerState({ playbackRate: rates[newIndex] });
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

  const handleTouchStart = (e) => {
    if (!uiState.isMobile) return;

    const touch = e.touches[0];
    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    lastTouchPositionRef.current = { x: touch.clientX, y: touch.clientY };

    touchCountRef.current += 1;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const timeout = setTimeout(() => {
      if (touchCountRef.current === 1) {
        updateUiState({ showControls: true });
        resetControlsTimeout();
      } else if (touchCountRef.current === 2) {
        const screenWidth = window.innerWidth;
        if (touch.clientX < screenWidth / 3) {
          playPreviousAudio();
        } else if (touch.clientX > (screenWidth * 2) / 3) {
          playNextAudio();
        }
      }
      touchCountRef.current = 0;
    }, 300);

    clickTimeoutRef.current = timeout;
  };

  const handleTouchMove = (e) => {
    if (!uiState.isMobile || !lastTouchPositionRef.current) return;

    const touch = e.touches[0];
    const deltaY = touchStartYRef.current - touch.clientY;
    const deltaX = touch.clientX - touchStartXRef.current;
    const screenWidth = window.innerWidth;
    const isRightSide = touch.clientX > screenWidth / 2;

    if (isRightSide) {
      const volumeDelta = deltaY / 150;
      const newVolume = Math.min(1, Math.max(0, playerState.volume + volumeDelta));
      handleVolumeChange(newVolume);
    }

    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    lastTouchPositionRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    lastTouchPositionRef.current = null;
  };

  return (
    <>
      {uiState.showVolumeChange && ( 
        <div className="volume-animation-audio">
          <div className="volume-icon-container-audio">
            <div className="volume-icon-audio">
              {playerState.isMuted || playerState.volume === 0 ? (
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path d="M16.5,12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45,2.45c0.03-0.2,0.05-0.41,0.05-0.63z M19.93,11c0.17,0.66,0.27,1.35,0.27,2.07 s-0.1,1.41-0.27,2.07l1.93,1.93c0.5-1.11,0.8-2.32,0.8-3.6s-0.3-2.49-0.8-3.6L19.93,11z M4.27,4L2.86,5.41L7,9.56v6.09 c0,1.1,0.9,2,2,2h4l4.44,4.44l1.41-1.41L4.27,4z M12,4L9.91,6.09L12,8.18V4z" fill="white"/>
                </svg>
              ) : playerState.volume > 0.5 ? (
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s -2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="white"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path d="M7 9v6h4l5 5V4l-5 5H7z" fill="white"/>
                </svg>
              )}
            </div>
            <div className="volume-level-container-audio">
              <div
                className="volume-level-bar-audio"
                style={{ width: `${playerState.isMuted ? 0 : playerState.volume * 100}%` }}
              ></div>
            </div>
            <div className="volume-percent-audio">
              {Math.round((playerState.isMuted ? 0 : playerState.volume) * 100)}%
            </div>
          </div>
        </div>
      )}

      <AudioControls
        showControls={uiState.showControls}
        isPlaying={playerState.isPlaying}
        currentTime={playerState.currentTime}
        duration={playerState.duration}
        buffered={playerState.buffered}
        formatTime={formatTime}
        togglePlayPause={togglePlayPause}
        playPrevious={playPreviousAudio}
        playNext={playNextAudio}
        onTimeChange={(newTime) => {
          if (controlApi && typeof controlApi.onTimeChange === 'function') {
            controlApi.onTimeChange(newTime);
          } else {
            updatePlayerState({ currentTime: newTime });
          }
        }}
        repeatMode={playerState.repeatMode}
        toggleRepeatMode={toggleRepeatMode}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        volume={playerState.volume}
        isMuted={playerState.isMuted}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
      />
    </>
  );
};