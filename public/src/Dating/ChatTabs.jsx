import React from 'react';

export const ChatTabs = ({ activeChatTab, setActiveChatTab }) => {
  return (
    <div className="chat-tabs">
      <button 
        className={`chat-tab ${activeChatTab === 'chat' ? 'active' : ''}`}
        onClick={() => setActiveChatTab('chat')}
      >
        Chat
      </button>
      <button 
        className={`chat-tab ${activeChatTab === 'compatibility' ? 'active' : ''}`}
        onClick={() => setActiveChatTab('compatibility')}
      >
        Compatibility
      </button>
      <button 
        className={`chat-tab ${activeChatTab === 'questions' ? 'active' : ''}`}
        onClick={() => setActiveChatTab('questions')}
      >
        Questions
      </button>
    </div>
  );
};

