import React from 'react';
import { 
  FaUser, 
  FaMapMarkerAlt, 
  FaCreditCard, 
  FaHeart, 
  FaQuestionCircle, 
  FaCog, 
  FaCrown, 
  FaSignOutAlt, 
  FaShieldAlt, 
  FaBolt, 
  FaCoins, 
  FaGem 
} from 'react-icons/fa';

export const SettingsTab = ({
  profile,
  darkMode,
  handleDarkModeToggle,
  incognitoMode,
  handleIncognitoModeToggle,
  setShowSellerVerification,
  setShowPremiumModal,
  activeProfileTab,
  setActiveProfileTab,
  setProfile,
  setShowVerificationModal,
  handleStartSelling
}) => {
  return (
    <div className="settings-tab">
      <div className="settings-sections">
        <div className="settings-sidebar">
          <button 
            className={`settings-menu ${activeProfileTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveProfileTab('settings')}
          >
            Account Settings
          </button>
          <button className="settings-menu">
            Privacy & Security
          </button>
          <button className="settings-menu">
            Payment Methods
          </button>
          <button className="settings-menu">
            Shipping Addresses
          </button>
          <button className="settings-menu">
            Notification Preferences
          </button>
          {profile.seller && (
            <button className="settings-menu">
              Seller Settings
            </button>
          )}
          <button className="settings-menu">
            Help & Support
          </button>
        </div>
        
        <div className="settings-content">
          <div className="account-settings">
            <h3>Account Information</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              />
              {!profile.verified && (
                <button 
                  className="verify-email"
                  onClick={() => setShowVerificationModal(true)}
                >
                  Verify Email
                </button>
              )}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="preference-settings">
            <h3>Preferences</h3>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={darkMode}
                  onChange={handleDarkModeToggle}
                />
                <span className="checkmark"></span>
                Dark Mode
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={incognitoMode}
                  onChange={handleIncognitoModeToggle}
                  disabled={!profile.premium}
                />
                <span className="checkmark"></span>
                Incognito Mode
                {!profile.premium && (
                  <span className="premium-feature">
                    <FaCrown /> Premium Feature
                  </span>
                )}
              </label>
            </div>
            <div className="form-group">
              <label>Language</label>
              <select
                value={profile.preferences.language}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    language: e.target.value
                  }
                }))}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={profile.preferences.currency}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    currency: e.target.value
                  }
                }))}
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
              </select>
            </div>
          </div>
          
          {!profile.seller && (
            <div className="become-seller">
              <h3>Become a Seller</h3>
              <p>Start selling your products to millions of customers and grow your business with MarketHub.</p>
              <button 
                className="start-selling"
                onClick={handleStartSelling}
              >
                Start Selling Now
              </button>
            </div>
          )}
          
          {!profile.premium && (
            <div className="go-premium">
              <h3>Upgrade to Premium</h3>
              <div className="premium-features">
                <div className="feature">
                  <FaShieldAlt />
                  <span>Incognito Mode</span>
                </div>
                <div className="feature">
                  <FaBolt />
                  <span>Priority Support</span>
                </div>
                <div className="feature">
                  <FaCoins />
                  <span>Exclusive Discounts</span>
                </div>
                <div className="feature">
                  <FaGem />
                  <span>Early Access to New Features</span>
                </div>
              </div>
              <button 
                className="upgrade-button"
                onClick={() => setShowPremiumModal(true)}
              >
                <FaCrown /> Upgrade Now - $9.99/month
              </button>
            </div>
          )}
          
          <div className="account-actions">
            <h3>Account Actions</h3>
            <button className="change-password">
              Change Password
            </button>
            <button className="delete-account">
              Delete Account
            </button>
            <button className="logout-button">
              <FaSignOutAlt /> Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};