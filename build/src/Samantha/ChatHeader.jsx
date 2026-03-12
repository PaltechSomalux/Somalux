import React from 'react';
import { FaTimes, FaMicrophone, FaVideo, FaEllipsisH } from 'react-icons/fa';

export const ChatHeader = ({ match, setActiveChat, startAudioCall, startVideoCall, setShowReportModal }) => {
  return (
    <div className="chat-header">
      <button className="back-button" onClick={() => setActiveChat(null)}>
        <FaTimes />
      </button>
      <div className="chat-partner">
        <img src={match.photos[0]} alt={match.name} />
        <div>
          <h3>{match.name}</h3>
          <p className="status">
            {match.online ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      <div className="chat-actions">
        <button 
          className="audio-call-button"
          onClick={startAudioCall}
        >
          <FaMicrophone />
        </button>
        <button 
          className="video-call-button"
          onClick={startVideoCall}
        >
          <FaVideo />
        </button>
        <button 
          className="more-button"
          onClick={() => setShowReportModal(true)}
        >
          <FaEllipsisH />
        </button>
      </div>
    </div>
  );
};

