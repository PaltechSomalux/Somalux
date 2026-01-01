import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('books');
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUserTier, setCurrentUserTier] = useState('basic');
  const contentRef = useRef(null);

  // Initialize swipe gesture handler
  const tabs = [
    { id: 'books',      label: 'Books',       component: <BookPanel /> },
    { id: 'categories', label: 'Categories',  component: <BookCategories /> },
    { id: 'authors',    label: 'Authors',     component: <Authors /> },
    { id: 'pastpapers', label: 'Past Papers', component: <PaperPanel /> },
  ];

  const swipeHandlers = useSwipeTabs(tabs, activeTab, setActiveTab, contentRef);

  // Scroll effect for header shadow
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch current user's subscription tier
  useEffect(() => {
    const fetchUserTier = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCurrentUserTier('basic');
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

        setCurrentUserTier(profile?.subscription_tier || 'basic');
      } catch (err) {
        console.error('Error fetching user tier:', err);
        setCurrentUserTier('basic');
      }
    };

    fetchUserTier();

    // Subscribe to auth changes to refresh tier when user changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserTier();
      } else {
        setCurrentUserTier('basic');
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  // Auto-switch to books tab when query params exist
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('category') || params.get('book')) {
      setActiveTab('books');
    }
  }, [location.search]);

  const renderActiveTab = () => {
    return tabs.find(t => t.id === activeTab)?.component;
  };

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
              onClick={() => setActiveTab(tab.id)}
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
        {renderActiveTab()}
      </div>
    </div>
  );
};