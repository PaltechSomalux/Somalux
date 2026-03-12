import React from 'react';
import "./DashboardTab.css";
import { 
  FaShoppingCart, 
  FaTruck, 
  FaCheckCircle, 
  FaHeart, 
  FaRegHeart, 
  FaChartLine, 
  FaComment, 
  FaBell, 
  FaBoxOpen,
  FaTag,
  FaStar,
  FaTimes
} from 'react-icons/fa';

export const DashboardTab = ({
  profile,
  orders,
  notifications,
  handleMarkNotificationAsRead,
  products,
  handleAddToWishlist,
  handleAddToCart,
  setActiveProfileTab,
  setActiveTab
}) => {
  return (
    <div className="dashboard-tab">
      <div className="welcome-banner">
        <h2>Welcome back, {profile.name}!</h2>
        <p>Here's what's happening with your account today.</p>
      </div>
      
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <FaShoppingCart />
          </div>
          <div className="stat-info">
            <h3>{orders.filter(o => o.status === 'processing').length}</h3>
            <p>Orders Processing</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaTruck />
          </div>
          <div className="stat-info">
            <h3>{orders.filter(o => o.status === 'shipped').length}</h3>
            <p>Orders Shipped</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
            <p>Orders Delivered</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaHeart />
          </div>
          <div className="stat-info">
            <h3>{profile.wishlist.length}</h3>
            <p>Wishlist Items</p>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {notifications.slice(0, 5).map(notification => (
            <div 
              key={notification.id} 
              className={`activity-item ${notification.read ? '' : 'unread'}`}
              onClick={() => handleMarkNotificationAsRead(notification.id)}
            >
              <div className="activity-icon">
                {notification.type === 'order' && <FaShoppingCart />}
                {notification.type === 'promo' && <FaTag />}
                {notification.type === 'review' && <FaStar />}
                {notification.type === 'message' && <FaComment />}
              </div>
              <div className="activity-details">
                <p>{notification.message}</p>
                <span className="activity-time">
                  {new Date(notification.date).toLocaleDateString()}
                </span>
              </div>
              {!notification.read && <div className="unread-dot"></div>}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="no-activity">
              <p>No recent activity</p>
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <button 
            className="view-all-activity"
            onClick={() => setActiveProfileTab('notifications')}
          >
            View All Notifications
          </button>
        )}
      </div>
      
      <div className="wishlist-section">
        <div className="section-header">
          <h3>Your Wishlist ({profile.wishlist.length})</h3>
          <button 
            className="view-all"
            onClick={() => setActiveProfileTab('wishlist')}
          >
            View All
          </button>
        </div>
        {profile.wishlist.length > 0 ? (
          <div className="wishlist-grid">
            {products
              .filter(product => profile.wishlist.includes(product.id))
              .slice(0, 4)
              .map(product => (
                <div key={product.id} className="wishlist-item">
                  <img src={product.images[0]} alt={product.title} />
                  <div className="wishlist-info">
                    <h4>{product.title}</h4>
                    <div className="price">${product.price.toFixed(2)}</div>
                    <button 
                      className="add-to-cart"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      Add to Cart
                    </button>
                  </div>
                  <button 
                    className="remove-wishlist"
                    onClick={() => handleAddToWishlist(product.id)}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="empty-wishlist">
            <FaRegHeart size={48} />
            <p>Your wishlist is empty</p>
            <button 
              className="browse-products"
              onClick={() => setActiveTab('browse')}
            >
              Browse Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
};