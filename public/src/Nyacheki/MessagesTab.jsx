import React from 'react';
import { FaComment, FaTimes, FaSearch, FaPaperPlane } from 'react-icons/fa';
export const MessagesTab = ({
  messages,
  products,
  activeChat,
  setActiveChat,
  newMessage,
  setNewMessage,
  handleSendMessage,
  messagesEndRef
}) => {
  return (
    <div className="messages-tab">
      <div className="messages-container">
        <div className="conversations-list">
          <h3>Conversations</h3>
          <div className="search-conversations">
            <FaSearch />
            <input type="text" placeholder="Search messages" />
          </div>
          <div className="conversations">
            {Object.entries(messages).map(([sellerId, messagesList]) => {
              const seller = products.find(p => p.seller.id === sellerId)?.seller;
              if (!seller) return null;
              
              const lastMessage = messagesList[messagesList.length - 1];
              const unreadCount = messagesList.filter(m => !m.read && m.senderId !== 'user').length;
              
              return (
                <div 
                  key={sellerId} 
                  className={`conversation ${activeChat === sellerId ? 'active' : ''}`}
                  onClick={() => setActiveChat(sellerId)}
                >
                  <img src="https://via.placeholder.com/50" alt={seller.name} />
                  <div className="conversation-info">
                    <h4>{seller.name}</h4>
                    <p className="last-message">
                      {lastMessage.senderId === 'user' ? 'You: ' : ''}
                      {lastMessage.text.length > 30 
                        ? `${lastMessage.text.substring(0, 30)}...` 
                        : lastMessage.text}
                    </p>
                    <span className="message-time">
                      {new Date(lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="unread-badge">
                      {unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="message-view">
          {activeChat ? (
            <>
              <div className="message-header">
                <div className="seller-info">
                  <img src="https://via.placeholder.com/50" alt="" />
                  <h3>{products.find(p => p.seller.id === activeChat)?.seller.name}</h3>
                  <span className="seller-rating">
                    {products.find(p => p.seller.id === activeChat)?.seller.rating} ★
                  </span>
                </div>
                <button className="close-chat" onClick={() => setActiveChat(null)}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="messages-list">
                {messages[activeChat].map(message => (
                  <div 
                    key={message.id} 
                    className={`message ${message.senderId === 'user' ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{message.text}</p>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="message-input">
                <input 
                  type="text" 
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <FaComment size={48} />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

