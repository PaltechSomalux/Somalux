import React, { useState } from 'react';

export const IcebreakerModal = ({ setShowIcebreakerModal, match }) => {
  const [icebreakerAnswer, setIcebreakerAnswer] = useState('');

  return (
    <div className="modal-overlay" onClick={() => setShowIcebreakerModal(false)}>
      <div className="icebreaker-modal" onClick={e => e.stopPropagation()}>
        <h2>Icebreaker</h2>
        <p>{match?.icebreakers?.[0]}</p>
        <textarea
          value={icebreakerAnswer}
          onChange={(e) => setIcebreakerAnswer(e.target.value)}
          placeholder="Type your answer..."
        />
        <div className="icebreaker-actions">
          <button 
            className="skip-button"
            onClick={() => setShowIcebreakerModal(false)}
          >
            Skip
          </button>
          <button 
            className="send-button"
            onClick={() => {
              // Handle sending icebreaker
              setShowIcebreakerModal(false);
            }}
            disabled={!icebreakerAnswer.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

