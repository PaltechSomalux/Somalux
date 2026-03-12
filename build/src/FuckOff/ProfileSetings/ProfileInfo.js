import React, { useState } from 'react';
import { FiLink } from 'react-icons/fi';
import { AvatarUpload } from "./AvatarUpload";
import "./ProfileInfo.css";

export const ProfileInfo = ({
  user,
  setUser,
  validationErrors,
  handleChange,
  generateDefaultAvatar,
  isLoading,
  saveProfile,
  setStatusMessage,
  setValidationErrors
}) => {
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleCancel = () => {
    setIsEditing(false);
    setStatusMessage(null);
    setValidationErrors({});
    const savedUser = localStorage.getItem('userProfile');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  };

  const handleAvatarChange = (newAvatar) => {
    setUser(prev => ({ ...prev, avatar: newAvatar }));
  };

  const formatSocialLink = (platform, value) => {
    if (!value) return '';
    if (platform === 'x' && !value.startsWith('http')) return `https://x.com/${value.replace('@', '')}`;
    if (platform === 'instagram' && !value.startsWith('http')) return `https://instagram.com/${value.replace('@', '')}`;
    if (platform === 'linkedin' && !value.startsWith('http')) return `https://${value.replace('https://', '').replace('http://', '')}`;
    if (platform === 'facebook' && !value.startsWith('http')) return `https://facebook.com/${value.replace('@', '')}`;
    return value;
  };

  return (
    <div className={`profile-info-container ${isEditing ? 'editing' : ''}`}>
      {/* Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-item">
          <AvatarUpload 
            user={user}
            isEditing={isEditing}
            avatarPreview={avatarPreview}
            setAvatarPreview={setAvatarPreview}
            generateDefaultAvatar={generateDefaultAvatar}
            onAvatarChange={handleAvatarChange}
            setStatusMessage={setStatusMessage}
          />
        </div>
        {!isEditing ? (
          <button 
            className="avatar-edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit 
          </button>
        ) : (
          <div className="profile-actions">
            <button 
              className="cancel-button"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="save-button"
              onClick={saveProfile}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="profile-section">
        <div className={`profile-field ${validationErrors.name ? 'has-error' : ''}`}>
          <div className="field-wrapper">
            <div className="field-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="field-content">
              <label>Name</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="profile-input"
                  />
                  {validationErrors.name && (
                    <div className="error-message">{validationErrors.name}</div>
                  )}
                </>
              ) : (
                <div className="field-value">{user.name || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>

        <div className={`profile-field ${validationErrors.email ? 'has-error' : ''}`}>
          <div className="field-wrapper">
            <div className="field-icon">
           <svg xmlns="" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
</svg>
            </div>
            <div className="field-content">
              <label>Email</label>
              {isEditing ? (
                <>
                  <input
                    type="email"
                    name="email"
                    value={user.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="profile-input"
                  />
                  {validationErrors.email && (
                    <div className="error-message">{validationErrors.email}</div>
                  )}
                </>
              ) : (
                <div className="field-value">
                  {user.email || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="profile-field">
          <div className="field-wrapper">
            <div className="field-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div className="field-content">
              <label>Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={user.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                  className="profile-input"
                />
              ) : (
                <div className="field-value">{user.phone || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>

        <div className="profile-field">
          <div className="field-wrapper">
            <div className="field-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="field-content">
              <label>Bio</label>
              {isEditing ? (
                <div className="textarea-container">
                  <textarea
                    name="about"
                    value={user.about}
                    onChange={handleChange}
                    placeholder="Tell something about yourself"
                    rows="3"
                    className="profile-textarea"
                    maxLength="500"
                  />
                  <div className="char-counter">
                    {500 - (user.about?.length || 0)} characters remaining
                  </div>
                </div>
              ) : (
                <div className="field-value">
                  {user.about || 'No bio yet'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Social Media */}
      <div className="profile-section">
        <h3 className="section-title">
          <FiLink className="section-icon" />
          Links
        </h3>
        
        {!isEditing ? (
          <div className="social-links-container">
            {user.socialMedia?.x && (
              <a 
                href={formatSocialLink('x', user.socialMedia.x)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link twitter"
                aria-label="X (Twitter) profile"
                style={{ color: '#000000' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>{user.socialMedia.x.includes('http') ? 'X (Twitter)' : `@${user.socialMedia.x.replace('@', '')}`}</span>
              </a>
            )}
            {user.socialMedia?.linkedin && (
              <a 
                href={formatSocialLink('linkedin', user.socialMedia.linkedin)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link linkedin"
                aria-label="LinkedIn profile"
                style={{ color: '#0077B5' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0077B5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>{user.socialMedia.linkedin.includes('http') ? 'LinkedIn' : user.socialMedia.linkedin}</span>
              </a>
            )}
            {user.socialMedia?.facebook && (
              <a 
                href={formatSocialLink('facebook', user.socialMedia.facebook)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link facebook"
                aria-label="Facebook profile"
                style={{ color: '#1877F2' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
                </svg>
                <span>{user.socialMedia.facebook.includes('http') ? 'Facebook' : user.socialMedia.facebook}</span>
              </a>
            )}
            {user.socialMedia?.instagram && (
              <a 
                href={formatSocialLink('instagram', user.socialMedia.instagram)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link instagram"
                aria-label="Instagram profile"
                style={{ color: '#E4405F' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#E4405F">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span>{user.socialMedia.instagram.includes('http') ? 'Instagram' : `@${user.socialMedia.instagram.replace('@', '')}`}</span>
              </a>
            )}
            {!user.socialMedia?.x && !user.socialMedia?.linkedin && 
             !user.socialMedia?.facebook && !user.socialMedia?.instagram && (
              <div className="no-social-links">No social links added</div>
            )}
          </div>
        ) : (
          <>
            <div className="profile-field">
              <div className="field-wrapper">
                <div className="field-icon" style={{ color: '#000000' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div className="field-content">
                  <input
                    type="text"
                    name="socialMedia.x"
                    value={user.socialMedia?.x || ''}
                    onChange={handleChange}
                    placeholder="@username"
                    className="profile-input social-input"
                  />
                </div>
              </div>
            </div>

            <div className="profile-field">
              <div className="field-wrapper">
                <div className="field-icon" style={{ color: '#0077B5' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#0077B5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div className="field-content">
                  <input
                    type="text"
                    name="socialMedia.linkedin"
                    value={user.socialMedia?.linkedin || ''}
                    onChange={handleChange}
                    placeholder="linkedin.com/in/username"
                    className="profile-input social-input"
                  />
                </div>
              </div>
            </div>

            <div className="profile-field">
              <div className="field-wrapper">
                <div className="field-icon" style={{ color: '#1877F2' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
                  </svg>
                </div>
                <div className="field-content">
                  <input
                    type="text"
                    name="socialMedia.facebook"
                    value={user.socialMedia?.facebook || ''}
                    onChange={handleChange}
                    placeholder="facebook.com/username"
                    className="profile-input social-input"
                  />
                </div>
              </div>
            </div>
            <div className="profile-field">
              <div className="field-wrapper">
                <div className="field-icon" style={{ color: '#E4405F' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#E4405F">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </div>
                <div className="field-content">
                  <input
                    type="text"
                    name="socialMedia.instagram"
                    value={user.socialMedia?.instagram || ''}
                    onChange={handleChange}
                    placeholder="@username"
                    className="profile-input social-input"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};