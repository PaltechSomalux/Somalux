import React, { useState } from 'react';
import { Audio } from './Audio';
import { AudioViewer } from './AudioViewer';

export const AudioPlayer = () => {
  const [audioSrc, setAudioSrc] = useState(null);
  const [showAudioBrowser, setShowAudioBrowser] = useState(true);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [audioList, setAudioList] = useState([]);
  const [repeatMode, setRepeatMode] = useState('none'); // Added repeat mode state

  const handleAudioSelect = (audio, audios) => {
    const selectedIndex = audios.findIndex(a => a.path === audio.path);
    setAudioSrc(audio.path);
    setCurrentAudioIndex(selectedIndex);
    setAudioList(audios);
    setShowAudioBrowser(false);
  };

  const handleBackToLibrary = () => {
    setShowAudioBrowser(true);
    setAudioSrc(null);
    setCurrentAudioIndex(0);
    setAudioList([]);
  };

  const handleAudioChange = (newIndex) => {
    if (newIndex >= 0 && newIndex < audioList.length) {
      setCurrentAudioIndex(newIndex);
      setAudioSrc(audioList[newIndex].path);
    } else if (repeatMode === 'all') {
      // Handle wrap-around for repeat all mode
      const wrappedIndex = newIndex < 0 ? audioList.length - 1 : 0;
      setCurrentAudioIndex(wrappedIndex);
      setAudioSrc(audioList[wrappedIndex].path);
    }
  };

  // Optional: Add keyboard shortcuts for repeat mode
  const handleKeyDown = (e) => {
    if (e.key === 'l' || e.key === 'L') {
      toggleRepeatMode();
    }
  };

  const toggleRepeatMode = () => {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  return (
    <div 
      className="alc-player-container-audio audio"
      tabIndex="0" // Needed for keyboard events
      onKeyDown={handleKeyDown}
    >
      {showAudioBrowser ? (
        <Audio onAudioSelect={handleAudioSelect} />
      ) : (
        <AudioViewer 
          audioSrc={audioSrc} 
          onBackToLibrary={handleBackToLibrary}
          audioList={audioList.map(a => a.path)}
          audios={audioList}
          currentAudioIndex={currentAudioIndex}
          onAudioChange={handleAudioChange}
          repeatMode={repeatMode}
          onRepeatModeChange={toggleRepeatMode}
        />
      )}
    </div>
  );
};