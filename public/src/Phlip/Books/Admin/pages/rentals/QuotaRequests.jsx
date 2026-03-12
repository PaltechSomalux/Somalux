import React, { useEffect, useState } from 'react';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiSearch, FiUser, FiHome, FiEye } from 'react-icons/fi';
import { supabase } from '../../../supabaseClient';
import { useAdminUI } from '../../AdminUIContext';
import './RentalsAdmin.css';

const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || '';
  if (!token) console.warn('No Supabase session token found');
  return token;
};

export const QuotaRequests = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReq, setDetailReq] = useState(null);

  const { prompt, showToast } = useAdminUI();

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/rentals/admin/quota-requests?status=${statusFilter}`, {
        headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
      });
      if (res.ok) {
        const js = await res.json();
        setRequests(js.requests || []);
      }
    } catch (e) {
      console.error('Error loading quota requests', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reqRow) => {
    const val = await prompt({
      title: 'Approve quota request',
      message: 'Set the new total listing quota for this landlord.',
      label: 'New quota',
      defaultValue: String(reqRow.requested_quota ?? reqRow.current_quota ?? ''),
      confirmLabel: 'Approve',
      cancelLabel: 'Cancel',
    });
    if (!val) return;
    const newQuota = parseInt(val, 10);
    if (!Number.isFinite(newQuota) || newQuota < 1) {
      showToast({ type: 'error', message: 'Enter a valid number >= 1.' });
      return;
    }
    setSubmittingId(reqRow.id);
    try {
      const res = await fetch(`http://localhost:5000/api/rentals/admin/quota-requests/${reqRow.id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${await getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_quota: newQuota })
      });
      if (!res.ok) {
        const js = await res.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to approve.' });
        return;
      }
      await loadRequests();
      showToast({ type: 'success', message: 'Quota updated and request approved.' });
    } catch (e) {
      console.error(e);
      showToast({ type: 'error', message: 'Failed to approve quota request.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (reqRow) => {
    const reasonInput = await prompt({
      title: 'Reject quota request',
      message: 'Optional admin notes / reason for rejection.',
      label: 'Admin notes',
      multiline: true,
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    const reason = reasonInput ?? '';
    setSubmittingId(reqRow.id);
    try {
      const res = await fetch(`http://localhost:5000/api/rentals/admin/quota-requests/${reqRow.id}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${await getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: reason })
      });
      if (!res.ok) {
        const js = await res.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to reject.' });
        return;
      }
      await loadRequests();
      showToast({ type: 'success', message: 'Request rejected.' });
    } catch (e) {
      console.error(e);
      showToast({ type: 'error', message: 'Failed to reject quota request.' });
    } finally {
      setSubmittingId(null);
    }
  };

  const filtered = requests.filter(r =>
    r.landlord_id?.toLowerCase().includes(search.toLowerCase()) ||
    (r.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bookings-management">
      <div className="page-header">
        <div>
          <h1>Listing Quota Requests</h1>
          <p>Review and approve or reject landlord listing quota requests</p>
        </div>
        <button className="btn-icon" title="Refresh" onClick={loadRequests}>
          <FiRefreshCw />
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by landlord ID or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button className={statusFilter === 'pending' ? 'active' : ''} onClick={() => setStatusFilter('pending')}>Pending</button>
          <button className={statusFilter === 'approved' ? 'active' : ''} onClick={() => setStatusFilter('approved')}>Approved</button>
          <button className={statusFilter === 'rejected' ? 'active' : ''} onClick={() => setStatusFilter('rejected')}>Rejected</button>
          <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>All</button>
        </div>
      </div>

      {loading ? (
        <div className="table-loading">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FiHome size={64} />
          <h3>No requests found</h3>
        </div>
      ) : (
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Landlord</th>
                <th>Current</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td><code className="booking-id">{r.id.substring(0,8)}</code></td>
                  <td>
                    <div className="student-cell" style={{ gap: 8 }}>
                      <FiUser size={14} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{r.landlord_name || 'Unknown Landlord'}</strong>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{r.landlord_email || '—'}</span>
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>ID: {r.landlord_id.substring(0,8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td>{r.current_quota}</td>
                  <td>{r.requested_quota}</td>
                  <td>
                    <span className={`status-badge ${r.status}`}>{r.status}</span>
                  </td>
                  <td className="text-muted" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '-'}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View details" onClick={() => { setDetailReq(r); setDetailOpen(true); }}>
                        <span role="img" aria-label="View">👁️</span>
                      </button>
                      {r.status === 'pending' && (
                        <>
                          <button className="btn-icon success" title="Approve" disabled={submittingId===r.id} onClick={() => handleApprove(r)}>
                            <span role="img" aria-label="Approve">✅</span>
                          </button>
                          <button className="btn-icon danger" title="Reject" disabled={submittingId===r.id} onClick={() => handleReject(r)}>
                            <span role="img" aria-label="Reject">🗑️</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailOpen && detailReq && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} role="dialog" aria-modal="true">
          <div style={{ width: 'min(640px, 92vw)', background: '#111b21', color: '#e9edef', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1f2c33' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Quota Request Details</h3>
              <button className="btn-icon" onClick={() => { setDetailOpen(false); setDetailReq(null); }} title="Close">✕</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Request ID</div>
                  <div><code className="booking-id">{detailReq.id}</code></div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Landlord</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiUser size={14} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{detailReq.landlord_name || 'Unknown Landlord'}</strong>
                      <span className="text-muted" style={{ fontSize: 12 }}>{detailReq.landlord_email || '—'}</span>
                      <span className="text-muted" style={{ fontSize: 12 }}>ID: {detailReq.landlord_id}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Current Quota</div>
                  <div>{detailReq.current_quota}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Requested Quota</div>
                  <div>{detailReq.requested_quota}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Status</div>
                  <div><span className={`status-badge ${detailReq.status}`}>{detailReq.status}</span></div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Created At</div>
                  <div>{new Date(detailReq.created_at).toLocaleString()}</div>
                </div>
                {detailReq.reviewed_at && (
                  <div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Reviewed At</div>
                    <div>{new Date(detailReq.reviewed_at).toLocaleString()}</div>
                  </div>
                )}
                {detailReq.reviewed_by && (
                  <div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Reviewed By</div>
                    <div>{detailReq.reviewed_by}</div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="text-muted" style={{ fontSize: 12 }}>Reason</div>
                <div style={{ background: '#0b141a', border: '1px solid #1f2c33', borderRadius: 8, padding: 10, minHeight: 48 }}>{detailReq.reason || '—'}</div>
              </div>
              {detailReq.admin_notes && (
                <div style={{ marginTop: 12 }}>
                  <div className="text-muted" style={{ fontSize: 12 }}>Admin Notes</div>
                  <div style={{ background: '#0b141a', border: '1px solid #1f2c33', borderRadius: 8, padding: 10, minHeight: 40 }}>{detailReq.admin_notes}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 12, borderTop: '1px solid #1f2c33' }}>
              <button className="btn-secondary" onClick={() => { setDetailOpen(false); setDetailReq(null); }}>Close</button>
              {detailReq.status === 'pending' && (
                <>
                  <button className="btn-icon success" title="Approve" disabled={submittingId===detailReq.id} onClick={() => handleApprove(detailReq)}>
                    <span role="img" aria-label="Approve">✅</span>
                  </button>
                  <button className="btn-icon danger" title="Reject" disabled={submittingId===detailReq.id} onClick={() => handleReject(detailReq)}>
                    <span role="img" aria-label="Reject">❌</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotaRequests;
