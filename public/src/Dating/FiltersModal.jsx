import React, { useState } from 'react';
import { FaUndo } from 'react-icons/fa';
import "./FiltersModal.css";

export const FiltersModal = ({ setShowFilters, isPremium }) => {
  const [activeFilterTab, setActiveFilterTab] = useState('basic');
  const [filters, setFilters] = useState({
    ageRange: [18, 50],
    distance: 50,
    gender: ['male', 'female', 'other'],
    lookingFor: ['serious', 'casual', 'friendship'],
    verifiedOnly: false,
    active: 'any'
  });

  return (
    <div className="modal-overlay" onClick={() => setShowFilters(false)}>
      <div className="filters-modal" onClick={e => e.stopPropagation()}>
        <h2>Discovery Preferences</h2>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${activeFilterTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('basic')}
          >
            Basic
          </button>
          <button 
            className={`filter-tab ${activeFilterTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('advanced')}
            disabled={!isPremium}
          >
            {!isPremium ? 'Advanced (Premium)' : 'Advanced'}
          </button>
        </div>
        
        {activeFilterTab === 'basic' ? (
          <>
            <div className="filter-group">
              <label>Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}</label>
              <div className="range-sliders">
                <input 
                  type="range" 
                  min="18" 
                  max="80" 
                  value={filters.ageRange[0]}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    ageRange: [parseInt(e.target.value), prev.ageRange[1]]
                  }))}
                />
                <input 
                  type="range" 
                  min="18" 
                  max="80" 
                  value={filters.ageRange[1]}
                  onChange={e => setFilters(prev => ({
                    ...prev,
                    ageRange: [prev.ageRange[0], parseInt(e.target.value)]
                  }))}
                />
              </div>
            </div>
            
            {/* More basic filters... */}
          </>
        ) : (
          <>
            {/* Advanced filters... */}
          </>
        )}
        
        <div className="modal-actions">
          <button 
            className="reset-button"
            onClick={() => setFilters({
              ageRange: [18, 50],
              distance: 50,
              gender: ['male', 'female', 'other'],
              lookingFor: ['serious', 'casual', 'friendship'],
              verifiedOnly: false,
              active: 'any'
            })}
          >
            <FaUndo /> Reset
          </button>
          <button 
            className="apply-button"
            onClick={() => setShowFilters(false)}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
