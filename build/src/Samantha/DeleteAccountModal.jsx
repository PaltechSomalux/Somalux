import React, { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

export const DeleteAccountModal = ({ setShowDeleteAccountModal }) => {
  const [deleteReason, setDeleteReason] = useState('');

  return (
    <div className="modal-overlay" onClick={() => setShowDeleteAccountModal(false)}>
      <div className="delete-modal" onClick={e => e.stopPropagation()}>
        <h2>Delete Your Account</h2>
        <p>We're sorry to see you go. Please let us know why you're leaving:</p>
        <textarea
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          placeholder="Reason for leaving..."
          rows={4}
        />
        <p className="warning"><FaExclamationTriangle /> Warning: This action cannot be undone.</p>
        <div className="delete-actions">
          <button 
            className="cancel-delete"
            onClick={() => setShowDeleteAccountModal(false)}
          >
            Cancel
          </button>
          <button 
            className="confirm-delete"
            onClick={() => {
              // Handle account deletion
              setShowDeleteAccountModal(false);
            }}
            disabled={!deleteReason.trim()}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

