import React from 'react';
import { FaTimes } from 'react-icons/fa';
import "./AddressFormModal.css";

export const AddressFormModal = ({
  setShowAddressForm,
  newAddress,
  setNewAddress,
  handleAddShippingAddress
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowAddressForm(false)}>
      <div className="address-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{newAddress.id ? 'Edit Address' : 'Add New Address'}</h2>
          <button className="close-modal" onClick={() => setShowAddressForm(false)}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          handleAddShippingAddress(newAddress);
        }}>
          <div className="form-group">
            <label>Address Name (e.g., Home, Work)</label>
            <input 
              type="text" 
              value={newAddress.name}
              onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Street Address</label>
            <input 
              type="text" 
              value={newAddress.street}
              onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input 
                type="text" 
                value={newAddress.city}
                onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>State/Province</label>
              <input 
                type="text" 
                value={newAddress.state}
                onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>ZIP/Postal Code</label>
              <input 
                type="text" 
                value={newAddress.zip}
                onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Country</label>
              <select
                value={newAddress.country}
                onChange={(e) => setNewAddress({...newAddress, country: e.target.value})}
                required
              >
                <option value="USA">United States</option>
                <option value="CAN">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AUS">Australia</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={newAddress.default}
                onChange={(e) => setNewAddress({...newAddress, default: e.target.checked})}
              />
              <span className="checkmark"></span>
              Set as default shipping address
            </label>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setShowAddressForm(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
