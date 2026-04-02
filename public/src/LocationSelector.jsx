import React, { useState, useEffect, useRef } from 'react';
import './LocationSelector.css';
import { 
  getCountries, 
  getStatesByCountry, 
  getCitiesByState,
  formatLocation,
  getTimezonByCountry
} from './locationData';

function LocationSelector({ value, onChange, onTimezoneChange, placeholder = "Select Location" }) {
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [stage, setStage] = useState('country'); // 'country' | 'state' | 'city'
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const selectRef = useRef(null);

  // Initialize from value prop
  useEffect(() => {
    const availableCountries = getCountries();
    
    if (value && typeof value === 'string') {
      const parts = value.split(', ').filter(p => p.trim());
      
      let parsedCountry = '';
      let parsedState = '';
      let parsedCity = '';

      for (let i = parts.length - 1; i >= 0; i--) {
        if (availableCountries.includes(parts[i])) {
          parsedCountry = parts[i];
          parts.splice(i, 1);
          break;
        }
      }

      if (parts.length === 2) {
        parsedState = parts[0];
        parsedCity = parts[1];
      } else if (parts.length === 1) {
        parsedCity = parts[0];
      }

      if (parsedCountry) {
        setCountry(parsedCountry);
        const stateList = getStatesByCountry(parsedCountry);
        setStates(stateList);
        
        if (parsedState && stateList.includes(parsedState)) {
          setState(parsedState);
          const cityList = getCitiesByState(parsedCountry, parsedState);
          setCities(cityList);
          
          if (parsedCity) {
            setCity(parsedCity);
            setStage('complete');
          } else {
            setStage('city');
          }
        } else {
          setStage('state');
        }
      }
    } else {
      // Kenya will appear at the top of the list
      setCountry('');
      setStage('country');
    }

    setCountries(availableCountries);
  }, [value]);

  const handleDropdownChange = (e) => {
    const selectedValue = e.target.value;

    if (stage === 'country') {
      setCountry(selectedValue);
      setState('');
      setCity('');
      
      if (selectedValue) {
        const stateList = getStatesByCountry(selectedValue);
        setStates(stateList);
        setCities([]);
        setStage('state');
        
        // Auto-fill timezone when country is selected
        if (onTimezoneChange) {
          const timezone = getTimezonByCountry(selectedValue);
          onTimezoneChange(timezone);
        }
      }
    } else if (stage === 'state') {
      setState(selectedValue);
      setCity('');
      
      if (selectedValue && country) {
        const cityList = getCitiesByState(country, selectedValue);
        setCities(cityList);
        setStage('city');
      }
    } else if (stage === 'city') {
      setCity(selectedValue);
      updateValue(country, state, selectedValue);
      setStage('complete');
    }
  };

  const updateValue = (selectedCountry, selectedState, selectedCity) => {
    const formattedLocation = formatLocation(selectedCountry, selectedState, selectedCity);
    onChange(formattedLocation);
  };

  const resetSelection = () => {
    setCountry('');
    setState('');
    setCity('');
    setStage('country');
    setStates([]);
    setCities([]);
    onChange('');
  };

  const getOptions = () => {
    if (stage === 'country') {
      return countries;
    } else if (stage === 'state') {
      return states;
    } else if (stage === 'city') {
      return cities;
    }
    return [];
  };

  const getLabel = () => {
    if (stage === 'country') return 'Select Country';
    if (stage === 'state') return 'Select State/Province';
    if (stage === 'city') return 'Select City';
    return 'Location Selected';
  };

  return (
    <div className="loc-sel-wrapper">
      <div className="loc-sel-single-dropdown">
        <select 
          ref={selectRef}
          className="loc-sel-dropdown"
          value={stage === 'country' ? country : stage === 'state' ? state : city}
          onChange={handleDropdownChange}
          aria-label={getLabel()}
          disabled={stage === 'complete'}
        >
          <option value="">{getLabel()}</option>
          {getOptions().map((option) => (
            <option 
              key={option} 
              value={option}
              data-is-kenya={option === 'Kenya' ? 'true' : 'false'}
            >
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Location Display - Inline */}
      {(country || state || city) && (
        <div className="loc-sel-selected">
          <span className="loc-sel-badge">
            {(() => {
              const parts = [];
              if (country) parts.push(country);
              if (state) parts.push(state);
              if (city) parts.push(city);
              return ': ' + parts.join(', ');
            })()}
          </span>
          {stage !== 'complete' && (
            <span className="loc-sel-punctuation">,</span>
          )}
          <button 
            className="loc-sel-reset-btn"
            onClick={resetSelection}
            type="button"
            title="Reset selection"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default LocationSelector;

