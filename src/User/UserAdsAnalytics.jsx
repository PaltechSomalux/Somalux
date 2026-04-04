import React, { useEffect, useState, useCallback } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../SomaLux/Books/supabaseClient';
import { useAdminUI } from '../Admin/AdminUIContext';

const UserAdsAnalytics = ({ userProfile, onEdit }) => {
  const { showToast } = useAdminUI();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inject CSS to hide horizontal scrollbar for analytics table
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'analytics-scroll-style';
    style.innerHTML = `
      .analytics-scroll::-webkit-scrollbar { display: none; }
      .analytics-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('analytics-scroll-style'); if (el) el.remove(); };
  }, []);

  const fetchUserAds = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch approved/active ads submitted by this user from user_ads table
      const { data, error } = await supabase
        .from('user_ads')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAds(data || []);
    } catch (err) {
      console.error('Error fetching user ads:', err);
      showToast({ type: 'error', message: 'Failed to load analytics' });
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, showToast]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchUserAds();
    }
  }, [userProfile?.id, fetchUserAds]);

  if (loading) {
    return (
      <div style={{ padding: '0 20px 20px 20px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            background: '#0a0e11'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid #1c2a31',
                background: '#0f1419'
              }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>Title</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>Placement</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>Impressions</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>Clicks</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>CTR</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>Start Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>End Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>Actions</th>
            </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="10" style={{ padding: '40px 16px', textAlign: 'center', color: '#8696a0', fontSize: '14px' }}>Loading analytics...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const calculateCTR = (impressions, clicks) => {
    if (impressions === 0) return '0%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
  };

  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      {/* Table */}
      <div className="analytics-scroll" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          background: '#0a0e11'
        }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid #1c2a31',
              background: '#0f1419'
            }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>TITLE</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>TYPE</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>PLACEMENT</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>STATUS</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>IMPRESSIONS</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>CLICKS</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>CTR</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>START DATE</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>END DATE</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8696a0', fontWeight: '600', fontSize: '12px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 ? (
              <tr>
                <td colSpan="10" style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: '#8696a0',
                  fontSize: '14px'
                }}>
                  No ads created yet. Create your first ad to see it here.
                </td>
              </tr>
            ) : (
              ads.map((ad, idx) => (
                <tr key={ad.id || idx} style={{
                  borderBottom: '1px solid #1c2a31',
                  background: '#0a0e11'
                }}>
                  <td style={{ padding: '12px 16px', color: '#e9edef', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {ad.image_url && (
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    {ad.video_url && !ad.image_url && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        background: '#1c2a31',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        🎬
                      </div>
                    )}
                    <span>{ad.title || 'Untitled Ad'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e9edef' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: ad.ad_type === 'image' ? '#6478f0' : '#c864f0',
                      background: 'transparent'
                    }}>
                      {ad.ad_type === 'image' ? 'Image' : 'Video'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e9edef', fontSize: '12px' }}>
                    {ad.placement}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: ad.status === 'approved' ? '#00a884' : ad.status === 'rejected' ? '#f87171' : '#fb923c',
                      background: 'transparent'
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: 8, display: 'inline-block', background: ad.status === 'approved' ? '#00a884' : ad.status === 'rejected' ? '#f87171' : '#fb923c' }} />
                      {ad.status ? (ad.status.charAt(0).toUpperCase() + ad.status.slice(1).toLowerCase()) : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#e9edef' }}>
                    {(parseInt(ad.total_impressions) || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#e9edef' }}>
                    {(parseInt(ad.total_clicks) || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#e9edef' }}>
                    {calculateCTR(parseInt(ad.total_impressions) || 0, parseInt(ad.total_clicks) || 0)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#8696a0', fontSize: '12px' }}>
                    {ad.start_date ? new Date(ad.start_date).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#8696a0', fontSize: '12px' }}>
                    {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        style={{
                          background: 'transparent',
                          border: '1px solid #1c2a31',
                          color: '#8696a0',
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#00a884';
                          e.currentTarget.style.color = '#00a884';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#1c2a31';
                          e.currentTarget.style.color = '#8696a0';
                        }}
                        onClick={() => {
                          if (typeof onEdit === 'function') onEdit(ad);
                          else showToast({ type: 'info', message: 'Edit feature coming soon' });
                        }}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        style={{
                          background: 'transparent',
                          border: '1px solid #1c2a31',
                          color: '#8696a0',
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#f87171';
                          e.currentTarget.style.color = '#f87171';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#1c2a31';
                          e.currentTarget.style.color = '#8696a0';
                        }}
                        onClick={() => showToast({ type: 'info', message: 'Delete feature coming soon' })}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserAdsAnalytics;
