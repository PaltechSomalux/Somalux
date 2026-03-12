import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Account } from "./ProfileSetings/Account";
import { PrivacySettings } from "./ProfileSetings/PrivacySettings";
import { ChatsSettings } from "./ProfileSetings/ChatsSettings";
import { NotificationsSettings } from "./ProfileSetings/NotificationsSettings";
import { HelpSettings } from './ProfileSetings/HelpSettings';
import { ProfileInfo } from './ProfileSetings/ProfileInfo';
import { StatusMessage } from './ProfileSetings/StatusMessage';
import './Profile.css';
import { loadMyPrivacy, ensurePrivacyLiveSync } from '../utils/privacy';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

export const Profile = ({ isMobileView, user: initialUser, onUserUpdate, initialTab }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('userProfile');
    const defaultUser = {
      id: 'user1',
      name: 'Chief Designer',
      email: 'campuslives254@gmail.com',
      phone: '0799745733',
      bio: 'Be Honest. Be Real. Be you',
      avatar: '',
      jobTitle: 'Software Developer',
      company: 'Tech Corp',
      socialMedia: {
        x: '',
        linkedin: '',
        facebook: '',
        instagram: ''
      },
      about: 'Be Honest. Be Real. Be you',
      lastSeen: 'everyone',
      profilePhotoVisibility: 'everyone',
      readReceipts: true,
      blockedContacts: [],
      chatWallpaper: 'default',
      fontSize: 'medium',
      notificationTone: 'default',
      vibration: true,
      mediaVisibility: 'show',
      archiveChats: true,
      autoDownloadWiFi: 'all',
      autoDownloadCellular: 'photos',
      accountInfo: {
        device: 'iPhone 13',
        storageUsage: '3.2 GB',
        networkUsage: '1.5 GB this month'
      },
      security: {
        twoFactorEnabled: false,
        activeSessions: []
      },
      dataSettings: {
        exportFormat: 'json',
        selectedDataTypes: []
      }
    };
    return savedUser ? { ...defaultUser, ...JSON.parse(savedUser) } : defaultUser;
  });

  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile() || isMobileView;
  const [activeTab, setActiveTab] = useState(isMobile ? null : (initialTab || 'profile'));

  const [statusMessage, setStatusMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showAvatarFullscreen, setShowAvatarFullscreen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setActiveTab(initialTab || 'profile');
    }
  }, [initialTab, isMobile]);

  // Load privacy settings from Firestore and merge into local profile state
  useEffect(() => {
    (async () => {
      try {
        const remote = await loadMyPrivacy({ preferCache: true });
        if (remote) {
          setUser(prev => ({ ...prev, ...remote }));
          localStorage.setItem('userProfile', JSON.stringify({ ...user, ...remote }));
        }
        // Start live sync to keep cache fresh with minimal reads
        ensurePrivacyLiveSync();
        // Listen for instant local updates
        const onPriv = (e) => {
          const all = e?.detail?.all || {};
          setUser(prev => ({ ...prev, ...all }));
        };
        window.addEventListener('privacy:updated', onPriv);
        return () => window.removeEventListener('privacy:updated', onPriv);
      } catch (e) {
        console.warn('Failed to load privacy settings', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const errors = {};
    if (!user.name.trim()) errors.name = 'Name is required';
    if (!user.email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.email = 'Invalid email address';
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      setStatusMessage({
        text: 'Please fix the errors in the form',
        type: 'error'
      });
      return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const updatedUser = { 
        ...user,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));
      setUser(updatedUser);
      onUserUpdate(updatedUser); // Notify parent of user update
      setStatusMessage({
        text: 'Profile saved successfully!',
        type: 'success'
      });
    } catch (error) {
      setStatusMessage({
        text: 'Failed to save profile. Please try again.',
        type: 'error',
        persistent: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const path = name.split('.');
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setUser(prev => {
      const newUser = { ...prev };
      let current = newUser;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = type === 'checkbox' ? checked : value;
      return newUser;
    });
  };

  const generateDefaultAvatar = () => {
    const initials = user.name 
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'US';
    const colors = ['FFAD08', 'EDD382', 'FC7174', '6DD3CE', 'C8E9A0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newAvatar = `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff&size=256`;
    setUser(prev => ({ ...prev, avatar: newAvatar }));
    return newAvatar;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBackToSidebar = () => {
    setShowSidebar(true);
    setActiveTab(null);
  };

  const handleDownloadAvatar = () => {
    const link = document.createElement('a');
    link.href = user.avatar || generateDefaultAvatar();
    link.download = `${user.name.replace(/\s+/g, '_')}_avatar.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setStatusMessage({
      text: 'Avatar downloaded successfully!',
      type: 'success'
    });
  };

  const handleShareAvatar = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${user.name}'s Profile Picture`,
          text: `Check out ${user.name}'s profile picture`,
          url: user.avatar || generateDefaultAvatar(),
        });
      } else {
        await navigator.clipboard.writeText(user.avatar || generateDefaultAvatar());
        setStatusMessage({
          text: 'Avatar link copied to clipboard!',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
      if (err.name !== 'AbortError') {
        setStatusMessage({
          text: 'Sharing failed. Please try again.',
          type: 'error'
        });
      }
    }
  };

  useEffect(() => {
    if (!user.avatar) {
      const newAvatar = generateDefaultAvatar();
      setUser(prev => ({ ...prev, avatar: newAvatar }));
    }
  }, []);

  return (
    <div className={`profile-management ${isMobile ? 'mobile-view' : ''}`}>
      {showAvatarFullscreen && (
        <div className="avatar-fullscreen-overlay" onClick={() => setShowAvatarFullscreen(false)}>
          <div className="avatar-fullscreen-container" onClick={(e) => e.stopPropagation()}>
            <img 
              src={user.avatar || generateDefaultAvatar()} 
              alt="Profile" 
              className="avatar-fullscreen-image"
            />
            <div className="avatar-fullscreen-footer">
              <h3>{user.name}</h3>
              <p>{user.bio}</p>
              <div className="avatar-actions">
                <button 
                  className="avatar-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadAvatar();
                  }}
                  aria-label="Download avatar"
                >
                  <span>Save</span>
                </button>
                <button 
                  className="avatar-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareAvatar();
                  }}
                  aria-label="Share avatar"
                >
                  <span>Share</span>
                </button>
              </div>
            </div>
            <button 
              className="avatar-close-button"
              onClick={() => setShowAvatarFullscreen(false)}
              aria-label="Close avatar view"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className={`profile-sidebar ${showSidebar ? 'visible' : 'hidden'}`}>
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
        </div>

        <div className="profile-header-section">
          <div 
            className="profile-header-avatar-container"
            onClick={() => setShowAvatarFullscreen(true)}
            role="button"
            aria-label="View profile picture"
            tabIndex={0}
          >
            <img 
              src={user.avatar || generateDefaultAvatar()} 
              alt="Profile" 
              className="profile-header-avatar"
            />
            <div className="avatar-edit-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </div>
          </div>
          <div className="profile-header-info">
            <h2 className="profile-header-name">{user.name}</h2>
            <p className="profile-header-phone">{user.phone}</p>
            <p className="profile-header-bio">{user.bio}</p>
          </div>
        </div>

        <div className="settings-tabs-container">
          <button 
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
            aria-current={activeTab === 'profile'}
          >
            <div className="tab-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="tab-content">
              <span className="tab-title">Profile</span>
              <span className="tab-subtitle">Edit name, photo, bio and more</span>
            </div>
          </button>
          
          <button 
            className={`profile-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => handleTabChange('account')}
            aria-current={activeTab === 'account'}
          >
            <div className="tab-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <div className="tab-content">
              <span className="tab-title">Account</span>
              <span className="tab-subtitle">Security, change number, two-step verification</span>
            </div>
          </button>
          
          <button 
            className={`profile-tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => handleTabChange('privacy')}
            aria-current={activeTab === 'privacy'}
          >
            <div className="tab-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11V11.99z"/>
              </svg>
            </div>
            <div className="tab-content">
              <span className="tab-title">Privacy</span>
              <span className="tab-subtitle">Last seen, profile photo, read receipts</span>
            </div>
          </button>
          
          <button 
            className={`profile-tab ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => handleTabChange('chats')}
            aria-current={activeTab === 'chats'}
          >
            <div className="tab-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
            </div>
            <div className="tab-content">
              <span className="tab-title">Chats</span>
              <span className="tab-subtitle">Theme, wallpapers, chat history</span>
            </div>
          </button>
          
          <button 
            className={`profile-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => handleTabChange('notifications')}
            aria-current={activeTab === 'notifications'}
          >
            <div className="tab-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </div>
            <div className="tab-content">
              <span className="tab-title">Notifications</span>
              <span className="tab-subtitle">Message, group & call tones</span>
            </div>
          </button>
          
          <button 
            className={`profile-tab ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => handleTabChange('help')}
            aria-current={activeTab === 'help'}
          >
            <div className="tab-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            </div>
            <div className="tab-content">
              <span className="tab-title">Help</span>
              <span className="tab-subtitle">FAQ, contact us, privacy policy</span>
            </div>
          </button>
        </div>
      </div>
      
      <div className={`profile-content ${!showSidebar ? 'full-width' : ''}`}>
        {isMobile && !showSidebar && (
          <div className="mobile-content-header">
            <button 
              className="back-to-sidebar" 
              onClick={handleBackToSidebar}
              aria-label="Back to settings"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <h2 className="mobile-content-title">
              {activeTab === 'profile' && 'Profile'}
              {activeTab === 'account' && 'Account'}
              {activeTab === 'privacy' && 'Privacy'}
              {activeTab === 'chats' && 'Chats'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'help' && 'Help'}
            </h2>
          </div>
        )}
        
        {isMobile && showSidebar && (
          <div className="mobile-empty-state">
            <div className="empty-content">
              <h4>Be Honest. Be Real. Be you</h4>
            </div>
          </div>
        )}

        {(!isMobile || (activeTab !== null && !showSidebar)) && (
          <>
            {activeTab === 'profile' && (
              <ProfileInfo 
                user={user} 
                setUser={setUser}
                validationErrors={validationErrors}
                handleChange={handleChange}
                generateDefaultAvatar={generateDefaultAvatar}
                isLoading={isLoading}
                saveProfile={saveProfile}
                setStatusMessage={setStatusMessage}
                setValidationErrors={setValidationErrors}
                avatarPreview={avatarPreview}
                setAvatarPreview={setAvatarPreview}
              />
            )}
            {activeTab === 'account' && (
              <Account 
                user={user}
                onChange={handleChange}
                setUser={setUser}
                setStatusMessage={setStatusMessage}
              />
            )}
            {activeTab === 'privacy' && (
              <PrivacySettings 
                user={user}
                onChange={handleChange}
                setUser={setUser}
                setStatusMessage={setStatusMessage}
              />
            )}
            {activeTab === 'chats' && (
              <ChatsSettings 
                user={user}
                onChange={handleChange}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationsSettings 
                user={user}
                onChange={handleChange}
              />
            )}
            {activeTab === 'help' && (
              <HelpSettings />
            )}
          </>
        )}
      </div>
      
      <StatusMessage 
        statusMessage={statusMessage}
        setStatusMessage={setStatusMessage}
      />
    </div>
  );
};

Profile.propTypes = {
  isMobileView: PropTypes.bool,
  user: PropTypes.object,
  onUserUpdate: PropTypes.func,
  initialTab: PropTypes.string
};

Profile.defaultProps = {
  isMobileView: false,
  user: {},
  onUserUpdate: () => {},
  initialTab: undefined
};