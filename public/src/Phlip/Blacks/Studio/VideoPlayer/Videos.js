import React, { useState, useEffect } from 'react';
import { FoldersList } from './FoldersList';
import { VideosList } from './VideosList';
import './Videos.css';

export const Videos = ({ onVideoSelect }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load folders from localStorage on mount
  useEffect(() => {
    const savedFolders = localStorage.getItem('videoFolders');
    if (savedFolders) {
      try {
        const parsedFolders = JSON.parse(savedFolders);
        setFolders(parsedFolders);
        if (parsedFolders.length > 0) {
          setSelectedFolder(parsedFolders[0]);
        }
      } catch (e) {
        console.error('Failed to parse saved folders', e);
        setError('Failed to load saved folders');
      }
    }
  }, []);

  // Save folders to localStorage whenever they change (sanitize non-serializable fields)
  useEffect(() => {
    try {
      const safeFolders = (folders || []).map((folder) => ({
        id: folder.id,
        name: folder.name,
        videoCount: (folder.videos && folder.videos.length) || folder.videoCount || 0,
        thumbnail: folder.thumbnail || null,
        isLocked: !!folder.isLocked,
        // Persist minimal serializable metadata for videos
        videos: (folder.videos || []).map((v) => ({
          id: v.id,
          title: v.title,
          duration: v.duration,
          size: v.size,
          isFavorite: !!v.isFavorite,
        })),
      }));
      localStorage.setItem('videoFolders', JSON.stringify(safeFolders));
    } catch (e) {
      console.error('Failed to save folders to localStorage:', e);
    }
  }, [folders]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpdateVideos = (folderId, updatedVideosOrUpdater) => {
    const computeNext = (prevVideos) => {
      return typeof updatedVideosOrUpdater === 'function'
        ? updatedVideosOrUpdater(prevVideos)
        : updatedVideosOrUpdater;
    };

    setFolders((prev) => {
      const updated = prev.map(folder => {
        if (folder.id === folderId) {
          const nextVideos = computeNext(folder.videos || []);
          return { ...folder, videos: nextVideos, videoCount: nextVideos.length };
        }
        return folder;
      });
      return updated;
    });

    setSelectedFolder((prev) => {
      if (prev && prev.id === folderId) {
        const nextVideos = computeNext(prev.videos || []);
        return { ...prev, videos: nextVideos, videoCount: nextVideos.length };
      }
      return prev;
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

  const loadVideosFromDirectory = async () => {
    try {
      // Check if File System Access API is supported
      if (!window.showDirectoryPicker) {
        setError('File System Access API is not supported in this browser. Please use a modern browser like Chrome or Edge.');
        return;
      }

      setIsLoading(true);
      setError(null);

      let directoryHandle;
      try {
        directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
      } catch (err) {
        // Handle user cancellation or permission denial
        if (err.name === 'AbortError') {
          setError('Directory selection was cancelled.');
          setIsLoading(false);
          return;
        }
        throw err; // Rethrow other errors
      }

      const videoFiles = await scanDirectoryForVideos(directoryHandle);

      if (videoFiles.length === 0) {
        setError('No video files found in the selected directory');
        setIsLoading(false);
        return;
      }

      const newFolder = {
        id: `local-${Date.now()}`,
        name: directoryHandle.name,
        videoCount: videoFiles.length,
        videos: videoFiles.map((file, index) => ({
          id: `video-${index}-${Date.now()}`,
          title: file.name,
          duration: 'N/A',
          size: formatFileSize(file.size),
          path: URL.createObjectURL(file),
          thumbnail: null,
          isFavorite: false,
        })),
        thumbnail: null,
        isLocked: false,
        directoryHandle: directoryHandle,
      };

      setFolders((prevFolders) => {
        const updatedFolders = prevFolders.filter(
          (folder) => folder.name !== directoryHandle.name
        );
        return [...updatedFolders, newFolder];
      });
      setSelectedFolder(newFolder);
      setIsLoading(false);
    } catch (error) {
      console.error('Error accessing directory:', error);
      setError(error.message || 'Failed to access directory');
      setIsLoading(false);
    }
  };

  const scanDirectoryForVideos = async (directoryHandle) => {
    const videoFiles = [];
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    const scanEntries = async (handle) => {
      for await (const entry of handle.values()) {
        if (entry.kind === 'directory') {
          await scanEntries(entry);
        } else if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (
            file.type.startsWith('video/') ||
            allowedTypes.some((type) => file.name.toLowerCase().endsWith(type.split('/')[1]))
          ) {
            videoFiles.push(file);
          }
        }
      }
    };

    await scanEntries(directoryHandle);
    return videoFiles;
  };

  // Add a button to trigger directory selection manually
  const handleOpenDirectory = () => {
    loadVideosFromDirectory();
  };

  if (!selectedFolder) {
    return (
      <div className="videos-container">
        {isLoading && <div className="loading">Loading videos...</div>}
        {error && <div className="error">{error}</div>}
        <button onClick={handleOpenDirectory} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Select Video Folder'}
        </button>
        <FoldersList
          folders={folders}
          setFolders={setFolders}
          onFolderSelect={handleFolderSelect}
        />
      </div>
    );
  }

  return (
    <div className="videos-container">
      <VideosList
        videos={selectedFolder.videos}
        setVideos={(updatedVideos) => handleUpdateVideos(selectedFolder.id, updatedVideos)}
        onVideoSelect={onVideoSelect}
        onBack={handleBackToFolders}
        folderName={selectedFolder.name}
      />
    </div>
  );
};