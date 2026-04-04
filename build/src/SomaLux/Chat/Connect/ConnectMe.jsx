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

import "./ConnectMe.css";
import { ChatMe } from '../ChatList/ChatMe';
import { MyGroups } from "../GroupList/MyGroups";
import { Chat } from '../Chat/Chat';
import { useLocation, useNavigate } from 'react-router-dom';

export const ConnectMe = ({ user: initialUser, onLogout, onForegroundToast }) => {
  const [activeTab, setActiveTab] = useState('Chats');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');
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
      console.error("Error parsing user data:", error);
      return initialUser || {};
    }
  });

  useEffect(() => {
    if (location.hash === '#chats') {
      setActiveTab('Chats');
    } else if (location.hash === '#chat') {
      setActiveTab(isMobile ? 'ChatView' : 'Chats');
    } else if (location.hash === '#groups') {
      setActiveTab('Groups');
    } else if (location.hash === '#group') {
      setActiveTab('Groups');
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
    { key: 'Chats', icon: <ChatCircleText size={24} />, label: 'Chats' },
    { key: 'Groups', icon: <Users size={24} />, label: 'Groups' },
    { key: 'Channels', icon: <Broadcast size={24} />, label: 'Channels' },
    { key: 'Story', icon: <PlayCircle size={24} />, label: 'Story' },
    { key: 'Calls', icon: <Phone size={24} />, label: 'Calls' },
    { key: 'Settings', icon: <Gear size={24} />, label: 'Settings' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Chats':
        return (
          <div className="tab-contentConnect chatme-chat-list-containerConnect">
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
          <div className={`tab-contentConnect groups-contentConnect ${isGroupViewActive ? 'group-detail-activeConnect' : ''}`}>
            <MyGroups
              searchQuery={searchQuery}
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
          </div>
        </div>
      )}

      {!(activeTab === 'ChatView') && !selectedChat && !(activeTab === 'Groups' && isGroupViewActive) && (
        <header className={`app-headerConnect ${isScrolled ? 'scrolledConnect' : ''}`}>
          <div className="header-contentConnect">
            <div className="search-barConnect">
              <MagnifyingGlass size={20} className="search-iconConnect" />
              <input
                type="text"
                placeholder={
                  activeTab === 'Chats' ? "Search chats" :
                    activeTab === 'Groups' ? "Search groups" :
                      activeTab === 'Profile' ? "Search profile" :
                        activeTab === 'Channels' ? "Search channels" :
                          `Search ${activeTab.toLowerCase()}`
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Removed Profile1 from header */}
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

      {isMobile && !isProfileViewerActive && activeTab !== 'ChatView' && !isGroupViewActive && (
        <nav className="mobile-bottom-navConnect">
          {tabs.filter(t => t.key !== 'Profile').map(tab => (
            <button
              key={tab.key}
              className={`mobile-tabConnect ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
            >
              {React.cloneElement(tab.icon, { size: 28 })}
              <span className="mobile-tab-labelConnect">{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};