import React, { useState } from 'react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { FaPoll } from 'react-icons/fa';
import './PollModalChatmeGroups.css';

export const PollModal = ({ onClose, onCreatePoll, currentUser }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    // Validate
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    // Create poll object
    const poll = {
      id: `poll_${Date.now()}`,
      question: question.trim(),
      options: filledOptions.map((text, index) => ({
        id: `opt_${index}`,
        text: text.trim(),
        votes: [],
        count: 0
      })),
      allowMultiple,
      isAnonymous,
      createdBy: currentUser?.uid || currentUser?.id || 'unknown',
      createdAt: new Date().toISOString(),
      totalVotes: 0
    };

    onCreatePoll(poll);
    onClose();
  };

  return (
    <div className="poll-modalChatmeGroups-overlay" onClick={onClose}>
      <div className="poll-modalChatmeGroups" onClick={(e) => e.stopPropagation()}>
        <div className="poll-modalChatmeGroups-header">
          <div className="poll-modalChatmeGroups-title">
            <FaPoll />
            <h3>Create Poll</h3>
          </div>
          <button className="poll-modalChatmeGroups-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="poll-modalChatmeGroups-content">
          {/* Question Input */}
          <div className="poll-inputChatmeGroups-group">
            <label>Question</label>
            <input
              type="text"
              className="poll-questionChatmeGroups-input"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              autoFocus
            />
            <span className="poll-charChatmeGroups-count">{question.length}/200</span>
          </div>

          {/* Options */}
          <div className="poll-optionsChatmeGroups-section">
            <label>Options</label>
            {options.map((option, index) => (
              <div key={index} className="poll-optionChatmeGroups-input-row">
                <input
                  type="text"
                  className="poll-optionChatmeGroups-input"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button
                    className="poll-removeChatmeGroups-option"
                    onClick={() => handleRemoveOption(index)}
                    title="Remove option"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <button className="poll-addChatmeGroups-option" onClick={handleAddOption}>
                <FiPlus /> Add Option
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="poll-settingsChatmeGroups">
            <label className="poll-checkboxChatmeGroups-label">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
              />
              <span>Allow multiple answers</span>
            </label>

            <label className="poll-checkboxChatmeGroups-label">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span>Anonymous voting</span>
            </label>
          </div>
        </div>

        <div className="poll-modalChatmeGroups-footer">
          <button className="poll-cancelChatmeGroups-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="poll-createChatmeGroups-btn" onClick={handleCreate}>
            Create Poll
          </button>
        </div>
      </div>
    </div>
  );
};
