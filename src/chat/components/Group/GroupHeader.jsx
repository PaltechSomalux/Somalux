import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiPhone, FiVideo, FiMoreVertical, FiArrowLeft, FiX } from 'react-icons/fi';
import { BsPinFill } from 'react-icons/bs';
import { format, isValid } from 'date-fns';
import { ChatMenu } from './ChatMenu';
import "./GroupHeaderChatmeGroups.css";

export const GroupHeader = ({
  group,
  pinnedMessages = [],
  onPinClick = () => {},
  onUnpinMessage = () => {},
  isTyping = false,
  typingUsers = {},
  currentTheme = 'dark',
  setCurrentTheme = () => {},
  setShowSettings = () => {},
  setShowClearChatConfirm = () => {},
  exportChat = () => {},
  isLoggedIn = false,
  handleLogout = () => {},
  setShowLogin = () => {},
  setShowWallpaper = () => {},
  currentWallpaper,
  resetWallpaper = () => {},
  enableFeatures = { typingIndicators: true, onlineStatus: true },
  isSelfChat = false,
  onVoiceCallClick = () => {},
  onVideoCallClick = () => {},
  onBackClick = () => {},
  setShowGroupInfo = () => {},
}) => {
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showGroupAvatarFullscreen, setShowGroupAvatarFullscreen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const pinnedRef = useRef(null);

  // compute icon size for header icons (24px desktop, 22px mobile)
  const iconSize = (typeof window !== 'undefined' && window.innerWidth <= 768) ? 22 : 24;

  const toggleTheme = () => {
    setCurrentTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const formatDate = (date) => {
    if (!date || !isValid(new Date(date))) return '';
    return format(new Date(date), 'h:mm a');
  };

  const generateDefaultGroupAvatar = () => {
    const initials = group.name ? group.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'GC';
    const colors = ['FFAD08', 'EDD382', 'FC7174', '6DD3CE', 'C8E9A0'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=256`;
  };

  const handleDownloadGroupAvatar = () => {
    const link = document.createElement('a');
    link.href = group.avatar || generateDefaultGroupAvatar();
    link.download = `${group.name.replace(/\s+/g, '_')}_avatar.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareGroupAvatar = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${group.name} Group`,
          url: group.avatar || generateDefaultGroupAvatar(),
        });
      } else {
        await navigator.clipboard.writeText(group.avatar || generateDefaultGroupAvatar());
        alert('URL copied!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowChatMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGroupMemberStatus = () => {
    const byIds = Array.isArray(group.memberIds) ? group.memberIds.length : null;
    const memberCount = (byIds ?? group.memberCount ?? (Array.isArray(group.members) ? group.members.length : 0)) || 0;
    const totalMembersText = `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;
    
    if (enableFeatures.typingIndicators && isTyping) {
      const names = Object.values(typingUsers).filter(Boolean);
      const count = names.length;
      const label = count === 1 ? `${names[0]} typing` : `${count} typing`;
      return (
        <div className="groupHeaderChatmeGroups-status-container">
          <span className="groupHeaderChatmeGroups-typingIndicator">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            {label}
          </span>
          <span className="groupHeaderChatmeGroups-member-count">{totalMembersText}</span>
        </div>
      );
    }

    if (enableFeatures.onlineStatus && !isSelfChat) {
      const online = group.members?.filter(m => m.online).length || 0;
      if (online > 0) {
        return (
          <div className="groupHeaderChatmeGroups-status-container">
            <span className="groupHeaderChatmeGroups-onlineStatus">
              <span className="groupHeaderChatmeGroups-onlineDot"></span>
              {`${online} ${online === 1 ? 'member' : 'members'} online`}
            </span>
            <span className="groupHeaderChatmeGroups-member-count">{totalMembersText}</span>
          </div>
        );
      }
      if (group.lastActivity) {
        return totalMembersText;
      }
    }

    return totalMembersText;
  };

  return (
    <div 
      className={`groupHeaderChatmeGroups-header ${currentTheme}-theme`}
      style={{
        backgroundImage: currentWallpaper?.url ? `url('${currentWallpaper.url}')` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {showGroupAvatarFullscreen && (
        <div className="groupHeaderChatmeGroups-avatarFullscreenOverlay" onClick={() => setShowGroupAvatarFullscreen(false)}>
          <div className="groupHeaderChatmeGroups-avatarFullscreenContainer" onClick={e => e.stopPropagation()}>
            <img
              src={group.avatar || generateDefaultGroupAvatar()}
              alt={group.name}
              className="groupHeaderChatmeGroups-avatarFullscreenImage"
              onError={(e) => { e.currentTarget.src = generateDefaultGroupAvatar(); }}
            />
            <div className="groupHeaderChatmeGroups-avatarFullscreenFooter">
              <h3>{group.name}</h3>
              <div className="groupHeaderChatmeGroups-avatarActions">
                <button onClick={(e) => { e.stopPropagation(); handleDownloadGroupAvatar(); }}>Save</button>
                <button onClick={(e) => { e.stopPropagation(); handleShareGroupAvatar(); }}>Share</button>
              </div>
            </div>
            <button className="groupHeaderChatmeGroups-avatarCloseButton" onClick={() => setShowGroupAvatarFullscreen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button className="groupHeaderChatmeGroups-backButton" onClick={onBackClick}>
        <FiArrowLeft size={24} strokeWidth={2.5} style={{ display: 'block', visibility: 'visible', opacity: 1 }} />
      </button>

      <div className="groupHeaderChatmeGroups-leftSection">
        <div className="groupHeaderChatmeGroups-contactInfo" onClick={() => setShowGroupInfo(true)} role="button" tabIndex={0}>
          <div className="groupHeaderChatmeGroups-contactAvatar">
            {group.avatar && !avatarFailed ? (
              <img
                src={group.avatar}
                alt={group.name}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="groupHeaderChatmeGroups-avatarPlaceholder">
                {group?.name?.charAt(0)?.toUpperCase() || 'G'}
              </div>
            )}
          </div>
          <div className="groupHeaderChatmeGroups-contactDetails">
            <h3>{group.name}</h3>
            <p className="groupHeaderChatmeGroups-status">{getGroupMemberStatus()}</p>
          </div>
        </div>
      </div>

      <div className="groupHeaderChatmeGroups-rightSection">
        <div className="groupHeaderChatmeGroups-chatMenuContainer" ref={menuRef}>
          <button className="groupHeaderChatmeGroups-iconButton groupHeaderChatmeGroups-voiceButton" onClick={onVoiceCallClick}>
            <FiPhone size={24} strokeWidth={2.5} />
          </button>
          <button className="groupHeaderChatmeGroups-iconButton groupHeaderChatmeGroups-videoButton" onClick={onVideoCallClick}>
            <FiVideo size={24} strokeWidth={2.5} />
          </button>
          <button className="groupHeaderChatmeGroups-iconButton groupHeaderChatmeGroups-menuButton" onClick={(e) => {
            if (!showChatMenu && menuRef.current) {
              const rect = menuRef.current.getBoundingClientRect();
              setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
            }
            setShowChatMenu(!showChatMenu);
          }}>
            <FiMoreVertical size={24} strokeWidth={2.5} />
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
              isLoggedIn={isLoggedIn}
              handleLogout={handleLogout}
              setShowLogin={setShowLogin}
              menuPosition={menuPosition}
            />
          )}
        </div>
      </div>
    </div>
  );
};

GroupHeader.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    members: PropTypes.array,
    memberCount: PropTypes.number,
    createdBy: PropTypes.string,
    admins: PropTypes.array,
    lastActivity: PropTypes.any,
  }).isRequired,
  pinnedMessages: PropTypes.array,
  onPinClick: PropTypes.func,
  isTyping: PropTypes.bool,
  typingUsers: PropTypes.object,
  currentTheme: PropTypes.string,
  setCurrentTheme: PropTypes.func,
  setShowSettings: PropTypes.func,
  setShowClearChatConfirm: PropTypes.func,
  exportChat: PropTypes.func,
  isLoggedIn: PropTypes.bool,
  handleLogout: PropTypes.func,
  setShowLogin: PropTypes.func,
  setShowWallpaper: PropTypes.func,
  currentWallpaper: PropTypes.any,
  resetWallpaper: PropTypes.func,
  enableFeatures: PropTypes.object,
  isSelfChat: PropTypes.bool,
  onVoiceCallClick: PropTypes.func,
  onVideoCallClick: PropTypes.func,
  onBackClick: PropTypes.func,
  setShowGroupInfo: PropTypes.func,
};