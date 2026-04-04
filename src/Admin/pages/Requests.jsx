import React, { useEffect, useState, useMemo } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { useAdminUI } from '../AdminUIContext';
import { API_URL } from '../../config';
import { supabase } from '../../SomaLux/Books/supabaseClient';

const API_BASE = API_URL;

const Badge = ({ children, color = '#00a884' }) => (
  <span style={{ background: 'rgba(0,168,132,0.12)', color, padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{children}</span>
);

const formatDate = (v) => {
  if (!v) return '';
  try { return new Date(v).toLocaleString(); } catch { return String(v); }
};

const Requests = ({ userProfile }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selected, setSelected] = useState(null);
  const [messageVisible, setMessageVisible] = useState(false);
  const { confirm, showToast } = useAdminUI();

  const fetchFromApi = async () => {
    const url = `${API_BASE}/api/requests?status=${encodeURIComponent(filter)}`;
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || '';
    // If response is JSON, parse and return; otherwise fallback silently (likely SPA index HTML)
    if (contentType.includes('application/json')) {
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load requests');
      return Array.isArray(json.requests) ? json.requests : [];
    }
    // Non-JSON response (HTML) - don't attempt to parse, return null to trigger Supabase fallback
    console.warn('API returned non-JSON content-type:', contentType || '(none)');
    return null;
  };

  const fetchFromSupabase = async () => {
    const q = supabase.from('requests').select('*');
    if (filter && filter !== 'all') q.eq('status', filter);
    q.order('created_at', { ascending: false }).limit(1000);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let data = null;
      try { data = await fetchFromApi(); } catch (e) { console.warn('API fetch failed', e); }
      if (data === null) {
        // API returned non-JSON or failed — fallback to Supabase client
        data = await fetchFromSupabase();
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load requests', e);
      showToast({ type: 'error', message: e.message || 'Failed to load requests' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const start = (page - 1) * pageSize;
    let list = items.slice();
    if (s) list = list.filter(r => (r.title || '').toLowerCase().includes(s) || (r.notes || r.message || '').toLowerCase().includes(s) || (r.userEmail || r.user_name || '').toLowerCase().includes(s));
    return { total: list.length, pageItems: list.slice(start, start + pageSize) };
  }, [items, search, page]);

  const markResolved = async (id) => {
    const ok = await confirm({ title: 'Mark resolved?', message: 'Mark this request as resolved for the admin team?', confirmLabel: 'Resolve' });
    if (!ok) return;
    try {
      // Try API first
      const res = await fetch(`${API_BASE}/api/requests/${id}/resolve`, { method: 'POST' });
      if (res.ok) { showToast({ type: 'success', message: 'Marked resolved.' }); fetchData(); return; }
      // Fallback: update directly in Supabase
      const { error } = await supabase.from('requests').update({ status: 'resolved', resolved_at: new Date().toISOString(), processed_by: userProfile?.id || null }).eq('id', id);
      if (error) throw error;
      showToast({ type: 'success', message: 'Marked resolved (direct DB).' });
      fetchData();
    } catch (e) {
      console.error('Resolve failed', e);
      showToast({ type: 'error', message: e.message || 'Resolve failed' });
    }
  };

  const remove = async (id) => {
    const ok = await confirm({ title: 'Delete request?', message: 'Permanently delete this request?', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/requests/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast({ type: 'success', message: 'Deleted.' }); fetchData(); return; }
      const { error } = await supabase.from('requests').delete().eq('id', id);
      if (error) throw error;
      showToast({ type: 'success', message: 'Deleted (direct DB).' });
      fetchData();
    } catch (e) {
      console.error('Delete failed', e);
      showToast({ type: 'error', message: e.message || 'Delete failed' });
    }
  };

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e9edef', margin: 0, letterSpacing: '-0.5px' }}>📨 Requests</div>
          <div style={{ color: '#8696a0', fontSize: 12, marginTop: 4 }}>
            Review submissions (books, papers, features, complaints, feedback)
          </div>
        </div>
      </div>

      {/* Stats Bar - Improved distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <div style={{ background: '#0b1216', border: '1px solid #263238', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#8696a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#e9edef' }}>{filtered.total}</div>
        </div>
        <div style={{ background: '#0b1216', border: '1px solid #263238', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#8696a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Pending</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ffa500' }}>{items.filter(r => r.status === 'pending').length}</div>
        </div>
        <div style={{ background: '#0b1216', border: '1px solid #263238', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#8696a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Resolved</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#00a884' }}>{items.filter(r => r.status === 'resolved').length}</div>
        </div>
      </div>

      {/* Filter & Search Bar - Better distributed */}
      <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '120px 1fr 50px', gap: 14, alignItems: 'center' }}>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="input" style={{ background: '#071018', border: '1px solid #263238', borderRadius: 4, padding: '8px 10px', color: '#e9edef', fontSize: 12, fontWeight: 500 }}>
          <option value="pending">📋 Pending</option>
          <option value="resolved">✅ Resolved</option>
          <option value="all">📊 All</option>
        </select>
        <input 
          placeholder="Search by title, email, name..." 
          className="input" 
          value={search} 
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
          style={{ background: '#071018', border: '1px solid #263238', borderRadius: 4, padding: '8px 10px', color: '#e9edef', fontSize: 12 }} 
        />
        <button className="btn" onClick={fetchData} title="Refresh list" style={{ padding: '8px 10px', fontSize: 12, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiRefreshCw size={14} /></button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8696a0' }}>Loading requests...</div>
      ) : (
        <div>
          {filtered.total === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8696a0' }}>
              {search ? '🔍 No requests match your search.' : '📭 No requests found.'}
            </div>
          ) : (
            <div>
              {/* Professional Table Layout */}
              <div style={{ background: '#0a0e11', borderRadius: 4, border: '1px solid #263238', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {/* Table Header */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 85px 140px 1fr 190px 150px 130px 180px',
                  columnGap: 18,
                  padding: '14px 18px',
                  background: '#0f1419',
                  borderBottom: '2px solid #263238',
                  fontWeight: 700,
                  fontSize: 10,
                  minWidth: 1100,
                  color: '#8696a0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <div style={{ textAlign: 'center' }}>#</div>
                  <div style={{ textAlign: 'center' }}>Type</div>
                  <div>Title</div>
                  <div>User</div>
                  <div>Email</div>
                  <div style={{ textAlign: 'center' }}>Date</div>
                  <div style={{ textAlign: 'center' }}>Status</div>
                  <div style={{ textAlign: 'center', paddingLeft: 12 }}>Actions</div>
                </div>

                {/* Table Rows */}
                {filtered.pageItems.map((r, idx) => (
                  <div 
                      key={r.id}
                      style={{ 
                        display: 'grid',
                        gridTemplateColumns: '40px 85px 140px 1fr 190px 150px 130px 180px',
                        columnGap: 18,
                        padding: '14px 18px',
                        borderBottom: idx < filtered.pageItems.length - 1 ? '1px solid #263238' : 'none',
                        background: '#0a0e11',
                        alignItems: 'center',
                        fontSize: 13,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        minHeight: 56,
                        minWidth: 1100
                      }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 168, 132, 0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#0a0e11'; }}
                  >
                    {/* # Column */}
                    <div style={{ color: '#8696a0', fontWeight: 600, fontSize: 12, textAlign: 'center' }}>
                      {(page - 1) * pageSize + idx + 1}
                    </div>

                    {/* Type Column */}
                    <div style={{ fontSize: 11, fontWeight: 600, color: r.type === 'book' || r.type === 'books' ? '#3b82f6' : r.type === 'pastpaper' || r.type === 'pastpapers' ? '#06b6d4' : r.type === 'feature' || r.type === 'features' ? '#a78bfa' : r.type === 'complaint' ? '#f97316' : r.type === 'feedback' ? '#ec4899' : '#64748b', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.type === 'book' || r.type === 'books' ? 'Book' : r.type === 'pastpaper' || r.type === 'pastpapers' ? 'Paper' : r.type === 'feature' || r.type === 'features' ? 'Feature' : r.type === 'complaint' ? 'Complaint' : r.type === 'feedback' ? 'Feedback' : 'Other'}
                    </div>

                    {/* Title Column */}
                    <div style={{ fontWeight: 600, color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, minWidth: 0 }}>
                      {r.title || (r.notes || r.message)?.slice(0, 60) || '(Untitled)'}
                    </div>

                    {/* User Column */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div className="viewer-avatar">
                        {(r.user_name || r.userName || 'Unknown').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, color: '#a7b2b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, minWidth: 0 }}>
                        {r.user_name || r.userName || 'Unknown'}
                      </span>
                    </div>

                    {/* Email Column */}
                    <div style={{ fontSize: 11, color: '#00a884', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, fontWeight: 500, padding: '0 10px' }}>
                      {r.user_email || r.userEmail || '—'}
                    </div>

                    {/* Date Column */}
                    <div style={{ fontSize: 11, color: '#a7b2b8', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {formatDate(r.created_at || r.createdAt)}
                    </div>

                    {/* Status Column */}
                    <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: r.status === 'resolved' ? '#10b981' : '#f59e0b', padding: '0 12px', whiteSpace: 'nowrap' }}>
                      {r.status === 'resolved' ? 'Done' : 'Pending'}
                    </div>

                    {/* Actions Column */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', paddingRight: 0 }}>
                      <button 
                        className="btn" 
                        onClick={() => { setSelected(r); setMessageVisible(false); }} 
                        title="View details"
                        style={{ fontSize: 10, padding: '5px 10px', whiteSpace: 'nowrap' }}
                      >
                        Details
                      </button>
                      {r.status !== 'resolved' && (
                        <button 
                          className="btn" 
                          onClick={() => markResolved(r.id)}
                          style={{ fontSize: 10, padding: '5px 10px', whiteSpace: 'nowrap' }}
                        >
                          Resolve
                        </button>
                      )}
                      <button 
                        className="btn" 
                        onClick={() => remove(r.id)}
                        style={{ fontSize: 10, padding: '5px 10px', whiteSpace: 'nowrap', background: 'transparent', borderColor: '#422', color: '#ff8a80' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination - Compact */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #263238', marginTop: 12 }}>
                <div style={{ color: '#8696a0', fontSize: 11 }}>
                  {filtered.total === 0 ? 'No requests' : `${Math.min((page-1)*pageSize+1, filtered.total)}–${Math.min(page*pageSize, filtered.total)} of `}<strong>{filtered.total}</strong>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    className="btn" 
                    disabled={page === 1} 
                    onClick={() => setPage(p => Math.max(1, p-1))}
                    style={{ opacity: page === 1 ? 0.5 : 1, padding: '4px 10px', fontSize: 11 }}
                  >
                    ← Prev
                  </button>
                  <button 
                    className="btn"
                    disabled={(page*pageSize) >= filtered.total}
                    onClick={() => setPage(p => p+1)}
                    style={{ opacity: (page*pageSize) >= filtered.total ? 0.5 : 1, padding: '4px 10px', fontSize: 11 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal - Rectangular Table Format */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setMessageVisible(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1220, maxHeight: '93vh', overflowY: 'auto', borderRadius: 8, padding: 0 }}>
            {/* Header */}
            <div style={{ background: '#0f1419', borderBottom: '2px solid #1c2a31', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e9edef' }}>Request Details</div>
              <button onClick={() => { setSelected(null); setMessageVisible(false); }} style={{ background: 'none', border: 'none', color: '#e9edef', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 0, margin: 0 }}>✕</button>
            </div>

            {/* Content Area */}
            <div style={{ padding: 0 }}>
              {/* Details Table - Comprehensive Rectangular Format */}
              <div style={{ background: '#0b1216', overflow: 'hidden', border: '1px solid #263238', borderRadius: 8 }}>
                {/* Table Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '70px 150px 120px 180px 110px 110px 120px 1fr', columnGap: 0, borderBottom: '2px solid #263238', background: '#0f1419' }}>
                  <div style={{ padding: '12px 14px', fontSize: 10, fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>#</div>
                  <div style={{ padding: '12px 14px', fontSize: 10, fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Title</div>
                  <div style={{ padding: '12px 14px', fontSize: 10, fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>User</div>
                  <div style={{ padding: '12px 14px', fontSize: 10, fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Email</div>
                  <div style={{ padding: '12px 14px', fontSize: 10, fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>Type</div>
                  <div style={{ padding: '12px 14px', fontSize: 10, fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>Status</div>
                  <div style={{ padding: '12px 14px', fontSize: 10, fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Submitted</div>
                  <div style={{ padding: '12px 14px', fontSize: 10, fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Actions</div>
                </div>

                {/* Table Row - Main Data */}
                <div style={{ display: 'grid', gridTemplateColumns: '70px 150px 120px 180px 110px 110px 120px 1fr', columnGap: 0, borderBottom: '1px solid #263238', alignItems: 'center', minHeight: 56, background: '#071018' }}>
                  {/* # */}
                  <div style={{ padding: '12px 14px', fontSize: 11, fontWeight: 600, color: '#8696a0', textAlign: 'center' }}>1</div>
                  {/* Title */}
                  <div style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600, color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.title || 'Untitled Request'}
                  </div>
                  {/* User */}
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <div className="viewer-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                      {(selected.user_name || selected.userName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selected.user_name || selected.userName || '—'}
                    </span>
                  </div>
                  {/* Email */}
                  <div style={{ padding: '12px 14px', fontSize: 10, color: '#00a884', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.user_email || selected.userEmail || '—'}
                  </div>
                  {/* Type */}
                  <div style={{ padding: '12px 14px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: selected.type === 'book' ? '#3b82f6' : selected.type === 'pastpaper' ? '#06b6d4' : selected.type === 'feature' ? '#a78bfa' : selected.type === 'complaint' ? '#f97316' : selected.type === 'feedback' ? '#ec4899' : '#64748b' }}>
                    {selected.type === 'book' ? 'Book' :
                     selected.type === 'pastpaper' ? 'Paper' :
                     selected.type === 'feature' ? 'Feature' :
                     selected.type === 'complaint' ? 'Complaint' :
                     selected.type === 'feedback' ? 'Feedback' :
                     'Other'}
                  </div>
                  {/* Status */}
                  <div style={{ padding: '12px 14px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: selected.status === 'resolved' ? '#10b981' : '#f59e0b' }}>
                    {selected.status === 'resolved' ? 'Done' : 'Pending'}
                  </div>
                  {/* Date */}
                  <div style={{ padding: '12px 14px', fontSize: 10, color: '#8696a0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {new Date(selected.created_at || selected.createdAt).toLocaleDateString()}
                  </div>
                  {/* Actions */}
                  <div style={{ padding: '12px 14px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {selected.status !== 'resolved' && (
                      <button className="btn" onClick={() => { markResolved(selected.id); setSelected(null); setMessageVisible(false); }} style={{ fontSize: 10, padding: '5px 10px', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        ✓ Resolve
                      </button>
                    )}
                    <button className="btn" onClick={() => { remove(selected.id); setSelected(null); setMessageVisible(false); }} style={{ fontSize: 10, padding: '5px 10px', whiteSpace: 'nowrap', background: '#7b2c2c', borderColor: '#d6453c', color: '#ff8a80', fontWeight: 600 }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>


              {/* Message Section - Removed */}

              {/* Resolved Info */}
              {selected.resolved_at && (
                <div style={{ background: '#0b1216', borderTop: '1px solid #263238', padding: '12px 20px', fontSize: 11 }}>
                  <div style={{ color: '#8696a0', fontWeight: 600, marginBottom: 4 }}>✓ Resolved on:</div>
                  <div style={{ color: '#10b981', fontWeight: 600 }}>
                    {formatDate(selected.resolved_at)} ({new Date(selected.resolved_at).toLocaleDateString()})
                  </div>
                </div>
              )}

              {/* Request Notes/Content */}
              {(selected.notes || selected.message || selected.title) && (
                <div style={{ background: '#0b1216', borderTop: '2px solid #263238', padding: '16px 20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 11, fontWeight: 700, color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.4px' }}>📝 Request Details</h3>
                  {selected.title && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: '#8696a0', fontWeight: 600, marginBottom: 4 }}>TITLE</div>
                      <div style={{ background: '#071018', border: '1px solid #263238', padding: 10, borderRadius: 4, fontSize: 12, color: '#d6e1e6', fontWeight: 500 }}>
                        {selected.title}
                      </div>
                    </div>
                  )}
                  {(selected.notes || selected.message) && (
                    <div>
                      <div style={{ fontSize: 10, color: '#8696a0', fontWeight: 600, marginBottom: 4 }}>DETAILS</div>
                      <div style={{ background: '#071018', border: '1px solid #263238', padding: 14, borderRadius: 6, minHeight: 80, fontSize: 12, color: '#d6e1e6', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {selected.notes || selected.message || '(No details provided)'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {selected.attachments && selected.attachments.length > 0 && (
                <div style={{ borderTop: '1px solid #263238', padding: '16px 20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 11, fontWeight: 700, color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.4px' }}>📎 Attachments ({selected.attachments.length})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {selected.attachments.map((a, i) => (
                      <a
                        key={i}
                        href={a.url || a.path || '#'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 10px',
                          background: '#0b1216',
                          border: '1px solid #263238',
                          borderRadius: 6,
                          color: '#00a884',
                          textDecoration: 'none',
                          fontSize: 12,
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          minHeight: 50,
                          textAlign: 'center',
                          wordBreak: 'break-word',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00a884'; e.currentTarget.style.background = 'rgba(0, 168, 132, 0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#263238'; e.currentTarget.style.background = '#0b1216'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        📄 {a.name || `File ${i+1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* External Link */}
              {selected.link && (
                <div style={{ borderTop: '1px solid #263238', padding: '16px 20px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 11, fontWeight: 700, color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.4px' }}>🔗 Linked URL</h3>
                  <a 
                    href={selected.link} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      display: 'block',
                      padding: '12px 14px',
                      background: '#0b1216',
                      border: '1px solid #263238',
                      borderRadius: 6,
                      color: '#00a884',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      fontSize: 12,
                      wordBreak: 'break-all',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00a884'; e.currentTarget.style.background = 'rgba(0, 168, 132, 0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#263238'; e.currentTarget.style.background = '#0b1216'; }}
                  >
                    🔗 {selected.link}
                  </a>
                </div>
              )}

              {/* Metadata - Always Visible */}
              {selected.metadata && Object.keys(selected.metadata).length > 0 ? (
                <div style={{ borderTop: '2px solid #263238', padding: '16px 20px', background: '#0b1216' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 11, fontWeight: 700, color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.4px' }}>⚙️ Additional Metadata</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    {Object.entries(selected.metadata).map(([key, value]) => (
                      <div key={key} style={{ background: '#071018', border: '1px solid #263238', borderRadius: 6, padding: 12 }}>
                        <div style={{ fontSize: 9, color: '#8696a0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6 }}>
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: 12, color: '#d6e1e6', fontWeight: 500, wordBreak: 'break-word' }}>
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ borderTop: '2px solid #263238', padding: '16px 20px', background: '#0b1216' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 11, fontWeight: 700, color: '#8696a0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>⚙️ Additional Metadata</h3>
                  <div style={{ fontSize: 12, color: '#8696a0' }}>No additional metadata provided</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
