// ViewersList.js
import React from 'react';
import "./ViewersList.css";
export const ViewersList = ({ storyViewer }) => {
  return (
    <div className="imo-story-viewers-list">
      <h4>Viewed by</h4>
      {storyViewer.viewers.map(viewer => (
        <div key={viewer} className="imo-story-viewer-item">
          <span className="imo-viewer-avatar">{viewer.charAt(0)}</span>
          <span>{viewer}</span>
        </div>
      ))}
    </div>
  );
};
