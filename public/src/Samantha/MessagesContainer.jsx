import React, { useRef, useEffect } from 'react';
import "./MessagesContainer.css";

export const MessagesContainer = ({ messages, setActiveMessageMenu, setMessageMenuPosition }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageMenu = (e, messageId) => {
    e.preventDefault();
    setActiveMessageMenu(messageId);
    setMessageMenuPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="messages-container">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`message ${msg.senderId === '123' ? 'sent' : 'received'}`}
          onContextMenu={(e) => handleMessageMenu(e, msg.id)}
        >
          {msg.isAudio ? (
            <div className="audio-message">
              <audio src={msg.audioUrl} controls />
            </div>
          ) : (
            <>
              <p>{msg.text}</p>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {msg.senderId === '123' && (
                <span className="message-status">
                  {msg.read ? 'Read' : 'Delivered'}
                </span>
              )}
            </>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

