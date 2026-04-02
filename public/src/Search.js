import './Search.css';
import { useState, useRef, useEffect } from 'react';

function Search({ profiles = [], onSearchChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Update search term and trigger filtering in real-time
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Trigger parent component callback for real-time filtering
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearchChange) {
      onSearchChange('');
    }
    inputRef.current?.focus();
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    setTimeout(() => {
      if (!isSearchOpen) {
        inputRef.current?.focus();
      }
    }, 0);
  };

  const handleBlur = () => {
    // Don't auto-close on blur - let icon control the open/close state
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSearchOpen]);

  return (
    <div className="search-search" ref={searchContainerRef}>
      <div className={`search-form-search ${isSearchOpen ? 'open' : 'closed'}`}>
        <textarea
          ref={inputRef}
          placeholder="Search by skills, names, jobs, locations, categories..."
          value={searchTerm}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="search-input-search"
                        rows="1"
                      />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="search-clear-btn-search"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={toggleSearch}
        className="search-icon-btn"
        aria-label="Toggle search"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6"></circle>
          <path d="m21 21-5.5-5.5"></path>
        </svg>
      </button>
    </div>
  );
}

export default Search;
