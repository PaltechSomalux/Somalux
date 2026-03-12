import React from 'react';
import { FaStar } from 'react-icons/fa';

export const BoostModal = ({ setShowBoostModal }) => {
  return (
    <div className="modal-overlay" onClick={() => setShowBoostModal(false)}>
      <div className="boost-modal" onClick={e => e.stopPropagation()}>
        <h2>Profile Boost Activated!</h2>
        <div className="boost-content">
          <div className="boost-icon">
            <FaStar />
          </div>
          <p>Your profile will be shown to <strong>10x more people</strong> for the next 30 minutes.</p>
        </div>
        <button 
          className="close-boost"
          onClick={() => setShowBoostModal(false)}
        >
          Got It!
        </button>
      </div>
    </div>
  );
};

