import React, { useState, useEffect } from 'react';
import { Broadcast } from 'phosphor-react';
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
import { logError } from '../../../Services/utils/errorFormatter';

import "./ConnectMe.css";
import { ChatMe } from '../ChatList/ChatMe';
import { MyGroups } from "../GroupList/MyGroups";
import { ProfilePage } from '../ProfilePage/ProfilePage';
import { useLocation, useNavigate } from 'react-router-dom';

export const ConnectMe = ({ user: initialUser, onLogout, onForegroundToast, onChatSelected, onChatWindowActive, onBackFromChat }) => {
  const [activeTab, setActiveTab] = useState('Chats');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isProfileViewerActive, setIsProfileViewerActive] = useState(false);
  const [isGroupViewActive, setIsGroupViewActive] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('userProfile');
      return savedUser ? JSON.parse(savedUser) : initialUser || {};
    } catch (error) {
      logError('Error parsing user data', error);
      return initialUser || {};
    }
  });

  useEffect(() => {
    console.log('ConnectMe: location.hash changed to:', location.hash);
    if (location.hash === '#chats') {
      console.log('ConnectMe: Setting activeTab to Chats');
      setActiveTab('Chats');
    } else if (location.hash === '#chat') {
      console.log('ConnectMe: Setting activeTab to ChatView or Chats');
      setActiveTab(isMobile ? 'ChatView' : 'Chats');
    } else if (location.hash === '#groups') {
      console.log('ConnectMe: Setting activeTab to Groups');
      setActiveTab('Groups');
    } else if (location.hash === '#group') {
      console.log('ConnectMe: Setting activeTab to Groups');
      setActiveTab('Groups');
    } else if (location.hash.startsWith('#profile/')) {
      console.log('ConnectMe: Setting activeTab to Profile with hash:', location.hash);
      setActiveTab('Profile');
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
      logError('Error saving user data', error);
    }
  }, [user]);

  const handleChatSelect = (chat) => {
    if (!chat) {
      // Back button was clicked, reset to Chats tab
      setSelectedChat(null);
      setActiveTab('Chats');
      navigate('#chats', { replace: true });
      if (onChatWindowActive) {
        onChatWindowActive(false);
      }
      return;
    }
    
    setSelectedChat(chat);
    if (isMobile) {
      setActiveTab('ChatView');
    }
    navigate('#chat', { replace: true });
    // Notify parent that a chat has been selected
    if (onChatSelected) {
      onChatSelected(chat);
    }
    // Also notify parent that chat window is active
    if (onChatWindowActive) {
      onChatWindowActive(!!chat);
    }
  };

  const handleBackToChats = () => {
    setSelectedChat(null);
    setActiveTab('Chats');
    navigate('#chats', { replace: true });
    // Notify parent that chat has been deselected
    if (onChatSelected) {
      onChatSelected(null);
    }
    // Also notify parent that chat window is inactive
    if (onChatWindowActive) {
      onChatWindowActive(false);
    }
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
      setIsSidebarExpanded(true);
    }
    navigate(
      tabKey === 'Chats' ? '#chats' :
        tabKey === 'Groups' ? '#groups' :
          tabKey === 'Story' ? '#story' :
            tabKey === 'Calls' ? '#calls' :
              tabKey === 'Profile' ? '#profile' :
                tabKey === 'Settings' ? '#settings' :
                  ''
    );
  };

  const tabs = [
    { key: 'Chats', icon: <ChatCircleText size={20} />, label: 'Chats' },
    { key: 'Groups', icon: <Users size={20} />, label: 'Groups' },
    { key: 'Channels', icon: <Broadcast size={20} />, label: 'Channels' },
    { key: 'Settings', icon: <Gear size={20} />, label: 'Settings' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Chats':
        return (
          <div className="tab-contentConnect chatme-chat-list-containerConnect">
            <ChatMe
              onChatSelect={handleChatSelect}
              isMobileView={isMobile}
              onProfileViewerChange={handleProfileViewerChange}
              user={user}
              onChatWindowActive={onChatWindowActive}
              onBackFromChat={onBackFromChat}
            />
          </div>
        );
      case 'Groups':
        return (
          <div className={`tab-contentConnect groups-contentConnect ${isGroupViewActive ? 'group-detail-activeConnect' : ''}`}>
            <MyGroups
              onGroupViewChange={handleGroupViewChange}
            />
          </div>
        );
      case 'Channels':
        return (
          <div className="tab-contentConnect channels-contentConnect">
            <div className="empty-stateConnect">
              <Broadcast size={64} weight="light" />
              <p>Channels feature coming soon</p>
            </div>
          </div>
        );
      case 'Calls':
        return (
          <div className="tab-contentConnect calls-contentConnect">
            <div className="calls-content-innerConnect">
              <h2>Calls</h2>
              <div className="empty-stateConnect">
                <Phone size={64} weight="light" />
                <p>Your call history will appear here</p>
              </div>
            </div>
          </div>
        );
      case 'Profile':
        // Extract userId from location hash if present (e.g., #profile/userId)
        const profileUserId = location.hash.startsWith('#profile/') 
          ? location.hash.substring('#profile/'.length) 
          : null;
        
        if (profileUserId) {
          return (
            <div className="tab-contentConnect profile-contentConnect profile-page-full">
              <ProfilePage />
            </div>
          );
        }
        
        return (
          <div className="tab-contentConnect profile-contentConnect">
            <div className="empty-stateConnect">
              <span>👤</span>
              <p>Settings coming soon</p>
            </div>
          </div>
        );
      case 'Settings':
        return (
          <div className="tab-contentConnect profile-contentConnect">
            <div className="empty-stateConnect">
              <Gear size={64} weight="light" />
              <p>Settings coming soon</p>
            </div>
          </div>
        );
      case 'ChatView':
        return (
          <div className="tab-contentConnect chat-view-contentConnect">
            {selectedChat && (
              <ChatMe
                initialChat={selectedChat}
                isMobileView={isMobile}
                onBackClick={handleBackToChats}
                onChatSelect={handleChatSelect}
                onForegroundToast={onForegroundToast}
                onChatWindowActive={onChatWindowActive}
                onBackFromChat={onBackFromChat}
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`connect-me-containerConnect ${isMobile ? 'mobile-viewConnect' : ''}`}>
      <div className="stars-containerConnect">
        <div className="starConnect"></div>
        <div className="starConnect"></div>
        <div className="starConnect"></div>
        <div className="starConnect"></div>
        <div className="starConnect"></div>
        <div className="starConnect"></div>
        <div className="starConnect"></div>
        <div className="starConnect"></div>
      </div>

      {!isMobile && (
        <div className={`desktop-sidebarConnect ${isSidebarExpanded ? 'expanded' : 'collapsed'} ${(activeTab === 'Groups' && isGroupViewActive) ? 'fullheight' : ''}`}>
          <button
            className="sidebar-toggleConnect"
            onClick={handleSidebarToggle}
            title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            aria-label={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <List size={24} />
          </button>
          <div className="sidebar-tabsConnect">
            {tabs.filter(tab => tab.key !== 'Profile' && tab.key !== 'Settings').map(tab => (
              <button
                key={tab.key}
                className={`sidebar-tabConnect ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
                title={tab.label}
              >
                {tab.icon}
                <span className="sidebar-tab-labelConnect">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="sidebar-spacerConnect"></div>
          <div className="sidebar-bottomConnect">
            {tabs.filter(tab => tab.key === 'Settings').map(tab => (
              <button
                key={tab.key}
                className={`sidebar-tabConnect ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
                title={tab.label}
              >
                {tab.icon}
                <span className="sidebar-tab-labelConnect">{tab.label}</span>
              </button>
            ))}
            {tabs.filter(tab => tab.key === 'Profile').map(tab => (
              <button
                key={tab.key}
                className={`sidebar-tabConnect ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
                title={tab.label}
              >
                {tab.icon}
                <span className="sidebar-tab-labelConnect">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!(activeTab === 'ChatView') && !selectedChat && !(activeTab === 'Groups' && isGroupViewActive) && (
        <header className={`app-headerConnect ${isScrolled ? 'scrolledConnect' : ''}`}>
          <div className="header-contentConnect">
            {/* Search moved to individual tab components */}
          </div>
        </header>
      )}

      {isMobile && activeTab === 'ChatView' && (
        <div className="mobile-chat-headerConnect">
          <button onClick={handleBackToChats} className="mobile-back-buttonConnect">
            <ArrowLeft size={24} />
          </button>
          {selectedChat && (
            <div className="mobile-chat-titleConnect">
              <img
                src={selectedChat.profilePicture}
                alt={selectedChat.name}
                className="mobile-chat-avatarConnect"
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

      <main className="main-contentConnect">
        {renderTabContent()}
      </main>

      {(() => {
        const show = isMobile && !isProfileViewerActive && activeTab !== 'ChatView' && !isGroupViewActive;
        return show;
      })() && (
        <nav className="mobile-bottom-navConnect">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`mobile-tabConnect ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
              title={tab.label}
            >
              {tab.icon}
              <span className="mobile-tab-labelConnect">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};