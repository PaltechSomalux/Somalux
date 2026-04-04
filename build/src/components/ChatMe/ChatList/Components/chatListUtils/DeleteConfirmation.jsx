// src/components/chat/DeleteConfirmation.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FiTrash2 } from 'react-icons/fi';

export const DeleteConfirmation = ({ show, selectedUserIds, users, onCancel, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="chatme-delete-confirmation">
      <div className="chatme-delete-confirm-content">
        <FiTrash2 className="chatme-delete-confirm-icon" />
        <h3>Delete Chat{selectedUserIds.length > 1 ? 's' : ''}?</h3>
        <p>
          This action cannot be undone. Are you sure you want to delete{' '}
          {selectedUserIds.length === 1 ? (
            <>
              the conversation with{' '}
              <strong>
                {users.find((u) => u.uid === selectedUserIds[0])?.name || 'this user'}
              </strong>
            </>
          ) : (
            <>
              {selectedUserIds.length} conversations
            </>
          )}
          ?
        </p>
        <div className="chatme-delete-confirm-buttons">
          <button className="chatme-confirm-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="chatme-confirm-delete-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmation.propTypes = {
  show: PropTypes.bool.isRequired,
  selectedUserIds: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};