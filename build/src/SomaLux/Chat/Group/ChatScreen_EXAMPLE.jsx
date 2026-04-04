// ChatScreen.jsx - Example Integration with useGroupChatState
// This is a simplified example showing the key integration points

import React, { useEffect, useRef } from 'react';
import { useGroupChatState } from './useGroupChatState';
import { GroupHeader } from "./GroupHeader";
import { InputArea } from './InputArea';
import "./ChatScreen.css";

export const ChatScreen = ({
  group,
  currentUser, // Must have: { uid, name }
  onBackClick,
}) => {
  const messagesEndRef = useRef(null);

  // Use the group chat hook
  const {
    messages,
    newMessage,
    setNewMessage,
    typingUsers, // { userId: userName, ... }
    replyingTo,
    setReplyingTo,
    sendMessage,
    handleTyping,
    markRead,
    wsReady,
  } = useGroupChatState({
    groupId: group.id,
    currentUser,
    initialMessages: [],
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessages = messages.filter(
        msg => msg.sender !== currentUser.uid && !(msg.readBy || []).includes(currentUser.uid)
      );
      if (unreadMessages.length > 0) {
        markRead(unreadMessages.map(m => m.id));
      }
    }
  }, [messages, currentUser.uid, markRead]);

  // Handle send
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
    }
  };

  // Format typing indicator text
  const typingNames = Object.values(typingUsers);
  const typingText = typingNames.length > 0
    ? `${typingNames.join(', ')} ${typingNames.length === 1 ? 'is' : 'are'} typing...`
    : null;

  // Render a single message
  const renderMessage = (msg) => {
    const isYou = msg.sender === currentUser.uid;
    const senderName = msg.senderName || (isYou ? 'You' : 'Unknown');

    return (
      <div key={msg.id} className={`message ${isYou ? 'sent' : 'received'}`}>
        {/* ALWAYS show sender name in group chats */}
        <div className="sender-name">
          {senderName}
        </div>
        
        {/* Reply-to indicator (if applicable) */}
        {msg.replyingTo && (
          <div className="reply-to-indicator">
            Replying to: {msg.replyingTo.text?.substring(0, 50)}...
          </div>
        )}
        
        {/* Message bubble */}
        <div className="message-bubble">
          {msg.text}
        </div>
        
        {/* Message metadata */}
        <div className="message-meta">
          <span className="message-time">
            {formatTime(msg.timestamp)}
          </span>
          {isYou && (
            <span className="message-status">
              {msg.status === 'read' ? '✓✓ Read' : msg.status === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Format time helper
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-screen">
      {/* Header with typing indicator */}
      <GroupHeader
        group={{
          ...group,
          typingText, // Pass typing text to header
        }}
        onBackClick={onBackClick}
        wsReady={wsReady}
      />
      
      {/* Messages Container */}
      <div className="messages-container">
        {messages.map(renderMessage)}
        
        {/* Typing Indicator (in messages area) */}
        {typingText && (
          <div className="typing-indicator-bubble">
            <div className="typing-dots">●●●</div>
            <div className="typing-text">{typingText}</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <InputArea
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        handleTyping={handleTyping} // Use handleTyping instead of setNewMessage
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        currentUser={currentUser}
        isGroup={true}
      />
    </div>
  );
};

// CSS additions needed:
/*
.sender-name {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.message.received .sender-name {
  color: #00a884;
}

.message.sent .sender-name {
  color: #d1d7db;
  text-align: right;
}

.message-bubble {
  background: #202c33;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 400px;
}

.message.sent .message-bubble {
  background: #005c4b;
  margin-left: auto;
}

.message-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #8696a0;
  margin-top: 2px;
}

.message.sent .message-meta {
  justify-content: flex-end;
}

.typing-indicator-bubble {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #202c33;
  border-radius: 8px;
  max-width: 200px;
  margin: 8px 0;
}

.typing-dots {
  animation: blink 1.4s infinite;
  color: #00a884;
}

@keyframes blink {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.typing-text {
  color: #8696a0;
  font-size: 14px;
}
*/
