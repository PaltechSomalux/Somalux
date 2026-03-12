import React from 'react';
import { FaHome, FaList, FaUser, FaShoppingCart } from 'react-icons/fa';

export const BottomNav = ({
  activeTab,
  setActiveTab,
  orders,
  notifications
}) => {
  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'browse' ? 'active' : ''}`}
        onClick={() => setActiveTab('browse')}
      >
        <FaHome />
        <span>Browse</span>
      </button>
      <button 
        className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
        onClick={() => setActiveTab('orders')}
      >
        <FaList />
        <span>Orders</span>
        {orders.filter(o => o.status === 'shipped' || o.status === 'processing').length > 0 && (
          <span className="nav-badge">
            {orders.filter(o => o.status === 'shipped' || o.status === 'processing').length}
          </span>
        )}
      </button>
      <button 
        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        <FaUser />
        <span>Profile</span>
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="nav-badge">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>
    </nav>
  );
};

