import React, { useState, useEffect } from 'react';
import "./Blacks.css";
import { Dating } from '../../Samantha/Dating';
import { Market } from "./Market/Market";
import { Briefcase, Desktop } from "phosphor-react";
import { Studio } from './Studio/Studio';
import { UserProfile } from './UserProfile';
import { CampusChumba } from './Rentals/CampusChumba';
import { FaHeart, FaBriefcase, FaShoppingBag, FaHome, FaVideo, FaLaptop } from 'react-icons/fa';

export const SocialDashboard = ({ user, onLogout }) => {
  // ──────────────────────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(window.innerWidth < 500);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768 && window.innerWidth >= 500);
  const [activeTab, setActiveTab] = useState('Dating');
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Optional global search

  // ──────────────────────────────────────────────────────────────
  // Effects
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsVerySmallScreen(width < 500);
      // Auto-collapse sidebar for medium screens (500-768px)
      setCollapsed(width < 768 && width >= 500);
      if (width >= 768) setMobileDrawerVisible(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Menu Items with React Icons
  // ──────────────────────────────────────────────────────────────
  const menuItems = [
    { key: 'Dating', icon: FaHeart, label: 'Pulse' },
    { key: 'jobs',   icon: FaBriefcase, label: 'Jobs' },
    { key: 'Market', icon: FaShoppingBag, label: 'Market' },
    { key: 'rent',   icon: FaHome, label: 'Rentals' },
    { key: 'studio', icon: FaVideo, label: 'Studio' },
    { key: 'Cyber',  icon: FaLaptop, label: 'Cyber' }
  ];

  // Only show first 5 tabs in mobile bottom nav
  const visibleMobileNavItems = [
    { key: 'Dating', icon: FaHeart, label: 'Pulse' },
    { key: 'jobs',   icon: FaBriefcase, label: 'Jobs' },
    { key: 'Market', icon: FaShoppingBag, label: 'Market' },
    { key: 'studio', icon: FaVideo, label: 'Studio' },
    { key: 'Cyber',  icon: FaLaptop, label: 'Cyber' },
  ];

  // Remaining items to show in dropdown
  const remainingItems = menuItems.filter(
    item => !visibleMobileNavItems.find(nav => nav.key === item.key)
  );

  // ──────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────
  const handleMobileNavClick = (key) => {
    if (key === 'more') {
      setMobileDrawerVisible(prev => !prev);
    } else {
      setActiveTab(key);
      setMobileDrawerVisible(false);
    }
  };

  const handleMenuItemClick = (key) => {
    setActiveTab(key);
    if (isMobile) setMobileDrawerVisible(false);
  };

  // ──────────────────────────────────────────────────────────────
  // Render Tab Content
  // ──────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dating':
        return <Dating />;
      case 'Market':
        return <Market searchQuery={searchQuery} />;
      case 'jobs':
        return (
          <div className="jobs-content-blacks">
            <h2>Jobs</h2>
            <div className="empty-state-blacks">
              <Briefcase size={64} weight="light" />
              <p>Job listings will appear here</p>
            </div>
          </div>
        );
      case 'rent':
        return <CampusChumba />;
      case 'studio':
        return <Studio hideMobileNav={isMobile} />;
      case 'Cyber':
        return (
          <div className="cyber-content-blacks">
            <h2>Cyber</h2>
            <div className="empty-state-blacks">
              <Desktop size={64} weight="light" />
              <p>Cyber services will appear here</p>
            </div>
          </div>
        );
      default:
        return <div>Select a tab to view content</div>;
    }
  };

  // Hide mobile bottom nav when Studio OR Market is active, or when screen is larger than 500px
  const shouldShowMobileNav = isVerySmallScreen && activeTab !== 'studio' && activeTab !== 'Market';

  // ──────────────────────────────────────────────────────────────
  // JSX
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="app-layout-blacks">

      {/* Desktop Sidebar - Show for >= 500px, auto-collapse for 500-768px */}
      {!isVerySmallScreen && (
        <div className={`sidebar-blacks ${collapsed ? 'collapsed-blacks' : ''}`}>
          <div className="logo-blacks">
            {collapsed ? 'SP' : 'Social Portal'}
            <button
              className="collapse-btn-blacks"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? '»' : '«'}
            </button>
          </div>

          <div className="menu-blacks">
            {menuItems.map(item => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.key}
                  className={`menu-item-blacks ${activeTab === item.key ? 'active-blacks' : ''}`}
                  onClick={() => handleMenuItemClick(item.key)}
                >
                  <span className="menu-icon-blacks"><IconComponent /></span>
                  {!collapsed && <span className="menu-label-blacks">{item.label}</span>}
                </button>
              );
            })}

            <button
              className={`menu-item-blacks ${collapsed ? 'collapsed-profile-blacks' : ''}`}
              style={{ marginTop: 'auto', paddingBottom: '20px' }}
            >
              <UserProfile user={user} onLogout={onLogout} showAsIconOnly={collapsed} size={24} />
              {!collapsed && <span className="menu-label-blacks">Profile</span>}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Dropdown Menu (Shows only remaining items) */}
      {isVerySmallScreen && mobileDrawerVisible && remainingItems.length > 0 && (
        <div className="mobile-dropdown-blacks">
          <div className="dropdown-content-blacks">
            {remainingItems.map(item => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.key}
                  className={`dropdown-item-blacks ${activeTab === item.key ? 'active-blacks' : ''}`}
                  onClick={() => {
                    setActiveTab(item.key);
                    setMobileDrawerVisible(false);
                  }}
                >
                  <span className="dropdown-icon-blacks"><IconComponent /></span>
                  <span className="dropdown-label-blacks">{item.label}</span>
                </button>
              );
            })}
          </div>
          <div
            className="dropdown-overlay-blacks"
            onClick={() => setMobileDrawerVisible(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        className={`main-content-blacks ${shouldShowMobileNav ? 'has-bottom-nav-blacks' : ''}`}
        style={{
          marginLeft: !isVerySmallScreen && collapsed ? '80px' : !isVerySmallScreen ? '250px' : '0',
          paddingBottom: shouldShowMobileNav ? '80px' : '0'
        }}
      >

        {renderTabContent()}

        {/* Mobile Bottom Navigation */}
        {shouldShowMobileNav && (
          <div className="mobile-bottom-nav-blacks">
            {visibleMobileNavItems.map(item => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.key}
                  className={`mobile-nav-item-blacks ${activeTab === item.key ? 'active-blacks' : ''}`}
                  onClick={() => handleMobileNavClick(item.key)}
                >
                  <span className="mobile-nav-icon-blacks"><IconComponent /></span>
                  <span className="mobile-nav-label-blacks">{item.label}</span>
                </button>
              );
            })}
            {remainingItems.length > 0 && (
              <button
                className={`mobile-nav-item-blacks ${mobileDrawerVisible ? 'active-blacks' : ''}`}
                onClick={() => handleMobileNavClick('more')}
              >
                <span className="mobile-nav-icon-blacks">⋮</span>
                <span className="mobile-nav-label-blacks">More</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};