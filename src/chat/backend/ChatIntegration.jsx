/**
 * ChatIntegration Component
 * Seamlessly integrates ChatMe into the main BookManagement system
 * Adapts the Chat component to match the visual style of Books, Categories, and PastPapers
 */

import React from 'react';
import { ChatMe } from './ChatList/ChatMe';
import './ChatIntegration.css';

export const ChatIntegration = () => {
  return (
    <div className="chat-integration-container">
      <ChatMe
        isMobileView={window.innerWidth <= 768}
        searchQuery=""
        onChatSelect={() => {}}
        onProfileViewerChange={() => {}}
      />
    </div>
  );
};
