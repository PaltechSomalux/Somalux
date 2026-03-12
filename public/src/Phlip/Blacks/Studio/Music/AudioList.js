import React, { useState, useRef, useEffect } from 'react';
import './AudioList.css';

export const AudioList = ({ audios = [], setAudios, onAudioSelect, onBack }) => {
  const [editingAudioId, setEditingAudioId] = useState(null);
  const [editAudioTitle, setEditAudioTitle] = useState('');
  const [showMenuForAudio, setShowMenuForAudio] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    try {
      const files = Array.from(event.target.files);
      console.log('Selected files:', files);
      
      const audioFiles = files.filter(file => {
        const isAudio = file.type.startsWith('audio/') || 
                       file.name.toLowerCase().endsWith('.mp3') ||
                       file.name.toLowerCase().endsWith('.wav') ||
                       file.name.toLowerCase().endsWith('.m4a');
        return isAudio;
      });
      
      console.log('Filtered audio files:', audioFiles);
      
      if (audioFiles.length === 0) {
        alert('Please select valid audio files (MP3, WAV, M4A)');
        return;
      }

      const newAudios = audioFiles.map(file => {
        const audio = {
          id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          duration: 'Processing...',
          size: formatFileSize(file.size),
          path: URL.createObjectURL(file),
          thumbnail: null,
          isFavorite: false,
          file: file
        };
        console.log('Created audio object:', audio);
        return audio;
      });

      // Create the updated audios array
      const updatedAudios = [...(audios || []), ...newAudios];
      console.log('Updating audios with:', updatedAudios);
      
      // Call setAudios with the new array directly
      setAudios(updatedAudios);

      // Clear the input to allow selecting the same file again
      event.target.value = '';
      
      // Get audio duration for each file
      newAudios.forEach(async (audio) => {
        try {
          const audioElement = new Audio(audio.path);
          audioElement.addEventListener('loadedmetadata', () => {
            const duration = Math.round(audioElement.duration);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Update the audio duration in the state
            const currentAudios = audios || [];
            const updatedAudiosList = currentAudios.map(item => 
              item.id === audio.id 
                ? { ...item, duration: formattedDuration }
                : item
            );
            setAudios(updatedAudiosList);
          });
        } catch (error) {
          console.error('Error getting audio duration:', error);
        }
      });

    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      alert('Error uploading files. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteAudio = (audioId) => {
    setAudios((audios || []).filter(audio => audio.id !== audioId));
    setShowMenuForAudio(null);
  };

  const handleRenameAudio = (audioId) => {
    const audio = (audios || []).find(a => a.id === audioId);
    if (audio) {
      setEditAudioTitle(audio.title);
      setEditingAudioId(audioId);
      setShowMenuForAudio(null);
    }
  };

  const saveAudioTitle = () => {
    setAudios((audios || []).map(audio => 
      audio.id === editingAudioId ? { ...audio, title: editAudioTitle } : audio
    ));
    setEditingAudioId(null);
  };

  const toggleFavoriteAudio = (audioId) => {
    setAudios((audios || []).map(audio => 
      audio.id === audioId ? { ...audio, isFavorite: !audio.isFavorite } : audio
    ));
    setShowMenuForAudio(null);
  };

  const handleAudioClick = (audio) => {
    if (!editingAudioId) {
      onAudioSelect(audio, audios || []);
    }
  };

  // Add effect to persist changes
  useEffect(() => {
    console.log('AudioList rendered with audios:', audios);
  }, [audios]);

  return (
    <div className="audio-organizer-audio">
      <div className="audio-list-header-audio">
        <button className="back-button-audio" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
      </div>

      <div className="audios-list-audio">
        {(audios || []).map(audio => (
          <div 
            key={audio.id} 
            className={`audio-item-audio ${audio.isFavorite ? 'favorite-audio' : ''}`}
            onClick={() => handleAudioClick(audio)}
          >
            <div className="audio-thumbnail-container-audio">
              <div className="audio-thumbnail-audio">
                {/* Updated to use emoji icon like in Studio component */}
                <div className="music-icon-audio">
                  🎵
                </div>
              
                <div className="duration-audio">{audio.duration || ''}</div>
              </div>
            </div>
            
            <div className="audio-info-audio">
              {editingAudioId === audio.id ? (
                <input
                  type="text"
                  value={editAudioTitle}
                  onChange={(e) => setEditAudioTitle(e.target.value)}
                  onBlur={saveAudioTitle}
                  onKeyPress={(e) => e.key === 'Enter' && saveAudioTitle()}
                  autoFocus
                  className="audio-title-input-audio"
                />
              ) : (
                <h4 className="audio-title-audio">{audio.title || 'Untitled Audio'}</h4>
              )}
              <div className="audio-details-audio">
                <span className="audio-size-audio">{audio.size || ''}</span>
              </div>
            </div>
            
            <div 
              className="audio-actions-audio"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="audio-menu-container-audio">
                <button 
                  className="audio-menu-button-audio"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuForAudio(showMenuForAudio === audio.id ? null : audio.id);
                  }}
                  aria-label="Audio options"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
                
                {showMenuForAudio === audio.id && (
                  <div className="audio-menu-dropdown-audio">
                    <button 
                      onClick={() => handleRenameAudio(audio.id)}
                      aria-label="Rename audio"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                      Rename
                    </button>
                    <button 
                      onClick={() => toggleFavoriteAudio(audio.id)}
                      aria-label={audio.isFavorite ? 'Remove favorite' : 'Add favorite'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d={audio.isFavorite ? 
                          "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : 
                          "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"}/>
                      </svg>
                      {audio.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                    </button>
                    <button 
                      className="delete-button-audio" 
                      onClick={() => handleDeleteAudio(audio.id)}
                      aria-label="Delete audio"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept="audio/*"
        multiple
      />

      {/* FAB Button */}
      <button 
        className="fab-button-audio"
        onClick={() => fileInputRef.current.click()}
        aria-label="Upload audio"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </div>
  );
};