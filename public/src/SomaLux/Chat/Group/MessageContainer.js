import React from 'react';
import { Message } from './Message';
import "./MessageContainer.css";

export const MessageContainer = ({
  filteredMessages,
  currentUser,
  group,
  isTyping,
  typingUsers = {},
  messageSelectionMode,
  selectedMessages,
  toggleMessageSelection,
  showMessageOptions,
  handleMessageOptions,
  addReaction,
  handleReply,
  handleForward,
  onDirectMessage,
  handleEditMessage,
  togglePinMessage,
  showDeleteConfirmation,
  setShowDeleteConfirmation,
  confirmDeleteMessage,
  onDeleteForEveryone,
  showMessageInfo,
  messageInfoDetails,
  setMessageInfoDetails,
  renderMessageContent,
  messagesEndRef,
  onSenderClick,
}) => {
  // Helper function to get sender info from group members
  const getSenderInfo = (senderId) => {
    if (!group?.members || !senderId) return null;
    const member = group.members.find(m => m.uid === senderId || m.id === senderId);
    return member;
  };

  return (
    <div className="imo-message-container">
      {filteredMessages.map((message, index) => {
        const senderInfo = getSenderInfo(message.sender);
        const previousMessage = index > 0 ? filteredMessages[index - 1] : null;

        return (
          <Message 
            key={message.id}
            message={message}
            currentUser={currentUser}
            group={group}
            senderInfo={senderInfo}
            previousMessage={previousMessage}
            messageSelectionMode={messageSelectionMode}
            selectedMessages={selectedMessages}
            toggleMessageSelection={toggleMessageSelection}
            showMessageOptions={showMessageOptions}
            handleMessageOptions={handleMessageOptions}
            onReactionAdd={addReaction}
            onReply={handleReply}
            onForward={handleForward}
            onDirectMessage={onDirectMessage}
            onEdit={handleEditMessage}
            onPinToggle={togglePinMessage}
            onStarToggle={(msgId) => console.log('Star:', msgId)}
            onDelete={confirmDeleteMessage}
            onDeleteForEveryone={onDeleteForEveryone || confirmDeleteMessage}
            showDeleteConfirmation={showDeleteConfirmation}
            setShowDeleteConfirmation={setShowDeleteConfirmation}
            confirmDeleteMessage={confirmDeleteMessage}
            showMessageInfo={showMessageInfo}
            messageInfoDetails={messageInfoDetails}
            setMessageInfoDetails={setMessageInfoDetails}
            renderContent={renderMessageContent}
            onSenderClick={(senderId, senderName) => {
              // Bubble up sender click to parent (ChatScreen) if provided
              if (typeof onSenderClick === 'function') onSenderClick(senderId, senderName);
            }}
          />
        );
      })}

      {/* Typing indicator with real user names */}
      {(() => {
        const typingUserNames = Object.values(typingUsers).filter(name => name && typeof name === 'string');
        if (typingUserNames.length === 0) return null;

        const firstTypingUser = typingUserNames[0];
        return (
          <div className="message-row incoming-row">
            <div className="message-avatar">
              <div className="avatar">
                <span 
                  className="avatar-initial"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  {firstTypingUser.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="message-content-wrapper incoming">
              <div className="message-sender-name">
                {typingUserNames.length > 1 
                  ? `${typingUserNames.length} people are typing`
                  : `${firstTypingUser} is typing`}
              </div>
              <div className="message-bubble typing-bubble">
                <div className="imo-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <div ref={messagesEndRef} />
    </div>
  );
};