import React, { useRef, useEffect } from 'react';
import "./AudioVisualizer.css";

export const AudioVisualizer = ({
  audioSrc,
  playerState,
  uiState,
  updatePlayerState,
  updateUiState,
  hasNextAudio,
  hasPreviousAudio,
  onAudioChange,
  currentAudioIndex,
  registerControlApi
}) => {
  const audioRef = useRef(null);
  const skipTimeoutRef = useRef(null);

  // Handle audio source changes
  useEffect(() => {
    if (audioRef.current && audioSrc) {
      updatePlayerState({ isLoading: true, error: null });
      audioRef.current.load();
      audioRef.current.play().catch(error => {
        console.error("Playback failed:", error);
        updatePlayerState({ error: "Playback failed. Please try again or select another audio." });
      });
    }
  }, [audioSrc]);

  // Apply playback rate and looping
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playerState.playbackRate;
      audioRef.current.loop = playerState.isLooping;
    }
  }, [playerState.playbackRate, playerState.isLooping]);

  // Handle audio events
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      updatePlayerState({ currentTime: audioElement.currentTime });
      if (audioElement.buffered.length > 0) {
        updatePlayerState({ buffered: audioElement.buffered.end(audioElement.buffered.length - 1) });
      }
    };

    const handleLoadedMetadata = () => {
      updatePlayerState({ 
        duration: audioElement.duration,
        isLoading: false
      });
    };

    const handleAudioError = () => {
      updatePlayerState({ 
        error: "Failed to load audio. Please try another source or refresh.",
        isLoading: false
      });
    };

    const handleAudioCanPlay = () => {
      updatePlayerState({ 
        isLoading: false,
        error: null
      });
    };

    const handleEnded = () => {
      updatePlayerState({ isPlaying: false });
      if (hasNextAudio) {
        playNextAudio();
      }
    };

    const handleProgress = () => {
      if (audioElement.buffered.length > 0) {
        updatePlayerState({ buffered: audioElement.buffered.end(audioElement.buffered.length - 1) });
      }
    };

    const handlePlay = () => updatePlayerState({ isPlaying: true });
    const handlePause = () => updatePlayerState({ isPlaying: false });

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('error', handleAudioError);
    audioElement.addEventListener('canplay', handleAudioCanPlay);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('progress', handleProgress);
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('error', handleAudioError);
      audioElement.removeEventListener('canplay', handleAudioCanPlay);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('progress', handleProgress);
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
    };
  }, [audioSrc, hasNextAudio]);

  // Apply volume/mute changes to element
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = playerState.isMuted;
    audioRef.current.volume = playerState.isMuted ? 0 : playerState.volume;
  }, [playerState.volume, playerState.isMuted]);

  // Seek element when currentTime in state changes (e.g., slider)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (Number.isFinite(playerState.currentTime) && Math.abs((el.currentTime || 0) - playerState.currentTime) > 0.2) {
      el.currentTime = playerState.currentTime;
    }
  }, [playerState.currentTime]);

  const togglePlayPause = () => {
    if (!audioSrc) return;

    if (audioRef.current) {
      if (playerState.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error("Playback failed:", error);
          updatePlayerState({ error: "Playback failed. Please try again or select another audio." });
        });
      }
      updatePlayerState({ isPlaying: !playerState.isPlaying });
    }
    updateUiState({ showControls: true });
  };

  const playNextAudio = () => {
    if (hasNextAudio) {
      showSkipAnimation('forward');
      onAudioChange(currentAudioIndex + 1);
    }
    updateUiState({ showControls: true });
  };

  const playPreviousAudio = () => {
    if (hasPreviousAudio) {
      showSkipAnimation('back');
      onAudioChange(currentAudioIndex - 1);
    }
    updateUiState({ showControls: true });
  };

  const showSkipAnimation = (direction) => {
    if (direction === 'back') {
      updateUiState({ showSkipBack: true });
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = setTimeout(() => updateUiState({ showSkipBack: false }), 1000);
    } else {
      updateUiState({ showSkipForward: true });
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = setTimeout(() => updateUiState({ showSkipForward: false }), 1000);
    }
  };

  const handleAudioClick = () => {
    togglePlayPause();
  };

  // Expose control API for parent controls
  useEffect(() => {
    if (typeof registerControlApi !== 'function') return;
    const api = {
      togglePlayPause: () => togglePlayPause(),
      onTimeChange: (t) => {
        if (audioRef.current && Number.isFinite(t)) {
          audioRef.current.currentTime = t;
        }
        updatePlayerState({ currentTime: t });
      },
      onVolumeChange: (v) => {
        const clamped = Math.min(1, Math.max(0, v));
        if (audioRef.current) {
          audioRef.current.volume = clamped;
          if (clamped > 0) audioRef.current.muted = false;
        }
        updatePlayerState({ volume: clamped, isMuted: clamped === 0 ? true : playerState.isMuted && clamped === 0 });
      },
      onToggleMute: () => {
        const muted = !playerState.isMuted;
        if (audioRef.current) {
          audioRef.current.muted = muted;
        }
        updatePlayerState({ isMuted: muted });
      },
      playNext: (index) => {
        if (typeof index === 'number') onAudioChange(index);
        else onAudioChange(currentAudioIndex + 1);
      },
      playPrevious: (index) => {
        if (typeof index === 'number') onAudioChange(index);
        else onAudioChange(currentAudioIndex - 1);
      }
    };
    registerControlApi(api);
  }, [registerControlApi, currentAudioIndex, playerState.isMuted]);

  return (
    <div className="audio-visualizer-audio">
      <audio
        ref={audioRef}
        src={audioSrc}
        onClick={handleAudioClick}
        autoPlay
        aria-label="Audio content"
      />
      <div className="waveform-audio"></div>
    </div>
  );
};