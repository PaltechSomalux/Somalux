import React, { useState, useEffect, useRef } from 'react';
import { FaHome, FaComment, FaUser, FaBell } from 'react-icons/fa';
import { DiscoverSection } from './DiscoverSection';
import { MatchesSection } from './MatchesSection';
import { ProfileSection } from './ProfileSection';
import { MessageMenu } from './MessageMenu';
import { ReactionMenu } from './ReactionMenu';
import './Dating.css';

export const Dating = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [activeMessageForReaction, setActiveMessageForReaction] = useState(null);
  const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      message: 'Sarah liked your profile',
      time: '2 hours ago',
      read: false
    },
    {
      id: '2',
      message: 'You matched with Emma!',
      time: '1 day ago',
      read: false
    },
    {
      id: '3',
      message: 'New message from Jessica',
      time: '30 minutes ago',
      read: true
    }
  ]);
  const socketRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser({
        id: '123',
        name: 'Alex',
        age: 28,
        photos: ['https://randomuser.me/api/portraits/men/32.jpg'],
        premium: false,
        location: {
          city: 'San Francisco',
          country: 'USA'
        },
        lastActive: new Date().toISOString(),
        online: true,
        activityStatus: 'active'
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    // Mark notifications as read when opened
    if (!showNotifications) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  if (loading) {
    return (
      <div className="dating-loading-screen">
        <div className="dating-spinner"></div>
        <p>Loading your dating experience...</p>
      </div>
    );
  }

  return (
    <div className="dating-app-container">
      <header className="dating-header">
        <h1>Fast.Fresh.Yours</h1>
        <div className="dating-header-actions">
          <div className="dating-notifications-container">
            <button 
              className={`dating-notifications-button ${showNotifications ? 'active' : ''}`}
              onClick={handleNotificationClick}
            >
              <FaBell />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="dating-badge">{notifications.filter(n => !n.read).length}</span>
              )}
            </button>
            {showNotifications && (
              <div className="dating-notifications-dropdown">
                <div className="dating-notifications-list">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`dating-notification-item ${notification.read ? '' : 'unread'}`}
                    >
                      <p>{notification.message}</p>
                      <span className="dating-notification-time">{notification.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dating-content">
        {activeTab === 'discover' && <DiscoverSection />}
        {activeTab === 'matches' && (
          <MatchesSection 
            setActiveMessageMenu={setActiveMessageMenu}
            setMessageMenuPosition={setMessageMenuPosition}
          />
        )}
        {activeTab === 'profile' && <ProfileSection />}
      </main>

      <nav className="dating-bottom-nav">
        <button 
          className={`dating-nav-item ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          <FaHome />
          <span>Discover</span>
        </button>
        <button 
          className={`dating-nav-item ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <FaComment />
          <span>Matches</span>
        </button>
        <button 
          className={`dating-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FaUser />
          <span>Profile</span>
        </button>
      </nav>

      {activeMessageMenu && (
        <MessageMenu 
          activeMessageMenu={activeMessageMenu}
          setActiveMessageMenu={setActiveMessageMenu}
          setActiveMessageForReaction={setActiveMessageForReaction}
          messageMenuPosition={messageMenuPosition}
        />
      )}

      {activeMessageForReaction && (
        <ReactionMenu 
          setActiveMessageForReaction={setActiveMessageForReaction}
          activeMessageForReaction={activeMessageForReaction}
        />
      )}
    </div>
  );
};