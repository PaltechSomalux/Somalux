// src/components/chat/ChatHeader.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FiX } from 'react-icons/fi';
import { FiBell } from 'react-icons/fi';
import { SelectionHeader } from './SelectionHeader';

export const ChatHeader = ({
  searchQuery,
  setSearchQuery,
  searchFocused,
  setSearchFocused,
  isSelectionMode,
  selectedUserIds,
  notificationCount,
  setShowNotificationModal,
  handleCancelSelection,
  handleBatchDelete,
  getBatchLockAction,
  handleBatchLock,
}) => {
  return (
    <div className="chatme-header">
      <h1>Vibes</h1>
      {/* Notification Bell */}
      {notificationCount > 0 && (
        <button
          className="notification-bell"
          onClick={() => setShowNotificationModal(true)}
        >
          <FiBell />
          <span className="notification-badge">{notificationCount}</span>
        </button>
      )}
      {isSelectionMode ? (
        <SelectionHeader
          selectedUserIds={selectedUserIds}
          onCancel={handleCancelSelection}
          onBatchDelete={handleBatchDelete}
          getBatchLockAction={getBatchLockAction}
          onBatchLock={handleBatchLock}
        />
      ) : (
        <div className={`chatme-header-search ${searchFocused ? 'focused' : ''}`}>
          <input
            type="text"
            placeholder="Search Vibes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="chatme-search-input"
          />
          {searchQuery && (
            <button className="chatme-clear-search" onClick={() => setSearchQuery('')}>
              <FiX />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

ChatHeader.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  searchFocused: PropTypes.bool.isRequired,
  setSearchFocused: PropTypes.func.isRequired,
  isSelectionMode: PropTypes.bool.isRequired,
  selectedUserIds: PropTypes.array.isRequired,
  notificationCount: PropTypes.number.isRequired,
  setShowNotificationModal: PropTypes.func.isRequired,
  handleCancelSelection: PropTypes.func.isRequired,
  handleBatchDelete: PropTypes.func.isRequired,
  getBatchLockAction: PropTypes.func.isRequired,
  handleBatchLock: PropTypes.func.isRequired,
};