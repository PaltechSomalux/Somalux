import React, { useState, useEffect } from 'react';
import { FiMapPin, FiPlus, FiEdit, FiTrash2, FiHome } from 'react-icons/fi';
import { supabase } from '../../../supabaseClient';
import { useAdminUI } from '../../AdminUIContext';
import './RentalsAdmin.css';

export const UniversitiesManagement = ({ userProfile }) => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState(null);

  const { confirm, showToast } = useAdminUI();

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/rentals/admin/universities', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUniversities(data.universities || []);
      }
    } catch (error) {
      console.error('Error loading universities:', error);
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

  const handleDelete = async (universityId) => {
    const ok = await confirm({
      title: 'Delete university?',
      message: 'Delete this university? All associated listings will be affected. This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/admin/universities/${universityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (response.ok) {
        showToast({ type: 'success', message: 'University deleted.' });
        loadUniversities();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to delete university.' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to delete university.' });
    }
  };

  return (
    <div className="universities-management">
      <div className="page-header">
        <div>
          <h1>Universities Management</h1>
          <p>Manage university locations for rentals</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <FiPlus /> Add University
        </button>
      </div>

      {/* Universities Table */}
      {loading ? (
        <div className="table-loading">Loading...</div>
      ) : universities.length === 0 ? (
        <div className="empty-state">
          <FiMapPin size={64} />
          <h3>No universities found</h3>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add First University
          </button>
        </div>
      ) : (
        <div className="universities-table">
          <table>
            <thead>
              <tr>
                <th>University</th>
                <th>Location</th>
                <th>Coordinates</th>
                <th>Listings</th>
                <th>Student Population</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {universities.map((university) => (
                <tr key={university.id}>
                  <td>
                    <div className="university-cell">
                      {university.cover_image_url && (
                        <img src={university.cover_image_url} alt={university.name} className="uni-thumb" />
                      )}
                      <strong>{university.name}</strong>
                    </div>
                  </td>
                  <td>{university.location}</td>
                  <td>
                    {university.latitude && university.longitude ? (
                      <code className="coordinates">
                        {university.latitude}, {university.longitude}
                      </code>
                    ) : (
                      <span className="text-muted">Not set</span>
                    )}
                  </td>
                  <td>
                    <span className="stat-badge">
                      <FiHome size={14} /> {university.listings_count || 0}
                    </span>
                  </td>
                  <td>{university.student_count?.toLocaleString() || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        title="Edit"
                        onClick={() => setEditingUniversity(university)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-icon danger"
                        title="Delete"
                        onClick={() => handleDelete(university.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingUniversity) && (
        <UniversityModal
          university={editingUniversity}
          onClose={() => {
            setShowAddModal(false);
            setEditingUniversity(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingUniversity(null);
            loadUniversities();
          }}
        />
      )}
    </div>
  );
};

const UniversityModal = ({ university, onClose, onSave }) => {
  const { showToast } = useAdminUI();
  const [formData, setFormData] = useState({
    name: university?.name || '',
    location: university?.location || '',
    latitude: university?.latitude || '',
    longitude: university?.longitude || '',
    student_count: university?.student_count || '',
    description: university?.description || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        university 
          ? `http://localhost:5000/api/rentals/admin/universities/${university.id}`
          : 'http://localhost:5000/api/rentals/admin/universities',
        {
          method: university ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        showToast({ type: 'success', message: university ? 'University updated.' : 'University added.' });
        onSave();
      } else {
        const js = await response.json().catch(() => ({}));
        showToast({ type: 'error', message: js?.error || 'Failed to save university.' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to save university.' });
    }
  };

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || '';
    if (!token) console.warn('No Supabase session token found');
    return token;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{university ? 'Edit University' : 'Add University'}</h2>
          <button onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>University Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., University of Nairobi"
            />
          </div>

          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="e.g., Nairobi"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                placeholder="-1.2833"
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                placeholder="36.8167"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Student Population</label>
            <input
              type="number"
              value={formData.student_count}
              onChange={(e) => setFormData({...formData, student_count: e.target.value})}
              placeholder="e.g., 84000"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of the university"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {university ? 'Update' : 'Add'} University
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UniversitiesManagement;
