// ReactionsPopup.js
import React from 'react';
import "./ReactionsPopup.css";
export const ReactionsPopup = ({ storyViewer }) => {
  return (
    <div className="imo-reactions-popup">
      {storyViewer.reactions.map((reaction, idx) => (
        <div key={idx} className="imo-reaction-item">
          <span>{reaction.type}</span>
          <small>{reaction.user}</small>
        </div>
      ))}
    </div>
  );
};

