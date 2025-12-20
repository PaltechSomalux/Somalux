import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BookCategories } from "../Categories/BookCategories";
import { BookPanel } from "../Books/BookPanel";
import { Authors } from '../Authors/Authors';
import { PaperPanel } from "../PastPapers/Pastpapers";
import {Profile} from './Profile';   // ← imported here
import VerificationBadge from "../Books/Admin/components/VerificationBadge";
import VerificationTierModal from "../Books/VerificationTierModal";
import { supabase } from "../Books/supabaseClient";
import './BookManagement.css';

export const BookManagement = () => {
  const [activeTab, setActiveTab] = useState('books');
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUserTier, setCurrentUserTier] = useState('basic');

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

  const tabs = [
    { id: 'books',      label: 'Books',       component: <BookPanel /> },
    { id: 'categories', label: 'Categories',  component: <BookCategories /> },
    { id: 'authors',    label: 'Authors',     component: <Authors /> },
    { id: 'pastpapers', label: 'Past Papers', component: <PaperPanel /> },
  ];

  return (
    <div className={`book-management ${isScrolled ? 'scrolled' : ''}`}>
      {/* Header */}
      <div className="book-management-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 className="header-title">SomaLux</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <VerificationBadge tier={currentUserTier} size="md" showLabel={false} showTooltip={true} />
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
              className={`tool-button-convert ${activeTab === tab.id ? 'active-convert' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="file-converter-content-convert">
        {tabs.find(t => t.id === activeTab)?.component}
      </div>
    </div>
  );
};