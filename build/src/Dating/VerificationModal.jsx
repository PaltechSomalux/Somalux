import React, { useState } from 'react';
import { FaTimes, FaCamera, FaVideo } from 'react-icons/fa';

export const VerificationModal = ({ setShowVerificationModal, setProfile }) => {
  const [verificationPhotos, setVerificationPhotos] = useState([]);
  const [verificationVideo, setVerificationVideo] = useState(null);

  const handleVerificationPhotoUpload = (e) => {
    const files = e.target.files;
    const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
    setVerificationPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleVerificationVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVerificationVideo(URL.createObjectURL(file));
    }
  };

  const handleCompleteVerification = () => {
    if (verificationPhotos.length >= 2 && verificationVideo) {
      setShowVerificationModal(false);
      setProfile(prev => ({ ...prev, verified: true }));
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowVerificationModal(false)}>
      <div className="verification-modal" onClick={e => e.stopPropagation()}>
        <h2>Verify Your Profile</h2>
        <p>Upload 2 photos of yourself and a short video to verify your identity.</p>
        
        <div className="verification-steps">
          <div className="verification-step">
            <h3>Step 1: Upload Photos</h3>
            <div className="verification-photos">
              {verificationPhotos.map((photo, index) => (
                <div key={index} className="verification-photo">
                  <img src={photo} alt={`Verification ${index + 1}`} />
                  <button onClick={() => setVerificationPhotos(prev => 
                    prev.filter((_, i) => i !== index)
                  )}>
                    <FaTimes />
                  </button>
                </div>
              ))}
              
              {verificationPhotos.length < 2 && (
                <label className="verification-upload">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleVerificationPhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <FaCamera />
                  <span>Add Photo</span>
                </label>
              )}
            </div>
          </div>
          
          <div className="verification-step">
            <h3>Step 2: Record Video</h3>
            {verificationVideo ? (
              <div className="verification-video">
                <video src={verificationVideo} controls />
                <button onClick={() => setVerificationVideo(null)}>
                  <FaTimes /> Re-record
                </button>
              </div>
            ) : (
              <label className="verification-upload">
                <input 
                  type="file" 
                  accept="video/*" 
                  capture="user" 
                  onChange={handleVerificationVideoUpload}
                  style={{ display: 'none' }}
                />
                <FaVideo />
                <span>Record Verification Video</span>
              </label>
            )}
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            className="cancel-button"
            onClick={() => setShowVerificationModal(false)}
          >
            Cancel
          </button>
          <button 
            className="submit-button"
            onClick={handleCompleteVerification}
            disabled={verificationPhotos.length < 2 || !verificationVideo}
          >
            Submit for Verification
          </button>
        </div>
      </div>
    </div>
  );
};

