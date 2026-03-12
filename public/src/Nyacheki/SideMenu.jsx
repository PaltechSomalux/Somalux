import React from 'react';
import { 
  FaUser, FaList, FaStore, FaSearch, FaShoppingCart, FaMapMarkerAlt, 
  FaCreditCard, FaHeart, FaQuestionCircle, FaCog, FaCrown, FaSignOutAlt, 
  FaTimes
} from 'react-icons/fa';
import "./SideMenu.css";

export const SideMenu = ({
  setMenuOpen,
  user,
  profile,
  setActiveTab,
  setActiveProfileTab,
  cart,
  setShowPaymentModal,
  setShowFilters,
  setShowSellerVerification,
  setShowPremiumModal,
  orders // Added the missing orders prop
}) => {
  return (
    <div className="side-menu-overlay" onClick={() => setMenuOpen(false)}>
      <div className="side-menu" onClick={(e) => e.stopPropagation()}>
        <div className="menu-header">
          <div className="user-info">
            <img src={user.avatar} alt={user.name} />
            <div>
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <div className="user-badges">
                {profile.premium && (
                  <span className="premium-badge">
                    <FaCrown /> Premium
                  </span>
                )}
                {profile.seller && (
                  <span className="seller-badge">
                    <FaStore /> Seller
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="close-menu" onClick={() => setMenuOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="menu-items">
          <div className="menu-item" onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}>
            <FaUser />
            <span>My Account</span>
          </div>
          <div className="menu-item" onClick={() => { setActiveTab('orders'); setMenuOpen(false); }}>
            <FaList />
            <span>My Orders</span>
            {orders && orders.filter(o => o.status === 'shipped' || o.status === 'processing').length > 0 && (
              <span className="menu-badge">
                {orders.filter(o => o.status === 'shipped' || o.status === 'processing').length}
              </span>
            )}
          </div>
          {profile.seller && (
            <div className="menu-item" onClick={() => { setActiveTab('profile'); setActiveProfileTab('seller'); setMenuOpen(false); }}>
              <FaStore />
              <span>Seller Center</span>
            </div>
          )}
          <div className="menu-item" onClick={() => { setShowFilters(true); setMenuOpen(false); }}>
            <FaSearch />
            <span>Browse Categories</span>
          </div>
          <div className="menu-item" onClick={() => { setShowPaymentModal(true); setMenuOpen(false); }}>
            <FaShoppingCart />
            <span>My Cart ({cart.length})</span>
          </div>
          <div className="menu-item" onClick={() => { setActiveTab('profile'); setActiveProfileTab('settings'); setMenuOpen(false); }}>
            <FaMapMarkerAlt />
            <span>Address Book</span>
          </div>
          <div className="menu-item" onClick={() => { setActiveTab('profile'); setActiveProfileTab('settings'); setMenuOpen(false); }}>
            <FaCreditCard />
            <span>Payment Methods</span>
          </div>
          <div className="menu-item" onClick={() => { setActiveTab('profile'); setMenuOpen(false); }}>
            <FaHeart />
            <span>Wishlist ({profile.wishlist.length})</span>
          </div>
          <div className="menu-item">
            <FaQuestionCircle />
            <span>Help Center</span>
          </div>
          <div className="menu-item" onClick={() => { setActiveTab('profile'); setActiveProfileTab('settings'); setMenuOpen(false); }}>
            <FaCog />
            <span>Settings</span>
          </div>
          {!profile.premium && (
            <div 
              className="menu-item premium-item"
              onClick={() => { setShowPremiumModal(true); setMenuOpen(false); }}
            >
              <FaCrown />
              <span>Go Premium</span>
            </div>
          )}
          <div className="menu-item">
            <FaSignOutAlt />
            <span>Log Out</span>
          </div>
        </div>
      </div>
    </div>
  );
};