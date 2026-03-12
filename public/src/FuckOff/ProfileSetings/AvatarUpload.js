import React, { useRef, useState, useEffect } from 'react';
import "./AvatarUpload.css";

// Import icons from react-icons library
import { FaUserCircle, FaTimes, FaCheck, FaCamera, FaTrash } from 'react-icons/fa';

export const AvatarUpload = ({ 
  user, 
  avatarPreview, 
  setAvatarPreview, 
  generateDefaultAvatar,
  onAvatarChange,
  setStatusMessage
}) => {
  const fileInputRef = useRef(null);
  const [showEditOptions, setShowEditOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tempAvatar, setTempAvatar] = useState('');

  // Initialize tempAvatar with current avatar
  useEffect(() => {
    setTempAvatar(avatarPreview || user.avatar || '');
  }, [avatarPreview, user.avatar]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setStatusMessage({
        text: 'Only image files are allowed',
        type: 'error'
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        text: 'Image size must be less than 5MB',
        type: 'error'
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setTempAvatar(event.target.result);
      setIsEditing(true);
      setShowEditOptions(false);
    };
    reader.readAsDataURL(file);
  };

  const confirmAvatarChange = () => {
    if (tempAvatar && onAvatarChange) {
      onAvatarChange(tempAvatar);
      setAvatarPreview(tempAvatar);
      setStatusMessage({
        text: 'Uploaded',
        type: 'success'
      });
      setIsEditing(false);
      setIsFullScreen(false);
    }
  };

  const handleRemoveAvatar = () => {
    const defaultAvatar = generateDefaultAvatar();
    setTempAvatar('');
    setAvatarPreview('');
    if (onAvatarChange) {
      onAvatarChange(defaultAvatar);
    }
    setStatusMessage({
      text: 'Photo removed',
      type: 'success'
    });
    setIsEditing(false);
    setIsFullScreen(false);
  };

  const handleImageError = () => {
    const newAvatar = generateDefaultAvatar();
    setTempAvatar(newAvatar);
    if (onAvatarChange) {
      onAvatarChange(newAvatar);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (!isFullScreen) {
      setShowEditOptions(false);
    }
  };

  const cancelEditing = () => {
    setTempAvatar(avatarPreview || user.avatar || '');
    setIsEditing(false);
    setIsFullScreen(false);
  };

  return (
    <div className="avatar-upload">
      {/* Regular Avatar Preview */}
      <div 
        className={`avatar-preview ${isEditing ? 'editable' : ''}`}
        onClick={toggleFullScreen}
      >
        {tempAvatar ? (
          <img 
            src={tempAvatar} 
            alt="Profile" 
            onError={handleImageError}
          />
        ) : (
          <div className="default-avatar">
            <FaUserCircle size={128} className="user-circle-icon" />
          </div>
        )}
        
        <div className="avatar-edit-indicator">
          <FaCamera className="camera-icon" />
        </div>
      </div>
      
      {/* Full Screen Preview */}
      {isFullScreen && (
        <div className="avatar-fullscreen">
          <div className="fullscreen-content">
            <div className="fullscreen-image-container">
              {tempAvatar ? (
                <img 
                  src={tempAvatar} 
                  alt="Profile" 
                  onError={handleImageError}
                />
              ) : (
                <div className="default-avatar-fullscreen">
                  <FaUserCircle size={256} className="user-circle-icon" />
                </div>
              )}
            </div>
            
            <div className="fullscreen-actions">
              {!isEditing ? (
                <>
                  <button 
                    className="edit-btn"
                    onClick={() => setShowEditOptions(true)}
                  >
           Edit
                  </button>
                  <button 
                    className="close-btn"
                    onClick={toggleFullScreen}
                  >
                   Close
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="cancel-btn"
                    onClick={cancelEditing}
                  >
                 Cancel
                  </button>
                  <button 
                    className="confirm-btn"
                    onClick={confirmAvatarChange}
                  >
                     Upload
                  </button>
                </>
              )}
            </div>
          </div> 
        </div>
      )}
      
      {/* File Input */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*"
        onChange={handleAvatarChange}
        style={{ display: 'none' }}
      />
      
      {/* Edit Options Menu (shown in fullscreen mode) */}
      {showEditOptions && isFullScreen && (
        <div className="avatar-edit-menu-fullscreen">
          <div className="edit-menu-content">
            <div className="edit-option" onClick={() => fileInputRef.current?.click()}>
              <FaCamera className="option-icon" />
              <span>Change</span>
            </div>
            {tempAvatar && (
              <div className="edit-option remove-option" onClick={handleRemoveAvatar}>
                <FaTrash className="option-icon" />
                <span>Remove</span>
              </div>
            )}
            <div className="edit-option" onClick={() => setShowEditOptions(false)}>
              <FaTimes className="option-icon" />
              <span>Cancel</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};