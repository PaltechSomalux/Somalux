import React, { useRef } from 'react';
import { FaXmark } from 'react-icons/fa6';
import './LanguageSelector.css';
import { getLanguages } from './languageData';

function LanguageSelector({ value = [], onChange, placeholder = "Add Language" }) {
  const containerRef = useRef(null);

  const languages = getLanguages();
  const selectedLanguages = Array.isArray(value) ? value : [];

  const handleLanguageSelect = (language) => {
    onChange([...selectedLanguages, language]);
  };

  const clearAllLanguages = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div 
      className="lang-sel-wrapper"
      ref={containerRef}
    >
      {/* Languages Label with Selected Items - Inline */}
      <div className="lang-sel-label-row">
        <span className="lang-sel-label">Languages:</span>
        {selectedLanguages.length > 0 && (
          <>
            <span className="lang-sel-badge">
              {selectedLanguages.join(', ')}
            </span>
            <button 
              className="lang-sel-clear-btn"
              onClick={clearAllLanguages}
              type="button"
              title="Clear all languages"
            >
              <FaXmark />
            </button>
          </>
        )}
      </div>

      {/* Input Container with dropdown */}
      <div className="lang-sel-input-row">
        {/* Dropdown Select - single color */}
        <div className="lang-sel-select-wrapper">
          <select 
            className="lang-sel-select"
            onChange={(e) => {
              if (e.target.value) {
                handleLanguageSelect(e.target.value);
                e.target.value = '';
              }
            }}
            value=""
          >
            <option value="">Select a language</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default LanguageSelector;




