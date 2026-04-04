import React from 'react';
import ELib from './ChatMe';

/**
 * Wrapper component for ELib/ChatMe that ensures Router context is available
 * Since ChatMe is integrated into BookManagement which is already within
 * a Router context, this wrapper just passes through to ELib
 */
export const ChatMeWrapper = ({ onChatSelected, onChatWindowActive, onBackFromChat }) => {
  return <ELib 
    onChatSelected={onChatSelected} 
    onChatWindowActive={onChatWindowActive}
    onBackFromChat={onBackFromChat}
  />;
}

export default ChatMeWrapper;
