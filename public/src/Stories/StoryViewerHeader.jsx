// StoryViewerHeader.js
import React from 'react';
import "./StoryViewerHeader.css";
export const StoryViewerHeader = ({ storyViewer, setStoryViewer, setShowViewers }) => {
  return (
    <div className="imo-story-viewer-header">
      <div className="imo-story-viewer-user">
        <div className="imo-story-viewer-avatar">{storyViewer.avatar}</div>
        <div className="imo-story-viewer-info">
          <span>{storyViewer.username}</span>
          <small>{storyViewer.time}</small>
        </div>
      </div>
      <div className="imo-story-viewer-actions">
        <button 
          className="imo-story-viewer-action"
          onClick={() => setShowViewers(prev => !prev)}
        >
          👁️ {storyViewer.viewers.length}
        </button>
        <button 
          className="imo-story-viewer-close" 
          onClick={() => setStoryViewer(null)}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
