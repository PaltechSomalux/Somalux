import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiEye, FiEdit, FiTrash2, FiMapPin, FiHome, FiDollarSign } from 'react-icons/fi';
import { supabase } from '../../../supabaseClient';
import { useAdminUI } from '../../AdminUIContext';
import './RentalsAdmin.css';

export const ListingsManagement = ({ userProfile }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  const { confirm, prompt, showToast } = useAdminUI();

  useEffect(() => {
    loadListings();
  }, [filter]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/listings?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
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

  const handleApprove = async (listingId) => {
    const ok = await confirm({
      title: 'Approve listing?',
      message: 'Approve this listing so it becomes visible to students?',
      confirmLabel: 'Approve',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/listings/${listingId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'Listing approved.' });
        loadListings();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to approve listing.' });
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      showToast({ type: 'error', message: 'Failed to approve listing.' });
    }
  };

  const handleReject = async (listingId) => {
    const reason = await prompt({
      title: 'Reject listing',
      message: 'Provide a reason for rejection (visible to landlord).',
      label: 'Reason',
      multiline: true,
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (reason == null || reason.trim() === '') return;

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/listings/${listingId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'Listing rejected.' });
        loadListings();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to reject listing.' });
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
      showToast({ type: 'error', message: 'Failed to reject listing.' });
    }
  };

  const handleDelete = async (listingId) => {
    const ok = await confirm({
      title: 'Delete listing?',
      message: 'Permanently delete this listing? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'Listing deleted.' });
        loadListings();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to delete listing.' });
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      showToast({ type: 'error', message: 'Failed to delete listing.' });
    }
  };

  const filteredListings = listings.filter(listing => 
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.area_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.landlord_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="listings-management">
      <div className="page-header">
        <div>
          <h1>Listings Management</h1>
          <p>Review and manage property listings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            className={filter === 'rejected' ? 'active' : ''}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Listings Table */}
      {loading ? (
        <div className="table-loading">Loading...</div>
      ) : filteredListings.length === 0 ? (
        <div className="empty-state">
          <FiHome size={64} />
          <h3>No listings found</h3>
          <p>No listings match your current filters</p>
        </div>
      ) : (
        <div className="listings-table">
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Landlord</th>
                <th>Location</th>
                <th>Rent</th>
                <th>Status</th>
                <th>Views</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((listing) => (
                <tr key={listing.id}>
                  <td>
                    <div className="listing-info">
                      <img
                        src={listing.images?.[0] || '/placeholder.jpg'}
                        alt={listing.title}
                        className="listing-thumb"
                      />
                      <div>
                        <strong>{listing.title}</strong>
                        <span className="listing-type">{listing.property_type}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{listing.landlord_name}</strong>
                      <br />
                      <span className="text-muted">{listing.landlord_phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="location-cell">
                      <FiMapPin size={14} />
                      {listing.area_name}
                    </div>
                  </td>
                  <td>
                    <strong>KES {listing.monthly_rent.toLocaleString()}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${listing.status}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td>{listing.views_count || 0}</td>
                  <td>
                    {listing.average_rating > 0 ? (
                      <span className="rating">
                        ⭐ {listing.average_rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted">No reviews</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <span
                        className="btn-icon"
                        title="View Details"
                        onClick={() => setSelectedListing(listing)}
                      >
                        <FiEye size={16} />
                      </span>
                      {listing.status === 'pending' && (
                        <>
                          <span
                            className="btn-icon success"
                            title="Approve"
                            onClick={() => handleApprove(listing.id)}
                          >
                            <FiCheckCircle size={16} />
                          </span> 
                          <span
                            className="btn-icon danger"
                            title="Reject"
                            onClick={() => handleReject(listing.id)}
                          >
                            <FiXCircle size={16} />
                          </span>
                        </>
                      )}
                      <span
                        className="btn-icon danger"
                        title="Delete"
                        onClick={() => handleDelete(listing.id)}
                      >
                        <FiTrash2 size={16} />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedListing && (
        <div className="modal-overlay" onClick={() => setSelectedListing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedListing.title}</h2>
              <button onClick={() => setSelectedListing(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="listing-details">
                <img src={selectedListing.images?.[0]} alt={selectedListing.title} />
                <p><strong>Description:</strong> {selectedListing.description}</p>
                <p><strong>Type:</strong> {selectedListing.property_type}</p>
                <p><strong>Location:</strong> {selectedListing.area_name}</p>
                <p><strong>Address:</strong> {selectedListing.address}</p>
                <p><strong>Monthly Rent:</strong> KES {selectedListing.monthly_rent.toLocaleString()}</p>
                <p><strong>Deposit:</strong> KES {selectedListing.deposit.toLocaleString()}</p>
                <p><strong>Rooms:</strong> {selectedListing.available_rooms} / {selectedListing.total_rooms}</p>
                
                <h3>Amenities</h3>
                <ul>
                  {selectedListing.has_wifi && <li>Wi-Fi</li>}
                  {selectedListing.has_24h_water && <li>24/7 Water</li>}
                  {selectedListing.has_security && <li>Security</li>}
                </ul>

                <h3>Landlord Contact</h3>
                <p><strong>Name:</strong> {selectedListing.landlord_name}</p>
                <p><strong>Phone:</strong> {selectedListing.landlord_phone}</p>
                {selectedListing.landlord_email && (
                  <p><strong>Email:</strong> {selectedListing.landlord_email}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsManagement;
