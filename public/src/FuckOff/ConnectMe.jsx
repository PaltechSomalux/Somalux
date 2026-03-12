import React, { useState, useEffect } from 'react';
import { Broadcast } from 'phosphor-react';  // Or wherever your Phosphor icons are imported from
import {
  Phone,
  Users,
  PlayCircle,
  ChatCircleText,
  MagnifyingGlass,
  ArrowLeft,
  List,
  MegaphoneSimple,
  Gear
} from "phosphor-react";

import "./ConnectMe.css";
import { ChatMe } from '../KissMe/ChatMe';
import { MyGroups } from "../MyCult/MyGroups";
import { Stories } from "../TalkToMe/Stories";
import { Profile1 } from './Profile1';
import { Profile } from './Profile';
import { Chat } from '../Kiss/Chat';
import { useLocation, useNavigate } from 'react-router-dom';
import { Channels } from '../Channel/Channels';
import CallsTab from './Calls/CallsTab';

export const ConnectMe = ({ user: initialUser, onLogout, onForegroundToast }) => {
  const [activeTab, setActiveTab] = useState('Chats');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isProfileViewerActive, setIsProfileViewerActive] = useState(false);
  const [isGroupViewActive, setIsGroupViewActive] = useState(false);
  const [isChannelViewActive, setIsChannelViewActive] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Changed to false for collapsed default
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('userProfile');
      return savedUser ? JSON.parse(savedUser) : initialUser || {};
    } catch (error) {
      console.error("Error parsing user data:", error);
      return initialUser || {};
    }
  });

  useEffect(() => {
    if (location.hash === '#chats') {
      setActiveTab('Chats');
    } else if (location.hash === '#chat') {
      // Mobile should open ChatView directly to avoid flick/bounce
      setActiveTab(isMobile ? 'ChatView' : 'Chats');
    } else if (location.hash === '#groups') {
      setActiveTab('Groups');
    } else if (location.hash === '#group') {
      setActiveTab('Groups');
    } else if (location.hash === '#channels') {
      setActiveTab('Channels');
    }
  }, [location.hash, isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      if (newIsMobile) {
        setIsSidebarExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (activeTab === 'Groups') {
      const targetHash = isGroupViewActive ? '#group' : '#groups';
      if (location.hash !== targetHash) {
        navigate(targetHash, { replace: true });
      }
    }
  }, [isGroupViewActive, activeTab, location.hash, navigate]);

  useEffect(() => {
    try {
      localStorage.setItem('userProfile', JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  }, [user]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    if (isMobile) {
      setActiveTab('ChatView');
    }
    navigate('#chat', { replace: true });
  };


  const handleBackToChats = () => {
    setSelectedChat(null);
    setActiveTab('Chats');
    navigate('#chats', { replace: true });
  };

  const handleGroupViewChange = (isActive) => {
    setIsGroupViewActive(isActive);
  };


  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleProfileViewerChange = (isActive) => {
    setIsProfileViewerActive(isActive);
  };

  const handleSidebarToggle = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    setSelectedChat(null);
    setIsGroupViewActive(false);
    if (isMobile) {
      setIsSidebarExpanded(true); // On mobile, safe to expand if applicable
    }
    navigate(
      tabKey === 'Chats' ? '#chats' :
        tabKey === 'Groups' ? '#groups' :
          tabKey === 'Channels' ? '#channels' :
            tabKey === 'Story' ? '#story' :
              tabKey === 'Calls' ? '#calls' :
                tabKey === 'Profile' ? '#profile' :
                  tabKey === 'Settings' ? '#settings' :
                    ''
    );
  };

  const tabs = [
    { key: 'Chats', icon: <ChatCircleText size={24} />, label: 'Chats' },
    { key: 'Groups', icon: <Users size={24} />, label: 'Groups' },
    { key: 'Channels', icon: <Broadcast size={24} />, label: 'Channels' },
    { key: 'Story', icon: <PlayCircle size={24} />, label: 'Story' },
    { key: 'Calls', icon: <Phone size={24} />, label: 'Calls' },
    { key: 'Settings', icon: <Gear size={24} />, label: 'Settings' },
    {
      key: 'Profile',
      icon: user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name || 'User'}
          className="profile-tab-avatar"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${user?.name ? user.name.charAt(0) : 'U'}&background=4285F4&color=fff&size=64`;
          }}
        />
      ) : (
        <div className="default-profile-tab-avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      ),
      label: 'Profile'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Chats':
        return (
          <div className="tab-content chats-content">
            <ChatMe
              onChatSelect={handleChatSelect}
              searchQuery={searchQuery}
              isMobileView={isMobile}
              onProfileViewerChange={handleProfileViewerChange}
              user={user}
            />
          </div>
        );
      case 'Groups':
        return (
          <div className={`tab-content groups-content ${isGroupViewActive ? 'group-detail-active' : ''}`}>
            <MyGroups
              searchQuery={searchQuery}
              onGroupViewChange={handleGroupViewChange}
            />
          </div>
        );
      case 'Channels':
        return (
          <div className="tab-content channels-content">
            <Channels searchQuery={searchQuery} onChannelViewChange={setIsChannelViewActive} />
          </div>
        );
      case 'Story':
        return (
          <div className="tab-content story-content">
            <Stories />
          </div>
        );
      case 'Calls':
        return (
          <div className="tab-content calls-content">
            <CallsTab user={user} isMobile={isMobile} />
          </div>
        );
      case 'Profile':
        return (
          <div className="tab-content profile-content">
            <Profile1
              user={user}
              isProfilePage={true}
              onLogout={onLogout}
              onUserUpdate={handleUserUpdate}
              isMobile={isMobile}
            />
          </div>
        );
      case 'Settings':
        return (
          <div className="tab-content profile-content">
            <Profile
              user={user}
              onUserUpdate={handleUserUpdate}
              isMobileView={isMobile}
              initialTab={'account'}
            />
          </div>
        );
      case 'ChatView':
        return (
          <div className="tab-content chat-view-content">
            {selectedChat && (
              <Chat
                initialMessages={selectedChat.messages}
                currentUser={{
                  id: 'user1',
                  name: user.name || 'You',
                  profilePicture: user.avatar,
                  status: 'online',
                  email: user.email || 'user@example.com',
                  role: 'user'
                }}
                contact={{
                  id: selectedChat.id,
                  name: selectedChat.name,
                  avatar: selectedChat.profilePicture,
                  status: selectedChat.isOnline ? 'online' : 'offline',
                  lastSeen: selectedChat.lastSeen
                }}
                onMessageCreated={(msg) => {
                  const updatedMessages = [...selectedChat.messages, msg];
                  setSelectedChat({ ...selectedChat, messages: updatedMessages });
                }}
                isMobileView={isMobile}
                onBackClick={handleBackToChats}
                onForegroundToast={onForegroundToast}
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`connect-me-container ${isMobile ? 'mobile-view' : ''}`}>
      <div className="stars-container">
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      </div>
      {!isMobile && (
        <div className={`desktop-sidebar ${isSidebarExpanded ? 'expanded' : 'collapsed'} ${(activeTab === 'Groups' && isGroupViewActive) ? 'fullheight' : ''}`}>
          <button
            className="sidebar-toggle"
            onClick={handleSidebarToggle}
            title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            aria-label={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <List size={24} />
          </button>
          <div className="sidebar-tabs">
            {tabs.filter(tab => tab.key !== 'Profile' && tab.key !== 'Settings').map(tab => (
              <button
                key={tab.key}
                className={`sidebar-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
                title={tab.label}
              >
                {tab.icon}
                <span className="sidebar-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="sidebar-spacer"></div>
          <div className="sidebar-bottom">
            {tabs.filter(tab => tab.key === 'Settings').map(tab => (
              <button
                key={tab.key}
                className={`sidebar-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
                title={tab.label}
              >
                {tab.icon}
                <span className="sidebar-tab-label">{tab.label}</span>
              </button>
            ))}
            {tabs.filter(tab => tab.key === 'Profile').map(tab => (
              <button
                key={tab.key}
                className={`sidebar-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
                title={tab.label}
              >
                {tab.icon}
                <span className="sidebar-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!(activeTab === 'ChatView') && !selectedChat && !(activeTab === 'Groups' && isGroupViewActive) && !(activeTab === 'Channels' && isChannelViewActive) && (
        <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
          <div className="header-content">
            {/* <div className="search-bar">
              <MagnifyingGlass size={20} className="search-icon" />
              <input
                type="text"
                placeholder={
                  activeTab === 'Chats' ? "Search chatss" :
                    activeTab === 'Groups' ? "Search groups" :
                      activeTab === 'Profile' ? "Search profile" :
                        activeTab === 'Channels' ? "Search channels" :
                          `Search ${activeTab.toLowerCase()}`
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div> */}
            <div className="header-profile">
              <Profile1
                user={user}
                isMobile={isMobile}
                onLogout={onLogout}
                onUserUpdate={handleUserUpdate}
              />
            </div>
          </div>
        </header>
      )}

      {isMobile && activeTab === 'ChatView' && (
        <div className="mobile-chat-header">
          <button onClick={handleBackToChats} className="mobile-back-button">
            <ArrowLeft size={24} />
          </button>
          {selectedChat && (
            <div className="mobile-chat-title">
              <img
                src={selectedChat.profilePicture}
                alt={selectedChat.name}
                className="mobile-chat-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${selectedChat.name.charAt(0)}&background=4285F4&color=fff&size=64`;
                }}
              />
              <span>{selectedChat.name}</span>
            </div>
          )}
        </div>
      )}

      <main className="main-content">
        {renderTabContent()}
      </main>

      {isMobile && !isProfileViewerActive && activeTab !== 'ChatView' && !isGroupViewActive && !isChannelViewActive && (
        <nav className="mobile-bottom-nav">
          {tabs.filter(t => t.key !== 'Settings').map(tab => (
            <button
              key={tab.key}
              className={`mobile-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
            >
              {React.cloneElement(tab.key === 'Profile' ?
                (user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${user?.name ? user.name.charAt(0) : 'U'}&background=4285F4&color=fff&size=64`;
                    }}
                  />
                ) : (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )) : tab.icon,
                { size: 24 }
              )}
              <span className="mobile-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

    </div>
  );
};