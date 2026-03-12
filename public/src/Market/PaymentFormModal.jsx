import React from 'react';
import { FaTimes } from 'react-icons/fa';
import "./PaymentFormModal.css";
export const PaymentFormModal = ({
  setShowPaymentForm,
  newPaymentMethod,
  setNewPaymentMethod,
  handleAddPaymentMethod
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowPaymentForm(false)}>
      <div className="payment-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Payment Method</h2>
          <button className="close-modal" onClick={() => setShowPaymentForm(false)}>
            <FaTimes />
          </button>
        </div>
        
        <div className="payment-tabs">
          <button className="payment-tab active">Credit/Debit Card</button>
          <button className="payment-tab">PayPal</button>
          <button className="payment-tab">Bank Transfer</button>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          handleAddPaymentMethod({
            type: 'credit_card',
            cardNumber: newPaymentMethod.cardNumber,
            last4: newPaymentMethod.cardNumber.slice(-4),
            expiry: newPaymentMethod.expiry,
            cvv: newPaymentMethod.cvv,
            name: newPaymentMethod.name,
            brand: 'Visa', // This would be determined by card number in a real app
            default: newPaymentMethod.default
          });
        }}>
          <div className="form-group">
            <label>Card Number</label>
            <input 
              type="text" 
              placeholder="1234 5678 9012 3456"
              value={newPaymentMethod.cardNumber}
              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cardNumber: e.target.value})}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Expiration Date</label>
              <input 
                type="text" 
                placeholder="MM/YY"
                value={newPaymentMethod.expiry}
                onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiry: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Security Code</label>
              <input 
                type="text" 
                placeholder="CVV"
                value={newPaymentMethod.cvv}
                onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cvv: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Name on Card</label>
            <input 
              type="text" 
              placeholder="John Smith"
              value={newPaymentMethod.name}
              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={newPaymentMethod.default}
                onChange={(e) => setNewPaymentMethod({...newPaymentMethod, default: e.target.checked})}
              />
              <span className="checkmark"></span>
              Set as default payment method
            </label>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setShowPaymentForm(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
            >
              Save Payment Method
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

