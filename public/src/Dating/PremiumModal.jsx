import React from 'react';
import { FaStar, FaLock, FaRegCompass, FaRegClock } from 'react-icons/fa';

export const PremiumModal = ({ setShowPremiumModal }) => {
  return (
    <div className="modal-overlay" onClick={() => setShowPremiumModal(false)}>
      <div className="premium-modal" onClick={e => e.stopPropagation()}>
        <h2>Upgrade to Premium</h2>
        <div className="premium-features">
          <div className="feature">
            <FaStar className="premium-icon" />
            <h3>Unlimited Likes</h3>
            <p>Swipe right as much as you want</p>
          </div>
          {/* More features... */}
        </div>
        
        <div className="pricing-options">
          <div className="option">
            <h3>1 Month</h3>
            <p>$9.99/month</p>
            <button>Choose</button>
          </div>
          {/* More options... */}
        </div>
        
        <button 
          className="close-premium"
          onClick={() => setShowPremiumModal(false)}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

