import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';
import { AdminUIProvider } from '../../Books/Admin/AdminUIContext';
import { supabase } from '../../Books/supabaseClient';
import './UserUploadPage.css';

const Request = React.lazy(() => import('../../Books/Admin/pages/Request'));

const UserRequestPageNew = () => {
  const navigate = useNavigate();
  const { tabType } = useParams();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState(tabType || 'books');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, display_name')
            .eq('id', user.id)
            .single();
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const tabOptions = [
    { id: 'books', label: 'Books' },
    { id: 'pastpapers', label: 'Past Papers' },
    { id: 'features', label: 'Feature Ideas' },
    { id: 'complaints', label: 'Issues' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'other', label: 'Other' }
  ];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => setActiveTab(tabType || 'books'), [tabType]);

  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e) => { touchEndX.current = e.changedTouches[0].screenX; handleSwipe(); };
  const handleSwipe = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < 50) return;
    const currentIndex = tabOptions.findIndex(t => t.id === activeTab);
    const newIndex = diff > 0 ? Math.min(tabOptions.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
    const newTab = tabOptions[newIndex];
    setActiveTab(newTab.id);
    navigate(`/user/request/${newTab.id}`);
  };

  if (loading) {
    return <div className="upload-page-loading"><div className="upload-page-spinner" /></div>;
  }

  return (
    <div className="upload-page-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="upload-page-header">
        <button onClick={() => navigate('/BookManagement')} className="upload-page-header-btn back-link">
          <FiChevronLeft size={20} />
          <span>Back to books</span>
        </button>
        <h1 className="upload-page-header-title">Request Panel</h1>
      </div>

      {isMobile && (
        <div className="upload-page-mobile-tabs">
          {tabOptions.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); navigate(`/user/request/${tab.id}`); }}
              className={`upload-page-mobile-tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
              <span className="upload-page-mobile-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      <React.Suspense fallback={<div className="upload-page-loading"><div className="upload-page-spinner" /></div>}>
        <AdminUIProvider>
          <Request userProfile={userProfile} initialTab={activeTab} />
        </AdminUIProvider>
      </React.Suspense>
    </div>
  );
};

export default UserRequestPageNew;
