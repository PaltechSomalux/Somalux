import React, { useState, useEffect } from 'react';
import './RateSelector.css';

function RateSelector({ value, onChange, currency = 'Ksh' }) {
  const [durationType, setDurationType] = useState('hourly');
  const [rateValue, setRateValue] = useState('');

  // Parse the value when component mounts or value changes
  useEffect(() => {
    if (value) {
      const parsed = parseRateValue(value);
      setDurationType(parsed.type);
      setRateValue(parsed.value);
    }
  }, [value]);

  // Parse rate value from formatted string like "Ksh 85 / hour"
  const parseRateValue = (rateString) => {
    if (!rateString) return { type: 'hourly', value: '' };
    
    const match = rateString.match(/\d+/);
    const numValue = match ? match[0] : '';
    
    let type = 'hourly';
    if (rateString.includes('day')) type = 'daily';
    else if (rateString.includes('week')) type = 'weekly';
    else if (rateString.includes('month')) type = 'monthly';
    else if (rateString.includes('contract')) type = 'contract';
    
    return { type, value: numValue };
  };

  // Format rate value into the full format
  const formatRateValue = (type, value) => {
    if (!value) return '';
    
    const suffixes = {
      hourly: '/ hour',
      daily: '/ day',
      weekly: '/ week',
      monthly: '/ month',
      contract: '(Fixed Price)'
    };
    
    return `${currency} ${value} ${suffixes[type]}`;
  };

  const handleDurationChange = (e) => {
    const newType = e.target.value;
    setDurationType(newType);
    const formatted = formatRateValue(newType, rateValue);
    onChange(formatted);
  };

  const handleRateChange = (e) => {
    const newValue = e.target.value;
    setRateValue(newValue);
    const formatted = formatRateValue(durationType, newValue);
    onChange(formatted);
  };

  return (
    <div className="rate-sel-container">
      <div className="rate-sel-wrapper">
        <div className="rate-sel-type-selector">
          <label htmlFor="duration-type" className="rate-sel-label">Duration</label>
          <div className="rate-sel-duration-select-wrapper">
            <select 
              id="duration-type"
              value={durationType}
              onChange={handleDurationChange}
              className="rate-sel-duration-select"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="contract">Contract (Fixed Price)</option>
            </select>
          </div>
        </div>

        <div className="rate-sel-input-group">
          <label htmlFor="rate-value" className="rate-sel-label">Amount</label>
          <div className="rate-sel-input-wrapper">
            <span className="rate-sel-currency-prefix">{currency}</span>
            <textarea 
              id="rate-value"
              value={rateValue}
              onChange={handleRateChange}
              placeholder={durationType === 'contract' ? '5000' : '200'}
              min="0"
              step="1"
              className="rate-sel-input"
                        rows="1"
                      />
            <span className="rate-sel-suffix">
              {durationType === 'hourly' && '/ hour'}
              {durationType === 'daily' && '/ day'}
              {durationType === 'weekly' && '/ week'}
              {durationType === 'monthly' && '/ month'}
              {durationType === 'contract' && '(Fixed)'}
            </span>
          </div>
        </div>
      </div>

      {rateValue && (
        <div className="rate-sel-preview">
          <span className="preview-label">Your Rate:</span>
          <span className="preview-value">{formatRateValue(durationType, rateValue)}</span>
        </div>
      )}
    </div>
  );
}

export default RateSelector;

