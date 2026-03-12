import React, { useState, useEffect } from 'react';
import './Studio.css';
import VideoLogo from "../../../Assets/Video.png";
import { VideoPlayer } from './VideoPlayer/VideoPLayer';
import { AudioPlayer } from './Music/AudioPlayer';
import { PhotoEditor } from './Photos/PhotoEditor';

export const Studio = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileDrawerVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { key: 'video', icon: '🎬', label: 'Video' },
    { key: 'audio', icon: '🎵', label: 'Audio' },
    { key: 'photos', icon: '🖼️', label: 'Photos' },
    { key: 'compressor', icon: '🗜️', label: 'Compressor' },
    { key: 'locked', icon: '🔒', label: 'Locked' },
    { key: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  const handleMenuItemClick = (itemKey) => {
    setActiveTab(itemKey);
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const activeMenuItem = menuItems.find(item => item.key === activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'video':
        return <VideoPlayer />;
      case 'audio':
        return <AudioPlayer />;
      case 'photos':
        return <PhotoEditor />;
      default:
        return (
          <div className="tab-content-placeholder-studio">
            <div className="placeholder-icon-studio">{activeMenuItem?.icon || '🎬'}</div>
            <h3>{activeTab} selected</h3>
            <p>Menu selection working</p>
          </div>
        );
    }
  };

  return (
    <div className="studio-fixed-container">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`sidebar-studio ${collapsed ? 'collapsed-studio' : ''}`}>
          <div className="logo-studio">
            {collapsed ? 'ST' : (
              <>
                <img src={VideoLogo} alt="Video Logo" className="logo-image-studio" />
                <span className="logo-text-studio">Studio</span>
              </>
            )}
            <button 
              className="collapse-btn-studio"
              onClick={() => setCollapsed(!collapsed)}
            > 
              {collapsed ? '»' : '«'}
            </button>
          </div>
          <div className="menu-studio">
            {menuItems.map(item => (
              <button
                key={item.key}
                className={`menu-item-studio ${activeTab === item.key ? 'active-studio' : ''}`}
                onClick={() => handleMenuItemClick(item.key)}
              >
                {!collapsed && <span className="menu-label-studio">{item.label}</span>}
                <span className="menu-icon-studio" style={{ marginLeft: !collapsed ? '12px' : '0' }}>{item.icon}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <>
          <div className={`mobile-drawer-studio ${mobileDrawerVisible ? 'visible' : ''}`}>
            <div className="drawer-content-studio">
              <div className="logo-studio">
                <img src={VideoLogo} alt="Video Logo" className="logo-image-studio" />
                <button 
                  className="close-drawer-studio"
                  onClick={() => setMobileDrawerVisible(false)}
                >
                  ×
                </button>
              </div>
              <div className="menu-studio">
                {menuItems.map(item => (
                  <button
                    key={item.key}
                    className={`menu-item-studio ${activeTab === item.key ? 'active-studio' : ''}`}
                    onClick={() => handleMenuItemClick(item.key)}
                  >
                    <span className="menu-label-studio">{item.label}</span>
                    <span className="menu-icon-studio" style={{ marginLeft: '12px' }}>{item.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {mobileDrawerVisible && (
            <div 
              className="drawer-overlay-studio" 
              onClick={() => setMobileDrawerVisible(false)}
            />
          )}
        </>
      )}

      {/* Main Content */}
      <div className="main-content-studio">
        {/* Mobile Header */}
        {isMobile && (
          <div className="mobile-header-studio">
            <button 
              className="mobile-menu-toggle-studio"
              onClick={() => setMobileDrawerVisible(true)}
            >
              ☰
            </button>
            <h1 className="mobile-header-title-studio">
              {activeMenuItem ? activeMenuItem.label : 'Studio'}
            </h1>
          </div>
        )}

        <main className="content-area-studio">
          <div className="content-card-studio">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}; 
