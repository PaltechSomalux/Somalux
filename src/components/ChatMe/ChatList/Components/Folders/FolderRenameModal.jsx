import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiFolder } from 'react-icons/fi';
import './folder-modals.css';

export const FolderRenameModal = ({ show, onClose, onRename, initialName }) => {
  const [name, setName] = useState(initialName || '');
  useEffect(() => setName(initialName || ''), [initialName]);
  if (!show) return null;
  const canSave = Boolean(name.trim());

  const handleRename = () => {
    if (canSave) {
      onRename(name.trim());
      onClose(); // Close modal after rename for better UX
    }
  };

  return (
    <div className="chatme-modal-overlay" onClick={onClose}>
      <div className="chatme-modal folder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chatme-modal-header folder-modal__header">
          <div className="folder-modal__icon">
            <FiFolder />
          </div>
          <h5 className="folder-modal__title">Rename Folder</h5>
          <button className="chatme-modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="chatme-modal-content folder-modal__content">
          <label htmlFor="folder-rename-input" className="folder-modal__label">
            Folder name
          </label>
          <div className="folder-modal__inputWrap">
            <input
              id="folder-rename-input"
              type="text"
              placeholder="Enter new folder name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSave) handleRename();
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
                onClick={handleRename}
                className="add-btn"
                disabled={!canSave}
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FolderRenameModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  initialName: PropTypes.string,
};