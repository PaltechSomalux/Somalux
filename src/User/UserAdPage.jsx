import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiFileText, FiCheckCircle, FiClock, FiXCircle, FiMousePointer, FiEye, FiPlus } from 'react-icons/fi';
import { AdminUIProvider } from '../Admin/AdminUIContext';
import { supabase } from '../SomaLux/Books/supabaseClient';
import './UserUploadPage.css';

const UserAds = React.lazy(() => import('./UserAds'));
const UserAdsAnalytics = React.lazy(() => import('./UserAdsAnalytics'));

const UserAdPage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ads');
  const [showCreateAdPanel, setShowCreateAdPanel] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [stats, setStats] = useState({
    totalAds: 0,
    activeAds: 0,
    pendingAds: 0,
    rejectedAds: 0,
    draftAds: 0,
    totalClicks: 0,
    totalImpressions: 0,
  });
  const [isNarrow, setIsNarrow] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Inject small CSS to hide horizontal scrollbar (WebKit) and make scroll invisible
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'user-ads-stats-scroll-style';
    style.innerHTML = `
      .stats-scroll::-webkit-scrollbar { display: none; }
      .stats-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('user-ads-stats-scroll-style'); if (el) el.remove(); };
  }, []);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 UserAdPage - Auth user:', { id: user?.id, email: user?.email });
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, display_name')
            .eq('id', user.id)
            .single();
          console.log('👤 UserAdPage - Profile fetched:', profile);
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

  // Fetch user ads and calculate stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile?.id) return;
      try {
        // Fetch from user_ads table where approved/active ads are stored
        const { data, error } = await supabase
          .from('user_ads')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const total = data.length;
          const active = data.filter(ad => ad.status === 'active' || ad.status === 'approved').length;
          const pending = data.filter(ad => ad.status === 'pending').length;
          const rejected = data.filter(ad => ad.status === 'rejected').length;
          const drafts = data.filter(ad => ad.status === 'draft').length;
          const impressions = data.reduce((sum, ad) => sum + (parseInt(ad.total_impressions) || 0), 0);
          const clicks = data.reduce((sum, ad) => sum + (parseInt(ad.total_clicks) || 0), 0);

          setStats({
            totalAds: total,
            activeAds: active,
            pendingAds: pending,
            rejectedAds: rejected,
            draftAds: drafts,
            totalClicks: clicks,
            totalImpressions: impressions,
          });
        } else {
          // Reset stats if no ads found
          setStats({
            totalAds: 0,
            activeAds: 0,
            pendingAds: 0,
            rejectedAds: 0,
            draftAds: 0,
            totalClicks: 0,
            totalImpressions: 0,
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        // Set default stats on error
        setStats({
          totalAds: 0,
          activeAds: 0,
          totalImpressions: 0,
        });
      }
    };

    fetchStats();
  }, [userProfile?.id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e) => { touchEndX.current = e.changedTouches[0].screenX; };

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
        <h1 className="upload-page-header-title">Ad Panel</h1>
      </div>

      {/* Stats - Top of Page */}
      {isNarrow ? (
        <div className="stats-scroll" style={{ display: 'flex', gap: 10, padding: '12px', paddingBottom: '16px', marginBottom: '8px', overflowX: 'auto', overflowY: 'hidden', msOverflowStyle: 'none', scrollbarWidth: 'none', background: '#0a0e11' }}>
          {[
            { key: 'total', label: 'Total Ads', value: stats.totalAds, icon: <FiFileText size={14} color="#9fbcc5" /> },
            { key: 'active', label: 'Active', value: stats.activeAds, icon: <FiCheckCircle size={14} color="#00a884" /> },
            { key: 'pending', label: 'Pending', value: stats.pendingAds, icon: <FiClock size={14} color="#f59e0b" /> },
            { key: 'draft', label: 'Drafts', value: stats.draftAds, icon: <FiFileText size={14} color="#6478f0" /> },
            { key: 'rejected', label: 'Rejected', value: stats.rejectedAds, icon: <FiXCircle size={14} color="#f87171" /> },
            { key: 'clicks', label: 'Total Clicks', value: stats.totalClicks, icon: <FiMousePointer size={14} color="#6478f0" /> },
            { key: 'imps', label: 'Total Impressions', value: stats.totalImpressions, icon: <FiEye size={14} color="#9fbcc5" /> }
          ].map(item => (
            <div key={item.key} style={{ flex: '0 0 160px', border: '1px solid #1c2a31', background: '#0f1419', padding: '8px', borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'center', minHeight: 52 }}>
              <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#8696a0', marginBottom: '4px', fontWeight: '600' }}>{item.label}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#e9edef' }}>{(item.value || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          padding: '12px',
          background: '#0a0e11'
        }}>
          {[
            { key: 'total', label: 'Total Ads', value: stats.totalAds, icon: <FiFileText size={16} color="#9fbcc5" /> },
            { key: 'active', label: 'Active', value: stats.activeAds, icon: <FiCheckCircle size={16} color="#00a884" /> },
            { key: 'pending', label: 'Pending', value: stats.pendingAds, icon: <FiClock size={16} color="#f59e0b" /> },
            { key: 'draft', label: 'Drafts', value: stats.draftAds, icon: <FiFileText size={16} color="#6478f0" /> },
            { key: 'rejected', label: 'Rejected', value: stats.rejectedAds, icon: <FiXCircle size={16} color="#f87171" /> },
            { key: 'clicks', label: 'Total Clicks', value: stats.totalClicks, icon: <FiMousePointer size={16} color="#6478f0" /> },
            { key: 'imps', label: 'Total Impressions', value: stats.totalImpressions, icon: <FiEye size={16} color="#9fbcc5" /> }
          ].map(item => (
            <div key={item.key} style={{ border: '1px solid #1c2a31', background: '#0f1419', padding: '8px', borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'center', minHeight: 52 }}>
              <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#8696a0', marginBottom: '4px', fontWeight: '600' }}>{item.label}</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#e9edef' }}>{(item.value || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '24px',
        padding: '12px 20px',
        borderBottom: '1px solid #1c2a31',
        background: '#0a0e11',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '4px'
      }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <button
            onClick={() => { setActiveTab('ads'); setShowCreateAdPanel(false); }}
            style={{
              padding: '8px 0',
              background: 'none',
              border: 'none',
              color: activeTab === 'ads' ? '#e9edef' : '#8696a0',
              fontSize: '15px',
              fontWeight: activeTab === 'ads' ? '600' : '500',
              cursor: 'pointer',
              borderBottom: activeTab === 'ads' ? '2px solid #00a884' : 'none',
              transition: 'all 0.3s'
            }}
          >
            📝 Ads
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '8px 0',
              background: 'none',
              border: 'none',
              color: activeTab === 'analytics' ? '#e9edef' : '#8696a0',
              fontSize: '15px',
              fontWeight: activeTab === 'analytics' ? '600' : '500',
              cursor: 'pointer',
              borderBottom: activeTab === 'analytics' ? '2px solid #00a884' : 'none',
              transition: 'all 0.3s'
            }}
          >
            📊 Analytics
          </button>
        </div>
      </div>

      {/* Create Ad Button - Below tabs, far left */}
      {activeTab === 'ads' && !showCreateAdPanel && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #1c2a31', background: '#0a0e11' }}>
          <button
            onClick={() => setShowCreateAdPanel(true)}
            style={{
              padding: '6px 12px',
              background: '#00a884',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#06d755';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#00a884';
            }}
          >
            <span style={{ display: 'inline-block' }}>
              Create Ad
            </span>
          </button>
        </div>
      )}

      {/* Fallback section (not needed now) */}

      {/* Tab Content */}
      <React.Suspense fallback={<div className="upload-page-loading"><div className="upload-page-spinner" /></div>}>
        <AdminUIProvider>
              {activeTab === 'ads' && showCreateAdPanel && <UserAds userProfile={userProfile} editingAd={editingAd} onAdCreated={() => { setShowCreateAdPanel(false); setEditingAd(null); }} onCancel={() => { setShowCreateAdPanel(false); setEditingAd(null); }} />}
          {activeTab === 'ads' && !showCreateAdPanel && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
              <div style={{ flex: 1, borderTop: '1px solid #1c2a31' }}>
                <UserAdsAnalytics userProfile={userProfile} onEdit={(ad) => { setEditingAd(ad); setShowCreateAdPanel(true); }} />
              </div>
            </div>
          )}
          {activeTab === 'analytics' && <UserAdsAnalytics userProfile={userProfile} />}
        </AdminUIProvider>
      </React.Suspense>
    </div>
  );
};

export default UserAdPage;
