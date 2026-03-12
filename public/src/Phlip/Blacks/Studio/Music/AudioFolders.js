import React, { useState, useEffect } from 'react';
import './AudioFolders.css'; // Already has audio-specific name

export const AudioFolders = ({ folders, setFolders, onFolderSelect }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [showMenuForFolder, setShowMenuForFolder] = useState(null);

  // Load folders from localStorage on initial render
  useEffect(() => {
    const savedFolders = localStorage.getItem('audioFolders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    }
  }, [setFolders]);

  // Save folders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('audioFolders', JSON.stringify(folders));
  }, [folders]);

  const handleDeleteFolder = (folderId) => {
    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    setFolders(updatedFolders);
    setShowMenuForFolder(null);
  };

  const handleRenameFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    setEditFolderName(folder.name);
    setEditingFolderId(folderId);
    setShowMenuForFolder(null);
  };

  const saveFolderName = () => {
    if (!editFolderName.trim()) return;
    
    const updatedFolders = folders.map(folder => 
      folder.id === editingFolderId ? { ...folder, name: editFolderName } : folder
    );
    setFolders(updatedFolders);
    setEditingFolderId(null);
  };

  const toggleLockFolder = (folderId) => {
    const updatedFolders = folders.map(folder => 
      folder.id === folderId ? { ...folder, isLocked: !folder.isLocked } : folder
    );
    setFolders(updatedFolders);
    setShowMenuForFolder(null);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const colors = ['FFAD08', 'EDD382', 'FC7174', '6DD3CE', 'C8E9A0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const thumbnail = `https://via.placeholder.com/256/${randomColor}/FFFFFF?text=${encodeURIComponent(newFolderName)}`;
    
    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      audioCount: 0,
      audios: [],
      thumbnail: thumbnail,
      isLocked: false
    };
    
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setShowAddFolderModal(false);
  };

  return (
    <div className="audio-organizer-audio">
      <div className="tabs-audio">
        <button 
          className={`tab-button-audio ${activeTab === 'all' ? 'active-audio' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <div className="tab-icon-wrapper-audio">
            <span>All</span>
          </div>
        </button>
        <button 
          className={`tab-button-audio ${activeTab === 'recent' ? 'active-audio' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <div className="tab-icon-wrapper-audio">
          
            <span>Recent</span>
          </div>
        </button>
        <button 
          className={`tab-button-audio ${activeTab === 'playlist' ? 'active-audio' : ''}`}
          onClick={() => setActiveTab('playlist')}
        >
          <div className="tab-icon-wrapper-audio">
          
            <span>Playlist</span>
          </div>
        </button>
      </div>

      <div className="folders-list-audio">
        {folders.map(folder => (
          <div 
            key={folder.id} 
            className="folder-card-audio"
            onClick={(e) => {
              if (!e.target.closest('.folder-menu-audio') && !editingFolderId) {
                onFolderSelect(folder);
              }
            }}
          >
            <div className="folder-header-thumbnail-container-audio">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
              {folder.isLocked && (
                <div className="lock-icon-audio">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              )}
            </div>
            
            <div className="folder-header-info-audio">
              {editingFolderId === folder.id ? (
                <input
                  type="text"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  onBlur={saveFolderName}
                  onKeyPress={(e) => e.key === 'Enter' && saveFolderName()}
                  autoFocus
                />
              ) : (
                <>
                  <h2 className="folder-header-name-audio">{folder.name}</h2>
                  <p className="folder-header-count-audio">{folder.audioCount} audios</p>
                </>
              )}
            </div>
            
            <div className="folder-menu-container-audio">
              <button 
                className="folder-menu-button-audio"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenuForFolder(showMenuForFolder === folder.id ? null : folder.id);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              
              {showMenuForFolder === folder.id && (
                <div className="folder-menu-dropdown-audio">
                  <button onClick={() => handleRenameFolder(folder.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Rename
                  </button>
                  <button onClick={() => toggleLockFolder(folder.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d={folder.isLocked ? 
                        "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" : 
                        "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"}/>
                    </svg>
                    {folder.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                  <button className="delete-button-audio" onClick={() => handleDeleteFolder(folder.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button 
        className="floating-add-btn-audio"
        onClick={() => setShowAddFolderModal(true)}
      >
        +
      </button>

      {showAddFolderModal && (
        <div className="modal-audio">
          <div className="modal-content-audio">
            <h3>Create Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="modal-actions-audio">
              <button onClick={handleCreateFolder}>
                Create
              </button>
              <button onClick={() => setShowAddFolderModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};