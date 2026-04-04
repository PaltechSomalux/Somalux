import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiMoreVertical, FiPhone, FiVideo, FiClock } from 'react-icons/fi';
import { BsPinFill } from 'react-icons/bs';
import { ChatMenu } from './ChatMenu';
import { getMaskedProfilePhoto, allowLastSeen } from '../../utils/privacyVisibility';
import { format, isToday, isValid, formatDistanceToNow } from 'date-fns';
import "./ChatHeader.css";
 
export const ChatHeader = ({
  contact = {},
  pinnedMessages = [], // New
  onPinClick = () => {}, // New: For jumping to pinned
  isTyping = false,
  currentTheme = 'dark',
  setCurrentTheme = () => {},
  setShowSettings = () => {}, 
  setShowClearChatConfirm = () => {},
  exportChat = () => {},
  isLoggedIn = false,
  handleLogout = () => {},
  setShowLogin = () => {},
  setShowWallpaper = () => {},
  currentWallpaper = {},
  resetWallpaper = () => {},
  enableFeatures = { typingIndicators: true, onlineStatus: true },
  isMobileView = false,
  onBackClick = () => {},
  startAudioCall = null,
  startVideoCall = null,
  isSelfChat = false,
  openDisappearingModal = () => {},
  hasDisappearingActive = true
}) => {
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showAvatarFullscreen, setShowAvatarFullscreen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 384 : false);
  const menuRef = useRef(null);
  const pinnedRef = useRef(null); // For pinned scroll

  // Debug logging
  useEffect(() => {
    console.log('🔍 ChatHeader received props:', { 
      isSelfChat,
      contactName: contact?.name
    });
  }, [isSelfChat, contact?.name]);

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  }; 

  const formatDate = (date) => {
    if (!date || !isValid(new Date(date))) return '';
    return format(new Date(date), 'h:mm a');
  };

  // New: Enhanced status text logic
  const getStatusText = () => {
    if (isTyping && enableFeatures.typingIndicators) {
      return (
        <span className="chatHeader-typingIndicator">
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          typing
        </span>
      );
    }

    if (contact.isOnline && enableFeatures.onlineStatus) {
      return (
        <span className="chatHeader-onlineStatus">
          <span className="chatHeader-onlineDot"></span>
          online
        </span>
      );
    }

    // Privacy: hide last seen if not allowed (treat viewer as not a contact for now)
    const privacy = contact.privacy || contact.targetPrivacy || {};
    const canSeeLastSeen = allowLastSeen(privacy, false);
    if (!canSeeLastSeen) {
      return '';
    }

    if (!contact.lastSeen) {
      return 'offline';
    }

    const lastSeenDate = new Date(contact.lastSeen);
    if (isToday(lastSeenDate)) {
      return `last seen today at ${formatDate(contact.lastSeen)}`;
    }

    return `last seen ${formatDistanceToNow(lastSeenDate, { addSuffix: true })}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth < 384);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const generateDefaultAvatar = () => {
    const initials = contact.name 
      ? contact.name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'US';
    const colors = ['FFAD08', 'EDD382', 'FC7174', '6DD3CE', 'C8E9A0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${randomColor}&color=fff&size=256`;
  };

  const handleDownloadAvatar = () => {
    const link = document.createElement('a');
    link.href = contact.avatar || generateDefaultAvatar();
    link.download = `${contact.name.replace(/\s+/g, '_')}_avatar.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareAvatar = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${contact.name}'s Profile Picture`,
          text: `Check out ${contact.name}'s profile picture`,
          url: contact.avatar || generateDefaultAvatar(),
        });
      } else {
        await navigator.clipboard.writeText(contact.avatar || generateDefaultAvatar());
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // New: Handle pin click (jump to message)
  const handlePinClick = (pin) => {
    if (onPinClick) {
      onPinClick(pin, true); // Navigation mode
    }
  };

  // FIXED: Robust back handler with touch fallback and guards
  const handleBackClickInternal = (e) => {
    e.preventDefault();  // Prevent scroll/jump
    e.stopPropagation(); // Stop any parent events
    console.log('🔙 ChatHeader: Back event fired (click/touch)', { onBackClickExists: !!onBackClick });
    if (onBackClick) {
      onBackClick();
    } else {
      console.warn('🔙 ChatHeader: onBackClick prop missing! Navigation blocked.');
    }
  };

  return (
    <div className={`chatHeader-header ${currentTheme}-theme`}>
      {showAvatarFullscreen && (
        <div className="chatHeader-avatarFullscreenOverlay" onClick={() => setShowAvatarFullscreen(false)}>
          <div className="chatHeader-avatarFullscreenContainer" onClick={(e) => e.stopPropagation()}>
            <img 
              src={contact.avatar || generateDefaultAvatar()} 
              alt={contact.name} 
              className="chatHeader-avatarFullscreenImage"
            />
            <div className="chatHeader-avatarFullscreenFooter">
              <h3>{contact.name}</h3>
              <div className="chatHeader-avatarActions">
                <button 
                  className="chatHeader-avatarActionButton"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadAvatar();
                  }}
                  aria-label="Download avatar"
                >
                  <span>Save</span>
                </button>
                <button 
                  className="chatHeader-avatarActionButton"
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
              className="chatHeader-avatarCloseButton"
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
      
      {/* FIXED: Back button with z-index, pointer-events, and dual events for mobile */}
      <button 
        className="chatHeader-iconButton chatHeader-backButton"
        onClick={handleBackClickInternal}
        onTouchEnd={handleBackClickInternal}  // Fallback for touch devices
        style={{
          pointerEvents: 'auto',  // Ensure clickable
          zIndex: 1000,  // Above any overlays (e.g., pinned, menu)
          position: 'relative'  // If needed for stacking
        }}
        aria-label="Back to chats"
        disabled={false}  // Explicitly enabled
      >
        <FiArrowLeft size={18} color={currentTheme === 'dark' ? '#aebac1' : '#54656f'} />
      </button>
      
      <div className="chatHeader-contactInfo">
        <div 
          className="chatHeader-contactAvatar"
          onClick={() => setShowAvatarFullscreen(true)}
          role="button"
          aria-label="View profile picture"
          tabIndex={0}
        >
          {(() => {
            const masked = getMaskedProfilePhoto(contact.avatar, contact.privacy || contact.targetPrivacy || {}, false);
            return masked;
          })() ? (
            <img src={getMaskedProfilePhoto(contact.avatar, contact.privacy || contact.targetPrivacy || {}, false)} alt={contact.name} />
          ) : (
            <div className="chatHeader-avatarPlaceholder">
              {contact.name.charAt(0).toUpperCase()}
            </div>
          )}
          {hasDisappearingActive && (
            <span className="chatHeader-disappearing-badge" title="Disappearing messages">
              <FiClock size={10} />
            </span>
          )}
        </div>
        <div className="chatHeader-contactDetails">
          <h3>{contact.name}</h3>
          {!isSelfChat && enableFeatures.onlineStatus && (
            <p className="chatHeader-status">
              {getStatusText()}
            </p>
          )}
        </div>
      </div>

      {/* New: Pinned Messages Section (swipeable horizontal) */}
      {pinnedMessages.length > 0 && (
        <div className="chatHeader-pinned-container">
          <div className="chatHeader-pinned-header">
            <BsPinFill size={12} className="chatHeader-pinned-icon" />
            <span className="chatHeader-pinned-label">Pinned</span>
          </div>
          <div className="chatHeader-pinned-list" ref={pinnedRef}>
            {pinnedMessages.map((pin) => (
              <div
                key={pin.id}
                className="chatHeader-pinned-item"
                onClick={() => handlePinClick(pin)}
                role="button"
                tabIndex={0}
                aria-label={`Jump to pinned message: ${pin.text?.substring(0, 50)}...`}
              >
                <div className="chatHeader-pinned-text">
                  {pin.text?.substring(0, 30)}...
                </div>
                <div className="chatHeader-pinned-time">
                  {formatDate(pin.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="chatHeader-chatMenuContainer" ref={menuRef}>
        {!isSelfChat && !isSmallScreen && (
          <>
            <button
              className="chatHeader-iconButton chatHeader-callButton voice"
              onClick={() => startAudioCall && startAudioCall()}
              title="Start voice call"
              aria-label="Start voice call"
            >
              <FiPhone size={18} />
            </button>
            <button
              className="chatHeader-iconButton chatHeader-callButton video"
              onClick={() => startVideoCall && startVideoCall()}
              title="Start video call"
              aria-label="Start video call"
            >
              <FiVideo size={18} />
            </button>
          </>
        )}
        <button 
          className="chatHeader-iconButton chatHeader-menuButton"
          onClick={() => setShowChatMenu(!showChatMenu)}
          aria-label="Chat menu"
          aria-expanded={showChatMenu}
        >
          <FiMoreVertical size={18} color={currentTheme === 'dark' ? '#aebac1' : '#54656f'} />
        </button>
        {showChatMenu && (
          <ChatMenu
            currentTheme={currentTheme}
            toggleTheme={toggleTheme}
            setShowSettings={setShowSettings}
            setShowClearChatConfirm={setShowClearChatConfirm}
            exportChat={exportChat}
            showChatMenu={showChatMenu}
            setShowChatMenu={setShowChatMenu}
            setShowWallpaper={setShowWallpaper}
            currentWallpaper={currentWallpaper}
            resetWallpaper={resetWallpaper}
            openDisappearingModal={openDisappearingModal}
            compactActions={isSmallScreen}
            onClickAudioCall={isSmallScreen ? startAudioCall : null}
            onClickVideoCall={isSmallScreen ? startVideoCall : null}
            isSelfChat={isSelfChat}
          />
        )}
      </div>
    </div>
  );
};

ChatHeader.propTypes = {
  contact: PropTypes.shape({
    name: PropTypes.string.isRequired,
    isOnline: PropTypes.bool,
    lastSeen: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.string,
      PropTypes.number
    ]),
    avatar: PropTypes.string
  }).isRequired,
  pinnedMessages: PropTypes.array, // New
  onPinClick: PropTypes.func, // New
  isTyping: PropTypes.bool,
  currentTheme: PropTypes.string,
  setCurrentTheme: PropTypes.func,
  setShowSettings: PropTypes.func,
  setShowClearChatConfirm: PropTypes.func,
  exportChat: PropTypes.func,
  isLoggedIn: PropTypes.bool,
  handleLogout: PropTypes.func,
  setShowLogin: PropTypes.func,
  setShowWallpaper: PropTypes.func,
  currentWallpaper: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      isCustom: PropTypes.bool
    })
  ]),
  resetWallpaper: PropTypes.func,
  enableFeatures: PropTypes.shape({
    typingIndicators: PropTypes.bool,
    onlineStatus: PropTypes.bool
  }),
  isMobileView: PropTypes.bool,
  onBackClick: PropTypes.func,
  isSelfChat: PropTypes.bool,
  startAudioCall: PropTypes.func,
  startVideoCall: PropTypes.func,
  hasDisappearingActive: PropTypes.bool,
  onDeleteUser: PropTypes.func
};