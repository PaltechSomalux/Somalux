import React from 'react';
import { FaTimes } from 'react-icons/fa';

export const QuestionModal = ({ setShowQuestionModal, setActiveQuestion }) => {
  const dealbreakerQuestions = [
    "Do you want children?",
    "What are your thoughts on monogamy?",
    "How important is religion in your life?"
  ];

  return (
    <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
      <div className="question-modal" onClick={e => e.stopPropagation()}>
        <h2>Ask a Question</h2>
        <div className="questions-list">
          {dealbreakerQuestions.map((question, index) => (
            <div 
              key={index} 
              className="question-item"
              onClick={() => {
                setActiveQuestion(question);
                setShowQuestionModal(false);
              }}
            >
              {question}
            </div>
          ))}
        </div>
        <button 
          className="close-question"
          onClick={() => setShowQuestionModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
