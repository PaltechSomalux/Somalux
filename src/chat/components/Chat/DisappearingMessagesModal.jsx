import React, { useState } from 'react';
import PropTypes from 'prop-types';

export const DisappearingMessagesModal = ({
  onClose,
  onSelect,
  currentDurationDays,
  limitedMode = false,
  keepDefault = false,
}) => {
  const [value, setValue] = useState(currentDurationDays || 0);
  const [keep, setKeep] = useState(!!keepDefault);

  const options = [
    { label: 'Off', days: 0 },
    { label: '24 hours', days: 1 },
    { label: '7 days', days: 7 },
    { label: '1 month', days: 30 },
    { label: '2 months', days: 60 },
    { label: '3 months', days: 90 },
  ];

  return (
    <div className="forward-modal-container" onClick={onClose}>
      <div className="forward-modal-backdrop" />
      <div
        className="forward-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Set disappearing messages"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 1002 }}
      >
        <div className="forward-modal-header">
          <h3>Disappearing messages</h3>
          <button className="forward-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="forward-users-list" style={{ paddingTop: 8 }}>
          {limitedMode ? (
            <label
              className="user-selection-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 12px',
                borderBottom: '1px solid #333',
                borderRadius: 6,
              }}
            >
              <span>Keep messages on this device</span>
              <input
                type="checkbox"
                checked={keep}
                onChange={() => setKeep(!keep)}
                style={{ accentColor: '#00a884', cursor: 'pointer' }}
              />
            </label>
          ) : (
            options.map(opt => (
              <label
                key={opt.days}
                className="user-selection-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderBottom: '1px solid #333',
                  borderRadius: 6,
                }}
              >
                <span>{opt.label}</span>
                <input
                  type="radio"
                  name="disappearing"
                  checked={value === opt.days}
                  onChange={() => setValue(opt.days)}
                  style={{ accentColor: '#00a884', cursor: 'pointer' }}
                />
              </label>
            ))
          )}
        </div>

        <div className="forward-actions">
          <button className="forward-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="forward-submit-btn"
            onClick={() => limitedMode ? onSelect(keep ? 1 : 0) : onSelect(value)}
            disabled={limitedMode && !keep}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
;

DisappearingMessagesModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  currentDurationDays: PropTypes.number,
  limitedMode: PropTypes.bool,
  keepDefault: PropTypes.bool,
};

export default DisappearingMessagesModal;
