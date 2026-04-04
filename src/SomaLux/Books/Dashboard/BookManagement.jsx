import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookCategories } from "../../Categories/BookCategories";
import { BookPanel } from "../BookPanel";
import { PaperPanel } from "../../PastPapers/Pastpapers";
import ChatMeWrapper from "../../../chat/components/ChatMeWrapper";
import {Profile} from './Profile';   // ← imported here
import VerificationBadge from "../../../Admin/VerificationBadge";
import { supabase } from "../supabaseClient";
import './BookManagement.css';

export const BookManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUserTier, setCurrentUserTier] = useState('basic');
  const [isChatSelected, setIsChatSelected] = useState(false);
  const contentRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const userTierCacheRef = useRef(null);

  // Memoize tab definitions to prevent unnecessary re-renders
  const tabs = useMemo(() => [
    { id: 'books',      label: 'Books' },
    { id: 'genres',     label: 'Genre' },
    { id: 'pastpapers', label: 'Past Papers' },
    { id: 'chatme',     label: 'ChatMe' },
  ], []);

  // Determine active tab from URL path with memoization
  const activeTab = useMemo(() => {
    const path = location.pathname;
    // Extract the tab segment after /BookManagement/
    const match = path.match(/\/BookManagement\/([a-z]+)/);
    if (match) {
      const tabName = match[1];
      if (['genres', 'pastpapers', 'chatme'].includes(tabName)) {
        return tabName;
      }
    }
    return 'books'; // default
  }, [location.pathname]);

  // Memoize component rendering to prevent unnecessary re-renders
  const renderActiveComponent = useCallback(() => {
    try {
      console.log('[BookManagement] Rendering tab:', activeTab);
      switch (activeTab) {
        case 'genres':
          console.log('[BookManagement] About to render BookCategories');
          return (
            <React.Suspense fallback={<div style={{ padding: '20px', color: '#888' }}>Loading Genres...</div>}>
              <BookCategories />
            </React.Suspense>
          );
        case 'pastpapers':
          console.log('[BookManagement] About to render PaperPanel');
          return (
            <React.Suspense fallback={<div style={{ padding: '20px', color: '#888' }}>Loading Past Papers...</div>}>
              <PaperPanel />
            </React.Suspense>
          );
        case 'chatme':
          console.log('[BookManagement] About to render ChatMe');
          return (
            <React.Suspense fallback={<div style={{ padding: '20px', color: '#888' }}>Loading ChatMe...</div>}>
              <ChatMeWrapper 
                onChatSelected={handleChatSelected}
                onChatWindowActive={handleChatWindowActive}
                onBackFromChat={handleBackFromChat}
              />
            </React.Suspense>
          );
        case 'books':
        default:
          console.log('[BookManagement] About to render BookPanel');
          return (
            <React.Suspense fallback={<div style={{ padding: '20px', color: '#888' }}>Loading Books...</div>}>
              <BookPanel />
            </React.Suspense>
          );
      }
    } catch (error) {
      console.error('[BookManagement] Error in renderActiveComponent:', error);
      return (
        <div style={{ padding: '20px', color: '#ff6b6b', border: '1px solid #ff6b6b' }}>
          <h3>Error loading {activeTab} tab</h3>
          <p>{error.message}</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Stack trace:</summary>
            {error.stack}
          </details>
        </div>
      );
    }
  }, [activeTab]);

  // Navigate to tab by updating URL - memoized
  const navigateToTab = useCallback((tabId) => {
    const basePath = '/BookManagement';
    const tabPath = tabId === 'books' ? '' : `/${tabId}`;
    navigate(`${basePath}${tabPath}`, { replace: false });
  }, [navigate]);

  // Optimized scroll effect with debouncing and passive listener
  useEffect(() => {
    const handleScroll = () => {
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce scroll event (100ms)
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolled(window.scrollY > 10);
      }, 100);
    };

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Optimized user tier fetching with caching
  const fetchUserTierOptimized = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCurrentUserTier('basic');
        return;
      }

      // Check cache first
      if (userTierCacheRef.current?.[user.id]) {
        setCurrentUserTier(userTierCacheRef.current[user.id]);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription tier:', error);
        setCurrentUserTier('basic');
        return;
      }

      const tier = profile?.subscription_tier || 'basic';
      setCurrentUserTier(tier);
      
      // Cache the result
      userTierCacheRef.current = { [user.id]: tier };
    } catch (err) {
      console.error('Error fetching user tier:', err);
      setCurrentUserTier('basic');
    }
  }, []);

  // Fetch user subscription tier once on mount
  useEffect(() => {
    let isMounted = true;

    // Non-blocking initialization
    if (isMounted) {
      fetchUserTierOptimized();
    }

    // Subscribe to auth changes with optimized listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        if (session?.user) {
          fetchUserTierOptimized();
        } else {
          setCurrentUserTier('basic');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, [fetchUserTierOptimized]);

  // Memoize chat selection handlers
  const handleChatSelected = useCallback((chat) => {
    setIsChatSelected(!!chat);
  }, []);

  const handleChatWindowActive = useCallback((isActive) => {
    setIsChatSelected(isActive);
  }, []);

  const handleBackFromChat = useCallback(() => {
    setIsChatSelected(false);
  }, []);

  // Check if chat is selected to hide header and tabs
  const isFullScreenChat = activeTab === 'chatme' && isChatSelected;

  return (
    <div className={`book-management ${isScrolled ? 'scrolled' : ''} ${isFullScreenChat ? 'fullscreen-chat' : ''}`}>
      {/* Header - Hide when chat is selected */}
      {!isFullScreenChat && (
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
      )}

      {/* Tab Bar - Hide when chat is selected */}
      {!isFullScreenChat && (
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
      )}

      {/* Main Content */}
      <div
        className={`file-converter-content-convert ${isFullScreenChat ? 'fullscreen-chat-content' : ''}`}
        ref={contentRef}
        data-active-tab={activeTab}
      >
        {renderActiveComponent()}
      </div>
    </div>
  );
};