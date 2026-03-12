import React from 'react';
import "./CartModal.css";
import { 
  FaTimes, 
  FaTag, 
  FaEdit, 
  FaTrash, 
  FaMinus, 
  FaPlus, 
  FaCreditCard, 
  FaShoppingCart 
} from 'react-icons/fa';

export const CartModal = ({
  setShowPaymentModal,
  cart,
  products,
  handleUpdateQuantity,
  handleRemoveFromCart,
  couponSelection,
  setCouponSelection,
  coupons,
  handleApplyCoupon,
  subtotal,
  shipping,
  tax,
  discount,
  total,
  profile,
  setShowAddressForm,
  setShowPaymentForm,
  handlePlaceOrder,
  setActiveTab
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
      <div className="cart-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Your Cart ({cart.length})</h2>
          <button className="close-modal" onClick={() => setShowPaymentModal(false)}>
            <FaTimes />
          </button>
        </div>
        
        {cart.length > 0 ? (
          <>
            <div className="cart-items">
              {cart.map(item => {
                const product = products.find(p => p.id === item.productId);
                const variation = product.variations.find(v => v.id === item.variationId);
                return (
                  <div key={item.id} className="cart-item">
                    <div className="item-image">
                      <img src={product.images[0]} alt={product.title} />
                    </div>
                    <div className="item-info">
                      <h4>{product.title} ({variation.value})</h4>
                      <div className="item-price">${item.price.toFixed(2)}</div>
                      <div className="item-quantity">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <FaMinus />
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                    <button 
                      className="remove-item"
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                );
              })}
            </div>
            
            <div className="coupon-section">
              <input 
                type="text" 
                placeholder="Enter coupon code"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    handleApplyCoupon(e.target.value);
                  }
                }}
              />
              <button 
                className="apply-coupon"
                onClick={() => {
                  const input = document.querySelector('.coupon-section input');
                  if (input.value) handleApplyCoupon(input.value);
                }}
              >
                Apply
              </button>
            </div>
            
            {couponSelection && (
              <div className="coupon-applied">
                <div className="coupon-info">
                  <FaTag />
                  <span>{couponSelection.code} - {couponSelection.description}</span>
                </div>
                <button onClick={() => setCouponSelection(null)}>
                  <FaTimes />
                </button>
              </div>
            )}
            
            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal ({cart.length} items):</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {couponSelection && (
                <div className="summary-row discount">
                  <span>Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="checkout-options">
              <div className="shipping-address">
                <h3>
                  Shipping Address
                  <button className="edit-address-btn">
                    <FaEdit />
                  </button>
                </h3>
                <div className="address-options">
                  {profile.shippingAddresses.map(address => (
                    <label key={address.id} className="address-option">
                      <input 
                        type="radio" 
                        name="shipping-address"
                        defaultChecked={address.default}
                        value={address.id}
                      />
                      <div className="address-details">
                        <strong>{address.name}</strong>
                        <p>{address.street}, {address.city}, {address.state} {address.zip}</p>
                        <p>{address.country}</p>
                        {address.default && <span className="default-badge">Default</span>}
                      </div>
                    </label>
                  ))}
                  <button 
                    className="add-address"
                    onClick={() => setShowAddressForm(true)}
                  >
                    + Add New Address
                  </button>
                </div>
              </div>
              
              <div className="payment-method">
                <h3>
                  Payment Method
                  <button className="edit-payment-btn">
                    <FaEdit />
                  </button>
                </h3>
                <div className="payment-options">
                  {profile.paymentMethods.map(method => (
                    <label key={method.id} className="payment-option">
                      <input 
                        type="radio" 
                        name="payment-method"
                        defaultChecked={method.default}
                        value={method.id}
                      />
                      <div className="method-details">
                        {method.type === 'credit_card' && (
                          <>
                            <FaCreditCard />
                            <div>
                              <span>•••• •••• •••• {method.last4}</span>
                              <span className="method-brand">{method.brand}</span>
                              <span className="method-expiry">Expires {method.expiry}</span>
                            </div>
                          </>
                        )}
                        {method.type === 'paypal' && (
                          <>
                            {/* PayPal icon */}
                            <div>
                              <span>PayPal</span>
                              <span className="method-email">{method.email}</span>
                            </div>
                          </>
                        )}
                        {method.default && <span className="default-badge">Default</span>}
                      </div>
                    </label>
                  ))}
                  <button 
                    className="add-payment"
                    onClick={() => setShowPaymentForm(true)}
                  >
                    + Add Payment Method
                  </button>
                </div>
              </div>
              
              <button 
                className="place-order-button"
                onClick={() => handlePlaceOrder(
                  document.querySelector('input[name="payment-method"]:checked')?.value,
                  document.querySelector('input[name="shipping-address"]:checked')?.value
                )}
                disabled={!profile.shippingAddresses.length || !profile.paymentMethods.length}
              >
                Place Order - ${total.toFixed(2)}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-cart">
            <FaShoppingCart size={48} />
            <p>Your cart is empty</p>
            <button 
              className="continue-shopping"
              onClick={() => {
                setShowPaymentModal(false);
                setActiveTab('browse');
              }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};