import React from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import "./EmptyChatView.css";

export const EmptyChatView = ({ isMobileView }) => {
  return (
    <div className={`chatme-empty-chat-view ${isMobileView ? 'chatme-mobile-empty-view' : ''}`}>
      <div className="chatme-empty-chat-content">
        <FiMessageSquare className="chatme-chat-icon" />
        <h2>Lets Vibe</h2>
        <p>Select a chat to start messaging</p>
      </div>
    </div>
  );
};

