import React from 'react';
import PropTypes from 'prop-types';
import { FiMessageSquare, FiFolder } from 'react-icons/fi';

export const FolderTabs = ({ activeTab, onChange }) => {
  return (
    <div className="chatme-folder-tabs">
      <button
        className={`folder-tab ${activeTab === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
        title="All Chats"
      >
        <FiMessageSquare size={16} />
        <span>All</span>
      </button>
      <button
        className={`folder-tab ${activeTab === 'folders' ? 'active' : ''}`}
        onClick={() => onChange('folders')}
        title="Folders"
      >
        <FiFolder size={16} />
        <span>Folders</span>
      </button>
    </div>
  );
};

FolderTabs.propTypes = {
  activeTab: PropTypes.oneOf(['all', 'folders']).isRequired,
  onChange: PropTypes.func.isRequired,
};
