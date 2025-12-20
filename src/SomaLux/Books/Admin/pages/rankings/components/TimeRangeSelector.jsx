import React from 'react';
import './TimeRangeSelector.css';

const TimeRangeSelector = ({ selected, onChange }) => (
  <div className="time-range-selector">
    {['daily', 'weekly', 'monthly', 'annually'].map(range => (
      <button
        key={range}
        className={`time-range-button ${selected === range ? 'active' : ''}`}
        onClick={() => onChange(range)}
      >
        {range.charAt(0).toUpperCase() + range.slice(1)}
      </button>
    ))}
  </div>
);

export default TimeRangeSelector;
