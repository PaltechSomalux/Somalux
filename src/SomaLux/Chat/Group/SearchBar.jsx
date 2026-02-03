import React from 'react';
import "./SearchBar.css";

export const SearchBar = ({
  messageSearch,
  setMessageSearch,
  setShowSearch
}) => {
  return (
    <div className="imo-search-bar">
      <input
        type="text"
        value={messageSearch}
        onChange={(e) => setMessageSearch(e.target.value)}
        placeholder="Search  Chats . . ."
        autoFocus
      />
      {messageSearch && (
        <button 
          className="imo-cancel-search" 
          onClick={() => {
            setMessageSearch('');
            setShowSearch(false);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};