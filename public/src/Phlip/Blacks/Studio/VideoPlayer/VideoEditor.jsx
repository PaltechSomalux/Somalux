import React, { useState } from 'react';
import './VideoEditor.css';
import { VideoPlayer } from './VideoPLayer';
export const VideoEditor = () => {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All' }, 
    { id: 'recent', label: 'Recent' },
    { id: 'playlist', label: 'Playlists' },
    { id: 'convert', label: 'Convert' },  // Moved to fourth position
    { id: 'edit', label: 'Edit' },       // Renamed from 'trim' to 'edit'
    { id: 'effects', label: 'Effects' },
    { id: 'merge', label: 'Merge' },
    { id: 'subtitles', label: 'Subtitles' },
    { id: 'speed', label: 'Speed' },
    { id: 'rotate', label: 'Rotate' },
  ];

  return (
    <div className="video-editor">
      <div className="tabs-container">
        <div className="tabs-scrollable">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="content-area">
        {activeTab === 'all' ? (
          <VideoPlayer /> 
        ) : (
          <>
            {activeTab === 'recent' && (
              <div className="tab-content">
                <h3>Recent Videos</h3>
                <p>Your recently viewed videos will appear here</p>
                <div className="placeholder-content"></div>
              </div>
            )}
            {activeTab === 'playlist' && (
              <div className="tab-content">
                <h3>Playlists</h3>
                <p>Your video playlists will appear here</p>
                <div className="placeholder-content"></div>
              </div>
            )}
            {activeTab === 'convert' && (
              <div className="tab-content">
                <h3>Convert Video</h3>
                <p>Video conversion features will be implemented here</p>
                <div className="placeholder-content"></div>
              </div>
            )}
            {activeTab === 'edit' && (
              <div className="tab-content">
                <h3>Video Editor</h3>
                <p>Video editing features will be implemented here</p>
                <div className="placeholder-content"></div>
              </div>
            )}
            {/* Other tab contents can be added here following the same pattern */}
          </>
        )}
      </div>
    </div>
  ); 
};