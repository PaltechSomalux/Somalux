import React from 'react';

export const StatusMessage = ({ statusMessage, setStatusMessage }) => {
  if (!statusMessage) return null;

  return (
    <div 
      className={`status-message ${statusMessage.type}`}
      onClick={() => !statusMessage.persistent && setStatusMessage(null)}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        {statusMessage.type === 'success' ? (
          <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7l-1.41-1.41L9 16.17Z" fill="currentColor"/>
        ) : (
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
        )}
      </svg>
      {statusMessage.text}
      {!statusMessage.persistent && (
        <button className="close-message">
          &times;
        </button>
      )}
    </div>
  );
};

