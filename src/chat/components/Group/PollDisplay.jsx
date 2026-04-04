import React, { useState, useMemo, useEffect } from 'react';
import { FaPoll, FaCheckCircle } from 'react-icons/fa';
import './PollDisplay.css';

export const PollDisplay = ({ poll, currentUser, onVote }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);

  // Check if current user has already voted
  const userVotes = useMemo(() => {
    const votes = [];
    const userId = currentUser?.uid || currentUser?.id;
    poll.options.forEach((option) => {
      if (option.votes?.includes(userId)) {
        votes.push(option.id);
      }
    });
    return votes;
  }, [poll.options, currentUser]);

  const alreadyVoted = userVotes.length > 0 || hasVoted;

  // Reset hasVoted if poll data updates from Firestore (on refresh or real-time update)
  useEffect(() => {
    if (userVotes.length > 0) {
      setHasVoted(true);
      setSelectedOptions([]);
    }
  }, [userVotes]);

  // Calculate total votes
  const totalVotes = useMemo(() => {
    return poll.options.reduce((sum, option) => sum + (option.count || option.votes?.length || 0), 0);
  }, [poll.options]);

  // Handle option selection
  const handleOptionClick = (optionId) => {
    if (alreadyVoted) return;

    if (poll.allowMultiple) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  // Submit vote
  const handleVote = () => {
    if (selectedOptions.length === 0) return;

    onVote(poll.id, selectedOptions);
    setHasVoted(true);
  };

  // Calculate percentage for each option
  const getPercentage = (option) => {
    if (totalVotes === 0) return 0;
    const count = option.count || option.votes?.length || 0;
    return Math.round((count / totalVotes) * 100);
  };

  // Check if option is selected by user
  const isSelected = (optionId) => {
    return selectedOptions.includes(optionId);
  };

  // Check if option was voted by user
  const isVotedByUser = (optionId) => {
    return userVotes.includes(optionId);
  };

  // Get bar color class based on option text (to match image)
  const getBarColorClass = (optionText) => {
    const lowerText = optionText.toLowerCase();
    if (lowerText.includes('above') || lowerText.includes('good') || lowerText.includes('excellent')) {
      return 'above-average';
    } else if (lowerText.includes('average') || lowerText.includes('ok') || lowerText.includes('neutral')) {
      return 'average';
    } else if (lowerText.includes('below') || lowerText.includes('bad') || lowerText.includes('poor')) {
      return 'below-average';
    }
    return ''; // Default
  };

  return (
    <div className="poll-display">
      <div className="poll-header">
        <FaPoll className="poll-icon" />
        <span className="poll-badge">Poll</span>
      </div>

      <div className="poll-question">{poll.question}</div>

      <div className="poll-options">
        {poll.options.map((option) => {
          const percentage = getPercentage(option);
          const count = option.count || option.votes?.length || 0;
          const selected = isSelected(option.id);
          const votedByUser = isVotedByUser(option.id);
          const barColorClass = getBarColorClass(option.text);

          return (
            <div
              key={option.id}
              className={`poll-option ${alreadyVoted ? 'voted' : 'clickable'} ${selected ? 'selected' : ''} ${votedByUser ? 'user-voted' : ''}`}
              onClick={() => handleOptionClick(option.id)}
            >
              {!alreadyVoted ? (
                // Pre-vote layout with checkboxes
                <div className="poll-option-checkbox">
                  <input
                    type={poll.allowMultiple ? 'checkbox' : 'radio'}
                    checked={selected}
                    readOnly
                  />
                  <span className="poll-option-text-prevote">
                    {option.text}
                  </span>
                </div>
              ) : (
                // Post-vote layout matching image
                <>
                  <div className="poll-option-label">
                    <span>{option.text}</span>
                    {votedByUser && <span className="user-vote-indicator">Your vote</span>}
                  </div>
                  <div className="poll-bar-container">
                    <div
                      className={`poll-bar ${barColorClass} ${votedByUser ? 'user-voted' : ''}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="poll-bar-stats">
                    <span className="poll-vote-count">{count} {count === 1 ? 'vote' : 'votes'}</span>
                    <span className="poll-percentage">{percentage}%</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!alreadyVoted && selectedOptions.length > 0 && (
        <button className="poll-vote-btn" onClick={handleVote}>
          Vote
        </button>
      )}

      <div className="poll-footer">
        {alreadyVoted && (
          <span className="poll-total-votes">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        )}
        {poll.isAnonymous && (
          <span className="poll-anonymous-badge">Anonymous</span>
        )}
        {poll.allowMultiple && !alreadyVoted && (
          <span className="poll-multiple-badge">Multiple answers allowed</span>
        )}
      </div>
    </div>
  );
};