import React from 'react';
import PropTypes from 'prop-types';
import "./CompatibilityModal.css";

export const CompatibilityModal = ({ match = {}, setShowCompatibilityModal }) => {
  // Default values for match data
  const {
    compatibility = 0,
    compatibilityBreakdown = {
      interests: 0,
      values: 0,
      lifestyle: 0,
      personality: 0
    },
    commonInterests = [],
    astroCompatibility = 'Not available',
    name = 'Unknown'
  } = match;

  return (
    <div className="modal-overlay" onClick={() => setShowCompatibilityModal(false)}>
      <div className="compatibility-modal" onClick={e => e.stopPropagation()}>
        <h2>Compatibility with {name}</h2>
        
        <div className="compatibility-content">
          <div className="compatibility-score">
            <div className="score-circle">
              {compatibility}%
            </div>
            <p>Overall Compatibility</p>
          </div>
          
          <div className="compatibility-details">
            <div className="detail">
              <label>Interests</label>
              <div className="breakdown-bar">
                <div 
                  className="bar-fill" 
                  style={{ width: `${compatibilityBreakdown.interests}%` }}
                ></div>
                <span>{compatibilityBreakdown.interests}%</span>
              </div>
            </div>
            
            <div className="detail">
              <label>Values</label>
              <div className="breakdown-bar">
                <div 
                  className="bar-fill" 
                  style={{ width: `${compatibilityBreakdown.values}%` }}
                ></div>
                <span>{compatibilityBreakdown.values}%</span>
              </div>
            </div>
            
            <div className="detail">
              <label>Lifestyle</label>
              <div className="breakdown-bar">
                <div 
                  className="bar-fill" 
                  style={{ width: `${compatibilityBreakdown.lifestyle}%` }}
                ></div>
                <span>{compatibilityBreakdown.lifestyle}%</span>
              </div>
            </div>
            
            <div className="detail">
              <label>Personality</label>
              <div className="breakdown-bar">
                <div 
                  className="bar-fill" 
                  style={{ width: `${compatibilityBreakdown.personality}%` }}
                ></div>
                <span>{compatibilityBreakdown.personality}%</span>
              </div>
            </div>
          </div>
          
          {commonInterests.length > 0 && (
            <div className="common-interests">
              <h3>Common Interests</h3>
              <div className="interests-list">
                {commonInterests.map((interest, index) => (
                  <span key={index} className="interest-tag">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="astro-compatibility">
            <h3>Astrological Compatibility</h3>
            <p>{astroCompatibility}</p>
          </div>
        </div>
        
        <button 
          className="close-compatibility"
          onClick={() => setShowCompatibilityModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
};

CompatibilityModal.propTypes = {
  match: PropTypes.shape({
    name: PropTypes.string,
    compatibility: PropTypes.number,
    compatibilityBreakdown: PropTypes.shape({
      interests: PropTypes.number,
      values: PropTypes.number,
      lifestyle: PropTypes.number,
      personality: PropTypes.number
    }),
    commonInterests: PropTypes.arrayOf(PropTypes.string),
    astroCompatibility: PropTypes.string
  }),
  setShowCompatibilityModal: PropTypes.func.isRequired
};

CompatibilityModal.defaultProps = {
  match: {}
};

