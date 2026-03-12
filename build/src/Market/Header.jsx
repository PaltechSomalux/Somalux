import React from 'react';
import "./Header.css";
import { 
  FaSearch, 
  FaShoppingCart
} from 'react-icons/fa';

export const Header = ({
  activeTab,
  setActiveTab,
  showSearchBar,
  setShowSearchBar,
  searchQuery,
  setSearchQuery,
  handleSearch,
  setShowPaymentModal,
  cart
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title" onClick={() => setActiveTab('browse')}>Shop</h1>
      </div>
      
      {showSearchBar ? (
        <form className="search-bar active" onSubmit={handleSearch}>
          <button type="button" className="search-back" onClick={() => setShowSearchBar(false)}>
            {/* Back icon */}
          </button>
          <input 
            type="text" 
            placeholder="Search for products, brands, etc."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-submit">
            <FaSearch />
          </button>
        </form>
      ) : (
        <div className="header-center">
          {/* Removed filter button */}
        </div>
      )}
      
      <div className="header-right">
        {!showSearchBar && (
          <button 
            className="search-button"
            onClick={() => setShowSearchBar(true)}
          >
            <FaSearch />
          </button>
        )}
        <button 
          className="cart-button"
          onClick={() => setShowPaymentModal(true)}
        >
          <FaShoppingCart />
          {cart.length > 0 && <span className="badge">{cart.length}</span>}
        </button>
      </div>
    </header>
  );
};