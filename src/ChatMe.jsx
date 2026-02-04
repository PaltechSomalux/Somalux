import React, { useState, useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import ChatMeApp from './components/ChatMe/ChatMe';

const ChatMe = ({ userProfile, onChatWindowActive, onChatSelected }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ChatMe has its own initialization
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#8696a0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '3px solid rgba(0, 168, 132, 0.2)',
            borderTop: '3px solid #00a884',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Loading ChatMe...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <ChatMeApp onChatWindowActive={onChatWindowActive} onChatSelected={onChatSelected} />
    </div>
  );
};

export default ChatMe;

