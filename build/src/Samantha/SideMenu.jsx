import React from 'react';
import { 
  FaTimes, FaUser, FaHeart, FaSearch, FaMapMarkerAlt, 
  FaLock, FaQuestionCircle, FaCog, FaStar, FaSignOutAlt 
} from 'react-icons/fa';

export const SideMenu = ({ user, setMenuOpen, setActiveTab }) => {
  return (
    <div className="side-menu-overlay" onClick={() => setMenuOpen(false)}>
      <div className="side-menu" onClick={(e) => e.stopPropagation()}>
        <div className="menu-header">
          <div className="user-info">
            <img src={user.photos[0]} alt={user.name} />
            <div>
              <h3>{user.name}</h3>
              <p>{user.age} years old</p>
              {user.verified && (
                <span className="verified-badge">
                  Verified
                </span>
              )}
              {user.premium && (
                <span className="premium-badge">
                  <FaStar /> Premium
                </span>
              )}
            </div>
          </div>
          <button className="close-menu" onClick={() => setMenuOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="menu-items">
          <div className="menu-item" onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}>
            <FaUser />
            <span>My Profile</span>
          </div>
          <div className="menu-item" onClick={() => { setActiveTab('matches'); setMenuOpen(false); }}>
            <FaHeart />
            <span>Likes You</span>
          </div>
          <div className="menu-item" onClick={() => { setMenuOpen(false); }}>
            <FaSearch />
            <span>Discovery Preferences</span>
          </div>
          <div className="menu-item" onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}>
            <FaMapMarkerAlt />
            <span>Location Settings</span>
          </div>
          <div className="menu-item" onClick={() => { setMenuOpen(false); }}>
            <FaLock />
            <span>Privacy & Safety</span>
          </div>
          <div className="menu-item">
            <FaQuestionCircle />
            <span>Help & Support</span>
          </div>
          <div className="menu-item" onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}>
            <FaCog />
            <span>Settings</span>
          </div>
          {!user.premium && (
            <div className="menu-item premium-item">
              <FaStar />
              <span>Go Premium</span>
            </div>
          )}
          <div className="menu-item">
            <FaSignOutAlt />
            <span>Log Out</span>
          </div>
        </div>
      </div>
    </div>
  );
};

