import React from 'react';
import { FaVenusMars, FaHeart, FaUserFriends, FaSearch, FaUndo } from 'react-icons/fa';
import "./PreferencesTab.css";
export const PreferencesTab = ({ profile, setProfile }) => {
  // Safely initialize preferences with defaults
  const preferences = {
    ageRange: [18, 50],
    distance: 50,
    gender: ['male', 'female', 'other'],
    lookingFor: ['serious', 'casual', 'friendship'],
    ...profile.preferences
  };

  const handlePreferenceChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const handleGenderChange = (gender) => {
    const currentGenders = preferences.gender;
    const newGenders = currentGenders.includes(gender)
      ? currentGenders.filter(g => g !== gender)
      : [...currentGenders, gender];
    handlePreferenceChange('gender', newGenders);
  };

  const handleLookingForChange = (type) => {
    const currentTypes = preferences.lookingFor;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    handlePreferenceChange('lookingFor', newTypes);
  };

  const resetPreferences = () => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ageRange: [18, 50],
        distance: 50,
        gender: ['male', 'female', 'other'],
        lookingFor: ['serious', 'casual', 'friendship']
      }
    }));
  };

  return (
    <div className="preferences-tab">
      <h3>Discovery Preferences</h3>
      
      <div className="preference-group">
        <label>Age Range: {preferences.ageRange[0]} - {preferences.ageRange[1]}</label>
        <div className="range-input">
          <div className="range-sliders">
            <input 
              type="range" 
              min="18" 
              max="80" 
              value={preferences.ageRange[0]}
              onChange={e => handlePreferenceChange(
                'ageRange', 
                [parseInt(e.target.value), preferences.ageRange[1]]
              )}
            />
            <input 
              type="range" 
              min="18" 
              max="80" 
              value={preferences.ageRange[1]}
              onChange={e => handlePreferenceChange(
                'ageRange', 
                [preferences.ageRange[0], parseInt(e.target.value)]
              )}
            />
          </div>
          <div className="range-values">
            {preferences.ageRange[0]} - {preferences.ageRange[1]}
          </div>
        </div>
      </div>
      
      <div className="preference-group">
        <label>Maximum Distance: {preferences.distance} miles</label>
        <div className="range-input">
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={preferences.distance}
            onChange={e => handlePreferenceChange('distance', parseInt(e.target.value))}
          />
          <div className="range-value">{preferences.distance} miles</div>
        </div>
      </div>
      
      <div className="preference-group">
        <label><FaVenusMars /> Gender Preferences</label>
        <div className="checkbox-group">
          {['male', 'female', 'other'].map(gender => (
            <label key={gender} className="gender-option">
              <input 
                type="checkbox" 
                checked={preferences.gender.includes(gender)}
                onChange={() => handleGenderChange(gender)}
              />
              <span className="checkbox-custom"></span>
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </label>
          ))}
        </div>
      </div>
      
      <div className="preference-group">
        <label><FaHeart /> Looking For</label>
        <div className="checkbox-group">
          {['serious', 'casual', 'friendship'].map(type => (
            <label key={type} className="looking-for-option">
              <input 
                type="checkbox" 
                checked={preferences.lookingFor.includes(type)}
                onChange={() => handleLookingForChange(type)}
              />
              <span className="checkbox-custom"></span>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div className="preference-group">
        <label><FaSearch /> Advanced Filters</label>
        <p className="premium-notice">
           Premium members get access to advanced filters including:
        </p>
        <ul className="premium-features">
          <li>Personality trait filters</li>
          <li>Astrological compatibility</li>
          <li>Love language preferences</li>
          <li>Education level</li>
          <li>Height range</li>
        </ul>
      </div>

      <div className="preference-actions">
        <button 
          type="button" 
          className="reset-button"
          onClick={resetPreferences}
        >
          <FaUndo /> Reset to Defaults
        </button>
      </div>
    </div>
  );
};