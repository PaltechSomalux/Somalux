import React from 'react';
import { FaTimes, FaTruck, FaCheckCircle } from 'react-icons/fa';

export const OrderDetailsModal = ({
  setShowOrderDetails,
  order,
  products,
  setSelectedProductForReview,
  setShowReviewModal
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowOrderDetails(null)}>
      <div className="order-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Order #{order.id.split('-')[1]}</h2>
          <button className="close-modal" onClick={() => setShowOrderDetails(null)}>
            <FaTimes />
          </button>
        </div>
        
        <div className="order-status">
          <div className={`status-badge ${order.status}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
          {order.status === 'shipped' && order.trackingNumber && (
            <div className="tracking-info">
              <FaTruck />
              <span>Tracking #: {order.trackingNumber}</span>
            </div>
          )}
          {order.status === 'delivered' && order.deliveryDate && (
            <div className="delivery-info">
              <FaCheckCircle />
              <span>Delivered on {new Date(order.deliveryDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="order-summary">
          <div className="summary-row">
            <span>Order Placed:</span>
            <span>{new Date(order.date).toLocaleDateString()}</span>
          </div>
          <div className="summary-row">
            <span>Payment Method:</span>
            <span>
              {order.paymentMethod.type === 'credit_card' ? (
                `•••• •••• •••• ${order.paymentMethod.last4} (${order.paymentMethod.brand})`
              ) : (
                order.paymentMethod.type
              )}
            </span>
          </div>
          <div className="summary-row">
            <span>Shipping Address:</span>
            <span>
              {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
            </span>
          </div>
        </div>
        
        <div className="order-items">
          <h3>Items ({order.items.length})</h3>
          {order.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return (
              <div key={item.id} className="order-item">
                <img src={product?.images[0] || ''} alt={item.name} />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <div className="item-meta">
                    <span>Qty: {item.quantity}</span>
                    <span>${item.price.toFixed(2)} each</span>
                  </div>
                  {order.status === 'delivered' && (
                    <button 
                      className="review-button"
                      onClick={() => {
                        setSelectedProductForReview(item.productId);
                        setShowReviewModal(true);
                        setShowOrderDetails(null);
                      }}
                    >
                      Write a Review
                    </button>
                  )}
                </div>
                <div className="item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="order-totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Shipping:</span>
            <span>$5.99</span>
          </div>
          <div className="total-row">
            <span>Tax:</span>
            <span>${(order.total * 0.08).toFixed(2)}</span>
          </div>
          <div className="total-row grand-total">
            <span>Total:</span>
            <span>${(order.total + 5.99 + (order.total * 0.08)).toFixed(2)}</span>
          </div>
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
          <button className="reorder">
            Reorder Items
          </button>
        </div>
      </div>
    </div>
  );
};

