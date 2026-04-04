// src/components/Chat/MessagesList.js
import React from 'react';
import PropTypes from 'prop-types';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {MessageItem} from './MessageItem';
import './MessagesList.css';

export const MessagesList = ({
  messages,
  currentUser,
  contact,
  expandedMessages,
  replyingTo,
  reportedMessages,
  pinnedMessages,
  enableFeatures,
  onMessageClick,
  onToggleExpand,
  messagesEndRef,
}) => {
  const renderDateSeparator = (date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  return (
    <div className="messages-list">
      {messages.map((message, index) => {
        const showDateSeparator = index === 0 || 
          !isSameDay(new Date(message.timestamp), new Date(messages[index - 1].timestamp));
        
        return (
          <React.Fragment key={message.id}>
            {showDateSeparator && (
              <div className="date-separator">
                {renderDateSeparator(new Date(message.timestamp))}
              </div>
            )}
            
            <MessageItem
              message={message}
              currentUser={currentUser}
              contact={contact}
              isExpanded={expandedMessages.includes(message.id)}
              isReplying={replyingTo?.id === message.id}
              isReported={reportedMessages.includes(message.id)}
              isPinned={pinnedMessages.includes(message.id)}
              enableFeatures={enableFeatures}
              onClick={() => onMessageClick(message)}
              onToggleExpand={() => onToggleExpand(message.id)}
            />
          </React.Fragment>
        );
      })}
      
      {enableFeatures.typingIndicators && (
        <div className="typing-indicator-container">
          {currentUser.isTyping && (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

MessagesList.propTypes = {
  messages: PropTypes.array.isRequired,
  currentUser: PropTypes.object.isRequired,
  contact: PropTypes.object.isRequired,
  expandedMessages: PropTypes.array.isRequired,
  replyingTo: PropTypes.object,
  reportedMessages: PropTypes.array.isRequired,
  pinnedMessages: PropTypes.array.isRequired,
  enableFeatures: PropTypes.object.isRequired,
  onMessageClick: PropTypes.func.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  messagesEndRef: PropTypes.object,
};

