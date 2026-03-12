import React from 'react';

export const ReactionMenu = ({ setActiveMessageForReaction, activeMessageForReaction }) => {
  const emojiReactions = [
    { emoji: '❤️', label: 'heart' },
    { emoji: '😂', label: 'laugh' },
    { emoji: '😮', label: 'surprise' },
    { emoji: '😢', label: 'sad' },
    { emoji: '😡', label: 'angry' },
    { emoji: '👍', label: 'thumbs up' },
    { emoji: '🔥', label: 'fire' },
    { emoji: '🎉', label: 'celebration' }
  ];

  return (
    <div 
      className="reaction-menu-overlay" 
      onClick={() => setActiveMessageForReaction(null)}
    >
      <div 
        className="reaction-menu"
        onClick={e => e.stopPropagation()}
      >
        {emojiReactions.map(reaction => (
          <span 
            key={reaction.label}
            className="reaction-option"
            onClick={() => {
              // Handle reaction logic
              setActiveMessageForReaction(null);
            }}
          >
            {reaction.emoji}
          </span>
        ))}
      </div>
    </div>
  );
};

