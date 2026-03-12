import React, { useState, useEffect } from 'react';
import { FiSearch, FiCheckCircle, FiXCircle, FiEye, FiDollarSign, FiCalendar, FiUser } from 'react-icons/fi';
import { supabase } from '../../../supabaseClient';
import { useAdminUI } from '../../AdminUIContext';
import './RentalsAdmin.css';

export const BookingsManagement = ({ userProfile }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { confirm, prompt, showToast } = useAdminUI();

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/bookings?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
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

  const handleApprove = async (bookingId) => {
    const ok = await confirm({
      title: 'Approve booking?',
      message: 'Approve this booking so the room is reserved for the student?',
      confirmLabel: 'Approve',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/bookings/${bookingId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'Booking approved.' });
        loadBookings();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to approve booking.' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to approve booking.' });
    }
  };

  const handleReject = async (bookingId) => {
    const reason = await prompt({
      title: 'Reject booking',
      message: 'Provide a reason for rejection (visible to student).',
      label: 'Reason',
      multiline: true,
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!reason || reason.trim() === '') return;

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'Booking rejected.' });
        loadBookings();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to reject booking.' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to reject booking.' });
    }
  };

  const filteredBookings = bookings.filter(booking => 
    booking.rental_listings?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.payment_phone?.includes(searchQuery)
  );

  return (
    <div className="bookings-management">
      <div className="page-header">
        <div>
          <h1>Bookings Management</h1>
          <p>Review and manage student bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
          <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>Approved</button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="table-loading">Loading...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="empty-state">
          <FiCalendar size={64} />
          <h3>No bookings found</h3>
        </div>
      ) : (
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Property</th>
                <th>Student</th>
                <th>Move-in Date</th>
                <th>Duration</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <code className="booking-id">{booking.id.substring(0, 8)}</code>
                  </td>
                  <td>
                    <div className="property-cell">
                      <strong>{booking.rental_listings?.title}</strong>
                      <span className="text-muted">{booking.rental_listings?.area_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="student-cell">
                      <FiUser size={14} />
                      {booking.payment_phone}
                    </div>
                  </td>
                  <td>{new Date(booking.move_in_date).toLocaleDateString()}</td>
                  <td>{booking.duration_months} months</td>
                  <td>
                    <strong>KES {booking.total_amount.toLocaleString()}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${booking.payment_status}`}>
                      {booking.payment_status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${booking.booking_status}`}>
                      {booking.booking_status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {booking.booking_status === 'pending' && (
                        <>
                          <button
                            className="btn-icon success"
                            title="Approve"
                            onClick={() => handleApprove(booking.id)}
                          >
                            <FiCheckCircle />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Reject"
                            onClick={() => handleReject(booking.id)}
                          >
                            <FiXCircle />
                          </button>
                        </>
                      )}
                      <button className="btn-icon" title="View Details">
                        <FiEye />
                      </button>
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

export default BookingsManagement;
