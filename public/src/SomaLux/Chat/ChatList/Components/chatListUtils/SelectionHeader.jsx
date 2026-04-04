// src/components/chat/SelectionHeader.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FiTrash2, FiLock } from 'react-icons/fi';

export const SelectionHeader = ({
  selectedUserIds,
  onCancel,
  onBatchDelete,
  getBatchLockAction,
  onBatchLock,
}) => {
  return (
    <div className="chatme-selection-header">
      <span>{selectedUserIds.length} selected</span>
      <button className="chatme-cancel-selection" onClick={onCancel}>
        Cancel
      </button>
      {selectedUserIds.length > 0 && (
        <>
          <button className="chatme-delete-selection" onClick={onBatchDelete}>
            <FiTrash2 /> Delete
          </button>
          <button
            className="chatme-lock-selection"
            onClick={() => onBatchLock(getBatchLockAction(selectedUserIds))}
          >
            <FiLock />{' '}
            {getBatchLockAction(selectedUserIds).charAt(0).toUpperCase() +
              getBatchLockAction(selectedUserIds).slice(1)}
          </button>
        </>
      )}
    </div>
  );
};

SelectionHeader.propTypes = {
  selectedUserIds: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  onBatchDelete: PropTypes.func.isRequired,
  getBatchLockAction: PropTypes.func.isRequired,
  onBatchLock: PropTypes.func.isRequired,
};