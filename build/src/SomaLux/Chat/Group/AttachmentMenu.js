import React from 'react';

export const AttachmentMenu = ({
  fileInputRef,
  videoInputRef,
  handleFileUpload,
  setShowAttachmentMenu,
  setShowContactPicker
}) => {
  return (
    <div className="imo-attachment-menu">
      <label className="imo-attachment-option">
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e, 'image')}
          style={{ display: 'none' }}
        />
        📷 Photo
      </label>
      <label className="imo-attachment-option">
        <input 
          type="file" 
          accept="video/*" 
          ref={videoInputRef}
          onChange={(e) => handleFileUpload(e, 'video')}
          style={{ display: 'none' }}
        />
        🎥 Video
      </label>
      <label className="imo-attachment-option">
        <input 
          type="file" 
          accept="audio/*" 
          onChange={(e) => handleFileUpload(e, 'audio')}
          style={{ display: 'none' }}
        />
        🎵 Audio
      </label>
      <button 
        className="imo-attachment-option"
        onClick={() => {
          setShowAttachmentMenu(false);
          setShowContactPicker(true);
        }}
      >
        👤 Contact
      </button>
    </div>
  );
};