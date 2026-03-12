import React, { useState } from 'react';
import { Navbar1 } from '../Pages/NavigationBar/Navbar1';
import { ChatWindow } from './ChatWindow';
import { useChat } from './useChat';
import { ChatList } from '../ChatMe/Components/ChatList';

export const ChatApp = () => {
  const [hideMobileNavLinks, setHideMobileNavLinks] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock chats data
  const [chats, setChats] = useState([
    {
      id: '1',
      name: 'John Doe',
      lastMessage: 'Hey, how are you?',
      time: '10:30 AM',
      isOnline: true,
      unreadCount: 2,
      isPinned: true,
      isMuted: false,
      isArchived: false,
      isLocked: false,
      lastMessageStatus: 'read',
      profilePicture: ''
    },
    // Add more chats as needed
  ]);

  // Current user data
  const currentUser = {
    id: 'user1',
    name: 'You',
    avatar: '',
    status: 'online',
    role: 'user'
  };

  // Use the chat hook
  const chatHook = useChat({
    initialMessages: [],
    currentUser,
    contact: selectedChat,
    enableVoiceMessages: true,
    enableTypingIndicators: true
  });

  const handleChatClick = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    setSelectedChat(chat);
    setHideMobileNavLinks(true);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setHideMobileNavLinks(false);
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log('User logged out');
  };

  return (
    <div className="chat-app">
      <Navbar1 
        user={currentUser} 
        onLogout={handleLogout} 
        hideMobileMenu={hideMobileNavLinks} 
      />
      
      <div className="chat-container">
        {!selectedChat ? (
          <ChatList
            chats={chats}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            onChatClick={handleChatClick}
            onAvatarClick={(chat) => console.log('Avatar clicked', chat)}
            onArchive={(chatId) => {
              setChats(chats.map(chat => 
                chat.id === chatId ? {...chat, isArchived: true} : chat
              ));
            }}
            onUnarchive={(chatId) => {
              setChats(chats.map(chat => 
                chat.id === chatId ? {...chat, isArchived: false} : chat
              ));
            }}
            onToggleMute={(chatId) => {
              setChats(chats.map(chat => 
                chat.id === chatId ? {...chat, isMuted: !chat.isMuted} : chat
              ));
            }}
            onTogglePin={(chatId) => {
              setChats(chats.map(chat => 
                chat.id === chatId ? {...chat, isPinned: !chat.isPinned} : chat
              ));
            }}
            onToggleLock={(chatId) => {
              setChats(chats.map(chat => 
                chat.id === chatId ? {...chat, isLocked: !chat.isLocked} : chat
              ));
            }}
            onChatSelected={setHideMobileNavLinks}
          />
        ) : (
          <ChatWindow
            {...chatHook}
            currentUser={currentUser}
            contact={selectedChat}
            enableFeatures={{
              enableVoiceMessages: true,
              enableReactions: true,
              enableMessageSearch: true,
              enableReadReceipts: true,
              enableTypingIndicators: true,
              enableOnlineStatus: true,
              enablePinning: true,
              enablePrivateMessages: true,
              enableReporting: true,
              enableThreading: true
            }}
            isMobileView={window.innerWidth < 768}
            onBackClick={handleBackToList}
            setHideMobileNavLinks={setHideMobileNavLinks}
          />
        )}
      </div>
    </div>
  );
};