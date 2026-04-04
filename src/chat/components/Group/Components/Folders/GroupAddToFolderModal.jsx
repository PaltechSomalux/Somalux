import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiX } from 'react-icons/fi';

export const GroupAddToFolderModal = ({ show, onClose, groups, excludedIds = [], onAdd, folderName }) => {
  const [q, setQ] = useState('');
  const excluded = useMemo(() => new Set(excludedIds || []), [excludedIds]);

  const available = useMemo(() => {
    const list = (groups || []).filter((g) => !excluded.has(g.id));
    if (!q) return list;
    const l = q.toLowerCase();
    return list.filter((g) => (g.name || '').toLowerCase().includes(l));
  }, [groups, excluded, q]);

  useEffect(() => { if (!show) setQ(''); }, [show]);

  if (!show) return null;

  return (
    <div className="fab-modal-overlay" onClick={onClose}>
      <div className="fab-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fab-modal-header">
          <div className="header-search-container">
            <h3>Add Group • {folderName || ''}</h3>
            <div className="fab-modal-search">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search groups..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <button className="fab-modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="fab-modal-content">
          <div className="fab-contact-list">
            {available.length === 0 ? (
              <div className="empty-state"><p>No groups available</p></div>
            ) : (
              available.map((g) => (
                <div key={g.id} className="contact-item">
                  <div className="contact-avatar">
                    {g.groupPicture ? (
                      <img src={g.groupPicture} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                    ) : (
                      <div style={{ width:'100%', height:'100%', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'#334155', color:'#fff' }}>
                        {(g.name || 'G').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="contact-info">
                    <h4>{g.name}</h4>
                    <p>{g.participants || 0} members</p>
                  </div>
                  <div className="contact-actions">
                    <button className="add-contact-btn" onClick={() => onAdd(g.id)}>Add</button>
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

GroupAddToFolderModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  groups: PropTypes.array.isRequired,
  excludedIds: PropTypes.array,
  onAdd: PropTypes.func.isRequired,
  folderName: PropTypes.string,
};
