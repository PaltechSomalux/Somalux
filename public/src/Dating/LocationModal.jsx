import React, { useState } from 'react';

export const LocationModal = ({ setShowLocationModal }) => {
  const [newLocation, setNewLocation] = useState('');

  return (
    <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
      <div className="location-modal" onClick={e => e.stopPropagation()}>
        <h2>Update Location</h2>
        <input
          type="text"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          placeholder="Enter new city"
        />
        <div className="location-actions">
          <button 
            className="cancel-location"
            onClick={() => setShowLocationModal(false)}
          >
            Cancel
          </button>
          <button 
            className="update-location"
            onClick={() => {
              // Handle location update
              setShowLocationModal(false);
            }}
            disabled={!newLocation.trim()}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

