// StoryInteraction.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import "./StoryInteraction.css";

const MAX_MESSAGE_LENGTH = 100;

export const StoryInteraction = ({ 
  reactToStory, 
  disabled = false,
  initialReactions = [],
  maxMessageLength = MAX_MESSAGE_LENGTH,
  placeholderText = "Message . . .",
  sendButtonLabel = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}) => {
  const [message, setMessage] = useState('');
  const [recentReactions, setRecentReactions] = useState([]);
  const [showReactions, setShowReactions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Handle reaction click
  const handleReaction = useCallback((reaction) => {
    if (disabled) return;
    
    reactToStory(reaction);
    
    // Add to recent reactions (but don't duplicate)
    setRecentReactions(prev => {
      const withoutNew = prev.filter(r => r !== reaction);
      return [reaction, ...withoutNew].slice(0, 3);
    });
  }, [disabled, reactToStory]);

  // Handle message submission
  const handleMessageSubmit = useCallback(() => {
    if (disabled || !message.trim()) return;
    
    const trimmedMessage = message.trim().slice(0, maxMessageLength);
    reactToStory(`💬 ${trimmedMessage}`);
    setMessage('');
    inputRef.current?.focus();
  }, [disabled, message, reactToStory, maxMessageLength]);

  // Handle key press events
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleMessageSubmit();
    }
  }, [handleMessageSubmit]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowReactions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Combined reactions (recent + default without duplicates)
  const allReactions = React.useMemo(() => {
    const combined = [...recentReactions];
    initialReactions.forEach(r => {
      if (!combined.includes(r)) {
        combined.push(r);
      }
    });
    return combined.slice(0, initialReactions.length); // Keep original count
  }, [recentReactions, initialReactions]);

  return (
    <div 
      className="imo-story-interaction" 
      data-testid="story-interaction"
      ref={containerRef}
    >
      {initialReactions.length > 0 && (
        <div className="imo-story-reactions-container">
          <button
            className="imo-story-reaction-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactions(!showReactions);
            }}
            disabled={disabled}
            aria-label={showReactions ? "Hide reactions" : "Show reactions"}
          >
            {showReactions ? '×' : '😊'}
          </button>
          
          {showReactions && (
            <div className="imo-story-reactions">
              {allReactions.map((reaction) => (
                <button
                  key={reaction}
                  className="imo-story-reaction"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction(reaction);
                    setShowReactions(false);
                  }}
                  disabled={disabled}
                  aria-label={`React with ${reaction}`}
                >
                  {reaction}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="imo-story-message">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, maxMessageLength))}
          onKeyPress={handleKeyPress}
          onClick={(e) => e.stopPropagation()}
          placeholder={placeholderText}
          disabled={disabled}
          aria-label="Message input"
          maxLength={maxMessageLength}
        />
        {message.length > 0 && (
          <span className="imo-story-message-counter">
            {message.length}/{maxMessageLength}
          </span>
        )}
        <button
          className="imo-story-send"
          onClick={(e) => {
            e.stopPropagation();
            handleMessageSubmit();
          }}
          disabled={disabled || !message.trim()}
          aria-label="Send message"
        >
          {sendButtonLabel}
        </button>
      </div>
    </div>
  );
};

StoryInteraction.propTypes = {
  reactToStory: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  initialReactions: PropTypes.arrayOf(PropTypes.string),
  maxMessageLength: PropTypes.number,
  placeholderText: PropTypes.string,
  sendButtonLabel: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ])
};

StoryInteraction.defaultProps = {
  initialReactions: [],
  maxMessageLength: MAX_MESSAGE_LENGTH
};