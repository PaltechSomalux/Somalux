import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiX } from 'react-icons/fi';

export const AddToFolderModal = ({ show, onClose, chats, excludedUids, onAdd, folderName }) => {
  const [q, setQ] = useState('');
  const available = useMemo(() => {
    const set = new Set(excludedUids || []);
    const list = chats.filter((c) => !set.has(c.uid));
    if (!q) return list;
    const l = q.toLowerCase();
    return list.filter((c) => (c.name||'').toLowerCase().includes(l));
  }, [chats, excludedUids, q]);

  if (!show) return null;

  return (
    <div className="fab-modal-overlay" onClick={onClose}>
      <div className="fab-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fab-modal-header">
          <div className="header-search-container">
            <h3>Add Chat • {folderName || ''}</h3>
            <div className="fab-modal-search">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
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
          <div className="fab-contact-list">
            {available.length === 0 ? (
              <div className="empty-state"><p>No chats available</p></div>
            ) : (
              available.map((c) => (
                <div key={c.uid} className="contact-item">
                  <div className="contact-avatar">
                    <img src={c.photoURL} alt={c.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                  </div>
                  <div className="contact-info">
                    <h4>{c.name}</h4>
                    <p>{c.email || ''}</p>
                  </div>
                  <div className="contact-actions">
                    <button className="add-contact-btn" onClick={() => onAdd(c.uid)}>Add</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

AddToFolderModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  chats: PropTypes.array.isRequired,
  excludedUids: PropTypes.array,
  onAdd: PropTypes.func.isRequired,
  folderName: PropTypes.string,
};
