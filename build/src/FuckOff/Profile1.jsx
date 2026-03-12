import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, X, Gear, Lifebuoy, Moon, SignOut } from "phosphor-react";
import { useNavigate } from 'react-router-dom';
import "./Profile1.css";
import { Profile } from "./Profile";

export const Profile1 = ({ 
  user: initialUser, 
  size = 32, 
  isMobile = false,
  onLogout,
  isProfilePage = false,
  isSettingsPage = false,
  onUserUpdate
}) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('userProfile');
      return savedUser ? JSON.parse(savedUser) : initialUser || {};
    } catch (error) {
      console.error("Error parsing user data:", error);
      return initialUser || {};
    }
  });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-profile-dropdown') && 
          !event.target.closest('.user-profile-panel')) {
        closeMenu();
      }
    };
    
    if (!isProfilePage && !isSettingsPage) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfilePage, isSettingsPage]);

  useEffect(() => {
    try {
      localStorage.setItem('userProfile', JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  }, [user]);

  const navigateToProfile = () => {
    closeMenu();
    navigate('/profile');
  };

  const navigateToSettings = () => {
    closeMenu();
    navigate('/settings');
  };

  const generateDefaultAvatar = () => {
    const initials = user?.name 
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'US';
    const colors = ['FFAD08', 'EDD382', 'FC7174', '6DD3CE', 'C8E9A0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff&size=256&rounded=true&bold=true`;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const updatedUser = { ...(user || {}), avatar: event.target.result };
      setUser(updatedUser);
      onUserUpdate(updatedUser); // Notify parent of user update
      try {
        localStorage.setItem('userProfile', JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Error saving user data:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerAvatarChange = () => {
    fileInputRef.current?.click();
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    onUserUpdate(updatedUser); // Propagate update to parent (ConnectMe)
    try {
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  // Profile page view 
  if (isProfilePage) {
    return (
      <div className="profile-page-container">
        <div className="profile-page-content">
          <Profile 
            user={user} 
            onUserUpdate={handleUserUpdate} 
            isMobileView={isMobile}
          />
        </div>
      </div>
    );
  }

  // Settings page view
  if (isSettingsPage) {
    return (
      <div className="settings-page-container">
        <div className="settings-page-content">
          {/* Add settings content if needed */}
        </div>
      </div>
    );
  }

  // Regular avatar with dropdown menu view
  return (
    <div className="user-profile-dropdown">
      <button 
        className="user-profile-button"
        onClick={toggleMenu}
        aria-label="User menu"
        style={{ width: size, height: size }}
      >
        {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name || 'User'} 
            className="user-avatar-image google-style"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = generateDefaultAvatar();
            }}
            style={{ 
              width: '100%', 
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        ) : (
          <div 
            className="default-avatar google-style"
            style={{ 
              width: '100%', 
              height: '100%',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#4285F4',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: `${Math.floor(size * 0.5)}px`,
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
          </div>
        )}
      </button>
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*"
        onChange={handleAvatarChange}
        style={{ display: 'none' }}
      />

      {isMenuOpen && (
        <div className={`user-profile-panel ${isMobile ? 'mobile' : ''}`}>
          <div className="panel-header">
            <div className="user-info">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name || 'User'} 
                  className="panel-avatar google-style"
                  onClick={triggerAvatarChange}
                  style={{ 
                    cursor: 'pointer',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = generateDefaultAvatar();
                  }}
                />
              ) : (
                <div 
                  className="panel-default-avatar google-style"
                  onClick={triggerAvatarChange}
                  style={{ 
                    cursor: 'pointer',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#4285F4',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '24px',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="user-details">
                <span className="user-name">{user.name || 'Guest'}</span>
                <span className="user-email">{user.email || ''}</span>
              </div>
            </div>
            <button 
              className="close-panel-button"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <div className="panel-options">
            <button onClick={navigateToProfile}>
              <UserCircle size={20} />
              <span>Profile</span>
            </button>
            <button onClick={navigateToSettings}>
              <Gear size={20} />
              <span>Settings</span>
            </button>
            <button onClick={onLogout}>
              <SignOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};