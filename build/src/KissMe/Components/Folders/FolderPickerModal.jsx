import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiFolder, FiX, FiSearch } from 'react-icons/fi';

export const FolderPickerModal = ({ show, folders = [], onClose, onConfirm, onCreateNew }) => {
  const [q, setQ] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Reset selections and query whenever the modal closes
  useEffect(() => {
    if (!show) {
      setSelectedIds([]);
      setQ('');
    }
  }, [show]);

  const sortedFolders = useMemo(() => {
    const list = [...folders].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    if (!q) return list;
    const l = q.toLowerCase();
    return list.filter((f) => (f.name || '').toLowerCase().includes(l));
  }, [folders, q]);

  if (!show) return null;

  const toggle = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const isDisabled = (id) => !selectedIds.includes(id) && selectedIds.length >= 3;

  return (
    <div className="fab-modal-overlay" onClick={onClose}>
      <div className="fab-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fab-modal-header">
          <div className="header-search-container">
            <h3>Add to Folder</h3>
            <div className="fab-modal-search">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search folders..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <button className="fab-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="fab-modal-content">
          <style>
            {`.glow-folder {
  position: relative;
  box-shadow:
    0 0 6px 1px rgba(0, 150, 255, 0.3),
    0 0 12px 3px rgba(0, 150, 255, 0.15);
}
.glow-folder svg {
  filter: drop-shadow(0 0 3px rgba(0, 150, 255, 0.8));
}`}
          </style>
          <div className="fab-contact-list">
            {sortedFolders.length === 0 ? (
              <div className="empty-state"><p>No folders yet</p></div>
            ) : (
              sortedFolders.map((f) => {
                const checked = selectedIds.includes(f.id);
                return (
                  <label key={f.id} className="contact-item" style={{ cursor: isDisabled(f.id) ? 'not-allowed' : 'pointer' }}>
                    <div className="chatme-avatar-container glow-folder">
                      <div className="chatme-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                        <FiFolder color="#0096FF" size={24} />
                      </div>
                    </div>
                    <div className="contact-info">
                      <h4>{f.name}</h4>
                      <p>{(f.members || []).length} chats</p>
                    </div>
                    <div className="contact-actions">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(f.id)}
                        disabled={isDisabled(f.id)}
                        style={{ width: 18, height: 18, accentColor: '#00a884' }}
                      />
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '12px 16px', borderTop: '1px solid #2a3942' }}>
          <button className="bulk-btn" onClick={onCreateNew}>Create folder</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="chatme-confirm-cancel-btn" onClick={onClose}>Cancel</button>
            <button
              className="chatme-confirm-delete-btn"
              onClick={() => { const ids = selectedIds; setSelectedIds([]); onConfirm(ids); onClose(); }}
              disabled={selectedIds.length === 0}
              style={{ opacity: selectedIds.length === 0 ? 0.6 : 1 }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

FolderPickerModal.propTypes = {
  show: PropTypes.bool,
  folders: PropTypes.array,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  onCreateNew: PropTypes.func,
};
