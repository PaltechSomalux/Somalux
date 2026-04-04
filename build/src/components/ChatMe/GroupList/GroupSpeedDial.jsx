import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiUsers, FiFolder } from 'react-icons/fi';
import '../KissMe/Components/FloatingActionButton.css';

export const GroupSpeedDial = ({ onCreateGroup, onCreateFolder }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="fab-container" style={{ zIndex: 50 }}>
      {open && (
        <div className="fab-menu">
          <button className="fab-menu-item" onClick={() => { setOpen(false); onCreateFolder && onCreateFolder(); }}>
            <span className="fab-icon"><FiFolder /></span>
            <span className="fab-label">New folder</span>
          </button>
          <button className="fab-menu-item" onClick={() => { setOpen(false); onCreateGroup && onCreateGroup(); }}>
            <span className="fab-icon"><FiUsers /></span>
            <span className="fab-label">New group</span>
          </button>
        </div>
      )}
      <button className={`fab-main ${open ? 'open' : ''}`} onClick={() => setOpen(v=>!v)} aria-label="Create">
        {open ? <FiX /> : '+'}
      </button>
    </div>
  );
};

GroupSpeedDial.propTypes = {
  onCreateGroup: PropTypes.func,
  onCreateFolder: PropTypes.func,
};

export default GroupSpeedDial;
