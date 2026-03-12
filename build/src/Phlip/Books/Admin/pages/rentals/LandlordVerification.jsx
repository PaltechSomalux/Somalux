import React, { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiMail, FiCheckCircle, FiXCircle, FiAlertCircle, FiHome } from 'react-icons/fi';
import { supabase } from '../../../supabaseClient';
import houseVerified from '../../../../../Assets/houseVerified.png';
import { useAdminUI } from '../../AdminUIContext';
import './RentalsAdmin.css';

export const LandlordVerification = ({ userProfile }) => {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const { confirm, prompt, showToast } = useAdminUI();

  useEffect(() => {
    loadLandlords();
  }, [filter]);

  const loadLandlords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/landlords?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLandlords(data.landlords || []);
      }
    } catch (error) {
      console.error('Error loading landlords:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || '';
    if (!token) console.warn('No Supabase session token found');
    return token;
  };

  const handleVerify = async (landlordId) => {
    const ok = await confirm({
      title: 'Verify landlord?',
      message: 'Mark this landlord as verified for rentals?',
      confirmLabel: 'Verify',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/landlords/${landlordId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'Landlord verified.' });
        loadLandlords();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to verify landlord.' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to verify landlord.' });
    }
  };

  const handleSuspend = async (landlordId) => {
    const reason = await prompt({
      title: 'Suspend landlord',
      message: 'Provide a reason for suspension.',
      label: 'Reason',
      multiline: true,
      confirmLabel: 'Suspend',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!reason || reason.trim() === '') return;

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/landlords/${landlordId}/suspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'Landlord suspended.' });
        loadLandlords();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to suspend landlord.' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to suspend landlord.' });
    }
  };

  return (
    <div className="landlords-verification">
      <div className="page-header">
        <h1>Landlord Verification</h1>
        <p>Verify and manage landlords</p>
      </div>

      {/* Filters */}
      <div className="filter-tabs">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        <button className={filter === 'verified' ? 'active' : ''} onClick={() => setFilter('verified')}>Verified</button>
        <button className={filter === 'unverified' ? 'active' : ''} onClick={() => setFilter('unverified')}>Unverified</button>
        <button className={filter === 'suspended' ? 'active' : ''} onClick={() => setFilter('suspended')}>Suspended</button>
      </div>

      {/* Landlords Table */}
      {loading ? (
        <div className="table-loading">Loading...</div>
      ) : landlords.length === 0 ? (
        <div className="empty-state">
          <FiUser size={64} />
          <h3>No landlords found</h3>
        </div>
      ) : (
        <div className="landlords-table">
          <table>
            <thead>
              <tr>
                <th>Landlord</th>
                <th>Contact</th>
                <th>Properties</th>
                <th>Bookings</th>
                <th>Revenue</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {landlords.map((landlord) => (
                <tr key={landlord.id}>
                  <td>
                    <div className="landlord-cell">
                      <div className="landlord-avatar">
                        {landlord.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{landlord.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <div><FiPhone size={14} /> {landlord.phone}</div>
                      {landlord.email && <div><FiMail size={14} /> {landlord.email}</div>}
                    </div>
                  </td>
                  <td>
                    <span className="stat-badge">
                      <FiHome size={14} /> {landlord.properties_count || 0}
                    </span>
                  </td>
                  <td>{landlord.bookings_count || 0}</td>
                  <td>
                    <strong>KES {(landlord.total_revenue || 0).toLocaleString()}</strong>
                  </td>
                  <td>
                    {landlord.average_rating > 0 ? (
                      <span className="rating">
                        ⭐ {landlord.average_rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    {landlord.verified ? (
                      <span
                        className="status-badge success"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                      >
                        <img
                          src={houseVerified}
                          alt="Verified landlord"
                          style={{ height: 20, marginBottom: 2 }}
                        />
                        <span>
                           Verified
                        </span>
                      </span>
                    ) : landlord.suspended ? (
                      <span className="status-badge danger">
                        <FiXCircle size={14} /> Suspended
                      </span>
                    ) : (
                      <span className="status-badge warning">
                        <FiAlertCircle size={14} /> Unverified
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!landlord.verified && !landlord.suspended && (
                        <button
                          className="btn-sm success"
                          onClick={() => handleVerify(landlord.id)}
                        >
                          <FiCheckCircle /> Verify
                        </button>
                      )}
                      {!landlord.suspended && (
                        <button
                          className="btn-sm danger"
                          onClick={() => handleSuspend(landlord.id)}
                        >
                          <FiXCircle /> Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LandlordVerification;
