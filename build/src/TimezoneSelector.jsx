import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaMagnifyingGlass, FaCheck } from 'react-icons/fa6';
import './TimezoneSelector.css';

const timezones = [
  // UTC Offsets
  'UTC-12:00 (International Date Line)',
  'UTC-11:00 (Samoa Standard Time)',
  'UTC-10:00 (Hawaii Standard Time)',
  'UTC-09:30 (Marquesas Islands)',
  'UTC-09:00 (Alaska Standard Time)',
  'UTC-08:00 (Pacific Standard Time)',
  'UTC-07:00 (Mountain Standard Time)',
  'UTC-06:00 (Central Standard Time)',
  'UTC-05:00 (Eastern Standard Time)',
  'UTC-04:30 (Venezuelan Standard Time)',
  'UTC-04:00 (Atlantic Standard Time)',
  'UTC-03:30 (Newfoundland Standard Time)',
  'UTC-03:00 (Brasília Standard Time)',
  'UTC-02:00 (Mid-Atlantic Standard Time)',
  'UTC-01:00 (Azores Standard Time)',
  'UTC+00:00 (Greenwich Mean Time)',
  'UTC+01:00 (Central European Time)',
  'UTC+02:00 (Eastern European Time)',
  'UTC+03:00 (Moscow Standard Time)',
  'UTC+03:30 (Iran Standard Time)',
  'UTC+04:00 (Gulf Standard Time)',
  'UTC+04:30 (Afghanistan Standard Time)',
  'UTC+05:00 (Pakistan Standard Time)',
  'UTC+05:30 (Indian Standard Time)',
  'UTC+05:45 (Nepal Time)',
  'UTC+06:00 (Bangladesh Standard Time)',
  'UTC+06:30 (Myanmar Standard Time)',
  'UTC+07:00 (Indochina Time)',
  'UTC+08:00 (China Standard Time)',
  'UTC+08:45 (Eucla Standard Time)',
  'UTC+09:00 (Japan Standard Time)',
  'UTC+09:30 (Australian Central Standard Time)',
  'UTC+10:00 (Australian Eastern Standard Time)',
  'UTC+10:30 (Lord Howe Standard Time)',
  'UTC+11:00 (Solomon Islands Standard Time)',
  'UTC+12:00 (New Zealand Standard Time)',
  'UTC+12:45 (Chatham Islands Standard Time)',
  'UTC+13:00 (Nuku\'alofa Standard Time)',
];

function TimezoneSelector({ value, onChange, placeholder = "Select Timezone" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTimezones, setFilteredTimezones] = useState(timezones);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize search when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 0);
    }
  }, [isOpen]);

  // Filter timezones based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTimezones(timezones);
    } else {
      setFilteredTimezones(
        timezones.filter(tz => 
          tz.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (timezone) => {
    onChange(timezone);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div 
      className="tz-sel-wrapper"
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Dropdown Button */}
      <button
        type="button"
        className="tz-sel-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select timezone"
        aria-expanded={isOpen}
      >
        <span className="tz-sel-value">
          {value || placeholder}
        </span>
        <FaChevronDown className="tz-sel-icon" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="tz-sel-dropdown-menu">
          {/* Search Input */}
          <div className="tz-sel-search-wrapper">
            <textarea
              ref={searchInputRef}
              className="tz-sel-search-input"
              placeholder="Search timezone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
                        rows="1"
                      />
            <FaMagnifyingGlass className="tz-sel-search-icon" />
          </div>

          {/* Options List */}
          <ul className="tz-sel-options-list">
            {filteredTimezones.length > 0 ? (
              filteredTimezones.map((timezone, index) => (
                <li
                  key={index}
                  className={`tz-sel-option ${value === timezone ? 'selected' : ''}`}
                  onClick={() => handleSelect(timezone)}
                >
                  <span className="tz-sel-option-text">{timezone}</span>
                  {value === timezone && <FaCheck className="tz-sel-option-checkmark" />}
                </li>
              ))
            ) : (
              <li className="tz-sel-no-results">
                No timezones found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TimezoneSelector;


