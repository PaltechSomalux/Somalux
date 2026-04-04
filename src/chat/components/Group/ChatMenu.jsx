import React from 'react';
import PropTypes from 'prop-types';
import { 
  FiSun, 
  FiMoon, 
  FiSettings, 
  FiTrash2,
  FiDownload,
  FiImage
} from 'react-icons/fi';
import "./ChatMenu.css";

export const ChatMenu = ({
  currentTheme = 'dark',
  toggleTheme,
  setShowSettings,
  setShowClearChatConfirm,
  exportChat,
  showChatMenu,
  setShowChatMenu,
  setShowWallpaper,
  currentWallpaper,
  resetWallpaper,
  isLoggedIn,
  handleLogout,
  setShowLogin,
  menuPosition = { top: 0, right: 0 }
}) => {
  if (!showChatMenu) return null;
  
  const menuStyle = {
    backgroundColor: '#0b1216',
    border: '1px solid #2a3942',
    color: '#e9edef',
    top: `${menuPosition.top}px`,
    right: `${menuPosition.right}px`
  };

  const handleWallpaperSelect = () => {
    setShowWallpaper(true);
    setShowChatMenu(false);
  };

  const handleResetWallpaper = () => {
    resetWallpaper();
    setShowChatMenu(false);
  };

  return (
    <div className="chat-menu" style={menuStyle}>
        {/* Theme toggle */}
        <button 
          className="menu-item"
          onClick={() => {
            toggleTheme();
            setShowChatMenu(false);
          }}
          aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
        >
          <span className="menu-item-icon">
            {currentTheme === 'light' ? (
              <FiMoon color="#8696a0" />
            ) : (
              <FiSun color="#00a884" />
            )}
          </span>
          <span className="menu-item-text">
            {currentTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
        
        {/* Wallpaper options */}
        <button 
          className="menu-item"
          onClick={handleWallpaperSelect}
          aria-label="Change wallpaper"
        >
          <span className="menu-item-icon">
            <FiImage color="#8696a0" />
          </span>
          <span className="menu-item-text">Wallpaper</span>
        </button>

        {currentWallpaper && currentWallpaper.id !== 'default' && (
          <button 
            className="menu-item" 
            onClick={handleResetWallpaper}
            aria-label="Reset wallpaper to default"
          >
            <span className="menu-item-icon">
              <FiImage color="#8696a0" />
            </span>
            <span className="menu-item-text">Reset Wallpaper</span>
          </button>
        )}

        {/* Export chat */}
        <button 
          className="menu-item"
          onClick={() => {
            exportChat();
            setShowChatMenu(false);
          }}
          aria-label="Export chat"
        >
          <span className="menu-item-icon">
            <FiDownload color="#8696a0" />
          </span>
          <span className="menu-item-text">Export Chat</span>
        </button>
        
        {/* Clear chat */}
        <button 
          className="menu-item"
          onClick={() => {
            setShowClearChatConfirm(true);
            setShowChatMenu(false);
          }}
          aria-label="Clear chat"
        >
          <span className="menu-item-icon">
            <FiTrash2 color="#8696a0" />
          </span>
          <span className="menu-item-text">Clear Chat</span>
        </button>
      </div>
  );
};

ChatMenu.propTypes = {
  currentTheme: PropTypes.string,
  toggleTheme: PropTypes.func.isRequired,
  setShowSettings: PropTypes.func.isRequired,
  setShowClearChatConfirm: PropTypes.func.isRequired,
  exportChat: PropTypes.func.isRequired,
  showChatMenu: PropTypes.bool.isRequired,
  setShowChatMenu: PropTypes.func.isRequired,
  setShowWallpaper: PropTypes.func.isRequired,
  currentWallpaper: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      isCustom: PropTypes.bool
    })
  ]),
  resetWallpaper: PropTypes.func.isRequired
}; 

ChatMenu.defaultProps = {
  currentTheme: 'dark',
  currentWallpaper: null 
}; 