import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookCategories } from "../Categories/BookCategories";
import { BookPanel } from "../Books/BookPanel";
import { Authors } from '../Authors/Authors';
import { PaperPanel } from "../PastPapers/Pastpapers";
import {Profile} from './Profile';   // ← imported here
import VerificationBadge from "../Books/Admin/components/VerificationBadge";
import VerificationTierModal from "../Books/VerificationTierModal";
import { supabase } from "../Books/supabaseClient";
import { useSwipeTabs } from './useSwipeTabs';
import './BookManagement.css';

export const BookManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUserTier, setCurrentUserTier] = useState('basic');
  const contentRef = useRef(null);

  // Determine active tab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    // Extract the tab segment after /BookManagement/
    const match = path.match(/\/BookManagement\/([a-z]+)/);
    if (match) {
      const tabName = match[1];
      if (['categories', 'authors', 'pastpapers'].includes(tabName)) {
        return tabName;
      }
    }
    return 'books'; // default
  };

  const activeTab = getActiveTabFromPath();

  // Render only the active tab component to avoid rendering all at once
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'categories':
        return <BookCategories />;
      case 'authors':
        return <Authors />;
      case 'pastpapers':
        return <PaperPanel />;
      case 'books':
      default:
        return <BookPanel />;
    }
  };

  // Tab definitions (without components to avoid rendering all)
  const tabs = [
    { id: 'books',      label: 'Books' },
    { id: 'categories', label: 'Categories' },
    { id: 'authors',    label: 'Authors' },
    { id: 'pastpapers', label: 'Past Papers' },
  ];

  const swipeHandlers = useSwipeTabs(tabs, activeTab, (tabId) => {
    navigateToTab(tabId);
  }, contentRef);

  // Navigate to tab by updating URL
  const navigateToTab = (tabId) => {
    const basePath = '/BookManagement';
    const tabPath = tabId === 'books' ? '' : `/${tabId}`;
    navigate(`${basePath}${tabPath}`, { replace: false });
  };

  // Scroll effect for header shadow
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch current user's subscription tier (non-blocking)
  useEffect(() => {
    let isMounted = true;

    const fetchUserTier = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        
        if (!user) {
          setCurrentUserTier('basic');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (!isMounted) return;
        
        if (error) {
          console.error('Error fetching subscription tier:', error);
          setCurrentUserTier('basic');
          return;
        }

        setCurrentUserTier(profile?.subscription_tier || 'basic');
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching user tier:', err);
          setCurrentUserTier('basic');
        }
      }
    };

    // Start fetching in background without awaiting
    fetchUserTier();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        if (session?.user) {
          fetchUserTier();
        } else {
          setCurrentUserTier('basic');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <div className={`book-management ${isScrolled ? 'scrolled' : ''}`}>
      {/* Header */}
      <div className="book-management-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingTop: '2px' }}>
          <h2 className="header-title">Somalux</h2>
          <div style={{ marginTop: '8px' }}>
            <VerificationBadge tier={currentUserTier} size="sm" showLabel={false} showTooltip={true} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Reusable Profile component */}
          <Profile />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tools-scroll-container-convert">
        <div className="tool-group-convert">
          {tabs.map(tab => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              className={`tool-button-convert ${activeTab === tab.id ? 'active-convert' : ''}`}
              onClick={() => navigateToTab(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div
        className="file-converter-content-convert"
        ref={contentRef}
        {...swipeHandlers}
      >
        {renderActiveComponent()}
      </div>
    </div>
  );
};