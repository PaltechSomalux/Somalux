import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiFolder } from 'react-icons/fi';
import './folder-modals.css';

export const FolderCreateModal = ({ show, onClose, onCreate }) => {
  const [name, setName] = useState('');
  if (!show) return null;
  const canCreate = Boolean(name.trim());

  const handleCreate = () => {
    if (canCreate) {
      onCreate(name.trim());
      setName('');
      onClose(); // Close modal after creation for better UX
    }
  };

  return (
    <div className="chatme-modal-overlay" onClick={onClose}>
      <div className="chatme-modal folder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chatme-modal-header folder-modal__header">
          <div className="folder-modal__icon">
            <FiFolder />
          </div>
          <h5 className="folder-modal__title">New Folder</h5>
          <button className="chatme-modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="chatme-modal-content folder-modal__content">
          <label htmlFor="folder-name-input" className="folder-modal__label">
            Folder name
          </label>
          <div className="folder-modal__inputWrap">
            <input
              id="folder-name-input"
              type="text"
              placeholder="e.g. Work, Friends, VIP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canCreate) handleCreate();
                if (e.key === 'Escape') onClose();
              }}
              className="chatme-search-input folder-modal__input"
              autoFocus
              maxLength={48}
              aria-label="Folder name"
            />
          </div>
          <div className="folder-modal__footer">
            <span className="folder-modal__count">{name.trim().length}/48</span>
            <div className="folder-modal__actions">
              <button onClick={onClose} className="chatme-all-btn" type="button">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="add-btn"
                disabled={!canCreate}
                type="button"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FolderCreateModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};