import React from 'react';
import { FaBoxOpen, FaTruck, FaCheckCircle, FaShoppingCart } from 'react-icons/fa';
import "./OrdersSection.css";
export const OrdersSection = ({
  orders,
  profile,
  activeOrderTab,
  setActiveOrderTab,
  setShowOrderDetails,
  products,
  setSelectedProductForReview,
  setShowReviewModal,
  setActiveTab
}) => {
  return (
    <div className="orders-section">
      <div className="orders-header">
        <h2>My Orders</h2>
        <div className="orders-summary">
          <div className="summary-item">
            <span className="count">{orders.length}</span>
            <span className="label">Total Orders</span>
          </div>
          <div className="summary-item">
            <span className="count">${profile.stats.totalSpent.toFixed(2)}</span>
            <span className="label">Total Spent</span>
          </div>
          <div className="summary-item">
            <span className="count">{new Date(profile.stats.memberSince).toLocaleDateString()}</span>
            <span className="label">Member Since</span>
          </div>
        </div>
      </div>

      <div className="orders-tabs">
        <button 
          className={`tab-button ${activeOrderTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveOrderTab('all')}
        >
          All Orders
        </button>
        <button 
          className={`tab-button ${activeOrderTab === 'processing' ? 'active' : ''}`}
          onClick={() => setActiveOrderTab('processing')}
        >
          Processing
        </button>
        <button 
          className={`tab-button ${activeOrderTab === 'shipped' ? 'active' : ''}`}
          onClick={() => setActiveOrderTab('shipped')}
        >
          Shipped
        </button>
        <button 
          className={`tab-button ${activeOrderTab === 'delivered' ? 'active' : ''}`}
          onClick={() => setActiveOrderTab('delivered')}
        >
          Delivered
        </button>
        <button 
          className={`tab-button ${activeOrderTab === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveOrderTab('cancelled')}
        >
          Cancelled
        </button>
      </div>

      <div className="orders-list">
        {orders
          .filter(order => 
            activeOrderTab === 'all' || 
            order.status === activeOrderTab
          )
          .map(order => (
            <div 
              key={order.id} 
              className="order-card"
              onClick={() => setShowOrderDetails(order)}
            >
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.id.split('-')[1]}</h3>
                  <p>Placed on {new Date(order.date).toLocaleDateString()}</p>
                  <p className={`status ${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </p>
                </div>
                <div className="order-total">
                  ${order.total.toFixed(2)}
                </div>
              </div>
              
              <div className="order-items-preview">
                {order.items.slice(0, 2).map(item => (
                  <div key={item.id} className="order-item-preview">
                    <img 
                      src={products.find(p => p.id === item.productId)?.images[0] || ''} 
                      alt={item.name}
                    />
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <div className="more-items">
                    +{order.items.length - 2} more items
                  </div>
                )}
              </div>
              
              <div className="order-actions">
                {order.status === 'processing' && (
                  <button className="cancel-order">
                    Cancel Order
                  </button>
                )}
                {order.status === 'shipped' && order.trackingNumber && (
                  <button className="track-order">
                    <FaTruck /> Track Package
                  </button>
                )}
                {order.status === 'delivered' && (
                  <button 
                    className="leave-review"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProductForReview(order.items[0].productId);
                      setShowReviewModal(true);
                    }}
                  >
                    Leave Review
                  </button>
                )}
                <button className="reorder">
                  Reorder
                </button>
              </div>
            </div>
          ))}
        
        {orders.length === 0 && (
          <div className="no-orders">
            <FaBoxOpen size={48} />
            <p>You haven't placed any orders yet</p>
            <button 
              className="start-shopping"
              onClick={() => setActiveTab('browse')}
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
