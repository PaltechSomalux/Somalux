import React from 'react';
import { FaTimes, FaShieldAlt, FaBolt, FaCoins, FaGem, FaCrown } from 'react-icons/fa';

export const PremiumModal = ({
  setShowPremiumModal,
  profile
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowPremiumModal(false)}>
      <div className="premium-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upgrade to Premium</h2>
          <button className="close-modal" onClick={() => setShowPremiumModal(false)}>
            <FaTimes />
          </button>
        </div>
        
        <div className="premium-features">
          <div className="feature">
            <FaShieldAlt />
            <h3>Incognito Mode</h3>
            <p>Browse and shop without leaving traces in your history</p>
          </div>
          <div className="feature">
            <FaBolt />
            <h3>Priority Support</h3>
            <p>Get your issues resolved faster with dedicated support</p>
          </div>
          <div className="feature">
            <FaCoins />
            <h3>Exclusive Discounts</h3>
            <p>Access to premium-only deals and coupons</p>
          </div>
          <div className="feature">
            <FaGem />
            <h3>Early Access</h3>
            <p>Try new features before everyone else</p>
          </div>
        </div>
        
        <div className="pricing-options">
          <div className="pricing-option">
            <h3>Monthly</h3>
            <div className="price">$9.99/month</div>
            <button className="subscribe-button">
              Subscribe
            </button>
          </div>
          <div className="pricing-option recommended">
            <div className="recommended-badge">Best Value</div>
            <h3>Yearly</h3>
            <div className="price">$7.99/month</div>
            <div className="billed">$95.88 billed annually</div>
            <button className="subscribe-button">
              Subscribe
            </button>
          </div>
        </div>
        
        <div className="payment-security">
          <FaShieldAlt />
          <span>Secure payment processed by Stripe</span>
        </div>
      </div>
    </div>
  );
};

