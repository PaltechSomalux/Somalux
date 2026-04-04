import React from 'react';
import PropTypes from 'prop-types';

export const Reactions = ({ reactions }) => {
  if (!reactions || reactions.length === 0) return null;
  
  const reactionGroups = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = 0;
    }
    acc[reaction.emoji]++;
    return acc;
  }, {});
  
  return (
    <div className="reactions-container">
      {Object.entries(reactionGroups).map(([emoji, count]) => (
        <span key={emoji} className="reaction-bubble">
          {emoji} {count > 1 ? count : ''}
        </span>
      ))}
    </div>
  );
};

Reactions.propTypes = {
  reactions: PropTypes.array
};
