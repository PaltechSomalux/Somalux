import React, { useState, useEffect, useRef } from 'react';
import { UserCircle, X, Gear, Lifebuoy, Moon, SignOut } from "phosphor-react";
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase'; // Import Firebase auth
import "./MyProfile.css";
import { MyProfile } from "../User/UserProfile/MyProfile";
import { SettingsPanel } from '../Settings/SettingsPanel';

export const UserProfile = ({
  user: initialUser,
  size = 32,
  isMobile = false,
  onLogout,
  isProfilePage = false,
  isSettingsPage = false
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

  // Sync user data with Firebase Authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // console.log('UserProfile.jsx: Firebase user detected:', {
        //   uid: firebaseUser.uid,
        //   displayName: firebaseUser.displayName,
        //   email: firebaseUser.email,
        //   photoURL: firebaseUser.photoURL,
        // });
        // Merge Firebase data with existing user data, prioritizing custom avatar if set
        setUser((prev) => ({
          ...prev,
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || prev.name || 'Guest User',
          email: firebaseUser.email || prev.email || 'guest@example.com',
          avatar: prev.avatar || firebaseUser.photoURL || null,
          isAuthenticated: true,
        }));
      } else {
        // console.log('UserProfile.jsx: No Firebase user, using local storage or defaults');
        setUser((prev) => ({
          ...prev,
          name: prev.name || 'Guest User',
          email: prev.email || 'guest@example.com',
          avatar: prev.avatar || null,
          isAuthenticated: false,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

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
    return `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff&size=256`;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.match('image.*')) {
      console.warn('UserProfile.jsx: Invalid file type, expected image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.warn('UserProfile.jsx: File size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUser((prev) => ({ ...prev, avatar: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const triggerAvatarChange = () => {
    fileInputRef.current?.click();
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  // Profile page view 
  if (isProfilePage) {
    return (
      <div className="profile-page-container">
        <div className="profile-page-content">
          <MyProfile user={user} onUserUpdate={handleUserUpdate} />
        </div>
      </div>
    );
  }

  // Settings page view
  if (isSettingsPage) {
    return (
      <div className="settings-page-container">
        <div className="settings-page-content">
          <SettingsPanel />
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
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || 'User'}
            className="user-avatar-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = generateDefaultAvatar();
            }}
            style={{ width: size, height: size }}
          />
        ) : (
          <div className="default-avatar" style={{ width: size, height: size }}>
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
                  className="panel-avatar"
                  onClick={triggerAvatarChange}
                  style={{ cursor: 'pointer' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = generateDefaultAvatar();
                  }}
                />
              ) : (
                <div
                  className="panel-default-avatar"
                  onClick={triggerAvatarChange}
                  style={{ cursor: 'pointer' }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="user-details">
                <div className="user-name">{user?.name || 'Guest User'}</div>
                <div className="user-email">{user?.email || 'guest@example.com'}</div>
              </div>
            </div>
          </div>

          <div className="panel-menu">
            <div className="menu-section">
              <button className="panel-item" onClick={navigateToProfile}>
                <div className="icon-wrapper"><UserCircle size={20} /></div>
                <span>Profile</span>
              </button>
            </div>

            <div className="menu-section">
              <button className="panel-item" onClick={navigateToSettings}>
                <div className="icon-wrapper"><Gear size={20} /></div>
                <span>Settings</span>
              </button>
            </div>

            <div className="menu-section menu-section-bottom">
              {user?.isAuthenticated ? (
                <button className="panel-item" onClick={onLogout}>
                  <div className="icon-wrapper"><SignOut size={20} /></div>
                  <span>Sign out</span>
                </button>
              ) : (
                <button
                  className="panel-item"
                  onClick={() => {
                    closeMenu();
                    navigate('/registration'); // Updated to match case-sensitive route
                  }}
                >
                  <div className="icon-wrapper"><UserCircle size={20} /></div>
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};