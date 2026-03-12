import React, { useState, useEffect } from 'react';
import { UserCircle } from "phosphor-react";
import "./UserProfile.css"

export const UserProfile = ({ 
  user, 
  size = 32, 
  isMobile = false,
  className = '',
  onProfileClick,
  onLogout,
  activeTab,
  setActiveTab = () => {} // Provide default empty function
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-avatar-container')) {
        closeMenu();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileAction = () => {
    setActiveTab('user'); // Now safe to call even if not provided
    closeMenu();
    onProfileClick?.();
  };

  return (
    <div className={`user-avatar-container ${className}`}>
      {/* Avatar Button */}
      <button 
        className={`user-avatar-button ${isMenuOpen ? 'activeBlack' : ''} ${activeTab === 'user' ? 'tab-active' : ''}`}
        onClick={toggleMenu}
        aria-label="User menu"
      >
        {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name || 'User'} 
            className="avatar-imageBlack"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none';
            }}
            style={{ width: size, height: size }}
          />
        ) : (
          <UserCircle size={24} weight="fill" />
        )}
        
      </button>

      {/* User Panel */}
      <div className={`user-panelBlack ${isMenuOpen ? 'open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}>
          <div className="user-nameBlack">{user?.name || 'Guest'}</div>
          <div className="user-emailBlack">{user?.email || 'guest@example.com'}</div>
      
        <button 
          className="panel-itemBlack" 
          onClick={handleProfileAction}
        >
          My Profile
        </button>
       
        <button className="panel-itemBlack">Settings</button>
        {user ? (
          <button className="panel-itemBlack" onClick={onLogout}>Logout</button>
        ) : (
          <button className="panel-itemBlack">Login</button>
        )}
      </div>
    </div>
  );
};