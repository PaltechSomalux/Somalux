import React, { useState, useEffect, useMemo } from 'react';
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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter assets based on search query
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    
    const query = searchQuery.toLowerCase().trim();
    return assets.filter((asset) => {
      const email = asset.email.toLowerCase();
      const date = formatDateDisplay(asset.end_date).toLowerCase();
      return email.includes(query) || date.includes(query);
    });
  }, [assets, searchQuery]);

  // Compute paginated assets from filtered results
  const paginatedAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredAssets.slice(start, end);
  }, [filteredAssets, page, pageSize]);

  // Compute total pages
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredAssets.length / pageSize)), [filteredAssets.length, pageSize]);

  // Reset to page 1 when results change
  useEffect(() => {
    setPage(1);
  }, [filteredAssets.length]);

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
            <TextField
              placeholder="Search by email or date..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="assets-search-input"
              size="small"
            />
            <button
              className="btn"
              onClick={handleOpenDialog}
              style={{ padding: '6px 12px', fontSize: '12px', background: '#00a884', borderRadius: '4px', flex: '0 0 auto', minWidth: 'auto', marginLeft: 'auto' }}
            >
              Add Asset
            </button>
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
            type="text"
            fullWidth
            variant="outlined"
            value={newEmail}
            onChange={(e) => {
              let value = e.target.value;
              
              // Extract only the username part (before any @)
              let username = value.split('@')[0].trim();
              
              // Only allow valid email characters in username
              username = username.replace(/[^a-zA-Z0-9._-]/g, '');
              
              // While typing, show only the username
              setNewEmail(username);
            }}
            onBlur={() => {
              // When they finish typing, add @gmail.com
              if (newEmail && !newEmail.includes('@')) {
                setNewEmail(newEmail + '@gmail.com');
              }
            }}
            placeholder="username"
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
        ) : filteredAssets.length === 0 ? (
          <Box className="empty-state">
            <p>No assets found matching your search.</p>
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
              {paginatedAssets.map((asset, index) => {
                const assetNumber = (page - 1) * pageSize + index + 1;
                return (
                  <TableRow key={asset.id} className="table-row">
                    <TableCell className="number-cell">{assetNumber}</TableCell>
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
                );
              })}
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
        ) : filteredAssets.length === 0 ? (
          <Box className="empty-state">
            <p>No assets found matching your search.</p>
          </Box>
        ) : (
          paginatedAssets.map((asset, index) => {
            const assetNumber = (page - 1) * pageSize + index + 1;
            return (
              <div key={asset.id} className="asset-card">
                <div className="asset-card-header">
                  <div className="asset-number">{assetNumber}</div>
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
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {filteredAssets.length > 0 && (
        <div className="actions" style={{ marginTop: 10, justifyContent: 'space-between', padding: '12px', background: 'transparent', borderTop: 'none' }}>
          <button className="btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <span style={{ color: '#cfd8dc' }}>Page {page} of {totalPages} ({filteredAssets.length})</span>
          <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      )}

      {searchQuery && filteredAssets.length === 0 && (
        <Alert severity="info" className="success-alert" sx={{ mt: 2 }}>
          No assets found matching "{searchQuery}"
        </Alert>
      )}
        </>
      )}
    </Box>
  );
};

export default Assets;
