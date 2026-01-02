import React, { useEffect, useMemo, useState } from 'react';
import { fetchAllProfilesForVerify, updateUserTier } from '../api';
import { useAdminUI } from '../AdminUIContext';
import { FiCheck, FiAward, FiStar, FiSearch } from 'react-icons/fi';

const Verify = ({ userProfile }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [updating, setUpdating] = useState({});
  const [sort, setSort] = useState({ col: 'created_at', dir: 'desc' });

  const { confirm, showToast } = useAdminUI();
  const ADMIN_EMAILS = ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'];
  const isAdmin = userProfile?.role === 'admin' || ADMIN_EMAILS.includes(userProfile?.email);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const allProfiles = await fetchAllProfilesForVerify();
      const profiles = (allProfiles || []).map(p => ({
        ...p,
        subscription_tier: p.subscription_tier || 'basic',
        subscription_started_at: p.subscription_started_at
      }));
      setRows(profiles);
      setCount(profiles.length);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      showToast({ type: 'error', message: 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) load();
  }, [userProfile]);

  const filteredRows = useMemo(() => {
    return rows.filter(u => {
      const matchSearch = !search || 
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase()));
      const matchTier = !tierFilter || u.subscription_tier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [rows, search, tierFilter]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const updateTier = async (userId, newTier) => {
    setUpdating(s => ({ ...s, [userId]: true }));
    try {
      const result = await updateUserTier(userId, newTier);
      
      // Update local state with response data
      setRows(prevRows => 
        prevRows.map(r => r.id === userId ? { 
          ...r, 
          subscription_tier: result.data?.subscription_tier || newTier,
          subscription_started_at: result.data?.subscription_started_at || new Date().toISOString()
        } : r)
      );
      
      showToast({ type: 'success', message: `User tier updated to ${newTier}` });
    } catch (error) {
      console.error('Failed to update tier:', error);
      showToast({ type: 'error', message: 'Failed to update user tier.' });
    } finally {
      setUpdating(s => ({ ...s, [userId]: false }));
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'premium':
        return { icon: <FiCheck />, color: '#2196F3', label: 'Premium', bgColor: 'rgba(33, 150, 243, 0.1)' };
      case 'premium_pro':
        return { icon: <FiAward />, color: '#FFD700', label: 'Premium Pro', bgColor: 'rgba(255, 215, 0, 0.1)' };
      default:
        return { icon: <FiStar />, color: '#8696a0', label: 'Basic', bgColor: 'rgba(134, 150, 160, 0.05)' };
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: 20, color: '#e9edef' }}>
        You don't have permission to access this page.
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 20, color: '#8696a0' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 12 }}>
      <div className="section-header" style={{ marginBottom: 16 }}>
        <h2 style={{ color: '#e9edef', fontSize: 18, margin: 0 }}>Verify Users</h2>
        <p style={{ color: '#8696a0', fontSize: 12, margin: '4px 0 0 0' }}>
          Manage user subscription tiers and verification status
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: 8, top: 8, color: '#8696a0' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 32, width: '100%', backgroundColor: 'black', color: 'white', fontSize: '13px' }}
          />
        </div>
        <select
          className="select"
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          style={{ minWidth: 150, width: 'auto' }}
        >
          <option value="">All Tiers</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
          <option value="premium_pro">Premium Pro</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Current Tier</th>
              <th>Subscription Date</th>
              <th>Change Tier To</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#8696a0', padding: 20 }}>
                  No users found
                </td>
              </tr>
            ) : (
              paginatedRows.map(u => {
                const tier = getTierBadge(u.subscription_tier);
                return (
                  <tr key={u.id}>
                    <td>{u.display_name || u.email?.split('@')[0] || 'Unknown'}</td>
                    <td style={{ fontSize: 12, color: '#8696a0' }}>{u.email}</td>
                    <td>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        borderRadius: 4,
                        backgroundColor: tier.bgColor,
                        width: 'fit-content'
                      }}>
                        <span style={{ color: tier.color, fontSize: 14 }}>{tier.icon}</span>
                        <span style={{ color: tier.color, fontSize: 12, fontWeight: 500 }}>{tier.label}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#8696a0' }}>
                      {u.subscription_started_at 
                        ? new Date(u.subscription_started_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <select
                        value={u.subscription_tier}
                        onChange={(e) => updateTier(u.id, e.target.value)}
                        disabled={updating[u.id]}
                        className="select"
                        style={{ fontSize: 12 }}
                      >
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                        <option value="premium_pro">Premium Pro</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="actions" style={{ marginTop: 10 }}>
        <button className="btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
        <span style={{ color: '#cfd8dc' }}>Page {page} of {totalPages}</span>
        <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(0, 168, 132, 0.05)',
        border: '1px solid rgba(0, 168, 132, 0.2)',
        borderRadius: 6,
        color: '#8696a0',
        fontSize: 12
      }}>
        <strong style={{ color: '#00a884' }}>Tier Information:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 16 }}>
          <li><strong>Basic:</strong> Default tier for all new users</li>
          <li><strong>Premium:</strong> <span style={{ color: '#2196F3' }}>●</span> Blue verification - Enhanced features</li>
          <li><strong>Premium Pro:</strong> <span style={{ color: '#FFD700' }}>●</span> Gold verification - All premium features</li>
        </ul>
      </div>
    </div>
  );
};

export default Verify;
