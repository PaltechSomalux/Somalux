import { useState, useEffect } from 'react';

function Profile() {
  const [avatar, setAvatar] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Load saved avatar from localStorage
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
      setImageError(false);
    }
  }, []);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="Profile">
      <div className="profile-avatar" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
        {avatar && !imageError ? (
          <img src={avatar} alt="User Avatar" onError={handleImageError} />
        ) : (
          <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="user-circle-placeholder">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        )}
      </div>
    </div>
  );
}

export default Profile;
