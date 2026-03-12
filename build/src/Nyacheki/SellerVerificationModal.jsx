import React from 'react';
import { FaTimes } from 'react-icons/fa';

export const SellerVerificationModal = ({
  setShowSellerVerification,
  verificationData,
  setVerificationData,
  documentInputRef,
  handleUploadDocument,
  handleCompleteSellerVerification
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowSellerVerification(false)}>
      <div className="verification-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Become a Seller</h2>
          <button className="close-modal" onClick={() => setShowSellerVerification(false)}>
            <FaTimes />
          </button>
        </div>
        
        <div className="verification-steps">
          <div className="step active">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Business Information</h3>
              <p>Provide details about your business</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Bank Details</h3>
              <p>Where we'll send your payments</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Verification</h3>
              <p>Confirm your identity</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          handleCompleteSellerVerification();
        }}>
          <div className="form-group">
            <label>Business Name</label>
            <input 
              type="text" 
              value={verificationData.businessName}
              onChange={(e) => setVerificationData({...verificationData, businessName: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Business Type</label>
            <select required>
              <option value="">Select business type</option>
              <option value="individual">Individual/Sole Proprietor</option>
              <option value="partnership">Partnership</option>
              <option value="corporation">Corporation</option>
              <option value="llc">LLC</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Tax Identification Number</label>
            <input 
              type="text" 
              value={verificationData.taxId}
              onChange={(e) => setVerificationData({...verificationData, taxId: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Business Address</label>
            <input 
              type="text" 
              placeholder="Street Address"
              required
            />
            <div className="form-row">
              <input 
                type="text" 
                placeholder="City"
                required
              />
              <input 
                type="text" 
                placeholder="State/Province"
                required
              />
            </div>
            <div className="form-row">
              <input 
                type="text" 
                placeholder="ZIP/Postal Code"
                required
              />
              <select required>
                <option value="">Country</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Business Document (License, Tax Filing, etc.)</label>
            <div className="file-upload">
              <input 
                type="file" 
                ref={documentInputRef}
                onChange={handleUploadDocument}
                style={{display: 'none'}}
                required
              />
              <button 
                type="button" 
                className="upload-button"
                onClick={() => documentInputRef.current.click()}
              >
                {verificationData.document ? verificationData.document.name : 'Choose File'}
              </button>
              <span className="file-info">
                {verificationData.document ? '' : 'No file chosen'}
              </span>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setShowSellerVerification(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={!verificationData.businessName || !verificationData.taxId || !verificationData.document}
            >
              Continue to Bank Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
