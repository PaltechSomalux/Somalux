import React, { useState, useEffect } from 'react';
import { AudioFolders } from './AudioFolders';
import { AudioList } from './AudioList';
export const Audio = ({ onAudioSelect }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load folders from localStorage on initial render
  useEffect(() => {
    const savedFolders = localStorage.getItem('audioFolders');
    if (savedFolders) {
      try {
        const parsedFolders = JSON.parse(savedFolders);
        // Initialize with sample data if no folders exist
        if (parsedFolders.length === 0) {
          setFolders([getSampleFolder()]);
        } else {
          setFolders(parsedFolders);
        }
      } catch (e) {
        console.error('Failed to parse saved folders', e);
        setFolders([getSampleFolder()]);
      }
    } else {
      setFolders([getSampleFolder()]);
    }
  }, []);

  // Save folders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('audioFolders', JSON.stringify(folders));
  }, [folders]);

  const getSampleFolder = () => ({
    id: '1',
    name: 'Sample Audios',
    audioCount: 2,
    audios: [
      { 
        id: '1-1', 
        title: 'Sample Audio 1', 
        duration: '12:34', 
        size: '1.2GB',
        path: 'https://example.com/sample-audio1.mp3',
        thumbnail: 'https://via.placeholder.com/256/FFAD08/FFFFFF?text=Audio1',
        isFavorite: false
      },
      { 
        id: '1-2', 
        title: 'Sample Audio 2', 
        duration: '8:45', 
        size: '856MB',
        path: 'https://example.com/sample-audio2.mp3',
        thumbnail: 'https://via.placeholder.com/256/FFAD08/FFFFFF?text=Audio2',
        isFavorite: true
      }
    ],
    thumbnail: 'https://via.placeholder.com/256/FFAD08/FFFFFF?text=Sample',
    isLocked: false
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpdateAudios = (folderId, updatedAudios) => {
    if (!Array.isArray(updatedAudios)) {
      console.error('updatedAudios is not an array:', updatedAudios);
      return;
    }

    console.log('Updating audios for folder:', folderId);
    console.log('New audios list:', updatedAudios);
    
    setFolders(prevFolders => {
      const updatedFolders = prevFolders.map(folder => {
        if (folder.id === folderId) {
          const newFolder = {
            ...folder,
            audios: updatedAudios,
            audioCount: updatedAudios.length
          };
          console.log('Updated folder:', newFolder);
          return newFolder;
        }
        return folder;
      });
      
      // Save to localStorage immediately
      localStorage.setItem('audioFolders', JSON.stringify(updatedFolders));
      console.log('Updated folders:', updatedFolders);
      return updatedFolders;
    });
  };

  const handleFolderSelect = (folder) => {
    if (!folder.isLocked) {
      setSelectedFolder(folder);
    }
  };

  const handleBackToFolders = () => {
    setSelectedFolder(null);
  };

  const loadAudiosFromDirectory = async () => {
    try {
      if (!window.showDirectoryPicker) {
        throw new Error('File System Access API not supported in this browser');
      }

      setIsLoading(true);
      setError(null);

      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read'
      });

      const audioFiles = await scanDirectoryForAudios(directoryHandle);

      if (audioFiles.length === 0) {
        setError('No audio files found in the selected directory');
        setIsLoading(false);
        return;
      }

      const newFolder = {
        id: `local-${Date.now()}`,
        name: directoryHandle.name,
        audioCount: audioFiles.length,
        audios: audioFiles.map((file, index) => ({
          id: `audio-${index}-${Date.now()}`,
          title: file.name,
          duration: 'N/A',
          size: formatFileSize(file.size),
          path: URL.createObjectURL(file),
          thumbnail: null,
          isFavorite: false
        })),
        thumbnail: null,
        isLocked: false,
        directoryHandle: directoryHandle
      };

      setFolders(prevFolders => [...prevFolders, newFolder]);
      setSelectedFolder(newFolder);
      setIsLoading(false);
    } catch (error) {
      console.error('Error accessing directory:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const scanDirectoryForAudios = async (directoryHandle) => {
    const audioFiles = [];
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp3'];

    const scanEntries = async (handle) => {
      for await (const entry of handle.values()) {
        if (entry.kind === 'directory') {
          await scanEntries(entry);
        } else if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.type.startsWith('audio/') || allowedTypes.some(type => file.name.endsWith(type.split('/')[1]))) {
            audioFiles.push(file);
          }
        }
      }
    };

    await scanEntries(directoryHandle);
    return audioFiles;
  };

  if (!selectedFolder) {
    return (
      <div className="audios-container-audio">
        {isLoading && <div className="loading-audio">Loading audios...</div>}
        {error && <div className="error-audio">{error}</div>}
        
        <AudioFolders 
          folders={folders} 
          setFolders={setFolders}
          onFolderSelect={handleFolderSelect} 
        />
        
        <div className="directory-access-section-audio">
          <button 
            onClick={loadAudiosFromDirectory} 
            className="access-button-audio"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Access Local Audios'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="audios-container-audio">
      <AudioList 
        audios={selectedFolder.audios}
        setAudios={(updatedAudios) => handleUpdateAudios(selectedFolder.id, updatedAudios)}
        onAudioSelect={onAudioSelect}
        onBack={handleBackToFolders}
        folderName={selectedFolder.name}
      />
    </div>
  );
};