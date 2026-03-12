import React from 'react';
import { FaCopy, FaExclamationTriangle } from 'react-icons/fa';
import "./MessageMenu.css";

export const MessageMenu = ({ 
  activeMessageMenu, 
  setActiveMessageMenu, 
  setActiveMessageForReaction,
  messageMenuPosition 
}) => {
  return (
    <div 
      className="message-menu-overlay" 
      onClick={() => setActiveMessageMenu(null)}
    >
      <div 
        className="message-menu" 
        style={{ top: `${messageMenuPosition.y}px`, left: `${messageMenuPosition.x}px` }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="message-menu-item"
          onClick={() => {
            setActiveMessageForReaction(activeMessageMenu);
            setActiveMessageMenu(null);
          }}
        >
          Add Reaction
        </div>
        <div className="message-menu-item">
          <FaCopy /> Copy Text
        </div>
        <div className="message-menu-item">
          <FaExclamationTriangle /> Report Message
        </div>
      </div>
    </div>
  );
};

