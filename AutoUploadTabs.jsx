import React, { useState } from 'react';
import { FiBook, FiFileText } from 'react-icons/fi';
import AutoUpload from './AutoUpload';
import PastPapersAutoUpload from './PastPapersAutoUpload';

const AutoUploadTabs = ({ userProfile, asSubmission = false }) => {
  const [activeTab, setActiveTab] = useState('books'); // 'books' or 'pastpapers'

  const tabStyles = `
    .autoupload-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      border-bottom: 2px solid #374151;
    }
    .autoupload-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: transparent;
      border: none;
      color: #8696a0;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.3s ease;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
    }
    .autoupload-tab:hover {
      color: #e9edef;
      background: rgba(0, 168, 132, 0.05);
    }
    .autoupload-tab.active {
      color: #00a884;
      border-bottom-color: #00a884;
    }
  `;

  return (
    <>
      <style>{tabStyles}</style>
      
      {/* Tabs */}
      <div className="autoupload-tabs">
        <button
          className={`autoupload-tab ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          <FiBook size={20} />
          Books Auto Upload
        </button>
        <button
          className={`autoupload-tab ${activeTab === 'pastpapers' ? 'active' : ''}`}
          onClick={() => setActiveTab('pastpapers')}
        >
          <FiFileText size={20} />
          Past Papers Auto Upload
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: '20px' }}>
        {activeTab === 'books' && (
          <AutoUpload userProfile={userProfile} asSubmission={asSubmission} />
        )}
        {activeTab === 'pastpapers' && (
          <PastPapersAutoUpload userProfile={userProfile} asSubmission={asSubmission} />
        )}
      </div>
    </>
  );
};

export default AutoUploadTabs;
