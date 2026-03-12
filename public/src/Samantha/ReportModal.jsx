import React from 'react';

export const ReportModal = ({ setShowReportModal, setShowBlockModal, handleReportProfile, handleBlockProfile }) => {
  return (
    <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <h2>Report Profile</h2>
        <p>Why are you reporting this profile?</p>
        <div className="report-options">
          <button onClick={() => handleReportProfile('Inappropriate Content')}>
            Inappropriate Content
          </button>
          <button onClick={() => handleReportProfile('Spam or Scam')}>
            Spam or Scam
          </button>
          <button onClick={() => handleReportProfile('Fake Profile')}>
            Fake Profile
          </button>
          <button onClick={() => handleReportProfile('Harassment')}>
            Harassment
          </button>
          <button onClick={() => {
            setShowReportModal(false);
            setShowBlockModal(true);
          }}>
            Block User
          </button>
        </div>
        <button 
          className="close-report"
          onClick={() => setShowReportModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};