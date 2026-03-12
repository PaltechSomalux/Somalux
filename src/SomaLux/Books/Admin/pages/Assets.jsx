import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { FiCopy, FiPlus, FiCheck } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { API_URL } from '../../../../config';
import './Assets.css';

// Only these superadmins can access Assets
const SUPERADMIN_EMAILS = ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'];

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if user is authorized superadmin and load assets
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        setIsAuthorized(false);
        return;
      }

      setUserEmail(user.email);

      // Check if user is in superadmin list
      if (!SUPERADMIN_EMAILS.includes(user.email)) {
        setError('Unauthorized - Only superadmins can access Assets');
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
      await fetchAssets();
    };

    checkAuthAndLoad();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('No valid session');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/assets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to fetch assets');
        setAssets([]);
      } else {
        setAssets(data);
        setError('');
      }
    } catch (err) {
      console.error('Error loading assets:', err);
      setError('Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAddAsset = async () => {
    if (!newEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (!newEndDate) {
      setError('Please select an end date');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('No valid session');
        return;
      }

      const url = editingId 
        ? `${API_URL}/api/admin/assets/${editingId}`
        : `${API_URL}/api/admin/assets`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          end_date: newEndDate,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save asset');
        return;
      }

      // Refresh assets list
      await fetchAssets();
      setSuccessMessage(editingId ? 'Asset updated successfully!' : 'Asset added successfully!');
      setEditingId(null);
    } catch (err) {
      console.error('Error saving asset:', err);
      setError('Failed to save asset');
    } finally {
      setNewEmail('');
      setNewEndDate('');
      setOpenDialog(false);
      setError('');
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('No valid session');
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/assets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to delete asset');
        return;
      }

      // Refresh assets list
      await fetchAssets();
      setSuccessMessage('Asset deleted successfully!');
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError('Failed to delete asset');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleEditAsset = (asset) => {
    setEditingId(asset.id);
    setNewEmail(asset.email);
    setNewEndDate(asset.end_date);
    setOpenDialog(true);
  };

  const handleCopyEmail = (email, id) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDialog = () => {
    setError('');
    setNewEmail('');
    setNewEndDate('');
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewEmail('');
    setNewEndDate('');
    setEditingId(null);
    setError('');
  };

  return (
    <Box className="assets-container">
      {!isAuthorized && error ? (
        <Alert severity="error" className="error-alert" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <div className="assets-header-simple">
            <h2 className="assets-title">Assets</h2>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenDialog}
              className="add-asset-btn"
            >
              Add
            </Button>
          </div>

          {successMessage && (
            <Alert severity="success" className="success-alert">
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" className="error-alert">
              {error}
            </Alert>
          )}

      {/* Add Asset Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
        <DialogContent className="dialog-content">
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user@example.com"
            sx={{ mb: 2, mt: 2 }}
          />
          <div className="manual-fields">
            <div className="manual-field">
              <label>End Date</label>
              <input 
                type="date" 
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddAsset} variant="contained" color="primary">
            {editingId ? 'Update Asset' : 'Add Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assets Table - Desktop View */}
      <TableContainer component={Paper} className="assets-table-container">
        {assets.length === 0 ? (
          <Box className="empty-state">
            <p>No assets yet. Click "Add Asset" to create your first entry.</p>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow className="table-header">
                <TableCell className="number-col">#</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map((asset, index) => (
                <TableRow key={asset.id} className="table-row">
                  <TableCell className="number-cell">{index + 1}</TableCell>
                  <TableCell className="email-cell">
                    <div className="email-content">
                      <span className="email-text">{asset.email}</span>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyEmail(asset.email, asset.id)}
                        className={`copy-btn ${copiedId === asset.id ? 'copied' : ''}`}
                        title="Copy email"
                      >
                        {copiedId === asset.id ? (
                          <FiCheck style={{ color: '#2ecc71' }} />
                        ) : (
                          <FiCopy />
                        )}
                      </IconButton>
                    </div>
                  </TableCell>
                  <TableCell className="date-cell">{formatDateDisplay(asset.end_date)}</TableCell>
                  <TableCell align="center" className="actions-cell">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditAsset(asset)}
                      title="Edit asset"
                    >
                      Edit
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Assets Cards - Mobile View */}
      <div className="assets-card-container">
        {assets.length === 0 ? (
          <Box className="empty-state">
            <p>No assets yet. Tap "Add Asset" to create your first entry.</p>
          </Box>
        ) : (
          assets.map((asset, index) => (
            <div key={asset.id} className="asset-card">
              <div className="asset-card-header">
                <div className="asset-number">{index + 1}</div>
              </div>

              <div className="asset-field">
                <span className="asset-label">Email Address</span>
                <div className="asset-email-value">
                  <span className="asset-email-text">{asset.email}</span>
                  <button
                    className={`asset-email-copy-btn ${copiedId === asset.id ? 'copied' : ''}`}
                    onClick={() => handleCopyEmail(asset.email, asset.id)}
                    title="Copy email to clipboard"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <FiCheck style={{ fontSize: '14px' }} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <FiCopy style={{ fontSize: '14px' }} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="asset-field">
                <span className="asset-label">Expiration Date</span>
                <span className="asset-value">{formatDateDisplay(asset.end_date)}</span>
              </div>

              <div className="asset-card-footer">
                <button
                  className="asset-footer-btn"
                  onClick={() => handleEditAsset(asset)}
                  title="Edit this asset"
                  style={{ flex: 1 }}
                >
                  ✏️ Edit
                </button>
                <button
                  className="asset-footer-btn"
                  onClick={() => handleDeleteAsset(asset.id)}
                  title="Delete this asset"
                  style={{ flex: 1, borderColor: '#e74c3c', color: '#e74c3c', background: 'rgba(231, 76, 60, 0.05)' }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}
    </Box>
  );
};

export default Assets;
