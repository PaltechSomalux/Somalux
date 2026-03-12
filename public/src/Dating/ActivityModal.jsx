import React from 'react';
import { FaRegSun, FaRegMoon, FaRegClock, FaRegSnowflake } from 'react-icons/fa';
import './ActivityModal.css';

export const ActivityModal = ({ setShowActivityModal, profile, setProfile }) => {
  const activityStatuses = [
    { value: 'active', label: 'Active', icon: <FaRegSun /> },
    { value: 'away', label: 'Away', icon: <FaRegMoon /> },
    { value: 'busy', label: 'Busy', icon: <FaRegClock /> },
    { value: 'offline', label: 'Appear Offline', icon: <FaRegSnowflake /> }
  ];

  return (
    <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
      <div className="activity-modal" onClick={e => e.stopPropagation()}>
        <h2>Update Activity Status</h2>
        <div className="status-options">
          {activityStatuses.map(status => (
            <div 
              key={status.value}
              className={`status-option ${profile.activityStatus === status.value ? 'active' : ''}`}
              onClick={() => {
                setProfile(prev => ({ ...prev, activityStatus: status.value }));
                setShowActivityModal(false);
              }}
            >
              <div className="status-icon">{status.icon}</div>
              <div className="status-label">{status.label}</div>
            </div>
          ))}
        </div>
        <button 
          className="close-activity"
          onClick={() => setShowActivityModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
};
