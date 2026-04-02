import './UserProfile.css';
import { useState, useRef } from 'react';
import LoginPanel from './LoginPanel';

function UserProfile({ onOpenProfile, selectedAccount, onSwitchAccount, onLogout, onUpgrade }) {
  const [isLoginPanelOpen, setIsLoginPanelOpen] = useState(false);
  const [avatar, setAvatar] = useState(localStorage.getItem('userAvatar') || null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  // Use selectedAccount if available, otherwise use default
  const profile = selectedAccount || {
    name: 'John Developer',
    email: 'john@example.com',
    avatar: avatar
  };

  const isSignedIn = !!selectedAccount;

  const handleSignInClick = () => {
    setIsLoginPanelOpen(true);
  };

  const handleLoginSuccess = (userData) => {
    // Call the onOpenProfile callback to refresh/update the account
    if (onOpenProfile) {
      onOpenProfile();
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setAvatar(result);
        setImageError(false);
        localStorage.setItem('userAvatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      <div className="user-profile-menu" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-header">
          <div 
            className="user-avatar-container"
            onClick={handleAvatarClick}
            style={{ cursor: 'pointer' }}
          >
            {profile.avatar && !imageError ? (
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                className="user-avatar"
                onError={handleImageError}
              />
            ) : (
              <svg width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="user-avatar-placeholder">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <div className="user-info">
            <p className="user-name">{profile.name}</p>
            <p className="user-email">{profile.email}</p>
          </div>
        </div>

        <div className="profile-action-buttons">
          <button className="action-btn" onClick={onOpenProfile}>
            <span className="btn-icon">👤</span>
            <span className="btn-label">Profile</span>
          </button>

          <button className="action-btn" onClick={onUpgrade}>
            <span className="btn-icon">⭐</span>
            <span className="btn-label">Upgrade</span>
          </button>

          <button className="action-btn">
            <span className="btn-icon">⚙️</span>
            <span className="btn-label">Settings</span>
          </button>

          <button className="action-btn">
            <span className="btn-icon">👥</span>
            <span className="btn-label">Account</span>
          </button>

          <button className="action-btn" onClick={isSignedIn ? onLogout : handleSignInClick}>
            <span className="btn-icon">{isSignedIn ? '🚪' : '🔓'}</span>
            <span className="btn-label">{isSignedIn ? 'Sign Out' : 'Sign In'}</span>
          </button>
        </div>
      </div>

      <LoginPanel
        isOpen={isLoginPanelOpen}
        onClose={() => setIsLoginPanelOpen(false)}
        onLogin={handleLoginSuccess}
      />
    </>
  );
}

export default UserProfile;
