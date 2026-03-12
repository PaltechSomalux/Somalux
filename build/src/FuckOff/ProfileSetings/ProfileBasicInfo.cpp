import React, { useState } from 'react';
import {AvatarUpload} from './AvatarUpload';
import "./ProfileBasicInfo.css";
export const ProfileBasicInfo = ({
  user,
  isEditing,
  setIsEditing,
  validationErrors,
  handleChange,
  generateDefaultAvatar,
  isLoading,
  saveProfile,
  setUser,
  setStatusMessage,
  setValidationErrors
}) => {
  const [avatarPreview, setAvatarPreview] = useState('');

  const handleCancel = () => {
    setIsEditing(false);
    setStatusMessage(null);
    setValidationErrors({});
    const savedUser = localStorage.getItem('userProfile');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  };

  return (
    <div className="basic-info-section">
      <AvatarUpload 
        user={user}
        isEditing={isEditing}
        avatarPreview={avatarPreview}
        setAvatarPreview={setAvatarPreview}
        generateDefaultAvatar={generateDefaultAvatar}
        setUser={setUser}
        setStatusMessage={setStatusMessage}
      />

      <div className="profile-fields">
        {/* Name Field */}
        <div className="form-group">
          <label>Full Name <span className="required">*</span></label>
          {isEditing ? (
            <>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                className={validationErrors.name ? 'error' : ''}
              />
              {validationErrors.name && (
                <div className="error-message">{validationErrors.name}</div>
              )}
            </>
          ) : (
            <div className="profile-value">{user.name || 'Not provided'}</div>
          )}
        </div>

        {/* Email Field */}
        <div className="form-group">
          <label>Email <span className="required">*</span></label>
          {isEditing ? (
            <>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                className={validationErrors.email ? 'error' : ''}
              />
              {validationErrors.email && (
                <div className="error-message">{validationErrors.email}</div>
              )}
            </>
          ) : (
            <div className="profile-value">
              {user.email || 'Not provided'}
              {user.email && (
                <span className={`verification-badge ${user.emailVerified ? 'verified' : 'unverified'}`}>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                  {!user.emailVerified && isEditing && (
                    <button className="verify-btn">Verify Now</button>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Phone Field */}
        <div className="form-group">
          <label>Phone Number</label>
          {isEditing ? (
            <>
              <input
                type="tel"
                name="phone"
                value={user.phone}
                onChange={handleChange}
                placeholder="+1 (123) 456-7890"
                className={validationErrors.phone ? 'error' : ''}
              />
              {validationErrors.phone && (
                <div className="error-message">{validationErrors.phone}</div>
              )}
            </>
          ) : (
            <div className="profile-value">{user.phone || 'Not provided'}</div>
          )}
        </div>

        {/* Bio Field */}
        <div className="form-group full-width">
          <label>Bio</label>
          {isEditing ? (
            <div className="bio-container">
              <textarea
                name="bio"
                value={user.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows="4"
                maxLength="500"
              />
              <div className="char-count">{500 - user.bio.length} characters remaining</div>
            </div>
          ) : (
            <div className="profile-value">
              {user.bio || 'No bio yet'}
            </div>
          )}
        </div>

        {/* Social Media Field */}
        <div className="form-group full-width">
          <label>Social Media</label>
          {isEditing ? (
            <div className="social-media-inputs">
              {/* Twitter/X Input */}
              <div className="social-input">
                <span className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </span> 
                <input
                  type="text"
                  name="socialMedia.x"
                  value={user.socialMedia.x}
                  onChange={handleChange}
                  placeholder="X.com username"
                />
              </div>
              
              {/* LinkedIn Input */}
              <div className="social-input">
                <span className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077B5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  name="socialMedia.linkedin"
                  value={user.socialMedia.linkedin}
                  onChange={handleChange}
                  placeholder="LinkedIn profile URL"
                />
              </div>

              {/* Facebook Input */}
              <div className="social-input">
                <span className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  name="socialMedia.facebook"
                  value={user.socialMedia.facebook}
                  onChange={handleChange}
                  placeholder="Facebook profile URL"
                />
              </div>

              {/* Instagram Input */}
              <div className="social-input">
                <span className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#E4405F">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  name="socialMedia.instagram"
                  value={user.socialMedia.instagram}
                  onChange={handleChange}
                  placeholder="Instagram username"
                />
              </div>
            </div>
          ) : (
            <div className="social-media-links">
              {user.socialMedia.x && (
                <a href={`https://x.com/${user.socialMedia.x}`} target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {user.socialMedia.linkedin && (
                <a href={user.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#0077B5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {user.socialMedia.facebook && (
                <a href={user.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
                  </svg>
                </a>
              )}
              {user.socialMedia.instagram && (
                <a href={`https://instagram.com/${user.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#E4405F">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
              )}
              {!user.socialMedia.x && !user.socialMedia.linkedin && 
               !user.socialMedia.facebook && !user.socialMedia.instagram && (
                <div className="no-social">No social links added</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="profile-actions">
        {isEditing ? (
          <>
            <button 
              className="cancel-btn" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="save-btn" 
              onClick={saveProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="spinner" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </>
        ) : (
          <button 
            className="edit-btn" 
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};