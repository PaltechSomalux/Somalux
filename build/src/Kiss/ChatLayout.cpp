// src/components/Chat/ChatLayout.js
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useChat } from './ChatContext';
import {ChatHeader} from './ChatHeader';
import {ChatFooter} from './ChatFooter';
import {MessagesList} from './MessagesList';
import {MessageActions} from './MessageActions';
import {SettingsPanel} from './SettingsPanel';
import {LoginModal} from './LoginModal';
import {WallpaperSettings} from './WallpaperSettings';
import './ChatLayout.css';

export const ChatLayout = ({
  initialMessages = [],
  currentUser = { id: 'user1', name: 'You', avatar: '', status: 'online' },
  contact = { id: 'contact1', name: 'Contact', avatar: '', status: 'online' },
  showHeader = true,
  showFooter = true,
  theme = 'light',
  enableFeatures = {},
  onMessageCreated,
  onReplyAdded,
  onMessageDeleted,
  onMessageUpdated,
  onMessageReported,
  onMessagePinned,
  isMobileView = false,
  onBackClick,
}) => {
  const {
    messages,
    newMessage,
    isTyping,
    searchQuery,
    showSearch,
    selectedMessage,
    showMessageActions,
    isRecording,
    isOnline,
    recordingTime,
    replyingTo,
    expandedMessages,
    currentTheme,
    showClearChatConfirm,
    reportedMessages,
    pinnedMessages,
    notificationSettings,
    wallpaper,
    setMessages,
    setNewMessage,
    setSearchQuery,
    setShowSearch,
    setSelectedMessage,
    setShowMessageActions,
    setReplyingTo,
    setIsTyping,
    setIsRecording,
    setRecordingTime,
    toggleMessageExpand,
    togglePinMessage,
    reportMessage,
    clearChat,
    toggleTheme,
    setWallpaper,
  } = useChat();

  const messagesEndRef = useRef(null);
  const settingsPanelRef = useRef(null);
  const loginModalRef = useRef(null);

  // Initialize with props
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, setMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      sender: currentUser.id,
      text: newMessage,
      timestamp: new Date(),
      status: 'sent',
      replyTo: replyingTo?.id || null,
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setReplyingTo(null);

    if (onMessageCreated) {
      onMessageCreated(message);
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    setShowMessageActions(false);
  };

  const handleForwardMessage = (message) => {
    setNewMessage(`Fwd: ${message.text}`);
    setShowMessageActions(false);
    scrollToBottom();
  };

  const handleDeleteMessage = (messageId) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
    setShowMessageActions(false);
    
    if (onMessageDeleted) {
      onMessageDeleted(messageId);
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setShowMessageActions(true);
  };

  const handleFileUpload = (file) => {
    const message = {
      id: Date.now().toString(),
      sender: currentUser.id,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      },
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages([...messages, message]);

    if (onMessageCreated) {
      onMessageCreated(message);
    }
  };

  return (
    <div className={`chat-container ${currentTheme}-theme`} style={{
      backgroundImage: wallpaper.selected !== 'default' 
        ? `url(${wallpaper.selected === 'custom' ? wallpaper.custom : wallpaper.selected})`
        : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      opacity: wallpaper.opacity,
    }}>
      {showHeader && (
        <ChatHeader
          contact={contact}
          isTyping={isTyping}
          currentTheme={currentTheme}
          toggleTheme={toggleTheme}
          showSearch={showSearch}
          toggleSearch={() => setShowSearch(!showSearch)}
          enableFeatures={enableFeatures}
          isMobileView={isMobileView}
          onBackClick={onBackClick}
          setWallpaper={setWallpaper}
        />
      )}

      <MessagesList
        messages={messages}
        currentUser={currentUser}
        contact={contact}
        expandedMessages={expandedMessages}
        replyingTo={replyingTo}
        reportedMessages={reportedMessages}
        pinnedMessages={pinnedMessages}
        enableFeatures={enableFeatures}
        onMessageClick={handleMessageClick}
        onToggleExpand={toggleMessageExpand}
        messagesEndRef={messagesEndRef}
      />

      {showMessageActions && selectedMessage && (
        <MessageActions
          message={selectedMessage}
          currentUser={currentUser}
          enableFeatures={enableFeatures}
          onReply={handleReplyToMessage}
          onForward={handleForwardMessage}
          onPin={togglePinMessage}
          onDelete={handleDeleteMessage}
          onReport={reportMessage}
          onClose={() => setShowMessageActions(false)}
        />
      )}



      {showFooter && (
        <ChatFooter
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          onSendMessage={handleSendMessage}
          enableFeatures={enableFeatures}
          onFileUpload={handleFileUpload}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          recordingTime={recordingTime}
          setRecordingTime={setRecordingTime}
        />
      )}

      <SettingsPanel ref={settingsPanelRef} />
      <LoginModal ref={loginModalRef} />
      <WallpaperSettings />
    </div>
  );
};

ChatLayout.propTypes = {
  initialMessages: PropTypes.array,
  currentUser: PropTypes.object,
  contact: PropTypes.object,
  showHeader: PropTypes.bool,
  showFooter: PropTypes.bool,
  theme: PropTypes.string,
  enableFeatures: PropTypes.object,
  onMessageCreated: PropTypes.func,
  onReplyAdded: PropTypes.func,
  onMessageDeleted: PropTypes.func,
  onMessageUpdated: PropTypes.func,
  onMessageReported: PropTypes.func,
  onMessagePinned: PropTypes.func,
  isMobileView: PropTypes.bool,
  onBackClick: PropTypes.func,
};

